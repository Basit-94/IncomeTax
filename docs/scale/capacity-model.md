# Wapsi capacity model

Status: design target, not a benchmark. Prepared 25 August 2026.

This model uses published filing counts to choose a workload for systems we own. It does not
measure, scrape, or load-test the Income Tax Department. The department's figures below describe
its reported filing volume, not an SLA or a promise about its technical performance.

## Inputs and sources

| Input | Value | Provenance |
|---|---:|---|
| Returns filed by 31 July 2024 for AY 2024-25 | 72,880,318 | [PIB release, 2 August 2024](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2040669&lang=2&reg=48) |
| Returns filed on 31 July 2024 | 6,992,000+ | Same PIB release |
| Highest filing hour, 19:00 to 20:00 on 31 July 2024 | 507,000+ filings/hour | Same PIB release |
| Highest filing minute | 9,367 filings/minute | Same PIB release |
| Highest filing second | 917 filings/second | Same PIB release |
| ITRs filed in FY 2024-25, including updated returns | about 91,900,000 | [PIB backgrounder, July 2025](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/jul/doc2025724591301.pdf) |

The first five rows are the workload anchor because they describe one ordinary salaried-filer
deadline day. The FY 2024-25 figure includes updated returns and is therefore a useful growth
context, but is not mixed into the deadline-day arithmetic.

## Derivation

The arithmetic is intentionally visible:

1. **Annual deadline workload:** 72,880,318 returns by the cited due date.
2. **Final-week share:** **ASSUMPTION: 45%**. The cited release gives the due-day total but does
   not publish a final-week denominator. This assumption is used only to make the missing shape
   explicit; the design target below is anchored directly to the observed due day.
3. **Final-day share of annual returns:** 6,992,000 / 72,880,318 = **9.60%**. If the 45% final-week
   assumption is used, the final day is 9.60% / 45% = **21.3% of that week**. This implied
   week-share is not treated as a government statistic.
4. **Peak-hour share of the final day:** 507,000 / 6,992,000 = **7.25%**.
5. **Sustained submission rate during the peak hour:** 507,000 / 3,600 = **140.83
   submissions/second**.
6. **Observed short burst:** 917 submissions/second, or 6.51 times the peak-hour sustained
   rate. The 9,367-per-minute figure is 156.12 submissions/second and is consistent with a short
   burst below the published one-second maximum.
7. **Design burst factor:** **ASSUMPTION: 2.0x over the published one-second maximum**. This is
   deliberate headroom for clock alignment, future growth, and measurement granularity. The
   resulting Wapsi design target is **1,834 submissions/second** (917 x 2), not a claim about the
   official portal.
8. **Read:write ratio:** **ASSUMPTION: 30:1**. A read includes draft loads, rule-set reads,
   recomputes, and page views; a write includes a submission or durable draft save. The ratio is
   a planning input to be replaced by trace data in Part D. At 30 reads per write, 1,834 writes/s
   implies **55,020 total requests/second** (1,834 x 31).

### Sensitivity

| Scenario | Submission target | Read:write assumption | Total request target |
|---|---:|---:|---:|
| Lower, no extra burst headroom | 917/s | 20:1 | 19,257/s |
| Design target | 1,834/s | 30:1 | 55,020/s |
| Higher read pressure | 1,834/s | 50:1 | 93,534/s |

The final-week percentage and read:write ratio are assumptions, not facts. Changing either does
not alter the observed 917/s source anchor; it changes only how much Wapsi capacity we provision
around it.

## SLOs for Wapsi-owned deployments

These are engineering targets we choose to test, not results:

- Interactive reads: p99 under 500 ms at the 55,020 total-request/s design target.
- Submission acceptance: p99 under 1 second to durably record an idempotent request and return a
  tracking ID. Full tax processing is asynchronous and is not part of this acceptance latency.
- Accepted filing loss: zero. A request that receives an acceptance ID must be recoverable from
  the ledger and queue after worker or pod failure.
- Application errors: under 0.1% at sustained design load, excluding deliberately injected chaos.
- Backpressure: queue depth may rise under overload, but accepted submissions remain durable and
  visible to the citizen with a tracking state.

## Failure modes to test deliberately

1. Postgres connection exhaustion as pod count rises; validate PgBouncer behavior and pool limits.
2. Queue backpressure when workers are slower than accepted submissions; prove durable enqueue and
   no dropped acceptance IDs.
3. Cold-start rule-set cache stampede; allow one loader and serve cached immutable versions.
4. Hot assessment-year partitions and index pressure; measure year-partitioned ledger behavior.
5. Redis loss; reads may degrade to Postgres, but submission idempotency and ledger writes cannot
   depend on Redis being available.
6. Pod termination during submission acceptance; replay the idempotency key and prove one filing.

## What this model does not claim

There is no unsourced claim here about the official portal's throughput, failure rate, capacity,
or reliability. The PIB release says the portal handled the cited activity; it does not establish
an independently audited SLO. Wapsi's numbers above are a reproducible workload target for a
system we own. They must be measured by the Part D harness before any capacity claim is made.
