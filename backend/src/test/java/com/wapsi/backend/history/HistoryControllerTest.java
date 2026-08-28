package com.wapsi.backend.history;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.auth.SessionService;
import com.wapsi.backend.auth.SessionStore;
import com.wapsi.backend.engine.TaxEngine;
import com.wapsi.backend.ledger.InMemoryFactLedger;
import com.wapsi.backend.rules.RuleSetLoader;
import com.wapsi.backend.submission.InMemorySubmissionStore;
import com.wapsi.backend.submission.SubmissionOwner;
import com.wapsi.backend.submission.SubmissionReceipt;
import com.wapsi.backend.submission.SubmissionService;
import com.wapsi.backend.submission.SubmissionStore;

/**
 * The property this test exists for: a caller sees their own filings and nobody else's, and the
 * identity comes from the session rather than from anything the caller can type.
 */
class HistoryControllerTest {
    private static final String MINE = "ABCDE1234F";
    private static final String THEIRS = "ZZZZZ9999Z";
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    private final SubmissionStore submissionStore = new InMemorySubmissionStore();
    private final SessionStore sessionStore = new SessionStore.InMemory();
    private final SessionService sessions = new SessionService(sessionStore, Duration.ofHours(12));
    private final SubmissionService submissions = new SubmissionService(
            new RuleSetLoader(new ObjectMapper().findAndRegisterModules()),
            new TaxEngine(), submissionStore, new InMemoryFactLedger());
    private final HistoryController controller = new HistoryController(sessions, submissions,
            new CarryForwardService(submissionStore, new InMemoryFactLedger()),
            Clock.fixed(T0, ZoneOffset.UTC));

    private void seed() {
        submissionStore.insertIfAbsent("k1",
                new SubmissionReceipt("11111111-1111-1111-1111-111111111111", "completed",
                        "2026-27-new", 9_152_000L, "processed"),
                new SubmissionOwner(MINE, "2026-27"));
        submissionStore.insertIfAbsent("k2",
                new SubmissionReceipt("22222222-2222-2222-2222-222222222222", "completed",
                        "2025-26-new", 8_000_000L, "processed"),
                new SubmissionOwner(THEIRS, "2026-27"));
    }

    @Test
    void aValidTokenReturnsOnlyThatPersonsFilings() {
        seed();
        var response = controller.myFilings("Bearer " + sessions.issue(MINE, T0));
        assertEquals(200, response.getStatusCode().value());
        List<HistoryController.Filing> filings = response.getBody();
        assertEquals(1, filings.size());
        assertEquals("11111111-1111-1111-1111-111111111111", filings.get(0).submissionId());
    }

    @Test
    void oneAccountsTokenNeverReturnsAnothersFilings() {
        seed();
        var response = controller.myFilings("Bearer " + sessions.issue(THEIRS, T0));
        assertEquals(1, response.getBody().size());
        assertEquals("22222222-2222-2222-2222-222222222222",
                response.getBody().get(0).submissionId());
    }

    @Test
    void noTokenIsUnauthorisedWithNoBody() {
        seed();
        for (String header : Arrays.asList(null, "", "Bearer ", "Basic abc", "not-a-token",
                "Bearer wrong-token")) {
            var response = controller.myFilings(header);
            assertEquals(401, response.getStatusCode().value(), "header: " + header);
            // No body: an unauthenticated caller learns nothing at all.
            assertNull(response.getBody(), "header: " + header);
        }
    }

    @Test
    void aRevokedOrExpiredTokenIsUnauthorised() {
        seed();
        String token = sessions.issue(MINE, T0);
        sessions.revoke(token, T0);
        assertEquals(401, controller.myFilings("Bearer " + token).getStatusCode().value());
    }

    @Test
    void theEndpointExposesNoWayToNameSomeoneElse() {
        // Structural, on purpose. The identity must come from the session, so the handler takes
        // exactly one argument — the Authorization header. A pan parameter added later would be
        // one missing check away from letting anyone read anyone's return, and this fails first.
        var handlers = Arrays.stream(HistoryController.class.getDeclaredMethods())
                .filter(m -> m.getName().equals("myFilings"))
                .toList();
        assertEquals(1, handlers.size());
        assertEquals(1, handlers.get(0).getParameterCount(),
                "the only input is the Authorization header");
        assertTrue(Arrays.stream(HistoryController.class.getDeclaredMethods())
                .noneMatch(m -> Arrays.stream(m.getParameters())
                        .anyMatch(p -> p.getName().toLowerCase().contains("pan"))),
                "no handler may take a pan");
    }

    @Test
    void bearerParsingIgnoresAnythingThatIsNotABearerToken() {
        assertNull(HistoryController.bearerToken(null));
        assertNull(HistoryController.bearerToken("Basic dXNlcjpwYXNz"));
        assertEquals("abc", HistoryController.bearerToken("Bearer abc"));
    }
}
