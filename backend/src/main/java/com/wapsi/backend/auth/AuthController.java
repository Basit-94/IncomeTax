package com.wapsi.backend.auth;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Result;
import com.wapsi.backend.auth.RegistrationService.RegistrationException;
import com.wapsi.backend.auth.SignInService.SignInFailed;

/**
 * Registration, sign-in and sign-out over HTTP.
 *
 * <p><strong>No endpoint here ever returns a one-time code.</strong> {@code POST /register/code}
 * answers 202 with an empty body in every mode, including mock mode. Where the code goes is a
 * delivery concern; in local and test builds it is a fixed constant written in
 * {@link Otp.FixedCode} and in the docs, so it is knowable from the source rather than from an
 * endpoint. A mock that hands back the code has built the exact hole the rule exists to close.
 *
 * <p>All data flowing through here is mock. No real PAN, mobile number or email belongs in it.
 */
@CrossOrigin(origins = { "${cors.allowed-origins:http://localhost:3000}" })
@RestController
@RequestMapping("/api/v1/auth")
public final class AuthController {

    public record BeginRequest(String pan) {
    }

    public record DetailsRequest(String pan, String fullName, String dateOfBirth,
                                 String mobile, String email) {
    }

    public record CodeRequest(String pan, String channel) {
    }

    public record VerifyRequest(String pan, String channel, String code) {
    }

    public record CompleteRequest(String pan, String password, String personalisedMessage) {
    }

    public record SignInRequest(String pan, String password) {
    }

    /** What a successful sign-in returns. The token is the only place the raw value exists. */
    public record SignedIn(String token, String pan, String fullName, String personalisedMessage) {
    }

    public record VerifyResponse(String result) {
    }

    public record ErrorResponse(String code, String message) {
    }

    private final RegistrationService registration;
    private final SignInService signIn;
    private final SessionService sessions;
    private final Clock clock;

    /** The container uses this one; the Clock overload exists for tests. */
    @Autowired
    public AuthController(RegistrationService registration, SignInService signIn,
                          SessionService sessions) {
        this(registration, signIn, sessions, Clock.systemUTC());
    }

    public AuthController(RegistrationService registration, SignInService signIn,
                          SessionService sessions, Clock clock) {
        this.registration = registration;
        this.signIn = signIn;
        this.sessions = sessions;
        this.clock = clock;
    }

    @PostMapping("/register/begin")
    public ResponseEntity<Void> begin(@RequestBody BeginRequest request) {
        registration.begin(request.pan(), Instant.now(clock));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/details")
    public ResponseEntity<Void> details(@RequestBody DetailsRequest request) {
        registration.submitDetails(request.pan(), request.fullName(),
                parseDate(request.dateOfBirth()), request.mobile(), request.email());
        return ResponseEntity.noContent().build();
    }

    /** Sends a code. 202 with no body — the code is never part of a response. */
    @PostMapping("/register/code")
    public ResponseEntity<Void> sendCode(@RequestBody CodeRequest request) {
        // The sink deliberately does nothing here: delivery is somebody else's job, and writing
        // the code to a log would break the same rule as returning it.
        registration.sendCode(request.pan(), channel(request.channel()), Instant.now(clock),
                code -> { });
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/register/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestBody VerifyRequest request) {
        Result result = registration.verifyCode(request.pan(), channel(request.channel()),
                request.code(), Instant.now(clock));
        // Naming the outcome is useful to the user — "expired" and "wrong" call for different
        // actions — and tells an attacker who already holds the challenge nothing new.
        return ResponseEntity.ok(new VerifyResponse(result.name()));
    }

    @PostMapping("/register/complete")
    public ResponseEntity<Void> complete(@RequestBody CompleteRequest request) {
        char[] password = request.password() == null ? new char[0] : request.password().toCharArray();
        registration.complete(request.pan(), password, request.personalisedMessage(),
                Instant.now(clock));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/signin")
    public ResponseEntity<SignedIn> signIn(@RequestBody SignInRequest request) {
        char[] password = request.password() == null ? new char[0] : request.password().toCharArray();
        Instant now = Instant.now(clock);
        SignInService.Session session = signIn.signIn(request.pan(), password, now);
        String token = sessions.issue(session.pan(), now);
        return ResponseEntity.ok(new SignedIn(
                token, session.pan(), session.fullName(), session.personalisedMessage()));
    }

    /**
     * Always 204, whether or not the token was real. An endpoint that errors on an unknown token
     * is a way to find out which tokens are real.
     */
    @PostMapping("/signout")
    public ResponseEntity<Void> signOut(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        sessions.revoke(bearerToken(authorization), Instant.now(clock));
        return ResponseEntity.noContent().build();
    }

    /** The resend cooldown said no. 429 names it; a 500 pretended we broke. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> tooSoon(IllegalStateException exception) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ErrorResponse("resend_too_soon", exception.getMessage()));
    }

    @ExceptionHandler(RegistrationException.class)
    public ResponseEntity<ErrorResponse> registrationFailed(RegistrationException exception) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("registration_failed", exception.getMessage()));
    }

    @ExceptionHandler(SignInFailed.class)
    public ResponseEntity<ErrorResponse> signInFailed(SignInFailed exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("sign_in_failed", exception.getMessage()));
    }

    static String bearerToken(String authorization) {
        if (authorization == null) {
            return null;
        }
        String prefix = "Bearer ";
        return authorization.startsWith(prefix) ? authorization.substring(prefix.length()).trim() : null;
    }

    private static Channel channel(String value) {
        try {
            return Channel.valueOf(String.valueOf(value).toUpperCase());
        } catch (IllegalArgumentException unknown) {
            throw new RegistrationException("Choose either your mobile or your email");
        }
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (RuntimeException malformed) {
            throw new RegistrationException("Enter your date of birth as YYYY-MM-DD");
        }
    }
}
