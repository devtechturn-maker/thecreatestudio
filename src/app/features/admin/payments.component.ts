import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { apiError, formatINR } from '../../core/api/api.models';
import { LedgerApi, METHOD_LABELS, PaymentMethod, PaymentsOverview, ProjectRow, todayIST } from '../../core/api/ledger.api';

interface ClientGroup {
  key: string;
  name: string;
  company: string | null;
  total: number;
  paid: number;
  balance: number;
  due: number;
  overdue: boolean;
  projects: ProjectRow[];
}

@Component({
  selector: 'app-admin-payments',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  private readonly api = inject(LedgerApi);

  protected readonly inr = formatINR;
  protected readonly labels = METHOD_LABELS;
  protected readonly methods = Object.keys(METHOD_LABELS) as PaymentMethod[];
  protected readonly data = signal<PaymentsOverview | null>(null);
  protected readonly error = signal('');
  protected readonly view = signal<'clients' | 'history'>('clients');
  protected readonly query = signal('');
  protected readonly show = signal('all');
  protected readonly method = signal('all');
  protected readonly month = signal('');

  protected readonly totals = computed(() => {
    const d = this.data();
    const t = { received: 0, online: 0, cash: 0, other: 0, test: 0, month: 0, balance: 0, due: 0, overdue: 0 };
    if (!d) return t;
    const thisMonth = todayIST().slice(0, 7);
    for (const e of d.entries) {
      if (e.cancelled) continue;
      if (e.testMode) {
        t.test += e.amountPaise;
        continue;
      }
      t.received += e.amountPaise;
      if (e.method === 'ONLINE' || e.method === 'UPI' || e.method === 'BANK_TRANSFER') t.online += e.amountPaise;
      else if (e.method === 'CASH') t.cash += e.amountPaise;
      else t.other += e.amountPaise;
      if (e.paidOn.startsWith(thisMonth)) t.month += e.amountPaise;
    }
    for (const p of d.projects) {
      if (p.status !== 'SIGNED') continue; // only signed work is money owed
      t.balance += p.balancePaise;
      t.due += p.dueNowPaise;
      if (p.overdue) t.overdue += p.dueNowPaise;
    }
    return t;
  });

  protected readonly clients = computed<ClientGroup[]>(() => {
    const groups = new Map<string, ClientGroup>();
    for (const p of this.data()?.projects ?? []) {
      const key = p.clientEmail.toLowerCase();
      let g = groups.get(key);
      if (!g) {
        g = { key, name: p.clientName, company: p.clientCompany, total: 0, paid: 0, balance: 0, due: 0, overdue: false, projects: [] };
        groups.set(key, g);
      }
      g.total += p.totalPaise;
      g.paid += p.paidPaise;
      g.balance += p.balancePaise;
      g.due += p.dueNowPaise;
      g.overdue ||= p.overdue;
      g.projects.push(p);
    }
    const q = this.query().trim().toLowerCase();
    const show = this.show();
    return [...groups.values()]
      .filter((g) => !q || [g.name, g.key, g.company, ...g.projects.flatMap((p) => [p.number, p.title])].some((s) => s?.toLowerCase().includes(q)))
      .filter((g) => show === 'all' || (show === 'due' && g.due > 0) || (show === 'overdue' && g.overdue)
        || (show === 'balance' && g.balance > 0) || (show === 'clear' && g.balance === 0))
      .sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.due - a.due || b.balance - a.balance);
  });

  protected readonly history = computed(() => {
    const q = this.query().trim().toLowerCase();
    return (this.data()?.entries ?? []).filter((e) =>
      (this.method() === 'all' || e.method === this.method())
      && (!this.month() || e.paidOn.startsWith(this.month()))
      && (!q || [e.clientName, e.number, e.reference, e.note].some((s) => s?.toLowerCase().includes(q))));
  });

  protected readonly historyTotal = computed(() =>
    this.history().reduce((sum, e) => (e.cancelled || e.testMode ? sum : sum + e.amountPaise), 0));

  constructor() {
    this.api.overview().subscribe({ next: (d) => this.data.set(d), error: (e) => this.error.set(apiError(e)) });
  }
}
