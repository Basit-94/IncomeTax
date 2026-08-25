package com.wapsi.backend.ledger;

import java.time.Instant;
import java.util.UUID;

import com.wapsi.backend.money.Money;

/** Immutable event in the fact ledger. Events are appended; they are never updated. */
public record FactLedgerEvent(
        UUID id,
        UUID returnId,
        String assessmentYear,
        String kind,
        Money value,
        String reportedBy,
        String sourceDocument,
        Instant reportedAt,
        Instant confirmedByUserAt,
        UUID supersedesFactId,
        String correctionReason) {
}
