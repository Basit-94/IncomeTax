# Load-test report — local owned evidence

Status: bounded local evidence; not the Part D peak benchmark.

The owned runner completed a realistic local journey—submit, duplicate retry, asynchronous status polling, and output correctness assertion—against one Spring Boot jar on the development laptop.

| Run | Requests | Concurrency | Success | Correctness failures | Logical RPS | p50 | p95 | p99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 Aug 2026 smoke | 20 | 4 | 20/20 | 0 | 77.27 | 8.83 ms | 229.21 ms | 229.21 ms |

Additional bounded runs are recorded separately:

- [1/2/4/8/16-process linearity](linearity.md) — all journeys correct, but
  16 processes were slower than 8 on this laptop.
- [2,000-request overload](degradation.md) — 2,000/2,000 successful at
  concurrency 128, 1,033.91 logical RPS, p99 662.01 ms.
- [60-second preflight soak](soak.md) — 31,700/31,700 successful.
- [process-loss chaos preflight](chaos.md) — 500 failures when one in-memory
  process was killed, followed by 100/100 successful new journeys after restart.

## Failure found and fixed

The first Windows runner attempt failed before measurement because `Start-Process` split the Spring Boot jar path at the space in `C:\Coding\Tax Filing\IncomeTax`, producing `Unable to access jarfile C:\Coding\Tax`. The runner now passes the jar path as an explicitly quoted argument. The rerun above passed. This is a harness failure, not a service-capacity failure.

## What this does not show

These runs are not evidence of the modeled deadline peak. They do not test a
shared Postgres/Redis/PgBouncer deployment, durable queue backpressure, durable
failure recovery, or a 24-hour soak. No production or national-capacity claim
is made.
