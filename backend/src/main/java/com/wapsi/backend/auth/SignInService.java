package com.wapsi.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

/**
 * Signing in with a PAN and a password.
 *
 * <p><strong>The personalised message is the point of this class as much as the password is.</strong>
 * It is returned only after the password is correct, so a visitor who types a PAN cannot harvest
 * it. Shown back at sign-in, it is how a user tells the real portal from a convincing copy — and
 * a copy cannot show it, because it does not have it.
 *
 * <p><strong>A wrong password and an unknown PAN fail identically</strong> — same exception, same
 * message, same counted attempt. Sign-in must not answer "does this person have an account".
 * (Registration still can: see PLAN.md T2.1c.)
 */
public final class SignInService {
    public static final int DEFAULT_MAX_ATTEMPTS = 5;
    public static final Duration DEFAULT_LOCKOUT = Duration.ofMinutes(15);

    /** Raised for every sign-in failure, so the reason cannot be read from the type. */
    public static class SignInFailed extends RuntimeException {
        public SignInFailed(String message) {
            super(message);
        }
    }

    /** What a successful sign-in hands back. Never contains the password hash. */
    public record Session(String pan, String fullName, String personalisedMessage) {
    }

    private final AccountStore accounts;
    private final SignInAttempts attempts;
    private final PasswordHasher hasher;
    private final int maxAttempts;
    private final Duration lockout;

    public SignInService(AccountStore accounts, SignInAttempts attempts, PasswordHasher hasher) {
        this(accounts, attempts, hasher, DEFAULT_MAX_ATTEMPTS, DEFAULT_LOCKOUT);
    }

    public SignInService(AccountStore accounts, SignInAttempts attempts, PasswordHasher hasher,
                         int maxAttempts, Duration lockout) {
        this.accounts = Objects.requireNonNull(accounts, "accounts");
        this.attempts = Objects.requireNonNull(attempts, "attempts");
        this.hasher = Objects.requireNonNull(hasher, "hasher");
        this.maxAttempts = maxAttempts;
        this.lockout = Objects.requireNonNull(lockout, "lockout");
    }

    public Session signIn(String pan, char[] password, Instant now) {
        SignInAttempts.State state = attempts.get(pan);
        if (state.isLocked(now)) {
            throw new SignInFailed("Too many attempts. Try again later.");
        }

        Optional<Account> found = accounts.byPan(pan);
        // An account still in registration must not be signable-in, and is treated exactly like
        // a wrong password so the stage of someone else's registration is not observable.
        boolean ok = found.filter(Account::isActive)
                .map(account -> hasher.matches(password, account.passwordHash()))
                .orElse(false);

        if (!ok) {
            int failed = state.failedAttempts() + 1;
            Instant until = failed >= maxAttempts ? now.plus(lockout) : null;
            attempts.put(pan, new SignInAttempts.State(failed, until), now);
            throw new SignInFailed("That PAN and password do not match.");
        }

        Account account = found.orElseThrow();
        attempts.clear(pan, now);
        return new Session(account.pan(), account.fullName(),
                account.greeting().orElse(null));
    }
}
