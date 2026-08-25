# Graceful degradation — bounded overload experiment

Status: **BOUNDED RUN COMPLETE; SHARED QUEUE/BACKPRESSURE NOT TESTED**.

The owned one-process service completed a bounded overload run of 2,000
synthetic journeys at concurrency 128:

| Requests | Concurrency | Success | Correctness failures | Logical RPS | p50 | p95 | p99 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 2,000 | 128 | 2,000/2,000 | 0 | 1,033.91 | 79.16 ms | 584.65 ms | 662.01 ms |

The service accepted and completed every bounded journey, including 200
idempotency retries. No queue-depth or backpressure metric exists in this
in-memory boundary, so this is a correctness/latency observation rather than
evidence that the modeled peak is safe.

Reproduce with:

```powershell
pwsh -File loadtest/run-degradation.ps1 -Requests 2000 -Concurrency 128
```

The pass condition is not “the server stays fast”: submissions remain accepted and idempotent, no synthetic filing disappears, and the queue/backpressure state is visible. A failure must include the load level, first symptom, and fix. The current in-memory adapter is not sufficient evidence for production backpressure.
