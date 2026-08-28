package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.auth.AuthController.BeginRequest;
import com.wapsi.backend.auth.AuthController.CodeRequest;
import com.wapsi.backend.auth.AuthController.CompleteRequest;
import com.wapsi.backend.auth.AuthController.DetailsRequest;
import com.wapsi.backend.auth.AuthController.SignInRequest;
import com.wapsi.backend.auth.AuthController.SignedIn;
import com.wapsi.backend.auth.AuthController.VerifyRequest;

/** The full journey over the HTTP surface, with the mock fixed code. All data synthetic. */
class AuthControllerTest {
    private static final String PAN = "ABCDE1234F";
    private static final String CODE = "949494";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private final AccountStore accounts = new AccountStore.InMemory();
    private final PasswordHasher hasher = new PasswordHasher(1_000);
    private final SessionService sessions =
            new SessionService(new SessionStore.InMemory(), Duration.ofHours(12));
    private final AuthController controller = new AuthController(
            new RegistrationService(accounts,
                    new OtpService(new InMemoryOtpStore(), new Otp.FixedCode(CODE), hasher), hasher),
            new SignInService(accounts, new SignInAttempts.InMemory(), hasher),
            sessions,
            Clock.fixed(T0, ZoneOffset.UTC));

    private void registerFully() {
        controller.begin(new BeginRequest(PAN));
        controller.details(new DetailsRequest(PAN, "Priya Sharma", "1994-03-17",
                "9876543210", "priya.sharma@example.com"));
        controller.sendCode(new CodeRequest(PAN, "mobile"));
        controller.verify(new VerifyRequest(PAN, "mobile", CODE));
        controller.sendCode(new CodeRequest(PAN, "email"));
        controller.verify(new VerifyRequest(PAN, "email", CODE));
        controller.complete(new CompleteRequest(PAN, "TestPass@2026", "Green door, third floor"));
    }

    @Test
    void theWholeJourneyEndsSignedInWithTheAntiPhishingMessage() {
        registerFully();
        var response = controller.signIn(new SignInRequest(PAN, "TestPass@2026"));
        assertEquals(200, response.getStatusCode().value());
        SignedIn body = response.getBody();
        assertNotNull(body.token());
        assertEquals("Priya Sharma", body.fullName());
        assertEquals("Green door, third floor", body.personalisedMessage());
    }

    @Test
    void sendCodeNeverReturnsTheCode() {
        controller.begin(new BeginRequest(PAN));
        controller.details(new DetailsRequest(PAN, "Priya Sharma", "1994-03-17",
                "9876543210", "priya.sharma@example.com"));
        var response = controller.sendCode(new CodeRequest(PAN, "mobile"));
        assertEquals(202, response.getStatusCode().value());
        // The body is empty in every mode. The mock code is knowable from the source, not from here.
        assertNull(response.getBody());
    }

    @Test
    void verifyNamesTheOutcome() {
        controller.begin(new BeginRequest(PAN));
        controller.details(new DetailsRequest(PAN, "Priya Sharma", "1994-03-17",
                "9876543210", "priya.sharma@example.com"));
        controller.sendCode(new CodeRequest(PAN, "mobile"));
        assertEquals("INCORRECT",
                controller.verify(new VerifyRequest(PAN, "mobile", "000000")).getBody().result());
        assertEquals("OK",
                controller.verify(new VerifyRequest(PAN, "mobile", CODE)).getBody().result());
    }

    @Test
    void theSessionTokenActuallyAuthenticates() {
        registerFully();
        String token = controller.signIn(new SignInRequest(PAN, "TestPass@2026")).getBody().token();
        assertEquals(java.util.Optional.of(PAN), sessions.authenticate(token, T0.plusSeconds(60)));
    }

    @Test
    void signOutRevokesTheSessionAndIsIdempotent() {
        registerFully();
        String token = controller.signIn(new SignInRequest(PAN, "TestPass@2026")).getBody().token();
        assertEquals(204, controller.signOut("Bearer " + token).getStatusCode().value());
        assertEquals(java.util.Optional.empty(), sessions.authenticate(token, T0.plusSeconds(60)));
        // A second sign-out, a garbage token and no header at all answer identically: an endpoint
        // that errors on an unknown token is a way to find out which tokens are real.
        assertEquals(204, controller.signOut("Bearer " + token).getStatusCode().value());
        assertEquals(204, controller.signOut("Bearer nonsense").getStatusCode().value());
        assertEquals(204, controller.signOut(null).getStatusCode().value());
    }

    @Test
    void aWrongPasswordFailsWithoutLeakingTheGreeting() {
        registerFully();
        SignInService.SignInFailed thrown = org.junit.jupiter.api.Assertions.assertThrows(
                SignInService.SignInFailed.class,
                () -> controller.signIn(new SignInRequest(PAN, "wrong")));
        assertFalse(thrown.getMessage().contains("Green door"));
    }

    @Test
    void malformedInputsBecomeRegistrationErrorsNotServerErrors() {
        controller.begin(new BeginRequest(PAN));
        org.junit.jupiter.api.Assertions.assertThrows(
                RegistrationService.RegistrationException.class,
                () -> controller.details(new DetailsRequest(PAN, "Priya", "17/03/1994",
                        "9876543210", "priya@example.com")),
                "a malformed date is the user's mistake, not a 500");
        org.junit.jupiter.api.Assertions.assertThrows(
                RegistrationService.RegistrationException.class,
                () -> controller.sendCode(new CodeRequest(PAN, "carrier-pigeon")));
    }
}
