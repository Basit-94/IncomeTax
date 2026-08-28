package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Result;

class OtpServiceTest {
    private static final String MOBILE = "9876543210";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private final List<String> delivered = new ArrayList<>();
    private final Otp.Store store = new InMemoryOtpStore();
    private final PasswordHasher hasher = new PasswordHasher(1_000);

    private OtpService service() {
        return new OtpService(store, new Otp.SecureCodes(), hasher,
                Duration.ofMinutes(15), 5, Duration.ofSeconds(60));
    }

    private String issue(OtpService service, Instant now) {
        delivered.clear();
        service.issue(MOBILE, Channel.MOBILE, now, delivered::add);
        return delivered.get(0);
    }

    @Test
    void aCorrectCodeVerifiesOnce_andAReplayIsRejected() {
        OtpService service = service();
        String code = issue(service, T0);

        assertEquals(Result.OK, service.verify(MOBILE, Channel.MOBILE, code, T0.plusSeconds(30)));
        // Consuming on success is what stops a captured code being used again.
        assertEquals(Result.ALREADY_USED,
                service.verify(MOBILE, Channel.MOBILE, code, T0.plusSeconds(31)));
    }

    @Test
    void theCodeIsNeverReturnedByTheApiAndNeverStoredInTheClear() {
        OtpService service = service();
        // issue() hands back a correlation id, never the code.
        Object issued = service.issue(MOBILE, Channel.EMAIL, T0, delivered::add);
        assertNotNull(issued);
        assertFalse(String.valueOf(issued).contains(delivered.get(0)));

        Otp.Challenge stored = store.latest(MOBILE, Channel.EMAIL).orElseThrow();
        assertFalse(stored.codeHash().contains(delivered.get(0)),
                "a stolen database must not yield live codes");
        assertTrue(hasher.matches(delivered.get(0), stored.codeHash()));
    }

    @Test
    void codesAreSixDigits() {
        assertTrue(Pattern.matches("\\d{6}", issue(service(), T0)));
    }

    @Test
    void aWrongCodeIsIncorrect_andAttemptsAreCounted() {
        OtpService service = service();
        String code = issue(service, T0);
        String wrong = code.equals("000000") ? "111111" : "000000";

        assertEquals(Result.INCORRECT, service.verify(MOBILE, Channel.MOBILE, wrong, T0));
        assertEquals(1, store.latest(MOBILE, Channel.MOBILE).orElseThrow().attempts());
    }

    @Test
    void theAttemptCapLocksTheChallengeEvenIfTheRightCodeArrivesLater() {
        OtpService service = service();
        String code = issue(service, T0);
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 4; i++) {
            assertEquals(Result.INCORRECT, service.verify(MOBILE, Channel.MOBILE, wrong, T0));
        }
        assertEquals(Result.TOO_MANY_ATTEMPTS, service.verify(MOBILE, Channel.MOBILE, wrong, T0));
        // Brute force must not be rescued by eventually guessing right.
        assertEquals(Result.TOO_MANY_ATTEMPTS, service.verify(MOBILE, Channel.MOBILE, code, T0));
    }

    @Test
    void anExpiredCodeIsRejected() {
        OtpService service = service();
        String code = issue(service, T0);
        assertEquals(Result.EXPIRED,
                service.verify(MOBILE, Channel.MOBILE, code, T0.plus(Duration.ofMinutes(15))));
    }

    @Test
    void resendIsRateLimited_butAllowedOnceTheCooldownPasses() {
        OtpService service = service();
        issue(service, T0);
        assertThrows(IllegalStateException.class,
                () -> service.issue(MOBILE, Channel.MOBILE, T0.plusSeconds(5), delivered::add));

        String second = issue(service, T0.plusSeconds(61));
        assertEquals(Result.OK, service.verify(MOBILE, Channel.MOBILE, second, T0.plusSeconds(62)));
    }

    @Test
    void verifyingWithNoChallengeSaysSo() {
        assertEquals(Result.NO_CHALLENGE,
                service().verify("nobody", Channel.MOBILE, "123456", T0));
    }

    @Test
    void mobileAndEmailAreVerifiedIndependently() {
        OtpService service = service();
        String mobileCode = issue(service, T0);
        delivered.clear();
        service.issue(MOBILE, Channel.EMAIL, T0, delivered::add);
        String emailCode = delivered.get(0);

        assertEquals(Result.OK, service.verify(MOBILE, Channel.MOBILE, mobileCode, T0));
        // The real portal verifies both separately; consuming one must not consume the other.
        assertEquals(Result.OK, service.verify(MOBILE, Channel.EMAIL, emailCode, T0));
    }

    @Test
    void aFixedCodeGeneratorSupportsMockModeWithoutAnEndpointLeakingIt() {
        OtpService service = new OtpService(store, new Otp.FixedCode("949494"), hasher);
        String code = issue(service, T0);
        assertEquals("949494", code);
        assertEquals(Result.OK, service.verify(MOBILE, Channel.MOBILE, "949494", T0));
    }
}
