# Graceful degradation — not run

Status: **NOT RUN**.

No overload experiment has yet been run against the owned service. The required test will push a bounded synthetic workload above the service's measured acceptance point and record queue depth, accepted submissions, duplicate-key behavior, completed/failed jobs, and p99 latency over time.

The pass condition is not “the server stays fast”: submissions remain accepted and idempotent, no synthetic filing disappears, and the queue/backpressure state is visible. A failure must include the load level, first symptom, and fix. The current in-memory adapter is not sufficient evidence for production backpressure.
