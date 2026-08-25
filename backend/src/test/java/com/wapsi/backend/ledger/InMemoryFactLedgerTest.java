package com.wapsi.backend.ledger;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.money.Money;

class InMemoryFactLedgerTest {
    @Test
    void correctionAppendsAndProjectionDropsOnlyTheSupersededFact() {
        var ledger = new InMemoryFactLedger();
        UUID returnId = UUID.randomUUID();
        UUID originalId = UUID.randomUUID();

        ledger.append(new FactLedgerEvent(originalId, returnId, "2026-27", "salary",
                Money.ofRupees(900_000), "Employer", "26AS", Instant.parse("2026-05-01T00:00:00Z"), null, null, null));
        ledger.append(new FactLedgerEvent(UUID.randomUUID(), returnId, "2026-27", "salary",
                Money.ofRupees(850_000), "You", "correction", Instant.parse("2026-08-25T00:00:00Z"),
                Instant.parse("2026-08-25T00:00:00Z"), originalId, "Employer filed the wrong figure"));

        assertEquals(2, ledger.history(returnId).size());
        assertEquals(1, ledger.currentProjection(returnId).size());
        assertEquals(850_000_00L, ledger.currentProjection(returnId).getFirst().value().paise());
    }
}
