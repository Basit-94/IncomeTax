package com.wapsi.backend.document;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wapsi.backend.auth.SessionService;

/**
 * A signed-in taxpayer's documents.
 *
 * <p>Like the history endpoint: <strong>no {@code pan} or {@code citizen} parameter, ever.</strong>
 * The owner comes from the session. Fetching by id is also owner-scoped at the store, so someone
 * else's document id answers 404 exactly as a nonexistent one does — an id is not an oracle.
 */
@CrossOrigin(origins = { "${cors.allowed-origins:http://localhost:3000}" })
@RestController
@RequestMapping("/api/v1/documents")
public final class DocumentController {

    public record UploadRequest(String assessmentYear, String docType, String filename,
                                String contentType, byte[] content) {
    }

    public record DocumentMeta(String id, String assessmentYear, String docType,
                               String filename, String contentType, Instant uploadedAt) {
        static DocumentMeta of(StoredDocument document) {
            return new DocumentMeta(document.id().toString(), document.assessmentYear(),
                    document.docType(), document.filename(), document.contentType(),
                    document.uploadedAt());
        }
    }

    private final SessionService sessions;
    private final DocumentStore documents;
    private final Clock clock;

    /** The container uses this one; the Clock overload exists for tests. */
    @Autowired
    public DocumentController(SessionService sessions, DocumentStore documents) {
        this(sessions, documents, Clock.systemUTC());
    }

    public DocumentController(SessionService sessions, DocumentStore documents, Clock clock) {
        this.sessions = sessions;
        this.documents = documents;
        this.clock = clock;
    }

    @PostMapping
    public ResponseEntity<DocumentMeta> upload(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody UploadRequest request) {
        Optional<String> owner = authenticate(authorization);
        if (owner.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        StoredDocument.validate(request.contentType(), request.content());
        if (request.assessmentYear() == null || request.assessmentYear().isBlank()
                || request.docType() == null || request.docType().isBlank()) {
            throw new IllegalArgumentException("Say which year and what kind of document this is");
        }
        StoredDocument saved = documents.save(new StoredDocument(
                UUID.randomUUID(), owner.get(), request.assessmentYear(), request.docType(),
                request.filename() == null ? "document" : request.filename(),
                request.contentType(), request.content(), Instant.now(clock)));
        return ResponseEntity.status(HttpStatus.CREATED).body(DocumentMeta.of(saved));
    }

    @GetMapping
    public ResponseEntity<List<DocumentMeta>> list(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String type) {
        Optional<String> owner = authenticate(authorization);
        if (owner.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(documents.list(owner.get(), year, type).stream()
                .map(DocumentMeta::of).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> fetch(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String id) {
        Optional<String> owner = authenticate(authorization);
        if (owner.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID documentId;
        try {
            documentId = UUID.fromString(id);
        } catch (IllegalArgumentException notAUuid) {
            return ResponseEntity.notFound().build();
        }
        // Owner-scoped at the store: someone else's id and a nonexistent id are the same 404.
        return documents.byId(owner.get(), documentId)
                .map(document -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(document.contentType()))
                        .header("Content-Disposition",
                                "attachment; filename=\"" + document.filename() + "\"")
                        .body(document.content()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }

    private Optional<String> authenticate(String authorization) {
        String token = null;
        if (authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring("Bearer ".length()).trim();
        }
        return sessions.authenticate(token, Instant.now(clock));
    }
}
