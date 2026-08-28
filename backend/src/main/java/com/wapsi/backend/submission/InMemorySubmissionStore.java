package com.wapsi.backend.submission;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Single-process store. Correct only while exactly one instance is running; use
 * {@link PostgresSubmissionStore} anywhere the backend is scaled horizontally.
 */
public final class InMemorySubmissionStore implements SubmissionStore {
    private record Row(SubmissionReceipt receipt, SubmissionOwner owner, long sequence) {
    }

    private final Map<String, Row> byKey = new ConcurrentHashMap<>();
    private long sequence;

    @Override
    public synchronized Optional<SubmissionReceipt> insertIfAbsent(
            String idempotencyKey, SubmissionReceipt receipt, SubmissionOwner owner) {
        Row existing = byKey.get(idempotencyKey);
        if (existing != null) {
            return Optional.of(existing.receipt());
        }
        byKey.put(idempotencyKey, new Row(receipt, owner, sequence++));
        return Optional.empty();
    }

    @Override
    public void complete(String idempotencyKey, SubmissionReceipt receipt) {
        byKey.computeIfPresent(idempotencyKey,
                (key, row) -> new Row(receipt, row.owner(), row.sequence()));
    }

    @Override
    public Optional<SubmissionReceipt> bySubmissionId(String submissionId) {
        return byKey.values().stream()
                .map(Row::receipt)
                .filter(receipt -> receipt.submissionId().equals(submissionId))
                .findFirst();
    }

    @Override
    public Optional<SubmissionReceipt> latestCompleted(String citizenReference, String assessmentYear) {
        if (citizenReference == null || citizenReference.isBlank() || assessmentYear == null) {
            return Optional.empty();
        }
        return byKey.values().stream()
                .filter(row -> citizenReference.equals(row.owner().citizenReference()))
                .filter(row -> assessmentYear.equals(row.owner().assessmentYear()))
                .filter(row -> "completed".equals(row.receipt().status()))
                .max(Comparator.comparingLong(Row::sequence))
                .map(Row::receipt);
    }

    @Override
    public List<SubmissionReceipt> history(String citizenReference) {
        if (citizenReference == null || citizenReference.isBlank()) {
            return List.of();
        }
        List<Row> rows = new ArrayList<>(byKey.values().stream()
                .filter(row -> citizenReference.equals(row.owner().citizenReference()))
                .toList());
        rows.sort(Comparator.comparingLong(Row::sequence).reversed());
        return rows.stream().map(Row::receipt).toList();
    }
}
