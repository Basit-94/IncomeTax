package com.wapsi.backend.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues, checks and revokes session tokens.
 *
 * <p><strong>The raw token exists exactly once</strong> — in the value returned by {@link #issue}.
 * Only its hash is stored, so a stolen database yields no live sessions, and nothing here logs it.
 *
 * <p>Tokens are 256 bits from {@link SecureRandom}. A guessable session token bypasses the
 * password, the one-time codes and the lockout in a single step, so this is not a place to
 * economise.
 *
 * <p>Expiry is <strong>absolute</strong>, not sliding. A sliding window lets a stolen token be
 * kept alive indefinitely simply by using it; an absolute one ends regardless.
 */
public final class SessionService {
    public static final Duration DEFAULT_LIFETIME = Duration.ofHours(12);

    private final SessionStore sessions;
    private final SecureRandom random = new SecureRandom();
    private final Duration lifetime;

    public SessionService(SessionStore sessions) {
        this(sessions, DEFAULT_LIFETIME);
    }

    public SessionService(SessionStore sessions, Duration lifetime) {
        this.sessions = Objects.requireNonNull(sessions, "sessions");
        this.lifetime = Objects.requireNonNull(lifetime, "lifetime");
    }

    /** @return the raw token. The caller hands it to the client and keeps no copy. */
    public String issue(String pan, Instant now) {
        byte[] raw = new byte[32];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        sessions.save(new SessionStore.Record(
                UUID.randomUUID(), hash(token), pan, now, now.plus(lifetime), null));
        return token;
    }

    /** @return the PAN this token authenticates, or empty if it is unknown, expired or revoked. */
    public Optional<String> authenticate(String token, Instant now) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return sessions.byTokenHash(hash(token))
                .filter(session -> session.isUsable(now))
                .map(SessionStore.Record::pan);
    }

    public void revoke(String token, Instant now) {
        if (token != null && !token.isBlank()) {
            sessions.revoke(hash(token), now);
        }
    }

    /**
     * SHA-256, not PBKDF2. A session token is 256 random bits, so there is no low-entropy guess
     * to slow down — the work factor that protects a human-chosen password buys nothing here and
     * would only make every authenticated request expensive.
     */
    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().withoutPadding()
                    .encodeToString(digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is required but unavailable", impossible);
        }
    }
}
