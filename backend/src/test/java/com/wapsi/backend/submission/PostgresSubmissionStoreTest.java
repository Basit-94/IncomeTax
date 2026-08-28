package com.wapsi.backend.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

import com.wapsi.backend.config.SchemaMigrator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.engine.TaxEngine;
import com.wapsi.backend.rules.RuleSetLoader;

/**
 * B1: idempotency must be owned by the database, not by process memory, or two backend
 * instances handed the same key file the same return twice.
 */
class PostgresSubmissionStoreTest {

    private static SubmissionRequest request(String key) {
        return new SubmissionRequest(
                key, "DEMPTEST0001", "2026-27", "2026-27-new",
                List.of(new SubmissionRequest.FactRequest("salary", 90_000_000L)),
                List.of(), 8_400_00L);
    }

    private static SubmissionService node(DataSource dataSource) {
        return new SubmissionService(
                new RuleSetLoader(new ObjectMapper().findAndRegisterModules()),
                new TaxEngine(),
                new PostgresSubmissionStore(dataSource));
    }

    @Test
    void duplicateKeyOnASecondInstanceReturnsTheFirstInstancesReceipt() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            runMigration(postgres);
            DataSource dataSource = postgres.getPostgresDatabase();

            // Two services with separate stores: the same key arriving at two backend nodes.
            try (SubmissionService nodeA = node(dataSource);
                 SubmissionService nodeB = node(dataSource)) {
                SubmissionRequest request = request("loadtest-b1-0001");

                SubmissionReceipt first = nodeA.submit(request);
                SubmissionReceipt retry = nodeB.submit(request);

                assertEquals(first.submissionId(), retry.submissionId());
                assertEquals(1, countSubmissions(dataSource), "the key must yield exactly one row");

                // Node B can read a status that node A is responsible for writing.
                SubmissionReceipt completed = awaitCompletion(nodeB, first.submissionId());
                assertEquals("completed", completed.status());
                assertNotNull(completed.totalTaxPaise());
                assertEquals(1, countSubmissions(dataSource), "completing must not insert a second row");
            }
        }
    }

    @Test
    void concurrentSubmitsOfOneKeyCollapseToASingleSubmission() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            runMigration(postgres);
            DataSource dataSource = postgres.getPostgresDatabase();

            int nodes = 8;
            SubmissionService[] cluster = new SubmissionService[nodes];
            for (int i = 0; i < nodes; i++) {
                cluster[i] = node(dataSource);
            }
            try {
                SubmissionRequest request = request("loadtest-b1-race");
                Set<String> ids = ConcurrentHashMap.newKeySet();
                List<Throwable> failures = Collections.synchronizedList(new ArrayList<>());
                CountDownLatch start = new CountDownLatch(1);
                CountDownLatch done = new CountDownLatch(nodes);

                for (SubmissionService service : cluster) {
                    Thread.ofVirtual().start(() -> {
                        try {
                            start.await();
                            ids.add(service.submit(request).submissionId());
                        } catch (InterruptedException interrupted) {
                            Thread.currentThread().interrupt();
                        } catch (Throwable thrown) {
                            // Without this the losing nodes die quietly and the test passes
                            // while the race is in fact broken.
                            failures.add(thrown);
                        } finally {
                            done.countDown();
                        }
                    });
                }
                start.countDown();
                assertTrue(done.await(20, TimeUnit.SECONDS), "all nodes should return");

                assertEquals(List.of(), failures, "no node may fail the race: " + failures);
                assertEquals(1, ids.size(), "every node must see the same submission id, got " + ids);
                assertEquals(1, countSubmissions(dataSource), "the race must produce exactly one row");
            } finally {
                for (SubmissionService service : cluster) {
                    service.close();
                }
            }
        }
    }

    private static SubmissionReceipt awaitCompletion(SubmissionService service, String submissionId)
            throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
        SubmissionReceipt receipt = service.status(submissionId);
        while (System.nanoTime() < deadline && !"completed".equals(receipt.status())) {
            Thread.sleep(10);
            receipt = service.status(submissionId);
        }
        return receipt;
    }

    private static int countSubmissions(DataSource dataSource) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery("SELECT COUNT(*) FROM submission")) {
            result.next();
            return result.getInt(1);
        }
    }

    /**
     * Uses the real migrator rather than applying one hardcoded file. Applying only V2 meant this
     * test broke the moment a later migration added a column it writes — the schema is the
     * migrator's job, and duplicating it here just creates a second thing to keep in sync.
     */
    private static void runMigration(EmbeddedPostgres postgres) {
        new SchemaMigrator(postgres.getPostgresDatabase()).migrate();
    }
}
