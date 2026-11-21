package in.thecreatestudio.backend.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class HashingTest {

    @Test
    void sha256MatchesKnownVector() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", Hashing.sha256Hex("abc"));
    }

    @Test
    void hmacMatchesRfc4231Vector() {
        // RFC 4231 test case 2
        assertEquals("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
                Hashing.hmacSha256Hex("Jefe", "what do ya want for nothing?"));
    }

    @Test
    void razorpayStyleSignatureVerification() {
        String secret = "test_secret";
        String sig = Hashing.hmacSha256Hex(secret, "order_123|pay_456");
        assertTrue(Hashing.safeEquals(sig, Hashing.hmacSha256Hex(secret, "order_123|pay_456")));
        assertFalse(Hashing.safeEquals(sig, Hashing.hmacSha256Hex(secret, "order_123|pay_999")));
        assertFalse(Hashing.safeEquals(sig, null));
    }

    @Test
    void randomTokensAreUrlSafeAndUnique() {
        String a = Hashing.randomToken(32), b = Hashing.randomToken(32);
        assertNotEquals(a, b);
        assertEquals(43, a.length());
        assertTrue(a.matches("[A-Za-z0-9_-]+"));
    }
}
