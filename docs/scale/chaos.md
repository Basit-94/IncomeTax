# Chaos and recovery — not run

Status: **NOT RUN**.

Pod termination, database failover, and Redis loss have not been tested. The current smoke harness has one local JVM, no Postgres, no Redis, and no multi-pod deployment to fail.

The planned owned experiment will kill one API process during synthetic submissions, interrupt the durable queue/database dependency in a controlled environment, and verify that idempotency records and accepted work survive or enter an explicit recoverable state. No zero-loss claim is made until those observations exist.
