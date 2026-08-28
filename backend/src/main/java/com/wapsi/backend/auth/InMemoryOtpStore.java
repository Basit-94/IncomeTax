package com.wapsi.backend.auth;

import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.wapsi.backend.auth.Otp.Challenge;
import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Store;

/** Single-process store for local development and tests; production uses {@link PostgresOtpStore}. */
public final class InMemoryOtpStore implements Store {
    private final Map<UUID, Challenge> byId = new ConcurrentHashMap<>();

    @Override
    public Challenge save(Challenge challenge) {
        byId.put(challenge.id(), challenge);
        return challenge;
    }

    @Override
    public Optional<Challenge> latest(String target, Channel channel) {
        return byId.values().stream()
                .filter(c -> c.target().equals(target) && c.channel() == channel)
                .max(Comparator.comparing(Challenge::issuedAt));
    }

    @Override
    public void recordAttempt(UUID id, int attempts) {
        byId.computeIfPresent(id, (key, c) -> new Challenge(
                c.id(), c.target(), c.channel(), c.codeHash(),
                c.issuedAt(), c.expiresAt(), attempts, c.consumedAt()));
    }

    @Override
    public void markConsumed(UUID id, Instant consumedAt) {
        byId.computeIfPresent(id, (key, c) -> new Challenge(
                c.id(), c.target(), c.channel(), c.codeHash(),
                c.issuedAt(), c.expiresAt(), c.attempts(), consumedAt));
    }
}
