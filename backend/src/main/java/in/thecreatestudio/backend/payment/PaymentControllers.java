package in.thecreatestudio.backend.payment;

import in.thecreatestudio.backend.common.ClientInfo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Client payment endpoints (token-gated) for the signing page. */
@RestController
@RequestMapping("/api/public/proposals/{token}/payment")
class PublicPaymentController {

    record VerifyRequest(@NotBlank @Size(max = 64) String orderId,
                         @NotBlank @Size(max = 64) String paymentId,
                         @NotBlank @Size(max = 128) String signature) {}

    private final PaymentService service;

    PublicPaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping("/status")
    Map<String, Object> status() {
        return Map.of("enabled", service.enabled());
    }

    @PostMapping("/order")
    PaymentService.CheckoutOrder order(@PathVariable String token, HttpServletRequest req) {
        return service.createOrder(token, ClientInfo.from(req));
    }

    @PostMapping("/verify")
    Map<String, Object> verify(@PathVariable String token, @Valid @RequestBody VerifyRequest body, HttpServletRequest req) {
        service.verifyCheckout(token, body.orderId(), body.paymentId(), body.signature(), ClientInfo.from(req));
        return Map.of("paid", true);
    }
}

/**
 * Razorpay webhook. Configure in Razorpay Dashboard → Settings → Webhooks with URL
 * https://<your-domain>/api/webhooks/razorpay and events payment.captured, order.paid, payment.failed.
 */
@RestController
@RequestMapping("/api/webhooks/razorpay")
class RazorpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookController.class);

    private final RazorpayClient razorpay;
    private final PaymentService service;
    private final ObjectMapper mapper;

    RazorpayWebhookController(RazorpayClient razorpay, PaymentService service, ObjectMapper mapper) {
        this.razorpay = razorpay;
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    ResponseEntity<Void> handle(@RequestBody String rawBody,
                                @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        if (signature == null || !razorpay.verifyWebhookSignature(rawBody, signature)) {
            log.warn("Rejected Razorpay webhook with missing/invalid signature");
            return ResponseEntity.badRequest().build();
        }
        JsonNode root = mapper.readTree(rawBody);
        String event = root.path("event").asString("");
        JsonNode payment = root.path("payload").path("payment").path("entity");
        JsonNode order = root.path("payload").path("order").path("entity");
        String orderId = payment.path("order_id").asString(order.path("id").asString(null));
        String paymentId = payment.path("id").asString(null);
        String method = payment.path("method").asString(null);
        String error = payment.path("error_description").asString(null);
        if (orderId != null) service.onWebhook(event, orderId, paymentId, method, error);
        return ResponseEntity.ok().build();
    }
}
