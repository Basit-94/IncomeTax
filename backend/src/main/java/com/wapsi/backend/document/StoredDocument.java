package com.wapsi.backend.document;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * One artefact a taxpayer keeps: a Form 16, a proof, a filed return, a receipt.
 *
 * <p>Addressed by owner + year + type, because that is how people ask for documents — "my TDS
 * certificate for last year" — and how the agent (Phase 6, T6.3) will fetch them.
 */
public record StoredDocument(
        UUID id,
        String citizenReference,
        String assessmentYear,
        String docType,
        String filename,
        String contentType,
        byte[] content,
        Instant uploadedAt) {

    /** 5 MB. A mock store that accepts unbounded uploads is how a mock becomes a liability. */
    public static final int MAX_BYTES = 5 * 1024 * 1024;

    /** What a tax document plausibly is. Everything else is refused, not stored-and-hoped-about. */
    public static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg", "application/json");

    public static void validate(String contentType, byte[] content) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("The file is empty");
        }
        if (content.length > MAX_BYTES) {
            throw new IllegalArgumentException("Files can be at most 5 MB");
        }
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only PDF, PNG, JPEG and JSON files are accepted");
        }
    }
}
