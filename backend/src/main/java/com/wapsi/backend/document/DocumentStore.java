package com.wapsi.backend.document;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Document persistence.
 *
 * <p><strong>Every read is scoped by owner.</strong> There is deliberately no fetch-by-id-alone:
 * {@link #byId} takes the citizen reference too, so "someone else's document" and "no such
 * document" are indistinguishable to a caller, and a leaked id is not an oracle.
 */
public interface DocumentStore {

    StoredDocument save(StoredDocument document);

    Optional<StoredDocument> byId(String citizenReference, UUID id);

    /** Metadata for listing; year and type may each be null meaning "any". Newest first. */
    List<StoredDocument> list(String citizenReference, String assessmentYear, String docType);

    final class InMemory implements DocumentStore {
        private final Map<UUID, StoredDocument> byId = new ConcurrentHashMap<>();

        @Override
        public StoredDocument save(StoredDocument document) {
            byId.put(document.id(), document);
            return document;
        }

        @Override
        public Optional<StoredDocument> byId(String citizenReference, UUID id) {
            return Optional.ofNullable(byId.get(id))
                    .filter(d -> d.citizenReference().equals(citizenReference));
        }

        @Override
        public List<StoredDocument> list(String citizenReference, String assessmentYear,
                                         String docType) {
            if (citizenReference == null || citizenReference.isBlank()) {
                return List.of();
            }
            return byId.values().stream()
                    .filter(d -> d.citizenReference().equals(citizenReference))
                    .filter(d -> assessmentYear == null || d.assessmentYear().equals(assessmentYear))
                    .filter(d -> docType == null || d.docType().equals(docType))
                    .sorted(Comparator.comparing(StoredDocument::uploadedAt).reversed())
                    .toList();
        }
    }
}
