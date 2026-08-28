package com.wapsi.backend.submission;

import java.util.List;
import java.util.Optional;

/**
 * Idempotency boundary for submissions. The store, not the process, decides which caller wins
 * the race for a given key, so two backend instances handed the same key produce one submission
 * rather than two.
 */
public interface SubmissionStore {
    /**
     * Records {@code receipt} under {@code idempotencyKey} if that key is not already taken.
     *
     * @param owner who the submission belongs to, for later history queries. Storage metadata,
     *              not part of the client contract.
     * @return empty when this caller won and should start processing; the receipt already stored
     *         under the key when it did not.
     */
    Optional<SubmissionReceipt> insertIfAbsent(String idempotencyKey, SubmissionReceipt receipt,
                                               SubmissionOwner owner);

    /** Replaces the receipt held under {@code idempotencyKey} once processing has finished. */
    void complete(String idempotencyKey, SubmissionReceipt receipt);

    Optional<SubmissionReceipt> bySubmissionId(String submissionId);

    /**
     * Every submission recorded against {@code citizenReference}, newest first.
     *
     * <p>A blank or null reference returns nothing rather than everything: an unowned submission
     * belongs to no one, and must never be readable as though it belonged to whoever asked.
     */
    List<SubmissionReceipt> history(String citizenReference);

    /**
     * The most recent <em>completed</em> submission this person made for this year, if any.
     * Completed only: a failed or still-processing return is not a source to carry facts from.
     */
    Optional<SubmissionReceipt> latestCompleted(String citizenReference, String assessmentYear);
}
