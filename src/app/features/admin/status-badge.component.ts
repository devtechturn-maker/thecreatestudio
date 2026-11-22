import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProposalStatus } from '../../core/api/api.models';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [attr.data-s]="status()">{{ label() }}</span>@if (expired() && !closed()) {<span class="badge" data-s="EXPIRED">Expired</span>}`,
  styles: `
    :host { display: inline-flex; gap: .35rem; flex-wrap: wrap; }
    .badge { display: inline-block; padding: .25rem .6rem; border-radius: 999px; font-size: .72rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; font-family: var(--f-alt); border: 1px solid var(--line-strong); color: var(--text-2); }
    [data-s='SENT'] { color: #93c5fd; border-color: rgba(147,197,253,.4); }
    [data-s='VIEWED'] { color: #c4b5fd; border-color: rgba(196,181,253,.4); }
    [data-s='SIGNED'] { color: var(--yellow); border-color: rgba(254,225,25,.5); }
    [data-s='PAID'] { color: #86efac; border-color: rgba(134,239,172,.5); background: rgba(34,197,94,.1); }
    [data-s='CANCELLED'], [data-s='EXPIRED'] { color: #fca5a5; border-color: rgba(252,165,165,.4); }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ProposalStatus>();
  readonly expired = input(false);
  protected label(): string {
    const s = this.status();
    return s === 'VIEWED' ? 'Viewed' : s.charAt(0) + s.slice(1).toLowerCase();
  }
  protected closed(): boolean {
    return ['SIGNED', 'PAID', 'CANCELLED'].includes(this.status());
  }
}
