package com.wapsi.backend.auth;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Result;

/**
 * Registration, following the shape of the real e-Filing portal:
 * PAN → personal details → a separate one-time code to the mobile <em>and</em> the email →
 * password plus a personalised message.
 *
 * <p><strong>PAN identifies, it never authorises.</strong> Supplying a PAN starts a registration
 * and nothing more: it returns no personal detail, and it cannot reach an existing account's data.
 * Only both verified codes activate an account, and only the password opens it afterwards.
 *
 * <p>All data here is mock. No real PAN, mobile number or email belongs in this system.
 */
public final class RegistrationService {

    /** Raised for every registration problem, so callers cannot read the failure as a signal. */
    public static class RegistrationException extends RuntimeException {
        public RegistrationException(String message) {
            super(message);
        }
    }

    private final AccountStore accounts;
    private final OtpService otp;
    private final PasswordHasher hasher;

    public RegistrationService(AccountStore accounts, OtpService otp, PasswordHasher hasher) {
        this.accounts = Objects.requireNonNull(accounts, "accounts");
        this.otp = Objects.requireNonNull(otp, "otp");
        this.hasher = Objects.requireNonNull(hasher, "hasher");
    }

    /** Step 1. Starts, or resumes, a registration for this PAN. */
    public Account begin(String pan, Instant now) {
        if (!Account.isWellFormedPan(pan)) {
            throw new RegistrationException("That does not look like a PAN");
        }
        return accounts.byPan(pan)
                .map(existing -> {
                    if (existing.isActive()) {
                        // Deliberately the same wording an already-active account would get from
                        // any other step: the message does not describe the account's state.
                        throw new RegistrationException("This PAN cannot be registered");
                    }
                    return existing; // an interrupted registration resumes rather than restarts
                })
                .orElseGet(() -> accounts.create(new Account(
                        UUID.randomUUID(), pan, null, null, null, null, null, null,
                        Account.Status.PENDING, null, null, now, null)));
    }

    /** Step 2. Details as they appear against the PAN. */
    public Account submitDetails(String pan, String fullName, LocalDate dateOfBirth,
                                 String mobile, String email) {
        Account pending = pending(pan);
        if (fullName == null || fullName.isBlank()) {
            throw new RegistrationException("A name is required");
        }
        if (mobile == null || mobile.isBlank() || email == null || !email.contains("@")) {
            throw new RegistrationException("A mobile number and an email address are required");
        }
        return accounts.update(new Account(
                pending.id(), pending.pan(), fullName, dateOfBirth, mobile, email,
                pending.passwordHash(), pending.personalisedMessage(), pending.status(),
                // Changing a contact detail clears that channel's verification: otherwise a
                // number verified earlier would vouch for a number entered later.
                null, null, pending.createdAt(), pending.activatedAt()));
    }

    /** Step 3. Sends a code. The code reaches {@code deliver} and nothing else. */
    public void sendCode(String pan, Channel channel, Instant now, OtpService.CodeSink deliver) {
        otp.issue(target(pending(pan), channel), channel, now, deliver);
    }

    /** Step 4. Verifies one channel. Both must pass before the account can be activated. */
    public Result verifyCode(String pan, Channel channel, String code, Instant now) {
        Account pending = pending(pan);
        Result result = otp.verify(target(pending, channel), channel, code, now);
        if (result == Result.OK) {
            accounts.update(pending.withVerified(channel, now));
        }
        return result;
    }

    /** Step 5. Sets the password and the anti-phishing message, and activates the account. */
    public Account complete(String pan, char[] password, String personalisedMessage, Instant now) {
        Account pending = pending(pan);
        if (!pending.bothChannelsVerified()) {
            throw new RegistrationException("Verify both your mobile number and your email first");
        }
        if (password == null || password.length < 8) {
            throw new RegistrationException("Choose a password of at least 8 characters");
        }
        if (personalisedMessage == null || personalisedMessage.isBlank()) {
            // Not decoration: this is shown at every sign-in so the user can tell the real login
            // screen from a copy of it. An optional anti-phishing device protects nobody.
            throw new RegistrationException("Choose a message we will show you when you sign in");
        }
        return accounts.update(pending.activated(hasher.hash(password), personalisedMessage, now));
    }

    private Account pending(String pan) {
        Account account = accounts.byPan(pan)
                .orElseThrow(() -> new RegistrationException("Start with your PAN"));
        if (account.isActive()) {
            throw new RegistrationException("This PAN cannot be registered");
        }
        return account;
    }

    private static String target(Account account, Channel channel) {
        String value = channel == Channel.MOBILE ? account.mobile() : account.email();
        if (value == null || value.isBlank()) {
            throw new RegistrationException("Enter your details first");
        }
        return value;
    }
}
