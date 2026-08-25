package com.wapsi.backend.submission;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = { "${cors.allowed-origins:http://localhost:3000,https://wapsi-amber.vercel.app,https://wapsi-abs21.vercel.app}" })
@RestController
@RequestMapping("/api/v1/returns")
public final class SubmissionController {
    private final SubmissionService service;

    public SubmissionController(SubmissionService service) {
        this.service = service;
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmissionReceipt> submit(@RequestBody SubmissionRequest request) {
        SubmissionReceipt receipt = service.submit(request);
        return ResponseEntity.accepted()
                .location(URI.create("/api/v1/returns/submissions/" + receipt.submissionId()))
                .body(receipt);
    }

    @GetMapping("/submissions/{submissionId}")
    public SubmissionReceipt status(@PathVariable String submissionId) {
        return service.status(submissionId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse("invalid_request", exception.getMessage()));
    }

    public record ErrorResponse(String code, String message) {
    }
}
