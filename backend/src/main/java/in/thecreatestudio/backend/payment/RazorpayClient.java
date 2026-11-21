package in.thecreatestudio.backend.payment;

import in.thecreatestudio.backend.common.ApiException;
import in.thecreatestudio.backend.common.Hashing;
import in.thecreatestudio.backend.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Minimal Razorpay REST client (Orders API + signature verification).
 * Docs: https://razorpay.com/docs/api/orders/ and
 * https://razorpay.com/docs/payments/server-integration/java/payment-gateway/build-integration/
 */
@Component
class RazorpayClient {

    private static final Logger log = LoggerFactory.getLogger(RazorpayClient.class);

    record Order(String id, long amount, String currency, String status) {}

    private final AppProperties.Razorpay cfg;
    private final RestClient http;

    RazorpayClient(AppProperties props) {
        this.cfg = props.razorpay();
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(Duration.ofSeconds(10));
        rf.setReadTimeout(Duration.ofSeconds(20));
        String basic = cfg.configured()
                ? Base64.getEncoder().encodeToString((cfg.keyId() + ":" + cfg.keySecret()).getBytes(StandardCharsets.UTF_8))
                : "";
        this.http = RestClient.builder()
                .baseUrl(cfg.apiBase())
                .requestFactory(rf)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .build();
    }

    boolean configured() {
        return cfg.configured();
    }

    String keyId() {
        return cfg.keyId();
    }

    @SuppressWarnings("unchecked")
    Order createOrder(long amountPaise, String currency, String receipt, Map<String, String> notes) {
        requireConfigured();
        try {
            Map<String, Object> res = http.post().uri("/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", amountPaise, "currency", currency, "receipt", receipt, "notes", notes))
                    .retrieve()
                    .body(Map.class);
            if (res == null || res.get("id") == null) throw new IllegalStateException("Empty Razorpay response");
            return new Order((String) res.get("id"), ((Number) res.get("amount")).longValue(),
                    (String) res.get("currency"), (String) res.get("status"));
        } catch (RestClientException | IllegalStateException e) {
            log.error("Razorpay order creation failed", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not start the payment. Please try again in a moment.");
        }
    }

    /** Checkout callback signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
    boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        requireConfigured();
        String expected = Hashing.hmacSha256Hex(cfg.keySecret(), orderId + "|" + paymentId);
        return Hashing.safeEquals(expected, signature);
    }

    /** Webhook signature: HMAC_SHA256(raw request body, webhook_secret). */
    boolean verifyWebhookSignature(String rawBody, String signature) {
        if (cfg.webhookSecret() == null || cfg.webhookSecret().isBlank()) return false;
        return Hashing.safeEquals(Hashing.hmacSha256Hex(cfg.webhookSecret(), rawBody), signature);
    }

    private void requireConfigured() {
        if (!cfg.configured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Online payment is not available yet. Please contact us to pay.");
        }
    }
}
