package com.wapsi.backend.history;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.ledger.FactLedgerEvent;
import com.wapsi.backend.ledger.InMemoryFactLedger;
import com.wapsi.backend.money.Money;
import com.wapsi.backend.submission.InMemorySubmissionStore;
import com.wapsi.backend.submission.SubmissionOwner;
import com.wapsi.backend.submission.SubmissionReceipt;

/** T2.4: last year's filed facts become this year's suggestions — never silently, never confirmed. */
class CarryForwardServiceTest {
    private static final String PAN = "ABCDE1234F";
    private static final String LAST_YEAR = "2025-26";
    private static final UUID RETURN_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final Instant FILED = Instant.parse("2025-07-01T10:00:00Z");

    private final InMemorySubmissionStore submissions = new InMemorySubmissionStore();
    private final InMemoryFactLedger ledger = new InMemoryFactLedger();
    private final CarryForwardService service = new CarryForwardService(submissions, ledger);

    private void fileLastYear() {
        submissions.insertIfAbsent("k-last",
                new SubmissionReceipt(RETURN_ID.toString(), "completed", "2025-26-new",
                        9_000_000L, "processed"),
                new SubmissionOwner(PAN, LAST_YEAR));
        ledger.append(new FactLedgerEvent(UUID.randomUUID(), RETURN_ID, LAST_YEAR, "salary",
                Money.ofPaise(120_000_000L), "taxpayer", PAN, FILED, FILED, null, null));
    }

    @Test
    void carriedFactsNameTheirSourceAndArriveUnconfirmed() {
        fileLastYear();
        CarryForwardService.Draft draft = service.draftFrom(PAN, LAST_YEAR).orElseThrow();
        assertEquals(LAST_YEAR, draft.fromAssessmentYear());
        assertEquals(RETURN_ID.toString(), draft.fromSubmissionId());
        assertEquals(1, draft.facts().size());
        CarryForwardService.CarriedFact salary = draft.facts().get(0);
        assertEquals("salary", salary.kind());
        assertEquals(120_000_000L, salary.amountPaise());
        // The rule the feature exists for: a carried figure is a suggestion, not a fact.
        assertFalse(salary.confirmed(), "never silently reuse a stale figure");
    }

    @Test
    void carryForwardUsesTheCorrectedFigureNotTheOriginalOne() {
        fileLastYear();
        // The taxpayer corrected their salary after filing; the correction supersedes.
        UUID original = ledger.history(RETURN_ID).get(0).id();
        ledger.append(new FactLedgerEvent(UUID.randomUUID(), RETURN_ID, LAST_YEAR, "salary",
                Money.ofPaise(121_000_000L), "taxpayer", PAN, FILED.plusSeconds(60),
                FILED.plusSeconds(60), original, "employer corrected the amount"));

        CarryForwardService.Draft draft = service.draftFrom(PAN, LAST_YEAR).orElseThrow();
        assertEquals(1, draft.facts().size(), "the superseded figure must not also carry");
        assertEquals(121_000_000L, draft.facts().get(0).amountPaise(),
                "corrections carry forward corrected, not as first misreported");
    }

    @Test
    void aFirstTimeFilerGetsAnEmptyDraftNotAnError() {
        assertEquals(Optional.empty(), service.draftFrom(PAN, LAST_YEAR));
    }

    @Test
    void aFailedReturnIsNotASourceToCarryFrom() {
        submissions.insertIfAbsent("k-failed",
                new SubmissionReceipt(RETURN_ID.toString(), "failed", "2025-26-new", null, "boom"),
                new SubmissionOwner(PAN, LAST_YEAR));
        assertEquals(Optional.empty(), service.draftFrom(PAN, LAST_YEAR));
    }

    @Test
    void onePersonsFactsNeverBecomeAnothersDraft() {
        fileLastYear();
        assertEquals(Optional.empty(), service.draftFrom("ZZZZZ9999Z", LAST_YEAR));
    }

    @Test
    void carryingForwardWritesNothing() {
        fileLastYear();
        List<FactLedgerEvent> before = ledger.history(RETURN_ID);
        service.draftFrom(PAN, LAST_YEAR);
        service.draftFrom(PAN, LAST_YEAR);
        assertTrue(ledger.history(RETURN_ID).equals(before),
                "a proposal must not append to the ledger");
    }
}
