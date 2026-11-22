import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { formatINR } from '../../core/api/api.models';
import { Balance } from '../../core/api/ledger.api';

/** Total / received / balance with a progress bar. Used by both the admin and the client page. */
@Component({
  selector: 'app-payment-summary',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = balance();
    <dl class="totals">
      <div><dt>Total fee</dt><dd>{{ inr(b.totalPaise) }}</dd></div>
      <div><dt>Received</dt><dd class="good">{{ inr(b.paidPaise) }}</dd></div>
      <div><dt>Balance</dt><dd class="left">{{ inr(b.balancePaise) }}</dd></div>
    </dl>
    <div class="track" role="progressbar" aria-label="Amount received" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent()">
      <span [style.width.%]="percent()"></span>
    </div>
    <p class="split"><span>Online, UPI &amp; bank: <b>{{ inr(b.onlinePaise) }}</b></span><span>Cash, cheque &amp; other: <b>{{ inr(b.offlinePaise) }}</b></span></p>
    @if (b.dueNowPaise > 0) {
      <p class="due" [class.due--late]="b.overdue">
        <strong>Due now: {{ inr(b.dueNowPaise) }}</strong>
        @if (b.dueDate) { <span>{{ b.overdue ? 'Overdue since' : 'Pay by' }} {{ b.dueDate | date: 'd MMM y' }}</span> }
        @if (b.dueNote) { <span>{{ b.dueNote }}</span> }
      </p>
    }
    @if (b.overpaidPaise > 0) {
      <p class="due due--late"><strong>Paid {{ inr(b.overpaidPaise) }} more than the total fee.</strong></p>
    }
  `,
  styles: `
    :host { display: grid; gap: .75rem; min-width: 0; }
    .totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .5rem; margin: 0; }
    .totals div { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: .1rem .6rem; padding: .7rem .9rem; border-radius: 14px; background: var(--bg); }
    dt { color: var(--text-2); font-size: .8rem; font-weight: 700; }
    dd { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .good { color: #86efac; }
    .left { color: var(--yellow); }
    .track { height: 9px; border-radius: 9px; background: var(--bg); overflow: hidden; }
    .track span { display: block; height: 100%; border-radius: inherit; background: var(--yellow); transition: width .8s var(--ease); }
    .split { display: flex; flex-wrap: wrap; gap: .2rem 1.25rem; color: var(--text-2); font-size: .85rem; }
    .split b { color: var(--text); }
    .due { display: grid; gap: .1rem; padding: .8rem 1rem; border-radius: 14px; background: var(--yellow); color: var(--ink); }
    .due--late { background: var(--coral); }
  `,
})
export class PaymentSummaryComponent {
  readonly balance = input.required<Balance>();
  protected readonly inr = formatINR;
  protected readonly percent = computed(() => {
    const b = this.balance();
    return b.totalPaise ? Math.min(100, Math.floor((b.paidPaise / b.totalPaise) * 100)) : 0;
  });
}
