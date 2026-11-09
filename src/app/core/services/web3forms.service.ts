import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InquiryPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  service_required: string;
  project_budget: string;
  message: string;
  preferred_contact_method: string;
  botcheck: boolean; // honeypot: must stay false
}

interface Web3FormsResponse {
  success: boolean;
  message: string;
}

export const PLACEHOLDER_KEY = 'WEB3FORMS_ACCESS_KEY';

/**
 * Sends inquiries to the official Web3Forms API (https://api.web3forms.com/submit).
 * No backend, SMTP or database is involved. The access key is public by design.
 */
@Injectable({ providedIn: 'root' })
export class Web3FormsService {
  private readonly http = inject(HttpClient);

  get isConfigured(): boolean {
    const k = environment.web3forms.accessKey;
    return !!k && k !== PLACEHOLDER_KEY;
  }

  submit(p: InquiryPayload): Observable<Web3FormsResponse> {
    const body = {
      access_key: environment.web3forms.accessKey,
      subject: 'New Project Inquiry – TheCreateStudio',
      from_name: 'TheCreateStudio Website',
      replyto: p.email,
      name: p.name,
      email: p.email,
      company: p.company || '—',
      phone: p.phone,
      service_required: p.service_required,
      project_budget: p.project_budget,
      preferred_contact_method: p.preferred_contact_method,
      message: p.message,
      botcheck: p.botcheck,
    };
    return this.http
      .post<Web3FormsResponse>(environment.web3forms.endpoint, body, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
      .pipe(
        map((res) => {
          if (!res?.success) throw new Error(res?.message || 'Submission was not accepted.');
          return res;
        }),
      );
  }
}
