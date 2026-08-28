package com.wapsi.backend.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.sql.DataSource;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/**
 * Applies the SQL files in {@code db/migration} to the configured database, in version order,
 * exactly once each.
 *
 * <p>This exists because Flyway is not a dependency here. It is deliberately small: it does not
 * do checksums, repair, baselining, or rollback. It does the one thing that was missing — a
 * database that is configured but empty gets its schema — and it stops there. If the project
 * later adds Flyway, delete this class rather than growing it.
 *
 * <p>Applied versions are recorded in {@code schema_version}, so a restart is a no-op. Each file
 * runs in its own transaction: a migration either lands whole or not at all.
 */
public final class SchemaMigrator {
    private static final String LOCATION = "classpath*:db/migration/V*.sql";

    private static final String CREATE_REGISTRY = """
            CREATE TABLE IF NOT EXISTS schema_version (
                version VARCHAR(64) NOT NULL PRIMARY KEY,
                script VARCHAR(255) NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL
            )
            """;

    /**
     * Advisory-lock key serialising concurrent migrators. Two instances booting at the same
     * moment against the same database both raced the registry and one died at startup -
     * observed 2026-08-29 with two real JVMs on a shared Postgres. The lock is session-scoped,
     * so a crashed holder releases it when its connection dies.
     */
    private static final long MIGRATION_LOCK_KEY = 0x57415053L; // "WAPS"

    private final DataSource dataSource;

    public SchemaMigrator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** @return the versions applied by this call, in order; empty when already up to date. */
    public List<String> migrate() {
        List<Resource> scripts = discover();
        List<String> applied = new ArrayList<>();
        try (Connection connection = dataSource.getConnection()) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("SELECT pg_advisory_lock(" + MIGRATION_LOCK_KEY + ")");
            }
            try {
                try (Statement statement = connection.createStatement()) {
                    statement.execute(CREATE_REGISTRY);
                }
                // Read AFTER taking the lock: the loser of a concurrent boot must see
                // every version the winner just recorded, not the empty registry.
                Set<String> already = alreadyApplied(connection);
                for (Resource script : scripts) {
                    String version = versionOf(script.getFilename());
                    if (already.contains(version)) {
                        continue;
                    }
                    apply(connection, script, version);
                    applied.add(version);
                }
                return List.copyOf(applied);
            } finally {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("SELECT pg_advisory_unlock(" + MIGRATION_LOCK_KEY + ")");
                }
            }
        } catch (SQLException | IOException exception) {
            throw new IllegalStateException("Could not apply database migrations", exception);
        }
    }

    private List<Resource> discover() {
        try {
            Resource[] found = new PathMatchingResourcePatternResolver().getResources(LOCATION);
            List<Resource> scripts = new ArrayList<>(List.of(found));
            // V2 must not run before V10 by string order, so compare the numeric version.
            scripts.sort(Comparator.comparingInt(r -> numeric(versionOf(r.getFilename()))));
            return scripts;
        } catch (IOException exception) {
            throw new IllegalStateException("Could not read migrations from " + LOCATION, exception);
        }
    }

    private void apply(Connection connection, Resource script, String version)
            throws SQLException, IOException {
        boolean autoCommit = connection.getAutoCommit();
        connection.setAutoCommit(false);
        try (Statement statement = connection.createStatement()) {
            for (String command : read(script).split(";")) {
                if (!command.isBlank()) {
                    statement.execute(command);
                }
            }
            try (PreparedStatement record = connection.prepareStatement(
                    "INSERT INTO schema_version (version, script, applied_at) VALUES (?, ?, ?)")) {
                record.setString(1, version);
                record.setString(2, String.valueOf(script.getFilename()));
                record.setTimestamp(3, Timestamp.from(Instant.now()));
                record.executeUpdate();
            }
            connection.commit();
        } catch (SQLException | IOException failure) {
            connection.rollback();
            throw failure;
        } finally {
            connection.setAutoCommit(autoCommit);
        }
    }

    private static Set<String> alreadyApplied(Connection connection) throws SQLException {
        Set<String> versions = new HashSet<>();
        try (Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery("SELECT version FROM schema_version")) {
            while (result.next()) {
                versions.add(result.getString(1));
            }
        }
        return versions;
    }

    private static String read(Resource script) throws IOException {
        try (InputStream input = script.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /** {@code V2__submission.sql} -> {@code 2}. */
    private static String versionOf(String filename) {
        if (filename == null) {
            throw new IllegalStateException("Migration resource has no filename");
        }
        int separator = filename.indexOf("__");
        if (!filename.startsWith("V") || separator < 0) {
            throw new IllegalStateException("Migration must be named V<version>__<name>.sql: " + filename);
        }
        return filename.substring(1, separator);
    }

    private static int numeric(String version) {
        try {
            return Integer.parseInt(version);
        } catch (NumberFormatException notANumber) {
            throw new IllegalStateException("Migration version must be an integer: " + version);
        }
    }
}
