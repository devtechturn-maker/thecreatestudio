package in.thecreatestudio.backend.proposal;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.common.Hashing;
import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

/** A proposal / service agreement sent to a client for acceptance and e-signature. */
@Entity
@Table(name = "proposal")
public class Proposal {

    static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Kolkata");

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String number;

    @Column(nullable = false)
    private String title;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "client_email", nullable = false)
    private String clientEmail;

    @Column(name = "client_phone")
    private String clientPhone;

    @Column(name = "client_company")
    private String clientCompany;

    @Column(nullable = false, columnDefinition = "text")
    private String summary;

    @Column(nullable = false, columnDefinition = "text")
    private String scope;

    @Column(nullable = false, columnDefinition = "text")
    private String terms;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Column(name = "advance_paise", nullable = false)
    private long advancePaise;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProposalStatus status;

    @Column(name = "public_token", nullable = false, unique = true)
    private String publicToken;

    @Column(name = "content_hash")
    private String contentHash;

    @Column(name = "owner_signer_name")
    private String ownerSignerName;

    @Column(name = "owner_signature", columnDefinition = "text")
    private String ownerSignature;

    @Column(name = "owner_signed_at")
    private Instant ownerSignedAt;

    @Column(name = "owner_signed_ip")
    private String ownerSignedIp;

    @Column(name = "client_signer_name")
    private String clientSignerName;

    @Column(name = "client_signature", columnDefinition = "text")
    private String clientSignature;

    @Column(name = "client_signed_at")
    private Instant clientSignedAt;

    @Column(name = "client_signed_ip")
    private String clientSignedIp;

    @Column(name = "client_user_agent")
    private String clientUserAgent;

    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "first_viewed_at")
    private Instant firstViewedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "signed_pdf")
    private byte[] signedPdf;

    @Column(name = "signed_pdf_hash")
    private String signedPdfHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected Proposal() {}

    Proposal(String number) {
        this.id = UUID.randomUUID();
        this.number = number;
        this.status = ProposalStatus.DRAFT;
        this.publicToken = Hashing.randomToken(32);
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    // ---------------------------------------------------------------- behaviour

    void updateContent(ProposalContent c) {
        requireStatus("edited", ProposalStatus.DRAFT);
        if (c.advancePaise() > c.amountPaise()) throw ApiException.badRequest("Advance cannot be more than the total amount.");
        this.title = c.title();
        this.clientName = c.clientName();
        this.clientEmail = c.clientEmail().trim().toLowerCase();
        this.clientPhone = c.clientPhone();
        this.clientCompany = c.clientCompany();
        this.summary = c.summary();
        this.scope = c.scope();
        this.terms = c.terms();
        this.amountPaise = c.amountPaise();
        this.advancePaise = c.advancePaise();
        this.validUntil = c.validUntil();
        // Any edit invalidates an earlier owner signature: the owner must re-sign what they send.
        clearOwnerSignature();
    }

    void ownerSign(String signerName, String signaturePng, ClientInfo info) {
        requireStatus("signed by you", ProposalStatus.DRAFT);
        this.ownerSignerName = signerName;
        this.ownerSignature = signaturePng;
        this.ownerSignedAt = Instant.now();
        this.ownerSignedIp = info.ip();
        this.contentHash = computeContentHash();
    }

    void markSent() {
        requireStatus("sent", ProposalStatus.DRAFT);
        if (ownerSignature == null) throw ApiException.conflict("Please sign the proposal before sending it.");
        if (!computeContentHash().equals(contentHash)) throw ApiException.conflict("Content changed after signing. Please sign again.");
        this.status = ProposalStatus.SENT;
        this.sentAt = Instant.now();
    }

    /** Returns true the first time the client opens the link. */
    boolean markViewed() {
        if (status == ProposalStatus.SENT) {
            status = ProposalStatus.VIEWED;
            firstViewedAt = Instant.now();
            return true;
        }
        return false;
    }

    void clientSign(String signerName, String signaturePng, ClientInfo info) {
        requireStatus("signed", ProposalStatus.SENT, ProposalStatus.VIEWED);
        if (isExpired()) throw ApiException.conflict("This proposal has expired. Please contact us for an updated proposal.");
        if (!computeContentHash().equals(contentHash)) throw ApiException.conflict("This proposal can no longer be signed. Please contact us.");
        Instant now = Instant.now();
        this.termsAcceptedAt = now;
        this.clientSignerName = signerName;
        this.clientSignature = signaturePng;
        this.clientSignedAt = now;
        this.clientSignedIp = info.ip();
        this.clientUserAgent = info.userAgent();
        if (firstViewedAt == null) firstViewedAt = now;
        this.status = ProposalStatus.SIGNED;
    }

    void attachSignedPdf(byte[] pdf) {
        this.signedPdf = pdf;
        this.signedPdfHash = Hashing.sha256Hex(pdf);
    }

    void markPaid() {
        if (status == ProposalStatus.PAID) return;
        requireStatus("marked as paid", ProposalStatus.SIGNED);
        this.status = ProposalStatus.PAID;
        this.paidAt = Instant.now();
    }

    void cancel() {
        requireStatus("cancelled", ProposalStatus.DRAFT, ProposalStatus.SENT, ProposalStatus.VIEWED);
        this.status = ProposalStatus.CANCELLED;
        this.cancelledAt = Instant.now();
    }

    boolean isExpired() {
        return validUntil != null && LocalDate.now(BUSINESS_ZONE).isAfter(validUntil);
    }

    boolean paymentDue() {
        return status == ProposalStatus.SIGNED && advancePaise > 0;
    }

    /** SHA-256 of everything the client agrees to — proves the signed text was not altered. */
    String computeContentHash() {
        String canonical = String.join("\u001F",
                number, nz(title), nz(clientName), nz(clientEmail), nz(clientPhone), nz(clientCompany),
                nz(summary), nz(scope), nz(terms), currency, Long.toString(amountPaise), Long.toString(advancePaise),
                validUntil == null ? "" : validUntil.toString());
        return Hashing.sha256Hex(canonical);
    }

    private void clearOwnerSignature() {
        this.ownerSignerName = null;
        this.ownerSignature = null;
        this.ownerSignedAt = null;
        this.ownerSignedIp = null;
        this.contentHash = null;
    }

    private void requireStatus(String action, ProposalStatus... allowed) {
        for (ProposalStatus s : allowed) if (s == status) return;
        throw ApiException.conflict("A proposal in status " + status + " cannot be " + action + ".");
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    // ---------------------------------------------------------------- getters

    public UUID getId() { return id; }
    public String getNumber() { return number; }
    public String getTitle() { return title; }
    public String getClientName() { return clientName; }
    public String getClientEmail() { return clientEmail; }
    public String getClientPhone() { return clientPhone; }
    public String getClientCompany() { return clientCompany; }
    public String getSummary() { return summary; }
    public String getScope() { return scope; }
    public String getTerms() { return terms; }
    public String getCurrency() { return currency; }
    public long getAmountPaise() { return amountPaise; }
    public long getAdvancePaise() { return advancePaise; }
    public LocalDate getValidUntil() { return validUntil; }
    public ProposalStatus getStatus() { return status; }
    public String getPublicToken() { return publicToken; }
    public String getContentHash() { return contentHash; }
    public String getOwnerSignerName() { return ownerSignerName; }
    public String getOwnerSignature() { return ownerSignature; }
    public Instant getOwnerSignedAt() { return ownerSignedAt; }
    public String getOwnerSignedIp() { return ownerSignedIp; }
    public String getClientSignerName() { return clientSignerName; }
    public String getClientSignature() { return clientSignature; }
    public Instant getClientSignedAt() { return clientSignedAt; }
    public String getClientSignedIp() { return clientSignedIp; }
    public String getClientUserAgent() { return clientUserAgent; }
    public Instant getTermsAcceptedAt() { return termsAcceptedAt; }
    public Instant getSentAt() { return sentAt; }
    public Instant getFirstViewedAt() { return firstViewedAt; }
    public Instant getPaidAt() { return paidAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public byte[] getSignedPdf() { return signedPdf; }
    public String getSignedPdfHash() { return signedPdfHash; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
