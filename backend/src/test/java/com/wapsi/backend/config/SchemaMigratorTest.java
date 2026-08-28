package com.wapsi.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Comparator;
import java.util.List;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/**
 * T1.5b. Persistence was wired in before anything created the schema, so a configured but empty
 * database would have started against missing tables.
 */
class SchemaMigratorTest {

    @Test
    void concurrentMigratorsBothSucceedAndApplyEachVersionOnce() throws Exception {
        // Observed 2026-08-29 with two real JVMs booting together: both raced the registry
        // and one died at startup. The advisory lock serialises them; the loser must see
        // the winner's versions and finish as a clean no-op, not an exception.
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            DataSource dataSource = postgres.getPostgresDatabase();
            var results = new java.util.concurrent.ConcurrentHashMap<Integer, List<String>>();
            var failures = new java.util.concurrent.ConcurrentLinkedQueue<Throwable>();
            var start = new java.util.concurrent.CountDownLatch(1);
            Thread[] nodes = new Thread[2];
            for (int i = 0; i < nodes.length; i++) {
                final int node = i;
                nodes[i] = new Thread(() -> {
                    try {
                        start.await();
                        results.put(node, new SchemaMigrator(dataSource).migrate());
                    } catch (Throwable t) {
                        failures.add(t);
                    }
                });
                nodes[i].start();
            }
            start.countDown();
            for (Thread node : nodes) {
                node.join(60_000);
            }
            assertTrue(failures.isEmpty(), "no node may die at boot: " + failures);
            // Every version was applied by exactly one of the two.
            var all = new java.util.ArrayList<String>();
            results.values().forEach(all::addAll);
            assertEquals(all.size(), new java.util.HashSet<>(all).size(),
                    "no version applied twice: " + results);
            assertTrue(tableExists(dataSource, "submission"));
        }
    }

    @Test
    void appliesEveryMigrationOnceAndIsANoOpOnRestart() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            DataSource dataSource = postgres.getPostgresDatabase();
            SchemaMigrator migrator = new SchemaMigrator(dataSource);

            List<String> first = migrator.migrate();
            // Asserting behaviour, not a frozen list: pinning the exact set means this test
            // breaks every time a migration is added, which is a false alarm rather than a bug.
            assertTrue(first.containsAll(List.of("1", "2", "3")), "all migrations applied: " + first);
            assertEquals(sortedNumerically(first), first, "applied in numeric version order");

            // The tables the rest of the backend depends on now exist.
            assertTrue(tableExists(dataSource, "fact_event"));
            assertTrue(tableExists(dataSource, "submission"));
            assertEquals(first.size(), count(dataSource, "SELECT COUNT(*) FROM schema_version"));

            // A restart must not re-run anything.
            List<String> second = migrator.migrate();
            assertEquals(List.of(), second, "an already-migrated database is left alone");
            assertEquals(first.size(), count(dataSource, "SELECT COUNT(*) FROM schema_version"));
        }
    }

    @Test
    void aSecondMigratorAgainstTheSameDatabaseAlsoDoesNothing() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            DataSource dataSource = postgres.getPostgresDatabase();
            assertFalse(new SchemaMigrator(dataSource).migrate().isEmpty());
            // A second instance booting against a shared database — the horizontal-scaling case.
            assertEquals(List.of(), new SchemaMigrator(dataSource).migrate());
        }
    }

    private static List<String> sortedNumerically(List<String> versions) {
        return versions.stream().sorted(Comparator.comparingInt(Integer::parseInt)).toList();
    }

    private static boolean tableExists(DataSource dataSource, String table) throws SQLException {
        return count(dataSource,
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '" + table + "'") > 0;
    }

    private static int count(DataSource dataSource, String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getInt(1);
        }
    }
}
