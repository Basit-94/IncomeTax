package com.wapsi.backend.submission;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.wapsi.backend.engine.TaxClaim;
import com.wapsi.backend.engine.TaxEngine;
import com.wapsi.backend.engine.TaxFact;
import com.wapsi.backend.engine.TaxInput;
import com.wapsi.backend.ledger.FactLedger;
import com.wapsi.backend.ledger.FactLedgerEvent;
import com.wapsi.backend.ledger.InMemoryFactLedger;
import com.wapsi.backend.money.Money;
import com.wapsi.backend.rules.RuleSetDefinition;
import com.wapsi.backend.rules.RuleSetLoader;

import jakarta.annotation.PreDestroy;

/**
 * Local async/idempotency boundary. The {@link SubmissionStore} owns the idempotency
 * decision: backed by {@link PostgresSubmissionStore}, a repeated key collapses to one
 * submission even when the two requests land on different backend instances.
 */
@Service
public final class SubmissionService implements AutoCloseable {
    private final RuleSetLoader ruleSetLoader;
    private final TaxEngine taxEngine;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final SubmissionStore store;
    private final FactLedger ledger;

    @Autowired
    public SubmissionService(RuleSetLoader ruleSetLoader, SubmissionStore store, FactLedger ledger) {
        this(ruleSetLoader, new TaxEngine(), store, ledger);
    }

    /** Convenience for tests: in-memory store and ledger, no Spring context required. */
    SubmissionService(RuleSetLoader ruleSetLoader) {
        this(ruleSetLoader, new TaxEngine(), new InMemorySubmissionStore(), new InMemoryFactLedger());
    }

    SubmissionService(RuleSetLoader ruleSetLoader, TaxEngine taxEngine) {
        this(ruleSetLoader, taxEngine, new InMemorySubmissionStore(), new InMemoryFactLedger());
    }

    public SubmissionService(RuleSetLoader ruleSetLoader, TaxEngine taxEngine, SubmissionStore store) {
        this(ruleSetLoader, taxEngine, store, new InMemoryFactLedger());
    }

    public SubmissionService(RuleSetLoader ruleSetLoader, TaxEngine taxEngine,
                             SubmissionStore store, FactLedger ledger) {
        this.ruleSetLoader = Objects.requireNonNull(ruleSetLoader, "ruleSetLoader");
        this.taxEngine = Objects.requireNonNull(taxEngine, "taxEngine");
        this.store = Objects.requireNonNull(store, "store");
        this.ledger = Objects.requireNonNull(ledger, "ledger");
    }

    public SubmissionReceipt submit(SubmissionRequest request) {
        validate(request);
        String key = request.idempotencyKey();
        String id = UUID.nameUUIDFromBytes(("wapsi:" + key).getBytes(StandardCharsets.UTF_8)).toString();
        SubmissionReceipt accepted = new SubmissionReceipt(
                id, "accepted", request.ruleSetVersion(), null, "queued for local processing");
        Optional<SubmissionReceipt> alreadyHeld =
                store.insertIfAbsent(key, accepted, SubmissionOwner.of(request));
        if (alreadyHeld.isPresent()) {
            return alreadyHeld.get();
        }
        // Only the caller that won the key does the work; every other caller reads its receipt.
        executor.submit(() -> process(request, accepted));
        return accepted;
    }

    /** Every filing recorded against this citizen reference, newest first. */
    public java.util.List<SubmissionReceipt> history(String citizenReference) {
        return store.history(citizenReference);
    }

    public SubmissionReceipt status(String submissionId) {
        return store.bySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown submission: " + submissionId));
    }

    private void process(SubmissionRequest request, SubmissionReceipt accepted) {
        try {
            recordReportedFacts(request, accepted);
            var rules = ruleSetLoader.load(request.ruleSetVersion());
            var facts = request.facts().stream()
                    .map(fact -> new TaxFact(fact.kind(), Money.ofPaise(fact.amountPaise()), fact.assetClass(), fact.holding()))
                    .toList();
            var claims = request.claims().stream()
                    .map(claim -> new TaxClaim(claim.section(), Money.ofPaise(claim.amountPaise())))
                    .toList();
            String ageBand = request.ageBand() != null ? request.ageBand() : "below_60";
            var result = taxEngine.compute(rules, new TaxInput(
                    facts, claims, ageBand, Money.ofPaise(request.tdsCreditsPaise())));
            store.complete(request.idempotencyKey(), new SubmissionReceipt(
                    accepted.submissionId(), "completed", request.ruleSetVersion(), result.totalTax().paise(), "processed locally"));
        } catch (RuntimeException exception) {
            store.complete(request.idempotencyKey(), new SubmissionReceipt(
                    accepted.submissionId(), "failed", request.ruleSetVersion(), null, exception.getMessage()));
        }
    }

    /**
     * Appends what the taxpayer reported, before the computation is attempted: a rule failure
     * must not erase the record that these figures were submitted.
     *
     * <p>Event ids are derived from the submission rather than random, so re-processing the same
     * submission cannot append the same fact twice — the ledger's own uniqueness check then acts
     * as a second guard behind the idempotency key.
     */
    private void recordReportedFacts(SubmissionRequest request, SubmissionReceipt accepted) {
        UUID returnId = UUID.fromString(accepted.submissionId());
        Instant reportedAt = Instant.now();
        int index = 0;
        for (SubmissionRequest.FactRequest fact : request.facts()) {
            String seed = accepted.submissionId() + ":" + fact.kind() + ":" + index++;
            ledger.append(new FactLedgerEvent(
                    UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8)),
                    returnId,
                    request.assessmentYear(),
                    fact.kind(),
                    Money.ofPaise(fact.amountPaise()),
                    "taxpayer",
                    request.citizenReference(),
                    reportedAt,
                    reportedAt,
                    null,
                    null));
        }
    }

    private void validate(SubmissionRequest request) {
        Objects.requireNonNull(request, "request");
        if (request.idempotencyKey() == null || request.idempotencyKey().isBlank() || request.idempotencyKey().length() > 128) {
            throw new IllegalArgumentException("idempotencyKey must be 1-128 characters");
        }
        if (request.assessmentYear() == null || request.assessmentYear().isBlank()) {
            throw new IllegalArgumentException("assessmentYear is required");
        }
        if (request.ruleSetVersion() == null || request.ruleSetVersion().isBlank()) {
            throw new IllegalArgumentException("ruleSetVersion is required");
        }
        // Without this the failure surfaced ASYNC as "Could not append fact event"
        // (fact_event.source_document is NOT NULL) - observed 2026-08-29 when the
        // front end omitted the field. A missing person is a 400, not a buried
        // processing failure after the caller was already told 202.
        if (request.citizenReference() == null || request.citizenReference().isBlank()) {
            throw new IllegalArgumentException("citizenReference is required");
        }
        // Any assessment year is supported for which a rule set exists. Checking the request
        // against the rule set that will actually be used — rather than against a hardcoded
        // year — also catches filing one year's return under another year's rules, which a
        // literal never could. Unknown versions fail here, synchronously, as a 400.
        RuleSetDefinition rules = ruleSetLoader.load(request.ruleSetVersion());
        if (!rules.assessmentYear().equals(request.assessmentYear())) {
            throw new IllegalArgumentException(
                    "Rule set " + request.ruleSetVersion() + " is for assessment year "
                            + rules.assessmentYear() + ", not " + request.assessmentYear());
        }
    }

    @PreDestroy
    @Override
    public void close() {
        executor.close();
    }
}
