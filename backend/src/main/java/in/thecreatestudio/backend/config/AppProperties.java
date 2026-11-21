package in.thecreatestudio.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the {@code app.*} configuration block. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String publicBaseUrl,
        String companyName,
        String ownerSignerName,
        String mailFrom,
        Jwt jwt,
        Admin admin,
        Razorpay razorpay) {

    public record Jwt(String secret, long ttlHours) {}

    public record Admin(String email, String password) {}

    public record Razorpay(String keyId, String keySecret, String webhookSecret, String apiBase) {
        public boolean configured() {
            return notBlank(keyId) && notBlank(keySecret);
        }
    }

    public String baseUrl() {
        return publicBaseUrl == null ? "" : publicBaseUrl.replaceAll("/+$", "");
    }

    static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
