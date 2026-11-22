package in.thecreatestudio.backend.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class HashingTest {

    @Test
    void sha256MatchesKnownVector() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", Hashing.sha256Hex("abc"));
    }

    @Test
    void randomTokensAreUrlSafeAndUnique() {
        String a = Hashing.randomToken(32), b = Hashing.randomToken(32);
        assertNotEquals(a, b);
        assertEquals(43, a.length());
        assertTrue(a.matches("[A-Za-z0-9_-]+"));
    }
}
