# Reproduce the local scale harness

This repository only measures the local Spring Boot service built from this tree. It never sends load to the official portal or another external system.

## Environment used for the smoke run

- Windows 11 Home Single Language, build `10.0.26200`
- HP OMEN by HP Gaming Laptop 16-xd0xxx, 16 logical processors, 16,415,322,112 bytes RAM
- Node `v24.12.0`
- Temurin Java `21.0.12.1`
- Apache Maven `3.9.11` in `%TEMP%\wapsi-maven\apache-maven-3.9.11`
- Spring Boot `3.5.4`

The Maven and JDK paths are task-local in this workspace. Change the two paths in
`loadtest/run.ps1` for another machine; the harness does not require a machine-wide install.

## One-command run

From the repository root:

```powershell
pwsh -File loadtest/run.ps1 -Requests 100 -Concurrency 8
```

The runner packages the backend, starts the generated jar on `127.0.0.1:8080`, runs deterministic synthetic journeys, prints JSON, and stops that exact local process. Each journey performs:

1. `POST /api/v1/returns/submit`;
2. a duplicate POST every tenth journey using the same idempotency key;
3. status polling until asynchronous processing completes;
4. correctness assertions for one receipt, `completed` status, and a tax output.

The request generator uses only structurally fake `DEMP-...` citizen references and fixed synthetic facts. It does not read credentials, PANs, bank data, or external URLs.

## Bounded evidence runs

```powershell
pwsh -File loadtest/run-linearity.ps1 -RequestsPerBackend 16 -ConcurrencyPerBackend 2
pwsh -File loadtest/run-degradation.ps1 -Requests 2000 -Concurrency 128
pwsh -File loadtest/run-soak.ps1 -DurationSeconds 60 -BatchRequests 100 -Concurrency 16
pwsh -File loadtest/run-chaos.ps1 -Requests 1000 -Concurrency 64
```

The linearity run starts 1, 2, 4, 8, and 16 independent local processes. The
degradation run is a bounded one-process overload. The soak is a 60-second
preflight, not the required 24-hour run. The chaos run kills one process during
synthetic traffic and records the expected in-memory receipt loss before a
restart recovery check. Results are summarized under `docs/scale/*-results.json`.

## Recorded smoke run

Command: `pwsh -File loadtest/run.ps1 -Requests 20 -Concurrency 4`

Result: 20/20 journeys succeeded, 0 failed, 2 duplicate checks matched, 0 correctness failures, logical RPS `77.27`, p50 `8.83 ms`, p95/p99 `229.21 ms`.

This is a local smoke result, not a capacity benchmark. It uses one laptop, one JVM, in-memory receipt state, and no database/Redis/PgBouncer. It must not be extrapolated to national scale.
