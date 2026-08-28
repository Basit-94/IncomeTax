package com.wapsi.backend.history;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import com.wapsi.backend.ledger.FactLedger;
import com.wapsi.backend.ledger.FactLedgerEvent;
import com.wapsi.backend.submission.SubmissionReceipt;
import com.wapsi.backend.submission.SubmissionStore;

/**
 * Pre-fills a new year's draft from the facts of the previous year's filed return.
 *
 * <p><strong>This is a proposal, not a write.</strong> It reads and returns; it appends nothing
 * to the ledger. Every carried fact arrives <em>unconfirmed</em> and names the year and return it
 * came from — "from your 2025–26 return — confirm it still applies" — because a figure that was
 * true last year is a suggestion this year, not a fact. Silent reuse is exactly the failure the
 * plan forbids.
 *
 * <p>It reads the ledger's <em>current projection</em>, not raw history: a figure the taxpayer
 * corrected last year carries forward corrected, not as it was first misreported.
 */
public final class CarryForwardService {

    /** One suggested fact. {@code confirmed} is always false — confirming is the user's act. */
    public record CarriedFact(
            String kind,
            long amountPaise,
            String fromAssessmentYear,
            String fromSubmissionId,
            boolean confirmed) {

        static CarriedFact of(FactLedgerEvent event, String submissionId) {
            return new CarriedFact(event.kind(), event.value().paise(),
                    event.assessmentYear(), submissionId, false);
        }
    }

    public record Draft(String fromAssessmentYear, String fromSubmissionId,
                        List<CarriedFact> facts) {
    }

    private final SubmissionStore submissions;
    private final FactLedger ledger;

    public CarryForwardService(SubmissionStore submissions, FactLedger ledger) {
        this.submissions = Objects.requireNonNull(submissions, "submissions");
        this.ledger = Objects.requireNonNull(ledger, "ledger");
    }

    /**
     * @return a draft built from {@code fromYear}'s latest completed return, or empty when that
     *         year has no completed return to carry from — a first-time filer is not an error.
     */
    public Optional<Draft> draftFrom(String citizenReference, String fromYear) {
        Optional<SubmissionReceipt> previous = submissions.latestCompleted(citizenReference, fromYear);
        if (previous.isEmpty()) {
            return Optional.empty();
        }
        String submissionId = previous.get().submissionId();
        List<FactLedgerEvent> current = ledger.currentProjection(UUID.fromString(submissionId));
        if (current.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new Draft(fromYear, submissionId,
                current.stream().map(event -> CarriedFact.of(event, submissionId)).toList()));
    }
}
