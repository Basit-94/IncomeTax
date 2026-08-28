package com.wapsi.backend.submission;

/**
 * Who a submission belongs to, and for which year.
 *
 * <p>Kept separate from {@link SubmissionRequest} deliberately. This is storage metadata — what
 * the row needs so a person's filings can be found again — not part of the client contract.
 * Folding it into the request record would change a public API and break every caller, including
 * the load-test harness, for no gain.
 *
 * <p>Both fields are nullable: submissions made before this existed have no owner recorded, and a
 * history query must treat those as "not mine" rather than "everyone's".
 */
public record SubmissionOwner(String citizenReference, String assessmentYear) {

    public static SubmissionOwner of(SubmissionRequest request) {
        return new SubmissionOwner(request.citizenReference(), request.assessmentYear());
    }

    /** For callers that genuinely have no owner, such as the load-test harness. */
    public static SubmissionOwner unknown() {
        return new SubmissionOwner(null, null);
    }
}
