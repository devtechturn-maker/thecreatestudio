package in.thecreatestudio.backend.auth;

import in.thecreatestudio.backend.common.ApiException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Simple in-memory brute-force protection: 5 failed logins per IP per 15 minutes. */
@Component
class LoginRateLimiter {

    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private record Bucket(int failures, Instant windowStart) {}

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    void check(String ip) {
        Bucket b = buckets.get(ip);
        if (b != null && b.windowStart().plus(WINDOW).isAfter(Instant.now()) && b.failures() >= MAX_FAILURES) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Please try again in 15 minutes.");
        }
    }

    void failure(String ip) {
        buckets.compute(ip, (k, b) -> {
            Instant now = Instant.now();
            if (b == null || b.windowStart().plus(WINDOW).isBefore(now)) return new Bucket(1, now);
            return new Bucket(b.failures() + 1, b.windowStart());
        });
    }

    void success(String ip) {
        buckets.remove(ip);
    }
}
