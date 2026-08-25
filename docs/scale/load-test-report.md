# Load-test report — local smoke only

Status: preliminary harness validation, not the Part D peak benchmark.

The owned runner completed a realistic local journey—submit, duplicate retry, asynchronous status polling, and output correctness assertion—against one Spring Boot jar on the development laptop.

| Run | Requests | Concurrency | Success | Correctness failures | Logical RPS | p50 | p95 | p99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 Aug 2026 smoke | 20 | 4 | 20/20 | 0 | 77.27 | 8.83 ms | 229.21 ms | 229.21 ms |

## Failure found and fixed

The first Windows runner attempt failed before measurement because `Start-Process` split the Spring Boot jar path at the space in `C:\Coding\Tax Filing\IncomeTax`, producing `Unable to access jarfile C:\Coding\Tax`. The runner now passes the jar path as an explicitly quoted argument. The rerun above passed. This is a harness failure, not a service-capacity failure.

## What this does not show

This run is not evidence of the modeled deadline peak. It does not test multiple pods, Postgres, Redis, PgBouncer, queue backpressure, failure recovery, or a 24-hour soak. The remaining Part D artifacts are intentionally not marked complete until those owned experiments exist.
