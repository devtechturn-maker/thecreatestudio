import { ChangeDetectionStrategy, Component, DOCUMENT, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { SignaturePadComponent } from '../../shared/components/signature-pad.component';
import { PublicProposalsApi } from '../../core/api/proposals.api';
import { ClientProposal, apiError, formatINR } from '../../core/api/api.models';

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(e: string, cb: (r: unknown) => void): void }; }
}

/** Public page where a client reviews, accepts, signs and (optionally) pays for a proposal. */
@Component({
  selector: 'app-sign',
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, SignaturePadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign.component.html',
  styleUrl: './sign.component.scss',
})
export class SignComponent {
  readonly token = input.required<string>();

  private readonly api = inject(PublicProposalsApi);
  private readonly doc = inject(DOCUMENT);

  protected readonly p = signal<ClientProposal | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly signerName = signal('');
  protected readonly accept = signal(false);
  protected readonly signature = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly paymentsEnabled = signal(false);
  protected readonly paying = signal(false);
  protected readonly payError = signal('');
  protected readonly justPaid = signal(false);
  protected readonly inr = formatINR;

  protected readonly canSign = computed(() => {
    const p = this.p();
    return !!p && (p.status === 'SENT' || p.status === 'VIEWED') && !p.expired;
  });
  protected readonly ready = computed(
    () => this.signerName().trim().length >= 2 && this.accept() && !!this.signature() && !this.submitting(),
  );
  protected readonly pdfUrl = computed(() => this.api.pdfUrl(this.token()));

  constructor() {
    effect(() => {
      const t = this.token();
      this.loading.set(true);
      this.api.get(t).subscribe({
        next: (p) => {
          this.p.set(p);
          if (!this.signerName()) this.signerName.set(p.clientName);
          this.loading.set(false);
          if (p.paymentDue) this.checkPayments();
        },
        error: (e) => {
          this.loadError.set(e?.status === 404 ? 'This link is invalid or no longer available.' : apiError(e));
          this.loading.set(false);
        },
      });
    });
  }

  submit(): void {
    if (!this.ready()) return;
    this.submitting.set(true);
    this.error.set('');
    this.api.sign(this.token(), this.signerName().trim(), this.signature()!, this.accept()).subscribe({
      next: (p) => {
        this.p.set(p);
        this.submitting.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (p.paymentDue) this.checkPayments();
      },
      error: (e) => {
        this.error.set(apiError(e));
        this.submitting.set(false);
      },
    });
  }

  pay(): void {
    if (this.paying()) return;
    this.paying.set(true);
    this.payError.set('');
    this.loadCheckout()
      .then(() =>
        this.api.createOrder(this.token()).subscribe({
          next: (o) => {
            const rzp = new window.Razorpay!({
              key: o.keyId,
              order_id: o.orderId,
              amount: o.amount,
              currency: o.currency,
              name: o.name,
              description: o.description,
              prefill: { name: o.prefillName, email: o.prefillEmail, contact: o.prefillContact ?? '' },
              theme: { color: '#0a434b' },
              handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
                this.verify(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature),
              modal: { ondismiss: () => this.paying.set(false) },
            });
            rzp.on('payment.failed', (r: unknown) => {
              const reason = (r as { error?: { description?: string } })?.error?.description;
              this.payError.set(reason ? `Payment failed: ${reason}` : 'Payment failed. Please try again.');
              this.paying.set(false);
            });
            rzp.open();
          },
          error: (e) => {
            this.payError.set(apiError(e));
            this.paying.set(false);
          },
        }),
      )
      .catch(() => {
        this.payError.set('Could not load the payment window. Please check your connection and try again.');
        this.paying.set(false);
      });
  }

  private verify(orderId: string, paymentId: string, signature: string): void {
    this.api.verifyPayment(this.token(), orderId, paymentId, signature).subscribe({
      next: () => {
        this.justPaid.set(true);
        this.paying.set(false);
        this.api.get(this.token()).subscribe((p) => this.p.set(p));
      },
      error: (e) => {
        this.payError.set(apiError(e, 'We could not confirm the payment yet. If money was deducted, it will be confirmed shortly.'));
        this.paying.set(false);
      },
    });
  }

  private checkPayments(): void {
    this.api.paymentStatus(this.token()).subscribe({ next: (s) => this.paymentsEnabled.set(s.enabled), error: () => {} });
  }

  private loadCheckout(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = this.doc.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject();
      this.doc.body.appendChild(s);
    });
  }

  paragraphs(text: string): string[] {
    return text.split(/\r?\n/);
  }
}
