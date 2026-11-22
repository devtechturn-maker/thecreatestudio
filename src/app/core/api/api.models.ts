/** Types mirroring the Spring Boot API (backend/src/main/java/.../proposal/ProposalDtos.java). */

export type ProposalStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'PAID' | 'CANCELLED';

export interface ProposalContent {
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  summary: string;
  scope: string;
  terms: string;
  amountPaise: number;
  advancePaise: number;
  validUntil: string | null; // yyyy-MM-dd
}

export interface ProposalSummary {
  id: string;
  number: string;
  title: string;
  clientName: string;
  clientCompany: string | null;
  amountPaise: number;
  currency: string;
  status: ProposalStatus;
  expired: boolean;
  createdAt: string;
  sentAt: string | null;
  clientSignedAt: string | null;
  paidAt: string | null;
}

export interface ProposalEventView {
  type: string;
  actor: string;
  ip: string | null;
  detail: string | null;
  createdAt: string;
}

export interface AdminProposal extends ProposalContent {
  id: string;
  number: string;
  currency: string;
  status: ProposalStatus;
  expired: boolean;
  signingUrl: string | null;
  contentHash: string | null;
  ownerSignerName: string | null;
  ownerSignature: string | null;
  ownerSignedAt: string | null;
  clientSignerName: string | null;
  clientSignature: string | null;
  clientSignedAt: string | null;
  clientSignedIp: string | null;
  termsAcceptedAt: string | null;
  sentAt: string | null;
  firstViewedAt: string | null;
  paidAt: string | null;
  signedPdfHash: string | null;
  createdAt: string;
  updatedAt: string;
  events: ProposalEventView[];
}

export interface ClientProposal {
  number: string;
  title: string;
  clientName: string;
  clientCompany: string | null;
  summary: string;
  scope: string;
  terms: string;
  currency: string;
  amountPaise: number;
  advancePaise: number;
  validUntil: string | null;
  status: ProposalStatus;
  expired: boolean;
  ownerSignerName: string | null;
  ownerSignature: string | null;
  ownerSignedAt: string | null;
  clientSignerName: string | null;
  clientSignature: string | null;
  clientSignedAt: string | null;
  paymentDue: boolean;
  paidAt: string | null;
}

export interface PageView<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface SendResponse {
  proposal: AdminProposal;
  emailSent: boolean;
  emailError: string | null;
  signingUrl: string;
}

export interface CheckoutOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefillName: string;
  prefillEmail: string;
  prefillContact: string | null;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  name: string;
  email: string;
}

/** Extracts the user-facing message from a Spring ProblemDetail error. */
export function apiError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { status?: number; error?: { detail?: string; errors?: Record<string, string> } };
  if (e?.status === 0) return 'Cannot reach the server. Please check your connection.';
  const fields = e?.error?.errors ? Object.values(e.error.errors).join(' ') : '';
  return [e?.error?.detail, fields].filter(Boolean).join(' ') || fallback;
}

export function formatINR(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
