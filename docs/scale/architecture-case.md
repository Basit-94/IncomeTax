# Wapsi architecture case — evidence-led draft

## 1. The problem, in citizens' words

The reference material describes filing as a high-stakes experience in which people encounter confusing information, deadline pressure, and uncertainty about whether a submission or refund has progressed. Those are user-experience observations, not measurements of the official portal's throughput. This case does not convert them into technical claims.

## 2. What we built

- **Fact ledger:** source facts, confirmations, corrections, reasons, and undo are modeled as append-only events, so a return projection can be rebuilt and a money figure can retain its provenance.
- **Rules as data:** versioned rule resources carry assessment year, regime, effective window, slab rows, rounding policy, and citations. Unverified rows remain `TODO(verify)`.
- **Exact money:** the Java boundary stores integer paise and requires explicit rounding; the TypeScript prototype's whole-rupee behavior is captured in conformance vectors.
- **Async/idempotent submission:** the local API accepts a request, returns a tracking ID, and handles retries by idempotency key. Its in-memory map is a test adapter, not production persistence.
- **Next.js frontend:** the eight-screen, provenance-first flow remains the citizen-facing differentiator; the backend is additive rather than a rewrite of the UI.

## 3. What we measured

- [capacity model](capacity-model.md): source-backed workload target with labeled assumptions.
- [load-test report](load-test-report.md): one local smoke run and the harness failure/fix.
- [linearity](linearity.md): required multi-process experiment not run.
- [capacity plan](capacity-plan.md): no unmeasured pod count published.
- [degradation](degradation.md): overload experiment not run.
- [chaos](chaos.md): dependency/process-failure experiment not run.
- [soak](soak.md): 24-hour experiment not run.
- [reproduce](reproduce.md): exact local runner, seed behavior, environment, and command.

The strongest measured statement today is narrow: one local Spring Boot process completed 20 synthetic submit/retry/status journeys at 77.27 logical RPS with p99 229.21 ms and zero correctness failures. It is not a national-capacity result.

## 4. What we did not test, and cannot claim

We did not test against government infrastructure, real filings, real credentials, or real citizen data. We did not observe department traffic. The workload shape is modeled from published statistics and assumptions, not private production traces. We cannot claim that the official portal fails at any particular RPS, that Wapsi handles the modeled peak, that a pod count is sufficient, or that zero filings are lost under database/queue failure.

## 5. What would transfer

The smallest portable changes are idempotent asynchronous submission, rules-as-data with immutable versions, and an append-only audit ledger. They can be introduced behind an existing API boundary. Read replicas, immutable rule caching, PgBouncer, queue backpressure, and stateless pods are deployment choices that require a real persistence/queue environment and measured failure behavior. Replacing an existing filing system would require a separate security, legal, integration, accessibility, and migration program.

## 6. Open questions and limitations

- Primary-source verification of every tax rule row remains open.
- PostgreSQL/Redis/PgBouncer and durable outbox integration are not in this local prototype.
- The conformance suite proves parity with the current prototype, not legal correctness.
- The six long-running/scale experiments are documented but not yet run.
- The first-round critics are not satisfied; source/calculation trails, acronym teaching, verification-status disclosure, and residual translations remain product work.

This is an engineering design with bounded evidence, not a superiority claim.
