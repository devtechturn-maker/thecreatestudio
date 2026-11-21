import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { AdminProposalsApi } from '../../core/api/proposals.api';
import { AdminProposal, apiError, formatINR } from '../../core/api/api.models';
import { IconComponent } from '../../shared/components/icon.component';

/**
 * Share the client link by WhatsApp, email (server SMTP or the admin's own email app) or copy.
 * WhatsApp/email-app open with a pre-written message; the admin presses Send there.
 */
@Component({
  selector: 'app-share-panel',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="adm-card share" aria-labelledby="share-title">
      <h2 id="share-title" class="h4">{{ signed() ? 'Share signed agreement' : 'Share with client' }}</h2>

      <div class="channels">
        <a class="ch ch--wa" [href]="whatsappUrl()" target="_blank" rel="noopener noreferrer" (click)="record('WHATSAPP')">
          <app-icon name="whatsapp" [size]="22" />
          <span><strong>WhatsApp</strong><small>Choose who to send it to</small></span>
        </a>

        @if (emailConfigured() && !signed()) {
          <button type="button" class="ch" (click)="sendEmail()" [disabled]="sending()">
            <app-icon name="mail" [size]="22" />
            <span><strong>{{ sending() ? 'Sending…' : 'Send email' }}</strong><small>From the website to {{ proposal().clientEmail }}</small></span>
          </button>
        }

        <a class="ch" [href]="mailtoUrl()" (click)="record('EMAIL_APP')">
          <app-icon name="mail" [size]="22" />
          <span><strong>Email app</strong><small>Opens your email with the message ready</small></span>
        </a>

        <button type="button" class="ch" (click)="copy()">
          <app-icon [name]="copied() ? 'check' : 'layers'" [size]="22" />
          <span><strong>{{ copied() ? 'Copied!' : 'Copy message' }}</strong><small>Paste anywhere</small></span>
        </button>
      </div>
      @if (!emailConfigured() && !signed()) {
        <p class="hint">Website email (SMTP) isn't set up, so "Send email" is hidden. "Email app" still works.</p>
      }
      @if (status()) { <p class="ok" role="status">{{ status() }}</p> }
      @if (error()) { <p class="adm-alert" role="alert">{{ error() }}</p> }

      <details class="preview">
        <summary>Message preview</summary>
        <pre>{{ message() }}</pre>
      </details>
      <div class="link-row">
        <input class="input" [value]="proposal().signingUrl" readonly aria-label="Client link" (focus)="$any($event.target).select()" />
      </div>
      <p class="hint">Anyone with this link can view{{ signed() ? '' : ' and sign' }}, so share it only with the client.</p>
    </section>
  `,
  styles: `
    .share { display: grid; gap: 1rem; border-color: rgba(255, 224, 27, .3); }
    .channels { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
    .ch { display: flex; gap: .8rem; align-items: center; text-align: left; padding: .9rem 1rem; border-radius: 14px; border: 1px solid var(--line-strong); background: var(--bg); transition: border-color .3s, transform .3s var(--ease); }
    .ch:hover { border-color: var(--yellow); transform: translateY(-2px); }
    .ch:disabled { opacity: .6; transform: none; }
    .ch app-icon { color: var(--yellow); flex: none; }
    .ch span { display: grid; gap: .1rem; min-width: 0; }
    .ch small { color: var(--text-2); font-size: .76rem; overflow: hidden; text-overflow: ellipsis; }
    .ch--wa { background: rgba(37, 211, 102, .1); border-color: rgba(37, 211, 102, .45); }
    .ch--wa app-icon { color: #25d366; }
    .hint { color: var(--text-2); font-size: .82rem; }
    .ok { color: #86efac; font-size: .9rem; }
    .preview summary { cursor: pointer; color: var(--text-2); font-size: .85rem; font-weight: 600; }
    .preview pre { white-space: pre-wrap; font-family: var(--f-body); font-size: .88rem; background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: .9rem; margin: .6rem 0 0; color: #d7e1e2; }
    .link-row .input { width: 100%; }
  `,
})
export class SharePanelComponent {
  readonly proposal = input.required<AdminProposal>();
  readonly emailConfigured = input(false);
  /** Emits the updated proposal after a share is recorded (refreshes the activity log). */
  readonly updated = output<AdminProposal>();

  private readonly api = inject(AdminProposalsApi);
  protected readonly sending = signal(false);
  protected readonly copied = signal(false);
  protected readonly status = signal('');
  protected readonly error = signal('');

  protected readonly signed = computed(() => ['SIGNED', 'PAID'].includes(this.proposal().status));

  protected readonly message = computed(() => {
    const p = this.proposal();
    const first = p.clientName.split(' ')[0];
    if (this.signed()) {
      const pay = p.status === 'SIGNED' && p.advancePaise > 0
        ? `\n\nYou can also pay the advance of ${formatINR(p.advancePaise)} securely from the same link.` : '';
      return `Hi ${first},\n\nThank you for signing "${p.title}" (${p.number}) with TheCreateStudio! 🎉\n\n`
        + `You can view and download your signed agreement here:\n${p.signingUrl}${pay}\n\nWe're excited to get started!\n— TheCreateStudio`;
    }
    return `Hi ${first},\n\nThank you for the opportunity! Your proposal "${p.title}" (${p.number}) from TheCreateStudio is ready.\n\n`
      + `Please review the scope and terms, then accept and sign online here:\n${p.signingUrl}\n\n`
      + (p.validUntil ? `This proposal is valid until ${new Date(p.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.\n\n` : '')
      + `Feel free to reach out if you have any questions.\n— TheCreateStudio`;
  });

  /**
   * Opens WhatsApp with the message ready and lets the admin pick the recipient
   * (like forwarding): no number in the link, so WhatsApp shows its contact/chat picker.
   */
  protected readonly whatsappUrl = computed(
    () => `https://api.whatsapp.com/send?text=${encodeURIComponent(this.message())}`,
  );

  protected readonly mailtoUrl = computed(() => {
    const p = this.proposal();
    const subject = this.signed() ? `Signed: ${p.title} (${p.number})` : `Your proposal from TheCreateStudio — ${p.title}`;
    return `mailto:${encodeURIComponent(p.clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(this.message())}`;
  });

  sendEmail(): void {
    if (this.sending()) return;
    this.sending.set(true);
    this.error.set('');
    this.status.set('');
    this.api.resendEmail(this.proposal().id).subscribe({
      next: () => {
        this.status.set(`Email sent to ${this.proposal().clientEmail}.`);
        this.sending.set(false);
        this.refresh();
      },
      error: (e) => {
        this.error.set(apiError(e));
        this.sending.set(false);
      },
    });
  }

  copy(): void {
    const done = () => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
      this.record('COPY');
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.message()).then(done, () => this.error.set('Could not copy. Select the link below instead.'));
    } else {
      this.error.set('Copy is not supported in this browser. Select the link below instead.');
    }
  }

  /** Logs the share in the audit trail. Failures are ignored — sharing itself already happened. */
  record(channel: 'WHATSAPP' | 'EMAIL_APP' | 'COPY'): void {
    this.api.share(this.proposal().id, channel).subscribe({ next: (p) => this.updated.emit(p), error: () => {} });
  }

  private refresh(): void {
    this.api.get(this.proposal().id).subscribe({ next: (p) => this.updated.emit(p), error: () => {} });
  }
}
