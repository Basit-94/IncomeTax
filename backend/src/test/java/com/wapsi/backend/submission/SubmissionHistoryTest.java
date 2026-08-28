package com.wapsi.backend.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

import com.wapsi.backend.config.SchemaMigrator;

/**
 * T2.3's foundation: a submission has to record who it belongs to, or "every past filing for this
 * account" has nothing to query by.
 */
class SubmissionHistoryTest {

    private static SubmissionReceipt receipt(String id) {
        return new SubmissionReceipt(id, "accepted", "2026-27-new", null, "queued");
    }

    private static void seed(SubmissionStore store) {
        store.insertIfAbsent("k1", receipt("11111111-1111-1111-1111-111111111111"),
                new SubmissionOwner("ABCDE1234F", "2025-26"));
        store.insertIfAbsent("k2", receipt("22222222-2222-2222-2222-222222222222"),
                new SubmissionOwner("ABCDE1234F", "2026-27"));
        store.insertIfAbsent("k3", receipt("33333333-3333-3333-3333-333333333333"),
                new SubmissionOwner("ZZZZZ9999Z", "2026-27"));
        store.insertIfAbsent("k4", receipt("44444444-4444-4444-4444-444444444444"),
                SubmissionOwner.unknown());
    }

    private static void assertHistoryRules(SubmissionStore store) {
        List<SubmissionReceipt> mine = store.history("ABCDE1234F");
        assertEquals(2, mine.size(), "only this person's filings");
        assertTrue(mine.stream().noneMatch(r -> r.submissionId().startsWith("33333333")),
                "another person's filing must never appear");
        assertTrue(mine.stream().noneMatch(r -> r.submissionId().startsWith("44444444")),
                "an unowned filing belongs to nobody, not to whoever asks");

        // The property documented on the interface: absence of a reference returns nothing,
        // never everything. Getting this backwards would hand one caller the whole table.
        assertEquals(List.of(), store.history(null));
        assertEquals(List.of(), store.history(""));
        assertEquals(List.of(), store.history("   "));
        assertEquals(List.of(), store.history("NOSUCH0000X"));
    }

    @Test
    void inMemoryHistoryReturnsOnlyThatPersonsFilings() {
        SubmissionStore store = new InMemorySubmissionStore();
        seed(store);
        assertHistoryRules(store);
        assertEquals("22222222-2222-2222-2222-222222222222",
                store.history("ABCDE1234F").get(0).submissionId(), "newest first");
    }

    @Test
    void postgresHistoryBehavesTheSameWay() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            DataSource dataSource = postgres.getPostgresDatabase();
            new SchemaMigrator(dataSource).migrate();
            SubmissionStore store = new PostgresSubmissionStore(dataSource);
            seed(store);
            // The two adapters must not drift: the same rules, proven against a real database.
            assertHistoryRules(store);
        }
    }
}
