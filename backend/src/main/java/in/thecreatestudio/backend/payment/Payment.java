package in.thecreatestudio.backend.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** A Razorpay order created for a proposal's advance payment. */
@Entity
@Table(name = "payment")
public class Payment {

    public enum Status { CREATED, PAID, FAILED }

    @Id
    private UUID id;

    @Column(name = "proposal_id", nullable = false)
    private UUID proposalId;

    @Column(name = "razorpay_order_id", nullable = false, unique = true)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", unique = true)
    private String razorpayPaymentId;

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private String method;

    @Column(name = "key_id")
    private String keyId;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Payment() {}

    Payment(UUID proposalId, String orderId, long amountPaise, String currency, String keyId) {
        this.keyId = keyId;
        this.id = UUID.randomUUID();
        this.proposalId = proposalId;
        this.razorpayOrderId = orderId;
        this.amountPaise = amountPaise;
        this.currency = currency;
        this.status = Status.CREATED;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    /** @return true if this call changed the status to PAID (idempotent). */
    boolean markPaid(String paymentId, String method) {
        if (status == Status.PAID) return false;
        this.status = Status.PAID;
        this.razorpayPaymentId = paymentId;
        if (method != null) this.method = method;
        this.failureReason = null;
        return true;
    }

    void markFailed(String paymentId, String reason) {
        if (status == Status.PAID) return;
        this.status = Status.FAILED;
        if (paymentId != null) this.razorpayPaymentId = paymentId;
        this.failureReason = reason == null ? null : reason.substring(0, Math.min(reason.length(), 300));
    }

    public String getKeyId() { return keyId; }
    public UUID getId() { return id; }
    public UUID getProposalId() { return proposalId; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public long getAmountPaise() { return amountPaise; }
    public String getCurrency() { return currency; }
    public Status getStatus() { return status; }
    public String getMethod() { return method; }
    public String getFailureReason() { return failureReason; }
    public Instant getCreatedAt() { return createdAt; }
}
