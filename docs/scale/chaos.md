# Chaos and recovery — bounded process-loss preflight

Status: **BOUNDED PROCESS-LOSS PREFLIGHT COMPLETE; DATABASE/QUEUE CHAOS NOT RUN**.

The owned runner started two local Spring Boot processes, killed port 8501
during 1,000 synthetic journeys, then restarted it. The first run recorded
500 successes and 500 `fetch failed` journeys; the surviving process continued
serving its half of the sticky workload. A 100-journey recovery run against the
restarted process completed 100/100 with zero correctness failures. The summary
is in [chaos-results.json](chaos-results.json).

Reproduce with:

```powershell
pwsh -File loadtest/run-chaos.ps1 -Requests 1000 -Concurrency 64
```

This is an honest failure, not a recovery success: the killed process lost its
in-memory receipts and accepted work. Restart accepts new work, but no durable
idempotency or outbox record was recovered.

Database failover, Redis loss, durable queue interruption, and zero-loss
recovery remain untested. No zero-loss claim is made until those observations
exist.
