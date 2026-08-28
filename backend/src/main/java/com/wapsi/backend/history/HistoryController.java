package com.wapsi.backend.history;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wapsi.backend.auth.SessionService;
import com.wapsi.backend.submission.SubmissionReceipt;
import com.wapsi.backend.submission.SubmissionService;

/**
 * A signed-in taxpayer's past filings.
 *
 * <p><strong>There is no {@code pan} parameter, and there must never be one.</strong> The identity
 * comes from the session token and nowhere else. An endpoint shaped as {@code /history?pan=…} is
 * one missing check away from letting anyone read anyone's return, and no amount of validation
 * elsewhere repairs that shape. If a future change needs "look up another person's filings", it
 * needs a different endpoint with its own authorisation, not a parameter added here.
 */
@CrossOrigin(origins = { "${cors.allowed-origins:http://localhost:3000}" })
@RestController
@RequestMapping("/api/v1/history")
public final class HistoryController {

    /** One past filing, as shown to the person who filed it. */
    public record Filing(String submissionId, String status, String ruleSetVersion,
                         Long totalTaxPaise, String message) {
        static Filing of(SubmissionReceipt receipt) {
            return new Filing(receipt.submissionId(), receipt.status(), receipt.ruleSetVersion(),
                    receipt.totalTaxPaise(), receipt.message());
        }
    }

    private final SessionService sessions;
    private final SubmissionService submissions;
    private final CarryForwardService carryForward;
    private final Clock clock;

    /** The container uses this one; the Clock overload exists for tests. */
    @Autowired
    public HistoryController(SessionService sessions, SubmissionService submissions,
                             CarryForwardService carryForward) {
        this(sessions, submissions, carryForward, Clock.systemUTC());
    }

    /**
     * Time is injected rather than read from {@code Instant.now()} inline: expiry is the whole
     * point of a session, and code that reaches for the wall clock cannot be tested at any moment
     * other than the present one.
     */
    public HistoryController(SessionService sessions, SubmissionService submissions,
                             CarryForwardService carryForward, Clock clock) {
        this.sessions = sessions;
        this.submissions = submissions;
        this.carryForward = carryForward;
        this.clock = clock;
    }

    @GetMapping
    public ResponseEntity<List<Filing>> myFilings(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<String> pan = sessions.authenticate(bearerToken(authorization), Instant.now(clock));
        if (pan.isEmpty()) {
            // 401 with no body: an unauthenticated caller learns nothing, not even whether the
            // PAN they were curious about exists.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(submissions.history(pan.get()).stream().map(Filing::of).toList());
    }

    /**
     * A draft for the new year, proposed from {@code fromYear}'s filed facts. Every fact comes
     * back unconfirmed — carrying forward suggests, the user confirms. 204 when there is nothing
     * to carry: a first-time filer is not an error.
     */
    @GetMapping("/carry-forward")
    public ResponseEntity<CarryForwardService.Draft> carryForward(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam String fromYear) {
        Optional<String> pan = sessions.authenticate(bearerToken(authorization), Instant.now(clock));
        if (pan.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return carryForward.draftFrom(pan.get(), fromYear)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    static String bearerToken(String authorization) {
        if (authorization == null) {
            return null;
        }
        String prefix = "Bearer ";
        return authorization.startsWith(prefix) ? authorization.substring(prefix.length()).trim() : null;
    }
}
