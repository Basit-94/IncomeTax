package com.wapsi.backend.preference;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.wapsi.backend.auth.SessionService;
import com.wapsi.backend.auth.SessionStore;

/** T5.1: the mode is a server-side setting, readable and writable only with a live session. */
class PreferenceControllerTest {
    private static final Instant T0 = Instant.parse("2026-08-28T10:00:00Z");

    private final SessionService sessions = new SessionService(new SessionStore.InMemory());
    private final PreferenceStore store = new PreferenceStore.InMemory();
    private final PreferenceController controller =
            new PreferenceController(sessions, store, Clock.fixed(T0, ZoneOffset.UTC));

    private String signIn(String pan) {
        return "Bearer " + sessions.issue(pan, T0);
    }

    @Test
    void withoutASessionBothEndpointsReturn401WithNoBody() {
        assertEquals(401, controller.mine(null).getStatusCode().value());
        assertEquals(401, controller.update("Bearer garbage",
                new PreferenceController.Preferences("full")).getStatusCode().value());
    }

    @Test
    void aUserWhoNeverChoseGetsSimple() {
        var response = controller.mine(signIn("DEMPS4417K"));
        assertEquals(200, response.getStatusCode().value());
        assertEquals("simple", response.getBody().mode());
    }

    @Test
    void aChosenModeIsStoredAndReadBack() {
        String auth = signIn("DEMPK8823R");
        controller.update(auth, new PreferenceController.Preferences("full"));
        assertEquals("full", controller.mine(auth).getBody().mode());
    }

    @Test
    void anUnknownModeIsRejectedWithoutWriting() {
        String auth = signIn("DEMPS9052M");
        assertEquals(400, controller.update(auth,
                new PreferenceController.Preferences("compact")).getStatusCode().value());
        assertEquals("simple", controller.mine(auth).getBody().mode());
    }

    @Test
    void oneUsersChoiceDoesNotLeakToAnother() {
        controller.update(signIn("DEMPK8823R"), new PreferenceController.Preferences("full"));
        assertEquals("simple", controller.mine(signIn("DEMPS4417K")).getBody().mode());
    }
}
