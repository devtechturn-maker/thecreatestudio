package in.thecreatestudio.backend.payment;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.config.AppProperties;
import in.thecreatestudio.backend.proposal.LedgerService;
import in.thecreatestudio.backend.proposal.Proposal;
import in.thecreatestudio.backend.proposal.ProposalEvent.Actor;
import in.thecreatestudio.backend.proposal.ProposalService;
import in.thecreatestudio.backend.proposal.ProposalStatus;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Payments via Razorpay. The amount always comes from the amount due in the
 * database — never from the browser. A payment is only marked paid after signature
 * verification (checkout callback) or a verified webhook.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    public record CheckoutOrder(String keyId, String orderId, long amount, String currency, String name,
                                String description, String prefillName, String prefillEmail, String prefillContact) {}

    private final PaymentRepository payments;
    private final RazorpayClient razorpay;
    private final ProposalService proposals;
    private final AppProperties props;
    private final LedgerService ledger;

    PaymentService(PaymentRepository payments, RazorpayClient razorpay, ProposalService proposals, AppProperties props, LedgerService ledger) {
        this.ledger = ledger;
        this.payments = payments;
        this.razorpay = razorpay;
        this.proposals = proposals;
        this.props = props;
    }

    public boolean enabled() {
        return razorpay.configured();
    }

    @Transactional
    public CheckoutOrder createOrder(String token, ClientInfo info) {
        Proposal p = ledger.lockByToken(token);
        if (p.getStatus() == ProposalStatus.PAID) throw ApiException.conflict("This proposal is already paid. Thank you!");
        if (p.getStatus() != ProposalStatus.SIGNED) throw ApiException.conflict("Please sign the proposal before paying.");
        long due = ledger.dueNow(p);
        if (due < 100) throw ApiException.conflict("No online payment is due right now.");

        // Reuse an open order only for the same amount and key (test orders don't work with live keys).
        Payment open = payments.findFirstByProposalIdAndStatusOrderByCreatedAtDesc(p.getId(), Payment.Status.CREATED)
                .filter(x -> x.getAmountPaise() == due && Objects.equals(x.getKeyId(), razorpay.keyId()))
                .orElse(null);
        if (open == null) {
            RazorpayClient.Order order = razorpay.createOrder(due, p.getCurrency(), p.getNumber(),
                    Map.of("proposal_number", p.getNumber(), "proposal_id", p.getId().toString()));
            if (order.amount() != due) throw new IllegalStateException("Razorpay amount mismatch");
            open = payments.save(new Payment(p.getId(), order.id(), order.amount(), order.currency(), razorpay.keyId()));
            proposals.logEvent(p.getId(), "PAYMENT_STARTED", Actor.CLIENT, info, "Razorpay order " + order.id());
        }
        return new CheckoutOrder(razorpay.keyId(), open.getRazorpayOrderId(), open.getAmountPaise(), open.getCurrency(),
                props.companyName(), "Payment for " + p.getNumber() + " — " + p.getTitle(),
                p.getClientName(), p.getClientEmail(), p.getClientPhone());
    }

    /** Called by the browser after Razorpay Checkout succeeds. */
    @Transactional
    /** @return the proposal to send a receipt for, empty when already recorded. */
    public Optional<UUID> verifyCheckout(String token, String orderId, String paymentId, String signature, ClientInfo info) {
        // Lock order is always payment, then proposal (the webhook does the same). The proposal must
        // not be read before it is locked, or a concurrent cash entry makes this fail as stale.
        Payment payment = payments.findByRazorpayOrderId(orderId).orElseThrow(() -> ApiException.notFound("Payment"));
        Proposal p = ledger.lockByToken(token);
        if (!payment.getProposalId().equals(p.getId())) throw ApiException.notFound("Payment");
        if (!razorpay.verifyPaymentSignature(orderId, paymentId, signature)) {
            proposals.logEvent(p.getId(), "PAYMENT_VERIFY_FAILED", Actor.CLIENT, info, "Invalid signature for " + paymentId);
            throw ApiException.badRequest("We could not verify this payment. If money was deducted, please contact us.");
        }
        return settle(payment, paymentId, null);
    }

    /** Verified Razorpay webhook events (payment.captured / order.paid / payment.failed). */
    @Transactional
    public Optional<UUID> onWebhook(String event, String orderId, String paymentId, String method, String error) {
        Payment payment = payments.findByRazorpayOrderId(orderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook {} for unknown order {}", event, orderId);
            return Optional.empty();
        }
        switch (event) {
            case "payment.captured", "order.paid" -> { return settle(payment, paymentId, method); }
            case "payment.failed" -> {
                if (payment.getStatus() == Payment.Status.PAID) return Optional.empty(); // late event
                payment.markFailed(paymentId, error);
                proposals.logEvent(payment.getProposalId(), "PAYMENT_FAILED", Actor.SYSTEM, null, error);
            }
            default -> log.debug("Ignoring webhook event {}", event);
        }
        return Optional.empty();
    }

    private Optional<UUID> settle(Payment payment, String paymentId, String method) {
        if (!payment.markPaid(paymentId, method)) return Optional.empty();
        boolean test = payment.getKeyId() != null && payment.getKeyId().startsWith("rzp_test");
        ledger.recordOnline(payment.getProposalId(), payment.getId(), payment.getAmountPaise(), paymentId, test);
        return Optional.of(payment.getProposalId());
    }
}
