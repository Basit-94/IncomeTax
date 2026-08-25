package com.wapsi.backend.submission;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.wapsi.backend.engine.TaxClaim;
import com.wapsi.backend.engine.TaxEngine;
import com.wapsi.backend.engine.TaxFact;
import com.wapsi.backend.engine.TaxInput;
import com.wapsi.backend.money.Money;
import com.wapsi.backend.rules.RuleSetLoader;

import jakarta.annotation.PreDestroy;

/**
 * Local async/idempotency boundary. The map is a test adapter; production uses
 * a durable unique idempotency key and an outbox/queue, not process memory.
 */
@Service
public final class SubmissionService implements AutoCloseable {
    private final RuleSetLoader ruleSetLoader;
    private final TaxEngine taxEngine;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final Map<String, SubmissionReceipt> receiptsByKey = new ConcurrentHashMap<>();

    @Autowired
    public SubmissionService(RuleSetLoader ruleSetLoader) {
        this(ruleSetLoader, new TaxEngine());
    }

    SubmissionService(RuleSetLoader ruleSetLoader, TaxEngine taxEngine) {
        this.ruleSetLoader = Objects.requireNonNull(ruleSetLoader, "ruleSetLoader");
        this.taxEngine = Objects.requireNonNull(taxEngine, "taxEngine");
    }

    public SubmissionReceipt submit(SubmissionRequest request) {
        validate(request);
        return receiptsByKey.computeIfAbsent(request.idempotencyKey(), key -> {
            String id = UUID.nameUUIDFromBytes(("wapsi:" + key).getBytes(StandardCharsets.UTF_8)).toString();
            SubmissionReceipt accepted = new SubmissionReceipt(
                    id, "accepted", request.ruleSetVersion(), null, "queued for local processing");
            executor.submit(() -> process(request, accepted));
            return accepted;
        });
    }

    public SubmissionReceipt status(String submissionId) {
        return receiptsByKey.values().stream()
                .filter(receipt -> receipt.submissionId().equals(submissionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown submission: " + submissionId));
    }

    private void process(SubmissionRequest request, SubmissionReceipt accepted) {
        try {
            var rules = ruleSetLoader.load(request.ruleSetVersion());
            var facts = request.facts().stream()
                    .map(fact -> new TaxFact(fact.kind(), Money.ofPaise(fact.amountPaise())))
                    .toList();
            var claims = request.claims().stream()
                    .map(claim -> new TaxClaim(claim.section(), Money.ofPaise(claim.amountPaise())))
                    .toList();
            var result = taxEngine.compute(rules, new TaxInput(
                    facts, claims, "below_60", Money.ofPaise(request.tdsCreditsPaise())));
            receiptsByKey.replace(request.idempotencyKey(), accepted, new SubmissionReceipt(
                    accepted.submissionId(), "completed", request.ruleSetVersion(), result.totalTax().paise(), "processed locally"));
        } catch (RuntimeException exception) {
            receiptsByKey.replace(request.idempotencyKey(), accepted, new SubmissionReceipt(
                    accepted.submissionId(), "failed", request.ruleSetVersion(), null, exception.getMessage()));
        }
    }

    private void validate(SubmissionRequest request) {
        Objects.requireNonNull(request, "request");
        if (request.idempotencyKey() == null || request.idempotencyKey().isBlank() || request.idempotencyKey().length() > 128) {
            throw new IllegalArgumentException("idempotencyKey must be 1-128 characters");
        }
        if (!"2026-27".equals(request.assessmentYear())) {
            throw new IllegalArgumentException("assessmentYear is not supported by this local fixture");
        }
        if (request.ruleSetVersion() == null || request.ruleSetVersion().isBlank()) {
            throw new IllegalArgumentException("ruleSetVersion is required");
        }
    }

    @PreDestroy
    @Override
    public void close() {
        executor.close();
    }
}
