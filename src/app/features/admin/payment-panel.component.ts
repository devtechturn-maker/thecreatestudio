import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminProposal, apiError, formatINR } from '../../core/api/api.models';
import { Account, LedgerApi, METHOD_LABELS, PaymentMethod, newId, todayIST } from '../../core/api/ledger.api';
import { PaymentSummaryComponent } from '../../shared/components/payment-summary.component';

type Mode = 'record' | 'due' | null;

/** Everything about one proposal's money: record, set due, cancel a mistake, tell the client. */
@Component({
  selector: 'app-payment-panel',
  imports: [DatePipe, ReactiveFormsModule, PaymentSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-panel.component.html',
  styleUrl: './payment-panel.component.scss',
})
export class PaymentPanelComponent {
  readonly proposal = input.required<AdminProposal>();
  readonly emailConfigured = input(false);
  /** Status and activity may change after every action. */
  readonly changed = output<void>();

  private readonly api = inject(LedgerApi);
  private readonly fb = inject(FormBuilder);
  private entryId = newId();

  protected readonly inr = formatINR;
  protected readonly labels = METHOD_LABELS;
  protected readonly methods: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER'];
  protected readonly today = todayIST();
  protected readonly account = signal<Account | null>(null);
  protected readonly mode = signal<Mode>(null);
  protected readonly cancelling = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');

  protected readonly hasTest = computed(() => !!this.account()?.entries.some((e) => e.testMode && !e.voidedAt));
  protected readonly canRequest = computed(() => this.proposal().status === 'SIGNED' && !!this.account()?.balance.balancePaise);

  protected readonly recordForm = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    method: this.fb.nonNullable.control<PaymentMethod>('CASH'),
    paidOn: this.fb.nonNullable.control(this.today, Validators.required),
    reference: this.fb.nonNullable.control('', Validators.maxLength(120)),
    note: this.fb.nonNullable.control('', Validators.maxLength(500)),
  });
  protected readonly dueForm = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    date: this.fb.nonNullable.control(''),
    note: this.fb.nonNullable.control('', Validators.maxLength(300)),
  });
  protected readonly reason = this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(300)]);

  protected readonly whatsappUrl = computed(() => {
    const a = this.account();
    if (!a) return '';
    const p = this.proposal(), b = a.balance;
    const lines = [
      `Hi ${p.clientName.split(' ')[0]},`, '',
      `Payment update for "${p.title}" (${p.number}):`,
      `Total fee: ${formatINR(b.totalPaise)}`,
      `Paid online / UPI / bank: ${formatINR(b.onlinePaise)}`,
      `Paid by cash / cheque / other: ${formatINR(b.offlinePaise)}`,
      `Total received: ${formatINR(b.paidPaise)}`,
      `Balance: ${formatINR(b.balancePaise)}`,
    ];
    if (b.dueNowPaise) {
      const by = b.dueDate ? ` by ${new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
      lines.push(`*Due now: ${formatINR(b.dueNowPaise)}${by}*`);
      if (b.dueNote) lines.push(`For: ${b.dueNote}`);
    }
    if (this.hasTest()) lines.push('(Includes a test payment, no real money)');
    lines.push('', 'See your full payment history here:', p.signingUrl ?? '', '', '— TheCreateStudio');
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(lines.join('\n'))}`;
  });

  constructor() {
    effect(() => {
      const id = this.proposal().id;
      untracked(() => this.load(id));
    });
  }

  toggle(mode: Exclude<Mode, null>): void {
    const opening = this.mode() !== mode;
    this.mode.set(opening ? mode : null);
    this.error.set('');
    const b = this.account()?.balance;
    if (!opening || !b) return;
    if (mode === 'due') {
      this.dueForm.setValue({ amount: (b.dueNowPaise || b.balancePaise) / 100, date: b.dueDate ?? '', note: b.dueNote ?? '' });
    } else {
      this.entryId = newId();
      this.recordForm.reset({ amount: null, method: 'CASH', paidOn: this.today, reference: '', note: '' });
    }
  }

  fillBalance(form: 'record' | 'due'): void {
    const amount = (this.account()?.balance.balancePaise ?? 0) / 100;
    (form === 'record' ? this.recordForm : this.dueForm).controls.amount.setValue(amount);
  }

  record(): void {
    if (this.busy() || !this.valid(this.recordForm)) return;
    const v = this.recordForm.getRawValue();
    this.run(
      this.api.record(this.proposal().id, {
        id: this.entryId, method: v.method, amountPaise: Math.round(Number(v.amount) * 100),
        paidOn: v.paidOn, reference: v.reference, note: v.note,
      }),
      'Payment recorded. Use WhatsApp update or Email update to tell the client.',
    );
  }

  saveDue(amountPaise?: number): void {
    if (this.busy() || (amountPaise === undefined && !this.valid(this.dueForm))) return;
    const v = this.dueForm.getRawValue();
    const amount = amountPaise ?? Math.round(Number(v.amount) * 100);
    this.run(
      this.api.setDue(this.proposal().id, amount, amount ? v.date || null : null, amount ? v.note : ''),
      amount ? 'Amount due saved. The client now sees it on their link.' : 'No payment is requested now. The balance stays.',
    );
  }

  startCancel(id: string): void {
    this.cancelling.set(id);
    this.reason.reset();
    this.error.set('');
  }

  confirmCancel(id: string): void {
    if (this.busy()) return;
    if (!this.reason.value.trim()) {
      this.error.set('Enter a reason for cancelling this payment.');
      return;
    }
    this.run(this.api.cancel(this.proposal().id, id, this.reason.value.trim()), 'Payment cancelled. The balance is updated.');
  }

  email(): void {
    if (this.busy()) return;
    this.start();
    this.api.emailUpdate(this.proposal().id).subscribe({
      next: () => this.finish(`Payment update emailed to ${this.proposal().clientEmail}.`),
      error: (e) => {
        this.fail(e);
        this.changed.emit();
      },
    });
  }

  private valid(form: { invalid: boolean; markAllAsTouched(): void }): boolean {
    if (!form.invalid) return true;
    form.markAllAsTouched();
    this.error.set('Check the amount and the date.');
    return false;
  }

  private run(request: Observable<Account>, ok: string): void {
    this.start();
    request.subscribe({
      next: (a) => {
        this.account.set(a);
        this.mode.set(null);
        this.cancelling.set(null);
        this.finish(ok);
      },
      error: (e) => this.fail(e),
    });
  }

  private start(): void {
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
  }

  private finish(message: string): void {
    this.busy.set(false);
    this.notice.set(message);
    this.changed.emit();
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.error.set(apiError(e));
  }

  private load(id: string): void {
    this.api.account(id).subscribe({ next: (a) => this.account.set(a), error: (e) => this.error.set(apiError(e)) });
  }
}
