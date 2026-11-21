package in.thecreatestudio.backend.common;

import jakarta.servlet.http.HttpServletRequest;

/**
 * IP address and user agent of the caller, recorded in the signing audit trail.
 * With {@code server.forward-headers-strategy=native}, {@code getRemoteAddr()} already
 * reflects X-Forwarded-For set by nginx.
 */
public record ClientInfo(String ip, String userAgent) {

    public static ClientInfo from(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        return new ClientInfo(truncate(request.getRemoteAddr(), 64), truncate(ua, 400));
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
