package in.thecreatestudio.backend.proposal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Request/response shapes for the proposal APIs. */
final class ProposalDtos {

    private ProposalDtos() {}

    record SignRequest(@NotBlank @Size(max = 120) String signerName, @NotBlank String signature) {}

    record ClientSignRequest(@NotBlank @Size(min = 2, max = 120) String signerName,
                             @NotBlank String signature,
                             boolean acceptTerms) {}

    record ProposalSummary(UUID id, String number, String title, String clientName, String clientCompany,
                           long amountPaise, String currency, ProposalStatus status, boolean expired,
                           Instant createdAt, Instant sentAt, Instant clientSignedAt, Instant paidAt) {
        static ProposalSummary of(Proposal p) {
            return new ProposalSummary(p.getId(), p.getNumber(), p.getTitle(), p.getClientName(), p.getClientCompany(),
                    p.getAmountPaise(), p.getCurrency(), p.getStatus(), p.isExpired(),
                    p.getCreatedAt(), p.getSentAt(), p.getClientSignedAt(), p.getPaidAt());
        }
    }

    record EventView(String type, String actor, String ip, String detail, Instant createdAt) {
        static EventView of(ProposalEvent e) {
            return new EventView(e.getType(), e.getActor(), e.getIp(), e.getDetail(), e.getCreatedAt());
        }
    }

    record AdminProposalView(UUID id, String number, String title, String clientName, String clientEmail,
                             String clientPhone, String clientCompany, String summary, String scope, String terms,
                             String currency, long amountPaise, long advancePaise, LocalDate validUntil,
                             ProposalStatus status, boolean expired, String signingUrl, String contentHash,
                             String ownerSignerName, String ownerSignature, Instant ownerSignedAt,
                             String clientSignerName, String clientSignature, Instant clientSignedAt,
                             String clientSignedIp, Instant termsAcceptedAt, Instant sentAt, Instant firstViewedAt,
                             Instant paidAt, String signedPdfHash, Instant createdAt, Instant updatedAt,
                             List<EventView> events) {
        static AdminProposalView of(Proposal p, String signingUrl, List<ProposalEvent> events) {
            return new AdminProposalView(p.getId(), p.getNumber(), p.getTitle(), p.getClientName(), p.getClientEmail(),
                    p.getClientPhone(), p.getClientCompany(), p.getSummary(), p.getScope(), p.getTerms(),
                    p.getCurrency(), p.getAmountPaise(), p.getAdvancePaise(), p.getValidUntil(), p.getStatus(),
                    p.isExpired(), p.getStatus() == ProposalStatus.DRAFT ? null : signingUrl, p.getContentHash(),
                    p.getOwnerSignerName(), p.getOwnerSignature(), p.getOwnerSignedAt(), p.getClientSignerName(),
                    p.getClientSignature(), p.getClientSignedAt(), p.getClientSignedIp(), p.getTermsAcceptedAt(),
                    p.getSentAt(), p.getFirstViewedAt(), p.getPaidAt(), p.getSignedPdfHash(), p.getCreatedAt(),
                    p.getUpdatedAt(), events.stream().map(EventView::of).toList());
        }
    }

    /** What the client sees on the signing page — no internal IPs or audit details. */
    record ClientProposalView(String number, String title, String clientName, String clientCompany, String summary,
                              String scope, String terms, String currency, long amountPaise, long advancePaise,
                              LocalDate validUntil, ProposalStatus status, boolean expired, String ownerSignerName,
                              String ownerSignature, Instant ownerSignedAt, String clientSignerName,
                              String clientSignature, Instant clientSignedAt, Instant paidAt) {
        static ClientProposalView of(Proposal p) {
            return new ClientProposalView(p.getNumber(), p.getTitle(), p.getClientName(), p.getClientCompany(),
                    p.getSummary(), p.getScope(), p.getTerms(), p.getCurrency(), p.getAmountPaise(), p.getAdvancePaise(),
                    p.getValidUntil(), p.getStatus(), p.isExpired(), p.getOwnerSignerName(), p.getOwnerSignature(),
                    p.getOwnerSignedAt(), p.getClientSignerName(), p.getClientSignature(), p.getClientSignedAt(),
                    p.getPaidAt());
        }
    }

    record PageView<T>(List<T> items, int page, int size, long total) {}

    record SendResponse(AdminProposalView proposal, boolean emailSent, String emailError, String signingUrl) {}
}
