package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.SignInService.SignInFailed;

/** All values synthetic. */
class SignInServiceTest {
    private static final String PAN = "ABCDE1234F";
    private static final String PASSWORD = "TestPass@2026";
    private static final String GREETING = "Green door, third floor";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private final AccountStore accounts = new AccountStore.InMemory();
    private final PasswordHasher hasher = new PasswordHasher(1_000);
    private final SignInAttempts attempts = new SignInAttempts.InMemory();
    private final OtpService otp =
            new OtpService(new InMemoryOtpStore(), new Otp.SecureCodes(), hasher);
    private final RegistrationService registration =
            new RegistrationService(accounts, otp, hasher);
    private final SignInService signIn =
            new SignInService(accounts, attempts, hasher, 3, Duration.ofMinutes(15));

    private final List<String> delivered = new ArrayList<>();

    private void register() {
        registration.begin(PAN, T0);
        registration.submitDetails(PAN, "Priya Sharma", LocalDate.of(1994, 3, 17),
                "9876543210", "priya.sharma@example.com");
        for (Channel channel : Channel.values()) {
            delivered.clear();
            registration.sendCode(PAN, channel, T0, delivered::add);
            registration.verifyCode(PAN, channel, delivered.get(0), T0);
        }
        registration.complete(PAN, PASSWORD.toCharArray(), GREETING, T0);
    }

    @Test
    void aCorrectPasswordSignsInAndReturnsTheAntiPhishingMessage() {
        register();
        SignInService.Session session = signIn.signIn(PAN, PASSWORD.toCharArray(), T0);
        assertEquals(PAN, session.pan());
        assertEquals("Priya Sharma", session.fullName());
        // This is what lets the user tell the real portal from a copy of it.
        assertEquals(GREETING, session.personalisedMessage());
    }

    @Test
    void aWrongPasswordAndAnUnknownPanFailIdentically() {
        register();
        SignInFailed wrongPassword =
                assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, "nope".toCharArray(), T0));
        SignInFailed unknownPan =
                assertThrows(SignInFailed.class, () -> signIn.signIn("ZZZZZ9999Z", PASSWORD.toCharArray(), T0));
        // Sign-in must not answer "does this person have an account".
        assertEquals(wrongPassword.getMessage(), unknownPan.getMessage());
    }

    @Test
    void theMessageIsNotHandedOutBeforeThePasswordIsCorrect() {
        register();
        SignInFailed failure =
                assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, "nope".toCharArray(), T0));
        assertNotEquals(GREETING, failure.getMessage());
        org.junit.jupiter.api.Assertions.assertFalse(failure.getMessage().contains(GREETING));
    }

    @Test
    void anAccountStillInRegistrationCannotSignIn() {
        registration.begin(PAN, T0);
        registration.submitDetails(PAN, "Priya Sharma", LocalDate.of(1994, 3, 17),
                "9876543210", "priya.sharma@example.com");
        // No password has been set, so nothing should match — and it must fail like any other.
        assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, PASSWORD.toCharArray(), T0));
    }

    @Test
    void repeatedFailuresLockTheAccountEvenAgainstTheCorrectPassword() {
        register();
        for (int i = 0; i < 3; i++) {
            assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, "nope".toCharArray(), T0));
        }
        // Brute force must not be rescued by eventually getting it right.
        assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, PASSWORD.toCharArray(), T0));
    }

    @Test
    void theLockoutExpires() {
        register();
        for (int i = 0; i < 3; i++) {
            assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, "nope".toCharArray(), T0));
        }
        SignInService.Session session =
                signIn.signIn(PAN, PASSWORD.toCharArray(), T0.plus(Duration.ofMinutes(16)));
        assertEquals(PAN, session.pan());
    }

    @Test
    void aSuccessfulSignInClearsTheFailureCount() {
        register();
        assertThrows(SignInFailed.class, () -> signIn.signIn(PAN, "nope".toCharArray(), T0));
        signIn.signIn(PAN, PASSWORD.toCharArray(), T0);
        assertEquals(0, attempts.get(PAN).failedAttempts());
    }
}
