package com.wapsi.backend.document;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

import com.wapsi.backend.config.SchemaMigrator;

/**
 * The Postgres adapter against a real database — the LIST query's {@code ?::varchar IS NULL}
 * pattern is exactly the kind of syntax an in-memory twin cannot vouch for.
 */
class PostgresDocumentStoreTest {
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private static StoredDocument doc(String owner, String year, String type, String name) {
        return new StoredDocument(UUID.randomUUID(), owner, year, type, name,
                "application/pdf", name.getBytes(StandardCharsets.UTF_8), T0);
    }

    @Test
    void roundTripAndOwnerScopingHoldOnARealDatabase() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            DataSource dataSource = postgres.getPostgresDatabase();
            new SchemaMigrator(dataSource).migrate();
            DocumentStore store = new PostgresDocumentStore(dataSource);

            StoredDocument mine = store.save(doc("ABCDE1234F", "2026-27", "form16", "mine.pdf"));
            store.save(doc("ABCDE1234F", "2025-26", "receipt", "old.pdf"));
            store.save(doc("ZZZZZ9999Z", "2026-27", "form16", "theirs.pdf"));

            // Null filters mean "any" — the ?::varchar casts have to survive real Postgres.
            assertEquals(2, store.list("ABCDE1234F", null, null).size());
            assertEquals(1, store.list("ABCDE1234F", "2026-27", null).size());
            assertEquals(1, store.list("ABCDE1234F", null, "receipt").size());
            assertEquals(0, store.list("ABCDE1234F", "2026-27", "receipt").size());

            assertArrayEquals("mine.pdf".getBytes(StandardCharsets.UTF_8),
                    store.byId("ABCDE1234F", mine.id()).orElseThrow().content());
            // Owner scoping: my id under someone else's reference is simply absent.
            assertTrue(store.byId("ZZZZZ9999Z", mine.id()).isEmpty());
        }
    }
}
