import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProposalStatus } from './api.models';

export type PaymentMethod = 'ONLINE' | 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE: 'Online', CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank transfer', CHEQUE: 'Cheque', OTHER: 'Other',
};

export interface Balance {
  totalPaise: number;
  paidPaise: number;
  onlinePaise: number;
  offlinePaise: number;
  balancePaise: number;
  overpaidPaise: number;
  dueNowPaise: number;
  dueDate: string | null;
  dueNote: string | null;
  overdue: boolean;
}

export interface ClientEntry {
  method: PaymentMethod;
  amountPaise: number;
  paidOn: string;
  reference: string | null;
  testMode: boolean;
}

export interface LedgerEntry extends ClientEntry {
  id: string;
  note: string | null;
  recordedBy: string;
  createdAt: string;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
}

export interface Account {
  balance: Balance;
  entries: LedgerEntry[];
}

export interface ClientAccount {
  balance: Balance;
  entries: ClientEntry[];
}

export interface ProjectRow {
  id: string;
  number: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
  status: ProposalStatus;
  totalPaise: number;
  paidPaise: number;
  balancePaise: number;
  dueNowPaise: number;
  dueDate: string | null;
  overdue: boolean;
}

export interface EntryRow extends ClientEntry {
  id: string;
  proposalId: string;
  number: string;
  clientName: string;
  note: string | null;
  cancelled: boolean;
  voidReason: string | null;
}

export interface PaymentsOverview {
  projects: ProjectRow[];
  entries: EntryRow[];
}

export interface NewPayment {
  id: string;
  method: PaymentMethod;
  amountPaise: number;
  paidOn: string;
  reference: string;
  note: string;
}

/** Today's date in India as yyyy-MM-dd. toISOString() would give yesterday before 05:30 IST. */
export function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** crypto.randomUUID() only exists on https; getRandomValues also works on plain http. */
export function newId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

@Injectable({ providedIn: 'root' })
export class LedgerApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/admin`;

  overview(): Observable<PaymentsOverview> {
    return this.http.get<PaymentsOverview>(`${this.base}/payments`);
  }

  account(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.base}/proposals/${id}/account`);
  }

  record(id: string, body: NewPayment): Observable<Account> {
    return this.http.post<Account>(`${this.base}/proposals/${id}/payments`, body);
  }

  cancel(id: string, entryId: string, reason: string): Observable<Account> {
    return this.http.post<Account>(`${this.base}/proposals/${id}/payments/${entryId}/cancel`, { reason });
  }

  setDue(id: string, amountPaise: number, dueDate: string | null, note: string): Observable<Account> {
    return this.http.put<Account>(`${this.base}/proposals/${id}/due`, { amountPaise, dueDate, note });
  }

  emailUpdate(id: string): Observable<{ emailSent: boolean }> {
    return this.http.post<{ emailSent: boolean }>(`${this.base}/proposals/${id}/payment-update`, {});
  }

  clientAccount(token: string): Observable<ClientAccount> {
    return this.http.get<ClientAccount>(`${environment.apiBase}/public/proposals/${encodeURIComponent(token)}/account`);
  }
}
