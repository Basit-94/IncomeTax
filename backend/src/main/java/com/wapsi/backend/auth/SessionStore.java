package com.wapsi.backend.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

/**
 * Where sessions live.
 *
 * <p>Only the <em>hash</em> of a token is stored, for the same reason OTP codes are hashed: a
 * stolen database must not hand over live sessions. The raw token exists once, in the response to
 * a successful sign-in, and is never persisted or logged anywhere.
 */
public interface SessionStore {

    record Record(UUID id, String tokenHash, String pan, Instant createdAt,
                  Instant expiresAt, Instant revokedAt) {

        public boolean isUsable(Instant now) {
            return revokedAt == null && now.isBefore(expiresAt);
        }
    }

    Record save(Record session);

    Optional<Record> byTokenHash(String tokenHash);

    void revoke(String tokenHash, Instant at);

    final class InMemory implements SessionStore {
        private final Map<String, Record> byHash = new ConcurrentHashMap<>();

        @Override
        public Record save(Record session) {
            byHash.put(session.tokenHash(), session);
            return session;
        }

        @Override
        public Optional<Record> byTokenHash(String tokenHash) {
            return Optional.ofNullable(byHash.get(tokenHash));
        }

        @Override
        public void revoke(String tokenHash, Instant at) {
            byHash.computeIfPresent(tokenHash, (key, s) -> new Record(
                    s.id(), s.tokenHash(), s.pan(), s.createdAt(), s.expiresAt(), at));
        }
    }

    final class Postgres implements SessionStore {
        private static final String INSERT = """
                INSERT INTO user_session (id, token_hash, pan, created_at, expires_at, revoked_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """;
        private static final String BY_HASH = """
                SELECT id, token_hash, pan, created_at, expires_at, revoked_at
                  FROM user_session WHERE token_hash = ?
                """;
        private static final String REVOKE =
                "UPDATE user_session SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL";

        private final DataSource dataSource;

        public Postgres(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public Record save(Record session) {
            try (Connection connection = dataSource.getConnection();
                 PreparedStatement statement = connection.prepareStatement(INSERT)) {
                statement.setObject(1, session.id());
                statement.setString(2, session.tokenHash());
                statement.setString(3, session.pan());
                statement.setTimestamp(4, Timestamp.from(session.createdAt()));
                statement.setTimestamp(5, Timestamp.from(session.expiresAt()));
                statement.setTimestamp(6, session.revokedAt() == null
                        ? null : Timestamp.from(session.revokedAt()));
                statement.executeUpdate();
                return session;
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not store the session", exception);
            }
        }

        @Override
        public Optional<Record> byTokenHash(String tokenHash) {
            try (Connection connection = dataSource.getConnection();
                 PreparedStatement statement = connection.prepareStatement(BY_HASH)) {
                statement.setString(1, tokenHash);
                try (ResultSet result = statement.executeQuery()) {
                    if (!result.next()) {
                        return Optional.empty();
                    }
                    Timestamp revoked = result.getTimestamp("revoked_at");
                    return Optional.of(new Record(
                            result.getObject("id", UUID.class),
                            result.getString("token_hash"),
                            result.getString("pan"),
                            result.getTimestamp("created_at").toInstant(),
                            result.getTimestamp("expires_at").toInstant(),
                            revoked == null ? null : revoked.toInstant()));
                }
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not read the session", exception);
            }
        }

        @Override
        public void revoke(String tokenHash, Instant at) {
            try (Connection connection = dataSource.getConnection();
                 PreparedStatement statement = connection.prepareStatement(REVOKE)) {
                statement.setTimestamp(1, Timestamp.from(at));
                statement.setString(2, tokenHash);
                statement.executeUpdate();
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not revoke the session", exception);
            }
        }
    }
}
