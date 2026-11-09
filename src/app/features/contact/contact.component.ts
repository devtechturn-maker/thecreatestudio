import { ChangeDetectionStrategy, Component, inject, input, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { IconComponent } from '../../shared/components/icon.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Web3FormsService } from '../../core/services/web3forms.service';
import { BUDGETS, CONTACT_SERVICES } from '../../core/config/services.data';
import { SITE, whatsappLink } from '../../core/config/site.config';

type Status = 'idle' | 'sending' | 'success' | 'error';
const COOLDOWN_MS = 60_000;

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  /** Optional preselected service from ?service=... */
  readonly service = input<string | undefined>();

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(Web3FormsService);

  protected readonly services = CONTACT_SERVICES;
  protected readonly budgets = BUDGETS;
  protected readonly methods = ['Email', 'Phone Call', 'WhatsApp'];
  protected readonly site = SITE;
  protected readonly wa = whatsappLink();
  protected readonly configured = this.api.isConfigured;
  protected readonly status = signal<Status>('idle');
  protected readonly errorText = signal('');
  private readonly openedAt = Date.now();
  private lastSent = 0;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    company: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
    // Indian mobile: optional +91 / 91 / 0 prefix, then 10 digits starting 6-9.
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/)]],
    service_required: ['', Validators.required],
    project_budget: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(3000)]],
    preferred_contact_method: ['Email', Validators.required],
    botcheck: [false], // honeypot
  });

  constructor() {
    effect(() => {
      const s = this.service();
      if (s && CONTACT_SERVICES.includes(s)) this.form.controls.service_required.setValue(s);
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.status() === 'sending') return; // duplicate submission guard
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.status.set('idle');
      setTimeout(() => document.querySelector<HTMLElement>('.contact-form .is-invalid')?.focus());
      return;
    }
    const v = this.form.getRawValue();

    // Spam controls: honeypot filled, or submitted unrealistically fast → silently drop.
    if (v.botcheck || Date.now() - this.openedAt < 3000) {
      this.fail('Your submission could not be processed. Please try again in a moment.');
      return;
    }
    if (Date.now() - this.lastSent < COOLDOWN_MS) {
      this.fail('You just sent an inquiry. Please wait a minute before sending another.');
      return;
    }
    if (!this.configured) {
      this.fail('The contact form is not configured yet (missing Web3Forms access key). Please reach us via the contact details on this page.');
      return;
    }

    this.status.set('sending');
    this.errorText.set('');
    this.form.disable({ emitEvent: false });
    this.api
      .submit({ ...v, phone: v.phone.trim(), name: v.name.trim(), message: v.message.trim() })
      .pipe(finalize(() => this.form.enable({ emitEvent: false })))
      .subscribe({
        next: () => {
          this.lastSent = Date.now();
          this.status.set('success');
          this.form.reset({ preferred_contact_method: 'Email', botcheck: false });
        },
        error: (err: unknown) => {
          let msg = 'Something went wrong while sending your inquiry. Please try again, or contact us directly.';
          if (err instanceof HttpErrorResponse) {
            if (err.status === 0) msg = 'Network error — please check your internet connection and try again.';
            else if (err.error?.message) msg = `Could not send: ${err.error.message}`;
          } else if (err instanceof Error && err.message) {
            msg = `Could not send: ${err.message}`;
          }
          this.fail(msg);
        },
      });
  }

  reset(): void {
    this.status.set('idle');
  }

  private fail(msg: string): void {
    this.errorText.set(msg);
    this.status.set('error');
  }
}
