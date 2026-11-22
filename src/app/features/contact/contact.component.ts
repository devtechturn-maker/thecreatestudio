import { ChangeDetectionStrategy, Component, inject, input, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../shared/components/icon.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links.component';
import { describeSocialLinks, socialLinksValidator } from '../../shared/components/social-links/social-links.util';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Web3FormsService } from '../../core/services/web3forms.service';
import { BUDGETS, CONTACT_SERVICES, SOCIAL_SERVICES } from '../../core/config/services.data';
import { SITE, whatsappLink } from '../../core/config/site.config';

type Status = 'idle' | 'sending' | 'success' | 'error';
const COOLDOWN_MS = 60_000;

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, IconComponent, RevealDirective, DropdownComponent, SocialLinksComponent],
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
  protected readonly needsSocial = signal(false);
  private readonly openedAt = Date.now();
  private lastSent = 0;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    company: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
    // Indian mobile: optional +91 / 91 / 0 prefix, then 10 digits starting 6-9.
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/)]],
    service_required: this.fb.nonNullable.control<string[]>([], Validators.required), // an empty list is invalid
    social_links: this.fb.nonNullable.control<string[]>(['']), // validated only while needsSocial is true
    project_budget: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(3000)]],
    preferred_contact_method: ['Email', Validators.required],
    botcheck: [false], // honeypot
  });

  constructor() {
    const { service_required, social_links } = this.form.controls;
    service_required.valueChanges.pipe(takeUntilDestroyed()).subscribe((selected) => {
      const needed = selected.some((s) => SOCIAL_SERVICES.includes(s));
      this.needsSocial.set(needed);
      social_links.setValidators(needed ? socialLinksValidator : null);
      social_links.updateValueAndValidity();
    });
    effect(() => {
      const s = this.service();
      if (s && CONTACT_SERVICES.includes(s)) this.form.controls.service_required.setValue([s]);
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
    const { social_links, ...v } = this.form.getRawValue();

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
      .submit({
        ...v,
        // One readable line in the email, e.g. "SEO, Branding (2 services)"
        service_required: v.service_required.length === 1
          ? v.service_required[0]
          : `${v.service_required.join(', ')} (${v.service_required.length} services)`,
        social_media_accounts: this.needsSocial() ? describeSocialLinks(social_links) : '',
        phone: v.phone.trim(),
        name: v.name.trim(),
        message: v.message.trim(),
      })
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
