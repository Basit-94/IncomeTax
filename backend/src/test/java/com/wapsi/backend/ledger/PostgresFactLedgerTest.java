package com.wapsi.backend.ledger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

import com.wapsi.backend.money.Money;

class PostgresFactLedgerTest {
    @Test
    void postgresPreservesAppendOnlyHistoryAndRebuildsCurrentProjection() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            runMigration(postgres);
            PostgresFactLedger ledger = new PostgresFactLedger(postgres.getPostgresDatabase());
            UUID returnId = UUID.randomUUID();
            UUID originalId = UUID.randomUUID();
            Instant firstTime = Instant.parse("2026-06-01T10:00:00Z");

            FactLedgerEvent original = new FactLedgerEvent(
                    originalId, returnId, "2026-27", "salary", Money.ofRupees(900000),
                    "Acme Employer", "26AS", firstTime, firstTime.plusSeconds(10), null, null);
            FactLedgerEvent correction = new FactLedgerEvent(
                    UUID.randomUUID(), returnId, "2026-27", "salary", Money.ofRupees(910000),
                    "Acme Employer", "26AS-correction", firstTime.plusSeconds(20), null,
                    originalId, "Employer corrected the filed amount");

            ledger.append(original);
            ledger.append(correction);

            assertEquals(2, ledger.history(returnId).size());
            assertEquals(List.of(correction), ledger.currentProjection(returnId));
            assertThrows(IllegalArgumentException.class, () -> ledger.append(original));
        }
    }

    private static void runMigration(EmbeddedPostgres postgres) throws IOException, SQLException {
        Path migration = Path.of("src", "main", "resources", "db", "migration", "V1__fact_ledger.sql");
        if (!Files.exists(migration)) {
            migration = Path.of("backend", "src", "main", "resources", "db", "migration", "V1__fact_ledger.sql");
        }
        String sql = Files.readString(migration);
        try (Connection connection = postgres.getPostgresDatabase().getConnection();
             Statement statement = connection.createStatement()) {
            for (String command : sql.split(";")) {
                if (!command.isBlank()) {
                    statement.execute(command);
                }
            }
        }
    }
}
