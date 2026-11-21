import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminProposalsApi } from '../../core/api/proposals.api';
import { PageView, ProposalStatus, ProposalSummary, apiError, formatINR } from '../../core/api/api.models';
import { StatusBadgeComponent } from './status-badge.component';

@Component({
  selector: 'app-proposal-list',
  imports: [RouterLink, DatePipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-head">
      <h1 class="h2">Proposals</h1>
      <a routerLink="/admin/proposals/new" class="btn btn--primary btn--sm">New proposal</a>
    </div>
    <div class="filters" role="group" aria-label="Filter by status">
      @for (f of filters; track f.label) {
        <button type="button" [class.is-active]="status() === f.value" [attr.aria-pressed]="status() === f.value" (click)="setStatus(f.value)">{{ f.label }}</button>
      }
    </div>

    @if (error()) { <p class="adm-alert" role="alert">{{ error() }}</p> }
    @if (data(); as d) {
      @if (d.items.length) {
        <div class="adm-card adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Number</th><th>Title</th><th>Client</th><th class="num">Amount</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              @for (p of d.items; track p.id) {
                <tr>
                  <td><a [routerLink]="['/admin/proposals', p.id]" class="strong">{{ p.number }}</a></td>
                  <td><a [routerLink]="['/admin/proposals', p.id]">{{ p.title }}</a></td>
                  <td>{{ p.clientName }}@if (p.clientCompany) {<br /><small class="muted">{{ p.clientCompany }}</small>}</td>
                  <td class="num">{{ inr(p.amountPaise) }}</td>
                  <td><app-status-badge [status]="p.status" [expired]="p.expired" /></td>
                  <td>{{ p.createdAt | date: 'd MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pager">
          <button type="button" class="btn btn--ghost btn--sm" [disabled]="d.page === 0" (click)="go(d.page - 1)">Previous</button>
          <span class="muted">Page {{ d.page + 1 }} of {{ pages(d) }} · {{ d.total }} total</span>
          <button type="button" class="btn btn--ghost btn--sm" [disabled]="d.page + 1 >= pages(d)" (click)="go(d.page + 1)">Next</button>
        </div>
      } @else {
        <div class="adm-card empty">
          <p>No proposals {{ status() ? 'with this status' : 'yet' }}.</p>
          <a routerLink="/admin/proposals/new" class="btn btn--primary btn--sm">Create your first proposal</a>
        </div>
      }
    } @else if (!error()) {
      <p class="muted" role="status">Loading…</p>
    }
  `,
  styles: `
    .filters { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .filters button { padding: .45rem .9rem; border-radius: 999px; border: 1px solid var(--line-strong); font-family: var(--f-alt); font-weight: 700; font-size: .82rem; color: var(--text-2); }
    .filters button.is-active { background: #fff; color: #111; border-color: #fff; }
    .pager { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
    .empty { display: grid; gap: 1rem; justify-items: start; }
  `,
})
export class ProposalListComponent {
  private readonly api = inject(AdminProposalsApi);
  protected readonly filters: { label: string; value: ProposalStatus | undefined }[] = [
    { label: 'All', value: undefined }, { label: 'Draft', value: 'DRAFT' }, { label: 'Sent', value: 'SENT' },
    { label: 'Viewed', value: 'VIEWED' }, { label: 'Signed', value: 'SIGNED' }, { label: 'Paid', value: 'PAID' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];
  protected readonly status = signal<ProposalStatus | undefined>(undefined);
  protected readonly page = signal(0);
  protected readonly data = signal<PageView<ProposalSummary> | null>(null);
  protected readonly error = signal('');
  protected readonly inr = formatINR;

  constructor() {
    effect(() => {
      const s = this.status();
      const pg = this.page();
      this.api.list(s, pg).subscribe({
        next: (d) => { this.data.set(d); this.error.set(''); },
        error: (e) => this.error.set(apiError(e)),
      });
    });
  }

  setStatus(s: ProposalStatus | undefined): void {
    this.status.set(s);
    this.page.set(0);
  }

  go(p: number): void {
    this.page.set(p);
  }

  pages(d: PageView<unknown>): number {
    return Math.max(1, Math.ceil(d.total / d.size));
  }
}
