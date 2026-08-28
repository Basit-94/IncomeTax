package com.wapsi.backend.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import javax.sql.DataSource;

import com.wapsi.backend.auth.Otp.Challenge;
import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Store;

/** PostgreSQL adapter for the otp_challenge table in V3__otp_challenge.sql. */
public final class PostgresOtpStore implements Store {
    private static final String INSERT = """
            INSERT INTO otp_challenge (
                id, target, channel, code_hash, issued_at, expires_at, attempts, consumed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String LATEST = """
            SELECT id, target, channel, code_hash, issued_at, expires_at, attempts, consumed_at
              FROM otp_challenge
             WHERE target = ? AND channel = ?
             ORDER BY issued_at DESC
             LIMIT 1
            """;

    private static final String RECORD_ATTEMPT = "UPDATE otp_challenge SET attempts = ? WHERE id = ?";

    private static final String MARK_CONSUMED =
            "UPDATE otp_challenge SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL";

    private final DataSource dataSource;

    public PostgresOtpStore(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Challenge save(Challenge challenge) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            statement.setObject(1, challenge.id());
            statement.setString(2, challenge.target());
            statement.setString(3, challenge.channel().name());
            statement.setString(4, challenge.codeHash());
            statement.setTimestamp(5, Timestamp.from(challenge.issuedAt()));
            statement.setTimestamp(6, Timestamp.from(challenge.expiresAt()));
            statement.setInt(7, challenge.attempts());
            statement.setTimestamp(8, challenge.consumedAt() == null
                    ? null : Timestamp.from(challenge.consumedAt()));
            statement.executeUpdate();
            return challenge;
        } catch (SQLException exception) {
            throw failure("store the challenge", exception);
        }
    }

    @Override
    public Optional<Challenge> latest(String target, Channel channel) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(LATEST)) {
            statement.setString(1, target);
            statement.setString(2, channel.name());
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? Optional.of(read(result)) : Optional.empty();
            }
        } catch (SQLException exception) {
            throw failure("read the challenge", exception);
        }
    }

    @Override
    public void recordAttempt(UUID id, int attempts) {
        update(RECORD_ATTEMPT, statement -> {
            statement.setInt(1, attempts);
            statement.setObject(2, id);
        }, "record the attempt");
    }

    @Override
    public void markConsumed(UUID id, Instant consumedAt) {
        update(MARK_CONSUMED, statement -> {
            statement.setTimestamp(1, Timestamp.from(consumedAt));
            statement.setObject(2, id);
        }, "consume the challenge");
    }

    private void update(String sql, Binder binder, String what) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            binder.bind(statement);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw failure(what, exception);
        }
    }

    private static Challenge read(ResultSet result) throws SQLException {
        Timestamp consumed = result.getTimestamp("consumed_at");
        return new Challenge(
                result.getObject("id", UUID.class),
                result.getString("target"),
                Channel.valueOf(result.getString("channel")),
                result.getString("code_hash"),
                result.getTimestamp("issued_at").toInstant(),
                result.getTimestamp("expires_at").toInstant(),
                result.getInt("attempts"),
                consumed == null ? null : consumed.toInstant());
    }

    private static IllegalStateException failure(String what, SQLException exception) {
        return new IllegalStateException("Could not " + what, exception);
    }

    @FunctionalInterface
    private interface Binder {
        void bind(PreparedStatement statement) throws SQLException;
    }
}
