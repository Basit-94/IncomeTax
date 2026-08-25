# Wapsi backend

This is the Spring Boot / Java 21 boundary for the scale workstream. The Next.js app remains the
frontend and local synthetic prototype. No controller here contacts a government system.

## Local prerequisites

- Java 21 or newer
- Maven 3.9 or newer

Run from this directory:

```text
mvn test
mvn spring-boot:run
```

The repository's verification run used Temurin 21.0.12 and an isolated Maven 3.9.11 distribution.
The machine-wide Maven install is not required. From the repository root, the owned synthetic load
harness is `pwsh -File loadtest/run.ps1 -Requests 100 -Concurrency 8`.

`POST /api/v1/returns/submit` is an async, idempotent local boundary. Its in-memory receipt map is
deliberately a test adapter; production needs a durable unique idempotency key and an outbox/queue.
No controller contacts an official portal.

## Money contract

`Money` stores integer paise in a `long`. API boundaries must use `Money`, never a raw numeric
currency value. Conversion from rupees accepts `BigDecimal` and rejects more than two decimal
places. Multiplication rounds to whole paise only when the caller supplies an explicit
`RoundingMode`.
