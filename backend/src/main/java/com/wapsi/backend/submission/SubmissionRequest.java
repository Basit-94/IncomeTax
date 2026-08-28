package com.wapsi.backend.submission;

import java.util.List;
import java.util.Objects;

/** Synthetic local request used by the owned load harness; no government payload. */
public record SubmissionRequest(
        String idempotencyKey,
        String citizenReference,
        String assessmentYear,
        String ruleSetVersion,
        String ageBand,
        List<FactRequest> facts,
        List<ClaimRequest> claims,
        long tdsCreditsPaise) {

    public SubmissionRequest(
            String idempotencyKey,
            String citizenReference,
            String assessmentYear,
            String ruleSetVersion,
            List<FactRequest> facts,
            List<ClaimRequest> claims,
            long tdsCreditsPaise) {
        this(idempotencyKey, citizenReference, assessmentYear, ruleSetVersion, "below_60", facts, claims, tdsCreditsPaise);
    }

    public SubmissionRequest {
        facts = List.copyOf(Objects.requireNonNullElse(facts, List.of()));
        claims = List.copyOf(Objects.requireNonNullElse(claims, List.of()));
    }

    /** assetClass/holding classify capital_gains for s.111A/112A/112 (T1.9b); null = slab. */
    public record FactRequest(String kind, long amountPaise, String assetClass, String holding) {
        public FactRequest(String kind, long amountPaise) {
            this(kind, amountPaise, null, null);
        }
    }

    public record ClaimRequest(String section, long amountPaise) {
    }
}
