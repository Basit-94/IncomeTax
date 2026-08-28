package com.wapsi.backend.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.engine.TaxEngine;
import com.wapsi.backend.ledger.FactLedger;
import com.wapsi.backend.ledger.FactLedgerEvent;
import com.wapsi.backend.ledger.InMemoryFactLedger;
import com.wapsi.backend.rules.RuleSetLoader;

/**
 * B3: submitting must append to the fact ledger. Before this the ledger existed but nothing in
 * the submission path wrote to it, so it recorded nothing and there was no history to read.
 */
class SubmissionLedgerTest {

    private static SubmissionRequest request(String key) {
        return new SubmissionRequest(
                key, "DEMPTEST0001", "2026-27", "2026-27-new",
                List.of(new SubmissionRequest.FactRequest("salary", 124_000_000L),
                        new SubmissionRequest.FactRequest("interest", 348_000L)),
                List.of(new SubmissionRequest.ClaimRequest("80C", 15_000_000L)),
                9_792_000L);
    }

    private static SubmissionService service(FactLedger ledger) {
        return new SubmissionService(
                new RuleSetLoader(new ObjectMapper().findAndRegisterModules()),
                new TaxEngine(), new InMemorySubmissionStore(), ledger);
    }

    private static void awaitCompletion(SubmissionService service, String id) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        while (System.nanoTime() < deadline && !"completed".equals(service.status(id).status())) {
            Thread.sleep(10);
        }
    }

    @Test
    void submittingAppendsEveryReportedFactToTheLedger() throws Exception {
        FactLedger ledger = new InMemoryFactLedger();
        try (SubmissionService service = service(ledger)) {
            SubmissionReceipt receipt = service.submit(request("ledger-0001"));
            awaitCompletion(service, receipt.submissionId());

            UUID returnId = UUID.fromString(receipt.submissionId());
            List<FactLedgerEvent> events = ledger.history(returnId);

            assertEquals(2, events.size(), "one event per reported fact");
            assertEquals("completed", service.status(receipt.submissionId()).status());

            FactLedgerEvent salary = events.stream()
                    .filter(e -> e.kind().equals("salary")).findFirst().orElseThrow();
            assertEquals(124_000_000L, salary.value().paise(), "paise must survive the round trip");
            assertEquals("2026-27", salary.assessmentYear());
            assertEquals("taxpayer", salary.reportedBy());
            assertEquals("DEMPTEST0001", salary.sourceDocument());
            assertTrue(events.stream().anyMatch(e -> e.kind().equals("interest")));
        }
    }

    @Test
    void aDuplicateSubmissionDoesNotAppendTheFactsTwice() throws Exception {
        FactLedger ledger = new InMemoryFactLedger();
        try (SubmissionService service = service(ledger)) {
            SubmissionRequest request = request("ledger-dupe");
            SubmissionReceipt first = service.submit(request);
            SubmissionReceipt retry = service.submit(request);
            awaitCompletion(service, first.submissionId());

            assertEquals(first.submissionId(), retry.submissionId());
            assertEquals(2, ledger.history(UUID.fromString(first.submissionId())).size(),
                    "the idempotency key must stop the second submission reaching the ledger");
        }
    }

    @Test
    void factsAreRecordedEvenWhenTheComputationFails() throws Exception {
        FactLedger ledger = new InMemoryFactLedger();
        try (SubmissionService service = service(ledger)) {
            // A valid rule set, so validation passes, but figures that overflow when summed —
            // a failure that can only happen after the facts have been recorded.
            SubmissionRequest overflowing = new SubmissionRequest(
                    "ledger-fail", "DEMPTEST0001", "2026-27", "2026-27-new",
                    List.of(new SubmissionRequest.FactRequest("salary", Long.MAX_VALUE),
                            new SubmissionRequest.FactRequest("interest", Long.MAX_VALUE)),
                    List.of(), 0L);
            SubmissionReceipt receipt = service.submit(overflowing);

            long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
            while (System.nanoTime() < deadline
                    && "accepted".equals(service.status(receipt.submissionId()).status())) {
                Thread.sleep(10);
            }

            assertEquals("failed", service.status(receipt.submissionId()).status());
            assertEquals(2, ledger.history(UUID.fromString(receipt.submissionId())).size(),
                    "a computation failure must not erase the record that these figures were reported");
        }
    }

    @Test
    void aRuleSetForAnotherAssessmentYearIsRejectedBeforeAnythingIsAccepted() {
        FactLedger ledger = new InMemoryFactLedger();
        try (SubmissionService service = service(ledger)) {
            SubmissionRequest mismatched = new SubmissionRequest(
                    "ledger-year", "DEMPTEST0001", "2025-26", "2026-27-new",
                    List.of(new SubmissionRequest.FactRequest("salary", 124_000_000L)),
                    List.of(), 0L);
            IllegalArgumentException thrown =
                    assertThrows(IllegalArgumentException.class, () -> service.submit(mismatched));
            assertTrue(thrown.getMessage().contains("2026-27"), thrown.getMessage());
        }
    }

    @Test
    void anUnknownRuleSetIsRejectedSynchronously() {
        FactLedger ledger = new InMemoryFactLedger();
        try (SubmissionService service = service(ledger)) {
            SubmissionRequest unknown = new SubmissionRequest(
                    "ledger-unknown", "DEMPTEST0001", "2026-27", "no-such-ruleset",
                    List.of(new SubmissionRequest.FactRequest("salary", 1L)), List.of(), 0L);
            assertThrows(IllegalArgumentException.class, () -> service.submit(unknown));
        }
    }
}
