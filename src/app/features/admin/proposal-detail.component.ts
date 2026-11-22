import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminProposalsApi, saveBlob } from '../../core/api/proposals.api';
import { AuthService } from '../../core/api/auth.service';
import { AdminProposal, apiError, formatINR } from '../../core/api/api.models';
import { SignaturePadComponent } from '../../shared/components/signature-pad.component';
import { StatusBadgeComponent } from './status-badge.component';
import { SharePanelComponent } from './share-panel.component';
import { PaymentPanelComponent } from './payment-panel.component';

@Component({
  selector: 'app-proposal-detail',
  imports: [RouterLink, DatePipe, LowerCasePipe, FormsModule, SignaturePadComponent, StatusBadgeComponent, SharePanelComponent, PaymentPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './proposal-detail.component.html',
  styleUrl: './proposal-detail.component.scss',
})
export class ProposalDetailComponent {
  readonly id = input.required<string>();
  private readonly api = inject(AdminProposalsApi);
  private readonly auth = inject(AuthService);

  protected readonly p = signal<AdminProposal | null>(null);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly busy = signal(false);
  protected readonly signerName = signal('');
  protected readonly signature = signal<string | null>(null);
  protected readonly emailConfigured = signal(false);
  protected readonly emailProblem = signal('');
  protected readonly inr = formatINR;

  protected readonly isDraft = computed(() => this.p()?.status === 'DRAFT');
  protected readonly canCancel = computed(() => ['DRAFT', 'SENT', 'VIEWED'].includes(this.p()?.status ?? ''));

  constructor() {
    effect(() => this.load(this.id()));
    this.api.integrations().subscribe({ next: (s) => { this.emailConfigured.set(s.emailConfigured); this.emailProblem.set(s.emailProblem ?? ''); }, error: (e) => this.emailProblem.set(apiError(e)) });
  }

  load(id: string): void {
    this.api.get(id).subscribe({
      next: (p) => {
        this.p.set(p);
        if (!this.signerName()) this.signerName.set(p.ownerSignerName ?? this.auth.user()?.name ?? '');
      },
      error: (e) => this.error.set(apiError(e)),
    });
  }

  sign(): void {
    const sig = this.signature();
    if (!sig || this.signerName().trim().length < 2) {
      this.error.set('Enter your name and draw your signature.');
      return;
    }
    this.run(this.api.sign(this.id(), this.signerName().trim(), sig), 'Signed. You can now send it to the client.');
  }

  send(): void {
    const p = this.p();
    if (!p || !confirm(`Send proposal ${p.number} to ${p.clientEmail}? Its content will be locked.`)) return;
    this.busy.set(true);
    this.error.set('');
    this.api.send(this.id()).subscribe({
      next: (r) => {
        this.p.set(r.proposal);
        this.notice.set(r.emailSent
          ? `Emailed to ${r.proposal.clientEmail}.`
          : `Marked as sent, but the email was not sent. ${r.emailError ?? ''} You can share the link below instead.`);
        this.busy.set(false);
      },
      error: (e) => { this.error.set(apiError(e)); this.busy.set(false); },
    });
  }

  cancel(): void {
    const p = this.p();
    if (!p || !confirm(`Cancel proposal ${p.number}? The client link will stop working.`)) return;
    this.run(this.api.cancel(this.id()), 'Proposal cancelled.');
  }

  downloadPdf(): void {
    const p = this.p();
    if (!p) return;
    this.api.pdf(this.id()).subscribe({
      next: (b) => saveBlob(b, `${p.number}${p.signedPdfHash ? '-signed' : ''}.pdf`),
      error: (e) => this.error.set(apiError(e)),
    });
  }

  private run(obs: ReturnType<AdminProposalsApi['get']>, ok: string): void {
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    obs.subscribe({
      next: (p) => { this.p.set(p); this.notice.set(ok); this.busy.set(false); },
      error: (e) => { this.error.set(apiError(e)); this.busy.set(false); },
    });
  }

  lines(text: string): string[] {
    return text.split(/\r?\n/);
  }

  eventLabel(t: string): string {
    return t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }
}
