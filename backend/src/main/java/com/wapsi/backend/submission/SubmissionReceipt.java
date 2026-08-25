package com.wapsi.backend.submission;

public record SubmissionReceipt(
        String submissionId,
        String status,
        String ruleSetVersion,
        Long totalTaxPaise,
        String message) {
}
