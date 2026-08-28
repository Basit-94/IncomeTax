package com.wapsi.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import com.wapsi.backend.auth.Otp.Challenge;
import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.CodeGenerator;
import com.wapsi.backend.auth.Otp.Result;
import com.wapsi.backend.auth.Otp.Store;

/**
 * Issues and verifies one-time codes.
 *
 * <p><strong>The code never leaves this class.</strong> {@link #issue} returns nothing — not the
 * code, not a hint of it. A caller that needs to deliver it goes through a delivery channel; a
 * caller that returns it to the browser has defeated the point. That holds in mock mode too,
 * where the code is knowable only because {@link Otp.FixedCode} is written in the source.
 *
 * <p>Every limit below is enforced here rather than in the UI, because a client-side limit is a
 * suggestion.
 *
 * <p><strong>On the numbers.</strong> The defaults are ours and are not claimed to match the real
 * e-Filing portal — its exact validity window and attempt cap still need checking against the
 * live service (PLAN.md T2.1). They are constructor parameters so that check changes a config
 * value, not this code.
 */
public final class OtpService {
    public static final Duration DEFAULT_VALIDITY = Duration.ofMinutes(15);
    public static final int DEFAULT_MAX_ATTEMPTS = 5;
    public static final Duration DEFAULT_RESEND_COOLDOWN = Duration.ofSeconds(60);

    private final Store store;
    private final CodeGenerator codes;
    private final PasswordHasher hasher;
    private final Duration validity;
    private final int maxAttempts;
    private final Duration resendCooldown;

    public OtpService(Store store, CodeGenerator codes, PasswordHasher hasher) {
        this(store, codes, hasher, DEFAULT_VALIDITY, DEFAULT_MAX_ATTEMPTS, DEFAULT_RESEND_COOLDOWN);
    }

    public OtpService(Store store, CodeGenerator codes, PasswordHasher hasher,
                      Duration validity, int maxAttempts, Duration resendCooldown) {
        this.store = Objects.requireNonNull(store, "store");
        this.codes = Objects.requireNonNull(codes, "codes");
        this.hasher = Objects.requireNonNull(hasher, "hasher");
        this.validity = Objects.requireNonNull(validity, "validity");
        this.maxAttempts = maxAttempts;
        this.resendCooldown = Objects.requireNonNull(resendCooldown, "resendCooldown");
    }

    /**
     * Issues a code for {@code target} and hands it to {@code deliver} — the only thing that ever
     * sees it. Returns the challenge id for correlation, never the code.
     *
     * @throws IllegalStateException if a code was issued too recently, so resend is not a way to
     *         mint unlimited codes.
     */
    public UUID issue(String target, Channel channel, Instant now, CodeSink deliver) {
        Optional<Challenge> previous = store.latest(target, channel);
        if (previous.isPresent() && !previous.get().isConsumed()) {
            Instant nextAllowed = previous.get().issuedAt().plus(resendCooldown);
            if (now.isBefore(nextAllowed)) {
                throw new IllegalStateException("A code was already sent; try again shortly");
            }
        }
        String code = codes.generate();
        Challenge challenge = new Challenge(
                UUID.randomUUID(), target, channel, hasher.hash(code),
                now, now.plus(validity), 0, null);
        store.save(challenge);
        deliver.accept(code);
        return challenge.id();
    }

    /**
     * Checks {@code code}, consuming the challenge on success so a replay fails.
     *
     * <p>A failed attempt is counted <em>before</em> the answer is known to the caller, so
     * exhausting the cap is not something a brute-force loop can avoid.
     */
    public Result verify(String target, Channel channel, String code, Instant now) {
        Optional<Challenge> found = store.latest(target, channel);
        if (found.isEmpty()) {
            return Result.NO_CHALLENGE;
        }
        Challenge challenge = found.get();
        if (challenge.isConsumed()) {
            return Result.ALREADY_USED;
        }
        if (challenge.hasExpired(now)) {
            return Result.EXPIRED;
        }
        if (challenge.attempts() >= maxAttempts) {
            return Result.TOO_MANY_ATTEMPTS;
        }
        int attempts = challenge.attempts() + 1;
        store.recordAttempt(challenge.id(), attempts);
        if (!hasher.matches(code, challenge.codeHash())) {
            return attempts >= maxAttempts ? Result.TOO_MANY_ATTEMPTS : Result.INCORRECT;
        }
        store.markConsumed(challenge.id(), now);
        return Result.OK;
    }

    /** Receives a freshly generated code for delivery. Implementations must never log it. */
    @FunctionalInterface
    public interface CodeSink {
        void accept(String code);
    }
}
