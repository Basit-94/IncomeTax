package com.wapsi.backend.preference;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wapsi.backend.auth.SessionService;

/**
 * The signed-in user's mode. Identity comes from the session token only —
 * same shape as {@code HistoryController}, and for the same reason: an
 * endpoint keyed on a client-supplied PAN is one missing check away from
 * letting anyone flip anyone's account.
 */
@CrossOrigin(origins = { "${cors.allowed-origins:http://localhost:3000}" })
@RestController
@RequestMapping("/api/v1/preferences")
public final class PreferenceController {

    private static final Set<String> MODES = Set.of("simple", "full");

    public record Preferences(String mode) {
    }

    private final SessionService sessions;
    private final PreferenceStore store;
    private final Clock clock;

    /** The container uses this one; the Clock overload exists for tests. */
    @Autowired
    public PreferenceController(SessionService sessions, PreferenceStore store) {
        this(sessions, store, Clock.systemUTC());
    }

    public PreferenceController(SessionService sessions, PreferenceStore store, Clock clock) {
        this.sessions = sessions;
        this.store = store;
        this.clock = clock;
    }

    /** 200 with the stored mode; "simple" when the user has never chosen. */
    @GetMapping
    public ResponseEntity<Preferences> mine(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<String> pan = authenticate(authorization);
        if (pan.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new Preferences(store.mode(pan.get()).orElse("simple")));
    }

    @PutMapping
    public ResponseEntity<Preferences> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Preferences body) {
        Optional<String> pan = authenticate(authorization);
        if (pan.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (body == null || body.mode() == null || !MODES.contains(body.mode())) {
            return ResponseEntity.badRequest().build();
        }
        store.setMode(pan.get(), body.mode(), Instant.now(clock));
        return ResponseEntity.ok(new Preferences(body.mode()));
    }

    private Optional<String> authenticate(String authorization) {
        String token = null;
        if (authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring("Bearer ".length()).trim();
        }
        return sessions.authenticate(token, Instant.now(clock));
    }
}
