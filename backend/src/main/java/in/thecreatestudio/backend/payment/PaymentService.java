package in.thecreatestudio.backend.payment;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.ClientInfo;
import in.thecreatestudio.backend.config.AppProperties;
import in.thecreatestudio.backend.proposal.Proposal;
import in.thecreatestudio.backend.proposal.ProposalEvent.Actor;
import in.thecreatestudio.backend.proposal.ProposalService;
import in.thecreatestudio.backend.proposal.ProposalStatus;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Advance payments via Razorpay. The amount always comes from the proposal stored in the
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

    PaymentService(PaymentRepository payments, RazorpayClient razorpay, ProposalService proposals, AppProperties props) {
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
        Proposal p = proposals.byToken(token);
        if (p.getStatus() == ProposalStatus.PAID) throw ApiException.conflict("This proposal is already paid. Thank you!");
        if (p.getStatus() != ProposalStatus.SIGNED) throw ApiException.conflict("Please sign the proposal before paying.");
        if (p.getAdvancePaise() <= 0) throw ApiException.conflict("No advance payment is due for this proposal.");

        // Reuse an open order for the same amount so repeated clicks don't create duplicates.
        Payment open = payments.findFirstByProposalIdAndStatusOrderByCreatedAtDesc(p.getId(), Payment.Status.CREATED)
                .filter(x -> x.getAmountPaise() == p.getAdvancePaise())
                .orElse(null);
        if (open == null) {
            RazorpayClient.Order order = razorpay.createOrder(p.getAdvancePaise(), p.getCurrency(), p.getNumber(),
                    Map.of("proposal_number", p.getNumber(), "proposal_id", p.getId().toString()));
            if (order.amount() != p.getAdvancePaise()) throw new IllegalStateException("Razorpay amount mismatch");
            open = payments.save(new Payment(p.getId(), order.id(), order.amount(), order.currency()));
            proposals.logEvent(p.getId(), "PAYMENT_STARTED", Actor.CLIENT, info, "Razorpay order " + order.id());
        }
        return new CheckoutOrder(razorpay.keyId(), open.getRazorpayOrderId(), open.getAmountPaise(), open.getCurrency(),
                props.companyName(), "Advance for " + p.getNumber() + " — " + p.getTitle(),
                p.getClientName(), p.getClientEmail(), p.getClientPhone());
    }

    /** Called by the browser after Razorpay Checkout succeeds. */
    @Transactional
    public void verifyCheckout(String token, String orderId, String paymentId, String signature, ClientInfo info) {
        Proposal p = proposals.byToken(token);
        Payment payment = payments.findByRazorpayOrderId(orderId)
                .filter(x -> x.getProposalId().equals(p.getId()))
                .orElseThrow(() -> ApiException.notFound("Payment"));
        if (!razorpay.verifyPaymentSignature(orderId, paymentId, signature)) {
            proposals.logEvent(p.getId(), "PAYMENT_VERIFY_FAILED", Actor.CLIENT, info, "Invalid signature for " + paymentId);
            throw ApiException.badRequest("We could not verify this payment. If money was deducted, please contact us.");
        }
        settle(payment, paymentId, null, "Verified checkout payment " + paymentId);
    }

    /** Verified Razorpay webhook events (payment.captured / order.paid / payment.failed). */
    @Transactional
    public void onWebhook(String event, String orderId, String paymentId, String method, String error) {
        Payment payment = payments.findByRazorpayOrderId(orderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook {} for unknown order {}", event, orderId);
            return;
        }
        switch (event) {
            case "payment.captured", "order.paid" -> settle(payment, paymentId, method, "Webhook " + event + " " + paymentId);
            case "payment.failed" -> {
                payment.markFailed(paymentId, error);
                proposals.logEvent(payment.getProposalId(), "PAYMENT_FAILED", Actor.SYSTEM, null, error);
            }
            default -> log.debug("Ignoring webhook event {}", event);
        }
    }

    private void settle(Payment payment, String paymentId, String method, String detail) {
        if (payment.markPaid(paymentId, method)) {
            proposals.recordPayment(payment.getProposalId(), detail);
        }
    }
}
