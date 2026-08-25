# Linearity — bounded local process experiment

Status: **BOUNDED RUN COMPLETE; NOT A PRODUCTION LINEARITY CLAIM**.

The owned runner measured 1 → 2 → 4 → 8 → 16 independent Spring Boot
processes using the same deterministic synthetic workload. Raw summarized
results are in [linearity-results.json](linearity-results.json). Every point
completed with zero correctness failures.

| Processes | Requests | Logical RPS | p50 | p95 | p99 |
|---:|---:|---:|---:|---:|---:|
| 1 | 16 | 65.37 | 5.24 ms | 206.59 ms | 206.59 ms |
| 2 | 32 | 74.90 | 12.74 ms | 296.97 ms | 326.95 ms |
| 4 | 64 | 146.03 | 14.73 ms | 313.35 ms | 328.35 ms |
| 8 | 128 | 166.84 | 30.79 ms | 534.25 ms | 576.28 ms |
| 16 | 256 | 132.16 | 62.10 ms | 1,415.03 ms | 1,429.67 ms |

The result is not linear: 16 processes performed worse than 8 on this laptop.
That is an observed host-contention signal, not a pod-sizing number. Each
process had its own in-memory idempotency map, so the experiment did not test a
shared database, queue, cache, or cross-process duplicate handling.

Reproduce with:

```powershell
pwsh -File loadtest/run-linearity.ps1 -RequestsPerBackend 16 -ConcurrencyPerBackend 2
```

The required protocol for production-like evidence remains:

1. provision 1, 2, 4, 8, and 16 identical API processes with separate ports;
2. use the same synthetic seed and request count at each point;
3. keep the database, queue, and client concurrency fixed;
4. record completed journeys, correctness failures, p50/p95/p99, and logical RPS;
5. publish the raw JSON and plot only measured points.

Until a shared-dependency experiment exists, this document makes no
horizontal-scaling or production-capacity claim.
