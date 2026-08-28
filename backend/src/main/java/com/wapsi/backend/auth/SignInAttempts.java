package com.wapsi.backend.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

/**
 * Counts failed sign-ins and holds the lockout.
 *
 * <p>Its own table rather than columns on {@code account}, so adding it does not reshape the
 * account record and every constructor that builds one.
 *
 * <p>Kept durable for the same reason the OTP attempt counter is: a counter held in process memory
 * resets on restart and is invisible to a second instance, which turns a lockout into a
 * suggestion an attacker can step around.
 */
public interface SignInAttempts {

    record State(int failedAttempts, Instant lockedUntil) {
        static final State CLEAR = new State(0, null);

        boolean isLocked(Instant now) {
            return lockedUntil != null && now.isBefore(lockedUntil);
        }
    }

    State get(String pan);

    void put(String pan, State state, Instant now);

    default void clear(String pan, Instant now) {
        put(pan, State.CLEAR, now);
    }

    final class InMemory implements SignInAttempts {
        private final Map<String, State> byPan = new ConcurrentHashMap<>();

        @Override
        public State get(String pan) {
            return byPan.getOrDefault(pan, State.CLEAR);
        }

        @Override
        public void put(String pan, State state, Instant now) {
            byPan.put(pan, state);
        }
    }

    final class Postgres implements SignInAttempts {
        private static final String SELECT =
                "SELECT failed_attempts, locked_until FROM signin_attempt WHERE pan = ?";
        private static final String UPSERT = """
                INSERT INTO signin_attempt (pan, failed_attempts, locked_until, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (pan) DO UPDATE
                   SET failed_attempts = EXCLUDED.failed_attempts,
                       locked_until = EXCLUDED.locked_until,
                       updated_at = EXCLUDED.updated_at
                """;

        private final DataSource dataSource;

        public Postgres(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public State get(String pan) {
            try (Connection connection = dataSource.getConnection();
                 PreparedStatement statement = connection.prepareStatement(SELECT)) {
                statement.setString(1, pan);
                try (ResultSet result = statement.executeQuery()) {
                    if (!result.next()) {
                        return State.CLEAR;
                    }
                    Timestamp until = result.getTimestamp("locked_until");
                    return new State(result.getInt("failed_attempts"),
                            until == null ? null : until.toInstant());
                }
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not read sign-in attempts", exception);
            }
        }

        @Override
        public void put(String pan, State state, Instant now) {
            try (Connection connection = dataSource.getConnection();
                 PreparedStatement statement = connection.prepareStatement(UPSERT)) {
                statement.setString(1, pan);
                statement.setInt(2, state.failedAttempts());
                statement.setTimestamp(3, state.lockedUntil() == null
                        ? null : Timestamp.from(state.lockedUntil()));
                statement.setTimestamp(4, Timestamp.from(now));
                statement.executeUpdate();
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not record the sign-in attempt", exception);
            }
        }
    }

    /** Convenience for callers that only want the lockout question answered. */
    static Optional<Instant> lockedUntil(State state, Instant now) {
        return state.isLocked(now) ? Optional.of(state.lockedUntil()) : Optional.empty();
    }
}
