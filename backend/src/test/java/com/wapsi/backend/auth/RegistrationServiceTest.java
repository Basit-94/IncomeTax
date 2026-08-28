package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Result;
import com.wapsi.backend.auth.RegistrationService.RegistrationException;

/** T2.1 / T2.2. All values here are synthetic. */
class RegistrationServiceTest {
    private static final String PAN = "ABCDE1234F";
    private static final String MOBILE = "9876543210";
    private static final String EMAIL = "priya.sharma@example.com";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private final AccountStore accounts = new AccountStore.InMemory();
    private final PasswordHasher hasher = new PasswordHasher(1_000);
    private final List<String> delivered = new ArrayList<>();
    private final OtpService otp =
            new OtpService(new InMemoryOtpStore(), new Otp.SecureCodes(), hasher);
    private final RegistrationService registration =
            new RegistrationService(accounts, otp, hasher);

    private void details() {
        registration.begin(PAN, T0);
        registration.submitDetails(PAN, "Priya Sharma", LocalDate.of(1994, 3, 17), MOBILE, EMAIL);
    }

    private String code(Channel channel, Instant now) {
        delivered.clear();
        registration.sendCode(PAN, channel, now, delivered::add);
        return delivered.get(0);
    }

    private Account registerFully() {
        details();
        assertEquals(Result.OK, registration.verifyCode(PAN, Channel.MOBILE, code(Channel.MOBILE, T0), T0));
        assertEquals(Result.OK, registration.verifyCode(PAN, Channel.EMAIL, code(Channel.EMAIL, T0), T0));
        return registration.complete(PAN, "TestPass@2026".toCharArray(), "Green door, third floor", T0);
    }

    @Test
    void theWholeFlowActivatesAnAccount() {
        Account account = registerFully();
        assertTrue(account.isActive());
        assertTrue(account.bothChannelsVerified());
        assertEquals("Green door, third floor", account.greeting().orElseThrow());
        assertTrue(hasher.matches("TestPass@2026", account.passwordHash()));
    }

    @Test
    void aPanAloneRevealsNothingAndGrantsNothing() {
        registerFully();
        // Someone who knows only the PAN gets no personal detail and cannot re-register it.
        RegistrationException thrown =
                assertThrows(RegistrationException.class, () -> registration.begin(PAN, T0));
        String message = thrown.getMessage();
        assertFalse(message.contains("Priya"), message);
        assertFalse(message.contains(MOBILE), message);
        assertFalse(message.contains(EMAIL), message);
    }

    @Test
    void aMalformedPanIsRejected() {
        assertThrows(RegistrationException.class, () -> registration.begin("12345ABCDE", T0));
        assertThrows(RegistrationException.class, () -> registration.begin("ABCDE1234", T0));
        assertThrows(RegistrationException.class, () -> registration.begin("", T0));
    }

    @Test
    void theAccountCannotBeActivatedWithOnlyOneChannelVerified() {
        details();
        assertEquals(Result.OK, registration.verifyCode(PAN, Channel.MOBILE, code(Channel.MOBILE, T0), T0));
        // The real portal verifies both; one is not enough.
        assertThrows(RegistrationException.class,
                () -> registration.complete(PAN, "TestPass@2026".toCharArray(), "hello", T0));
    }

    @Test
    void aWrongCodeDoesNotVerifyTheChannel() {
        details();
        String real = code(Channel.MOBILE, T0);
        String wrong = real.equals("000000") ? "111111" : "000000";
        assertEquals(Result.INCORRECT, registration.verifyCode(PAN, Channel.MOBILE, wrong, T0));
        assertNull(accounts.byPan(PAN).orElseThrow().mobileVerifiedAt());
    }

    @Test
    void changingAContactDetailClearsItsVerification() {
        details();
        assertEquals(Result.OK, registration.verifyCode(PAN, Channel.MOBILE, code(Channel.MOBILE, T0), T0));
        // Re-entering details must not let a previously verified number vouch for a new one.
        registration.submitDetails(PAN, "Priya Sharma", LocalDate.of(1994, 3, 17), "9000000000", EMAIL);
        assertNull(accounts.byPan(PAN).orElseThrow().mobileVerifiedAt());
    }

    @Test
    void anInterruptedRegistrationResumesRatherThanRestarting() {
        details();
        Account resumed = registration.begin(PAN, T0.plusSeconds(600));
        assertEquals("Priya Sharma", resumed.fullName(), "details entered before the interruption survive");
        assertEquals(Account.Status.PENDING, resumed.status());
    }

    @Test
    void aWeakPasswordOrMissingGreetingIsRefused() {
        details();
        registration.verifyCode(PAN, Channel.MOBILE, code(Channel.MOBILE, T0), T0);
        registration.verifyCode(PAN, Channel.EMAIL, code(Channel.EMAIL, T0), T0);
        assertThrows(RegistrationException.class,
                () -> registration.complete(PAN, "short".toCharArray(), "hello", T0));
        // The anti-phishing message is required: an optional one protects nobody.
        assertThrows(RegistrationException.class,
                () -> registration.complete(PAN, "TestPass@2026".toCharArray(), "  ", T0));
    }

    @Test
    void codesCannotBeSentBeforeContactDetailsExist() {
        registration.begin(PAN, T0);
        assertThrows(RegistrationException.class,
                () -> registration.sendCode(PAN, Channel.MOBILE, T0, delivered::add));
    }

    @Test
    void stepsBeforeBeginAreRefused() {
        assertThrows(RegistrationException.class,
                () -> registration.submitDetails(PAN, "X", LocalDate.of(1990, 1, 1), MOBILE, EMAIL));
    }
}
