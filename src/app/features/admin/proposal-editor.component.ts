import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminProposalsApi } from '../../core/api/proposals.api';
import { ProposalContent, apiError } from '../../core/api/api.models';

/** Default terms — a starting point only. Review with a legal professional. */
const DEFAULT_TERMS = `1. Scope: Work is limited to the deliverables listed in this proposal. Additional work will be quoted separately.
2. Payment: The advance stated in this proposal is payable on acceptance. The balance is payable on delivery, unless agreed otherwise in writing.
3. Timelines: Timelines start after receipt of the advance and all required content/access from the client. Delays in feedback extend timelines accordingly.
4. Revisions: Up to two rounds of revisions are included per deliverable. Further revisions are billed separately.
5. Client materials: The client confirms it has the rights to all content, logos and materials it provides.
6. Intellectual property: Ownership of final deliverables transfers to the client after full payment. TheCreateStudio may show the work in its portfolio unless agreed otherwise.
7. Confidentiality: Both parties will keep each other's confidential information private.
8. Cancellation: If the client cancels after work has started, the advance is non-refundable and work completed beyond the advance value is payable.
9. Third-party costs: Ad spend, hosting, domains, paid plugins, stock assets and similar costs are not included unless stated.
10. Limitation of liability: TheCreateStudio's total liability is limited to the fees paid under this proposal.
11. Governing law: This agreement is governed by the laws of India.`;

@Component({
  selector: 'app-proposal-editor',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-head">
      <h1 class="h2">{{ id() ? 'Edit proposal' : 'New proposal' }}</h1>
      <a [routerLink]="id() ? ['/admin/proposals', id()] : '/admin/proposals'" class="btn btn--ghost btn--sm">Cancel</a>
    </div>
    @if (id()) { <p class="adm-note">Editing clears your signature. You'll sign again before sending.</p> }

    <form class="adm-card form" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <fieldset>
        <legend>Client</legend>
        <div class="row">
          <div class="field"><label for="clientName">Client name *</label><input id="clientName" class="input" formControlName="clientName" /></div>
          <div class="field"><label for="clientCompany">Company</label><input id="clientCompany" class="input" formControlName="clientCompany" /></div>
        </div>
        <div class="row">
          <div class="field"><label for="clientEmail">Client email *</label><input id="clientEmail" type="email" class="input" formControlName="clientEmail" /></div>
          <div class="field"><label for="clientPhone">Client phone</label><input id="clientPhone" type="tel" class="input" formControlName="clientPhone" /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Proposal</legend>
        <div class="field"><label for="title">Title *</label><input id="title" class="input" formControlName="title" placeholder="e.g. Website Redesign & Social Media Launch" /></div>
        <div class="field"><label for="summary">Overview *</label><textarea id="summary" class="input" rows="4" formControlName="summary" placeholder="The goal of the project in a few sentences…"></textarea></div>
        <div class="field"><label for="scope">Scope of work &amp; deliverables *</label><textarea id="scope" class="input" rows="8" formControlName="scope" placeholder="One deliverable per line…"></textarea></div>
      </fieldset>

      <fieldset>
        <legend>Investment</legend>
        <div class="row row--3">
          <div class="field"><label for="amount">Total fee (₹) *</label><input id="amount" type="number" min="0" step="0.01" class="input" formControlName="amount" /></div>
          <div class="field"><label for="advance">Advance via Razorpay (₹)</label><input id="advance" type="number" min="0" step="0.01" class="input" formControlName="advance" /><small class="muted">0 = no online payment</small></div>
          <div class="field"><label for="validUntil">Valid until</label><input id="validUntil" type="date" class="input" formControlName="validUntil" /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Terms &amp; conditions</legend>
        <div class="field"><label for="terms">Terms the client accepts *</label><textarea id="terms" class="input" rows="14" formControlName="terms"></textarea>
          <small class="muted">A starting template is pre-filled. Have it reviewed by a legal professional.</small></div>
      </fieldset>

      @if (error()) { <p class="adm-alert" role="alert">{{ error() }}</p> }
      <div class="actions">
        <button type="submit" class="btn btn--primary" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save draft' }}</button>
      </div>
    </form>
  `,
  styles: `
    .form { display: grid; gap: 2rem; }
    fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 1.1rem; }
    legend { font-family: var(--f-alt); font-weight: 800; font-size: .78rem; letter-spacing: .16em; text-transform: uppercase; color: var(--yellow); margin-bottom: .75rem; }
    .row { display: grid; gap: 1.1rem; }
    @media (min-width: 760px) { .row { grid-template-columns: 1fr 1fr; } .row--3 { grid-template-columns: 1fr 1fr 1fr; } }
    .actions { display: flex; gap: 1rem; }
  `,
})
export class ProposalEditorComponent {
  readonly id = input<string>();
  private readonly api = inject(AdminProposalsApi);
  private readonly router = inject(Router);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    clientName: ['', [Validators.required, Validators.maxLength(120)]],
    clientCompany: ['', Validators.maxLength(160)],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPhone: ['', Validators.pattern(/^$|^[0-9+()\-\s]{7,30}$/)],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    summary: ['', Validators.required],
    scope: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    advance: [0, [Validators.min(0)]],
    validUntil: [this.defaultValidity()],
    terms: [DEFAULT_TERMS, Validators.required],
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.api.get(id).subscribe({
        next: (p) => {
          if (p.status !== 'DRAFT') {
            this.router.navigate(['/admin/proposals', id]);
            return;
          }
          this.form.setValue({
            clientName: p.clientName, clientCompany: p.clientCompany ?? '', clientEmail: p.clientEmail,
            clientPhone: p.clientPhone ?? '', title: p.title, summary: p.summary, scope: p.scope,
            amount: p.amountPaise / 100, advance: p.advancePaise / 100, validUntil: p.validUntil ?? '', terms: p.terms,
          });
        },
        error: (e) => this.error.set(apiError(e)),
      });
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Please fill in all required fields correctly.');
      return;
    }
    const v = this.form.getRawValue();
    const amountPaise = Math.round(Number(v.amount) * 100);
    const advancePaise = Math.round(Number(v.advance || 0) * 100);
    if (advancePaise > amountPaise) {
      this.error.set('Advance cannot be more than the total fee.');
      return;
    }
    const body: ProposalContent = {
      title: v.title.trim(), clientName: v.clientName.trim(), clientEmail: v.clientEmail.trim(),
      clientPhone: v.clientPhone.trim(), clientCompany: v.clientCompany.trim(), summary: v.summary, scope: v.scope,
      terms: v.terms, amountPaise, advancePaise, validUntil: v.validUntil || null,
    };
    this.busy.set(true);
    this.error.set('');
    const id = this.id();
    (id ? this.api.update(id, body) : this.api.create(body)).subscribe({
      next: (p) => this.router.navigate(['/admin/proposals', p.id]),
      error: (e) => {
        this.error.set(apiError(e));
        this.busy.set(false);
      },
    });
  }

  private defaultValidity(): string {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  }
}
