import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { SignaturePadComponent } from '../../shared/components/signature-pad.component';
import { PublicProposalsApi } from '../../core/api/proposals.api';
import { ClientAccount, LedgerApi, METHOD_LABELS } from '../../core/api/ledger.api';
import { PaymentSummaryComponent } from '../../shared/components/payment-summary.component';
import { ClientProposal, apiError, formatINR } from '../../core/api/api.models';

/** Public page where a client reviews, accepts and signs a proposal, and follows their payments. */
@Component({
  selector: 'app-sign',
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, SignaturePadComponent, PaymentSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign.component.html',
  styleUrl: './sign.component.scss',
})
export class SignComponent {
  readonly token = input.required<string>();

  private readonly api = inject(PublicProposalsApi);
  private readonly ledger = inject(LedgerApi);
  protected readonly account = signal<ClientAccount | null>(null);
  protected readonly accountError = signal('');
  protected readonly labels = METHOD_LABELS;

  protected readonly p = signal<ClientProposal | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly signerName = signal('');
  protected readonly accept = signal(false);
  protected readonly signature = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
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
          this.loadAccount();
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
        this.loadAccount();
      },
      error: (e) => {
        this.error.set(apiError(e));
        this.submitting.set(false);
      },
    });
  }

  protected refreshPayments(): void {
    this.api.get(this.token()).subscribe({ next: (p) => this.p.set(p), error: () => {} });
    this.loadAccount();
  }

  private loadAccount(): void {
    this.accountError.set('');
    this.ledger.clientAccount(this.token()).subscribe({
      next: (a) => this.account.set(a),
      error: (e) => this.accountError.set(apiError(e, 'Could not load your payment details. Please refresh the page.')),
    });
  }

  paragraphs(text: string): string[] {
    return text.split(/\r?\n/);
  }
}
