# Linearity — not run

Status: **NOT RUN**.

The required 1 → 2 → 4 → 8 → 16 pod experiment has not been measured. The current owned runner starts one Spring Boot jar with in-memory receipts, so a line chart would be fiction. The committed protocol is:

1. provision 1, 2, 4, 8, and 16 identical API processes with separate ports;
2. use the same synthetic seed and request count at each point;
3. keep the database, queue, and client concurrency fixed;
4. record completed journeys, correctness failures, p50/p95/p99, and logical RPS;
5. publish the raw JSON and plot only measured points.

Until that experiment exists, this document makes no horizontal-scaling claim.
