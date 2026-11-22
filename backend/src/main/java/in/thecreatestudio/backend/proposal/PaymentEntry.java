package in.thecreatestudio.backend.proposal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One amount received. Mistakes are cancelled with a reason, never edited or deleted. */
@Entity
@Table(name = "payment_entry")
public class PaymentEntry {

    public enum Method {
        ONLINE("Online"), CASH("Cash"), UPI("UPI"), BANK_TRANSFER("Bank transfer"), CHEQUE("Cheque"), OTHER("Other");

        private final String label;

        Method(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    @Id
    private UUID id;

    @Column(name = "proposal_id", nullable = false)
    private UUID proposalId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Method method;

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Column(name = "paid_on", nullable = false)
    private LocalDate paidOn;

    private String reference;

    private String note;

    // Only true on entries from the retired online checkout: not real money.
    @Column(name = "test_mode", nullable = false)
    private boolean testMode;

    @Column(name = "recorded_by", nullable = false)
    private String recordedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "voided_at")
    private Instant voidedAt;

    @Column(name = "voided_by")
    private String voidedBy;

    @Column(name = "void_reason")
    private String voidReason;

    protected PaymentEntry() {}

    PaymentEntry(UUID id, UUID proposalId, Method method, long amountPaise, LocalDate paidOn,
                 String reference, String note, String recordedBy) {
        this.id = id;
        this.proposalId = proposalId;
        this.method = method;
        this.amountPaise = amountPaise;
        this.paidOn = paidOn;
        this.reference = reference;
        this.note = note;
        this.recordedBy = recordedBy;
        this.createdAt = Instant.now();
    }

    void cancel(String by, String reason) {
        this.voidedAt = Instant.now();
        this.voidedBy = by;
        this.voidReason = reason;
    }

    boolean active() {
        return voidedAt == null;
    }

    public UUID getId() { return id; }
    public UUID getProposalId() { return proposalId; }
    public Method getMethod() { return method; }
    public long getAmountPaise() { return amountPaise; }
    public LocalDate getPaidOn() { return paidOn; }
    public String getReference() { return reference; }
    public String getNote() { return note; }
    public boolean isTestMode() { return testMode; }
    public String getRecordedBy() { return recordedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getVoidedAt() { return voidedAt; }
    public String getVoidedBy() { return voidedBy; }
    public String getVoidReason() { return voidReason; }
}
