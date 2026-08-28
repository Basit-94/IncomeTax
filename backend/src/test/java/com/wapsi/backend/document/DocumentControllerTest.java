package com.wapsi.backend.document;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.auth.SessionService;
import com.wapsi.backend.auth.SessionStore;
import com.wapsi.backend.document.DocumentController.UploadRequest;

/** T2.5: documents are addressable by year and type, and reachable only by their owner. */
class DocumentControllerTest {
    private static final String MINE = "ABCDE1234F";
    private static final String THEIRS = "ZZZZZ9999Z";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");
    private static final byte[] PDF = "not-really-a-pdf".getBytes(StandardCharsets.UTF_8);

    private final SessionService sessions =
            new SessionService(new SessionStore.InMemory(), Duration.ofHours(12));
    private final DocumentController controller = new DocumentController(
            sessions, new DocumentStore.InMemory(), Clock.fixed(T0, ZoneOffset.UTC));

    private String auth(String pan) {
        return "Bearer " + sessions.issue(pan, T0);
    }

    private String upload(String header, String year, String type) {
        var response = controller.upload(header,
                new UploadRequest(year, type, "form16.pdf", "application/pdf", PDF));
        assertEquals(201, response.getStatusCode().value());
        return response.getBody().id();
    }

    @Test
    void uploadListAndFetchRoundTrip() {
        String header = auth(MINE);
        String id = upload(header, "2026-27", "form16");

        var list = controller.list(header, "2026-27", "form16");
        assertEquals(1, list.getBody().size());
        assertEquals("form16.pdf", list.getBody().get(0).filename());

        var fetched = controller.fetch(header, id);
        assertEquals(200, fetched.getStatusCode().value());
        assertArrayEquals(PDF, fetched.getBody());
    }

    @Test
    void theAgentQueryShapeWorks_yearAndTypeNarrowTheList() {
        String header = auth(MINE);
        upload(header, "2025-26", "form16");
        upload(header, "2026-27", "form16");
        upload(header, "2026-27", "receipt");

        assertEquals(3, controller.list(header, null, null).getBody().size());
        assertEquals(2, controller.list(header, "2026-27", null).getBody().size());
        // "Get me the TDS certificate for last year" — T6.3's exact question.
        assertEquals(1, controller.list(header, "2025-26", "form16").getBody().size());
    }

    @Test
    void someoneElsesDocumentIdAnswersExactlyLikeANonexistentOne() {
        String id = upload(auth(MINE), "2026-27", "form16");
        var stranger = controller.fetch(auth(THEIRS), id);
        var nonsense = controller.fetch(auth(THEIRS), "99999999-9999-9999-9999-999999999999");
        assertEquals(404, stranger.getStatusCode().value(), "an id must not be an oracle");
        assertEquals(404, nonsense.getStatusCode().value());
        assertEquals(stranger.getStatusCode(), nonsense.getStatusCode());
    }

    @Test
    void noTokenMeans401ForEveryVerb() {
        assertEquals(401, controller.upload(null,
                new UploadRequest("2026-27", "form16", "x.pdf", "application/pdf", PDF))
                .getStatusCode().value());
        assertEquals(401, controller.list(null, null, null).getStatusCode().value());
        assertEquals(401, controller.fetch("Bearer junk",
                "11111111-1111-1111-1111-111111111111").getStatusCode().value());
    }

    @Test
    void oversizedAndForeignContentTypesAreRefused() {
        String header = auth(MINE);
        assertThrows(IllegalArgumentException.class, () -> controller.upload(header,
                new UploadRequest("2026-27", "form16", "big.pdf", "application/pdf",
                        new byte[StoredDocument.MAX_BYTES + 1])));
        assertThrows(IllegalArgumentException.class, () -> controller.upload(header,
                new UploadRequest("2026-27", "form16", "run.exe", "application/x-msdownload", PDF)));
        assertThrows(IllegalArgumentException.class, () -> controller.upload(header,
                new UploadRequest("2026-27", "form16", "empty.pdf", "application/pdf", new byte[0])));
    }

    @Test
    void aGarbageDocumentIdIs404Not500() {
        assertEquals(404, controller.fetch(auth(MINE), "not-a-uuid").getStatusCode().value());
    }
}
