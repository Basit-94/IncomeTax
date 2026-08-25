package com.wapsi.backend.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.rules.RuleSetLoader;

class SubmissionServiceTest {
    @Test
    void repeatedIdempotencyKeyReturnsOneReceiptAndCompletesAsync() throws Exception {
        try (SubmissionService service = new SubmissionService(
                new RuleSetLoader(new ObjectMapper().findAndRegisterModules()))) {
            SubmissionRequest request = new SubmissionRequest(
                    "loadtest-0001", "DEMPTEST0001", "2026-27", "2026-27-new",
                    List.of(new SubmissionRequest.FactRequest("salary", 90_000_000L)),
                    List.of(), 8_400_00L);
            SubmissionReceipt first = service.submit(request);
            SubmissionReceipt retry = service.submit(request);
            assertEquals(first.submissionId(), retry.submissionId());

            long deadline = System.nanoTime() + Duration.ofSeconds(2).toNanos();
            SubmissionReceipt completed = retry;
            while (System.nanoTime() < deadline && !"completed".equals(completed.status())) {
                Thread.sleep(10);
                completed = service.status(first.submissionId());
            }
            assertEquals("completed", completed.status());
            assertNotNull(completed.totalTaxPaise());
        }
    }
}
