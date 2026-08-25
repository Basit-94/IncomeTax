# Soak — bounded preflight

Status: **60-SECOND PREFLIGHT COMPLETE; REQUIRED 24-HOUR SOAK NOT RUN**.

The owned short preflight ran one Spring Boot process for 60.09 seconds in
100-request batches at concurrency 16. It completed 317 batches / 31,700
synthetic journeys with 31,700 successes, 0 failed journeys, and 0 correctness
failures. The summary is in [soak-results.json](soak-results.json).

Reproduce with:

```powershell
pwsh -File loadtest/run-soak.ps1 -DurationSeconds 60 -BatchRequests 100 -Concurrency 16
```

This does not establish memory, thread, connection, queue, or multi-process
stability. The required 24-hour run at approximately 70% of the modeled peak
has not been attempted, and no production-soak claim is made.

The future run must retain periodic correctness checks, heap/GC data, open connections, queue depth, error rate, and latency percentiles, with a raw timestamped output retained beside the report.
