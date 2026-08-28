package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {
    /** Low cost on purpose: these tests exercise the logic, not the work factor. */
    private final PasswordHasher hasher = new PasswordHasher(1_000);

    @Test
    void aPasswordVerifiesAgainstItsOwnHash() {
        String stored = hasher.hash("TestPass@2026");
        assertTrue(hasher.matches("TestPass@2026", stored));
    }

    @Test
    void aWrongPasswordDoesNotVerify() {
        String stored = hasher.hash("TestPass@2026");
        assertFalse(hasher.matches("TestPass@2025", stored));
        assertFalse(hasher.matches("", stored));
    }

    @Test
    void theSamePasswordHashesDifferentlyEveryTime() {
        // Without a per-password salt, identical passwords share a hash and one cracked hash
        // reveals every account that chose it.
        assertNotEquals(hasher.hash("same"), hasher.hash("same"));
    }

    @Test
    void theHashDoesNotContainThePassword() {
        assertFalse(hasher.hash("TestPass@2026").contains("TestPass@2026"));
    }

    @Test
    void aMalformedStoredValueReadsAsNoMatchRatherThanAnError() {
        // A corrupt row must not throw: an error a caller can provoke is a way to probe accounts.
        assertFalse(hasher.matches("x", null));
        assertFalse(hasher.matches("x", ""));
        assertFalse(hasher.matches("x", "not-a-hash"));
        assertFalse(hasher.matches("x", "pbkdf2-sha256$notanumber$aaaa$bbbb"));
        assertFalse(hasher.matches("x", "bcrypt$1000$aaaa$bbbb"));
    }

    @Test
    void hashesCarryTheirOwnParametersSoTheCostCanBeRaisedLater() {
        String old = new PasswordHasher(1_000).hash("carried");
        assertTrue(old.startsWith("pbkdf2-sha256$1000$"));
        // A hasher configured with a higher cost still verifies hashes written with the old one.
        assertTrue(new PasswordHasher(2_000).matches("carried", old));
    }

    @Test
    void refusesAnInsecureWorkFactor() {
        assertThrows(IllegalArgumentException.class, () -> new PasswordHasher(10));
    }

    @Test
    void theDefaultWorkFactorMeetsTheOwaspFloor() {
        assertEquals(600_000, PasswordHasher.DEFAULT_ITERATIONS);
    }
}
