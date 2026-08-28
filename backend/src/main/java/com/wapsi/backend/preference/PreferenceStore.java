package com.wapsi.backend.preference;

import java.sql.SQLException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

/**
 * The Simple / Full-detail mode, stored server-side against the PAN (T5.1).
 * localStorage was the wrong home for it: a mode chosen on one device must
 * follow the user to the next, because the two modes are two different
 * products, not a cosmetic density toggle.
 */
public interface PreferenceStore {

    /** Empty when the user has never chosen — the caller falls back to its default. */
    Optional<String> mode(String pan);

    /** @param mode "simple" or "full" — validated by the caller. */
    void setMode(String pan, String mode, Instant at);

    final class InMemory implements PreferenceStore {
        private final Map<String, String> modes = new ConcurrentHashMap<>();

        @Override
        public Optional<String> mode(String pan) {
            return Optional.ofNullable(modes.get(pan));
        }

        @Override
        public void setMode(String pan, String mode, Instant at) {
            modes.put(pan, mode);
        }
    }

    final class Postgres implements PreferenceStore {
        private final DataSource dataSource;

        public Postgres(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public Optional<String> mode(String pan) {
            try (var connection = dataSource.getConnection();
                 var statement = connection.prepareStatement(
                         "SELECT mode FROM user_preference WHERE pan = ?")) {
                statement.setString(1, pan);
                try (var rows = statement.executeQuery()) {
                    return rows.next() ? Optional.of(rows.getString(1)) : Optional.empty();
                }
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not read preference", exception);
            }
        }

        @Override
        public void setMode(String pan, String mode, Instant at) {
            try (var connection = dataSource.getConnection();
                 var statement = connection.prepareStatement(
                         "INSERT INTO user_preference (pan, mode, updated_at) VALUES (?, ?, ?) "
                                 + "ON CONFLICT (pan) DO UPDATE SET mode = EXCLUDED.mode, "
                                 + "updated_at = EXCLUDED.updated_at")) {
                statement.setString(1, pan);
                statement.setString(2, mode);
                statement.setObject(3, java.time.OffsetDateTime.ofInstant(at, java.time.ZoneOffset.UTC));
                statement.executeUpdate();
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not save preference", exception);
            }
        }
    }
}
