package com.wapsi.backend.submission;

import java.util.List;
import java.util.Objects;

/** Synthetic local request used by the owned load harness; no government payload. */
public record SubmissionRequest(
        String idempotencyKey,
        String citizenReference,
        String assessmentYear,
        String ruleSetVersion,
        List<FactRequest> facts,
        List<ClaimRequest> claims,
        long tdsCreditsPaise) {
    public SubmissionRequest {
        facts = List.copyOf(Objects.requireNonNullElse(facts, List.of()));
        claims = List.copyOf(Objects.requireNonNullElse(claims, List.of()));
    }

    public record FactRequest(String kind, long amountPaise) {
    }

    public record ClaimRequest(String section, long amountPaise) {
    }
}
