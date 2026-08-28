package com.wapsi.backend.auth;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * The OTP subsystem: types, code generation, and storage contract.
 *
 * <p>Grouped in one file because they are one idea and each piece is a few lines; splitting them
 * across six files would make the design harder to read, not easier.
 */
public final class Otp {
    private Otp() {
    }

    /** Where a code was sent. The real portal verifies mobile and email separately. */
    public enum Channel { MOBILE, EMAIL }

    /**
     * Outcome of a verification attempt. Deliberately an enum rather than a boolean: the caller
     * needs to tell "wrong code" from "expired" from "locked out" to say anything useful, and
     * a boolean would force it to guess.
     */
    public enum Result {
        OK,
        INCORRECT,
        EXPIRED,
        ALREADY_USED,
        TOO_MANY_ATTEMPTS,
        NO_CHALLENGE
    }

    /**
     * A challenge as stored. {@code codeHash} is a hash — the code itself is never persisted, so a
     * stolen database yields no live codes.
     */
    public record Challenge(
            UUID id,
            String target,
            Channel channel,
            String codeHash,
            Instant issuedAt,
            Instant expiresAt,
            int attempts,
            Instant consumedAt) {

        public boolean isConsumed() {
            return consumedAt != null;
        }

        public boolean hasExpired(Instant now) {
            return !now.isBefore(expiresAt);
        }
    }

    /** Supplies the digits. An interface so mock mode can be fixed without leaking a real code. */
    public interface CodeGenerator {
        String generate();
    }

    /** Six digits from {@link SecureRandom}. A predictable OTP is not an OTP. */
    public static final class SecureCodes implements CodeGenerator {
        private final SecureRandom random = new SecureRandom();

        @Override
        public String generate() {
            return String.format("%06d", random.nextInt(1_000_000));
        }
    }

    /**
     * A fixed code, for local development and tests.
     *
     * <p>This is how mock mode stays usable without the API ever returning a code. The value is
     * known because it is written here, not because an endpoint handed it out — a mock that
     * returns the code has built the vulnerability it was meant to avoid.
     */
    public static final class FixedCode implements CodeGenerator {
        private final String code;

        public FixedCode(String code) {
            this.code = code;
        }

        @Override
        public String generate() {
            return code;
        }
    }

    public interface Store {
        Challenge save(Challenge challenge);

        /** The newest challenge for this target and channel, whatever its state. */
        Optional<Challenge> latest(String target, Channel channel);

        void recordAttempt(UUID id, int attempts);

        void markConsumed(UUID id, Instant consumedAt);
    }
}
