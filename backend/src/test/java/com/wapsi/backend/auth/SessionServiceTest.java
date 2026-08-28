package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;

class SessionServiceTest {
    private static final String PAN = "ABCDE1234F";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private final SessionStore store = new SessionStore.InMemory();
    private final SessionService sessions = new SessionService(store, Duration.ofHours(12));

    @Test
    void aFreshTokenAuthenticatesItsAccount() {
        String token = sessions.issue(PAN, T0);
        assertEquals(Optional.of(PAN), sessions.authenticate(token, T0.plusSeconds(60)));
    }

    @Test
    void theRawTokenIsNeverStoredAsIs() {
        String token = sessions.issue(PAN, T0);
        // Black box, and deliberately so: re-implementing the hash here would prove only that the
        // test agrees with itself. The store is keyed by a hash, so the raw token is not a key...
        assertTrue(store.byTokenHash(token).isEmpty(),
                "a stolen database must not yield live sessions");
        // ...yet the token still authenticates, so the mapping exists in hashed form.
        assertEquals(Optional.of(PAN), sessions.authenticate(token, T0));
    }

    @Test
    void everyTokenIsDifferent() {
        assertNotEquals(sessions.issue(PAN, T0), sessions.issue(PAN, T0));
    }

    @Test
    void anUnknownOrEmptyTokenAuthenticatesNothing() {
        assertTrue(sessions.authenticate("not-a-real-token", T0).isEmpty());
        assertTrue(sessions.authenticate("", T0).isEmpty());
        assertTrue(sessions.authenticate(null, T0).isEmpty());
    }

    @Test
    void anExpiredTokenStopsWorking() {
        String token = sessions.issue(PAN, T0);
        assertTrue(sessions.authenticate(token, T0.plus(Duration.ofHours(12))).isEmpty());
    }

    @Test
    void expiryIsAbsoluteSoUsingATokenDoesNotExtendIt() {
        String token = sessions.issue(PAN, T0);
        // Used repeatedly right up to the deadline...
        for (int hour = 1; hour < 12; hour++) {
            assertEquals(Optional.of(PAN), sessions.authenticate(token, T0.plus(Duration.ofHours(hour))));
        }
        // ...and it still ends on time. A sliding window would let a stolen token live forever.
        assertTrue(sessions.authenticate(token, T0.plus(Duration.ofHours(12))).isEmpty());
    }

    @Test
    void revokingEndsTheSessionImmediately() {
        String token = sessions.issue(PAN, T0);
        sessions.revoke(token, T0.plusSeconds(10));
        assertTrue(sessions.authenticate(token, T0.plusSeconds(11)).isEmpty(),
                "signing out must end the session, not just drop the client's copy");
    }

    @Test
    void oneAccountsTokenNeverAuthenticatesAnother() {
        String mine = sessions.issue(PAN, T0);
        sessions.issue("ZZZZZ9999Z", T0);
        assertEquals(Optional.of(PAN), sessions.authenticate(mine, T0));
    }
}
