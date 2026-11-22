import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminProposal, CheckoutOrder, ClientProposal, PageView, ProposalContent, ProposalStatus, ProposalSummary, SendResponse,
} from './api.models';

/** Admin proposal endpoints (JWT added by authInterceptor). */
@Injectable({ providedIn: 'root' })
export class AdminProposalsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/admin/proposals`;

  list(status?: ProposalStatus, page = 0): Observable<PageView<ProposalSummary>> {
    let params = new HttpParams().set('page', page).set('size', 20);
    if (status) params = params.set('status', status);
    return this.http.get<PageView<ProposalSummary>>(this.base, { params });
  }

  get(id: string): Observable<AdminProposal> {
    return this.http.get<AdminProposal>(`${this.base}/${id}`);
  }

  create(body: ProposalContent): Observable<AdminProposal> {
    return this.http.post<AdminProposal>(this.base, body);
  }

  update(id: string, body: ProposalContent): Observable<AdminProposal> {
    return this.http.put<AdminProposal>(`${this.base}/${id}`, body);
  }

  sign(id: string, signerName: string, signature: string): Observable<AdminProposal> {
    return this.http.post<AdminProposal>(`${this.base}/${id}/sign`, { signerName, signature });
  }

  send(id: string): Observable<SendResponse> {
    return this.http.post<SendResponse>(`${this.base}/${id}/send`, {});
  }

  cancel(id: string): Observable<AdminProposal> {
    return this.http.post<AdminProposal>(`${this.base}/${id}/cancel`, {});
  }

  pdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }

  resendEmail(id: string): Observable<{ emailSent: boolean }> {
    return this.http.post<{ emailSent: boolean }>(`${this.base}/${id}/resend-email`, {});
  }

  /** Records a share in the audit trail. channel: WHATSAPP | EMAIL_APP | COPY */
  share(id: string, channel: 'WHATSAPP' | 'EMAIL_APP' | 'COPY'): Observable<AdminProposal> {
    return this.http.post<AdminProposal>(`${this.base}/${id}/share`, { channel });
  }

  integrations(): Observable<{ emailConfigured: boolean; emailProblem: string | null; paymentsConfigured: boolean; publicBaseUrl: string }> {
    return this.http.get<{ emailConfigured: boolean; emailProblem: string | null; paymentsConfigured: boolean; publicBaseUrl: string }>(
      `${environment.apiBase}/admin/integrations`,
    );
  }
}

/** Client signing-page endpoints (gated by the token in the link). */
@Injectable({ providedIn: 'root' })
export class PublicProposalsApi {
  private readonly http = inject(HttpClient);
  private url(token: string): string {
    return `${environment.apiBase}/public/proposals/${encodeURIComponent(token)}`;
  }

  get(token: string): Observable<ClientProposal> {
    return this.http.get<ClientProposal>(this.url(token));
  }

  sign(token: string, signerName: string, signature: string, acceptTerms: boolean): Observable<ClientProposal> {
    return this.http.post<ClientProposal>(`${this.url(token)}/sign`, { signerName, signature, acceptTerms });
  }

  pdfUrl(token: string): string {
    return `${this.url(token)}/pdf`;
  }

  paymentStatus(token: string): Observable<{ enabled: boolean }> {
    return this.http.get<{ enabled: boolean }>(`${this.url(token)}/payment/status`);
  }

  createOrder(token: string): Observable<CheckoutOrder> {
    return this.http.post<CheckoutOrder>(`${this.url(token)}/payment/order`, {});
  }

  verifyPayment(token: string, orderId: string, paymentId: string, signature: string): Observable<{ paid: boolean }> {
    return this.http.post<{ paid: boolean }>(`${this.url(token)}/payment/verify`, { orderId, paymentId, signature });
  }
}

/** Triggers a browser download for a Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
