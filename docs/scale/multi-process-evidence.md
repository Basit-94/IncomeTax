# Multi-process evidence — T1.6 + T8.1/T8.3 (2026-08-29)

Everything below is an **observed output**, not a projection. Reproduce with the
commands in §4.

## 1. Setup (honest description)

- One Windows laptop, 1 physical processor package, 15,655 MB RAM (both figures from
  `systeminfo`), also running the Next.js dev server and a browser.
- One shared PostgreSQL (zonky embedded, port 55432) — real Postgres binaries, not H2.
- **Two separate backend JVM processes** (`java -cp …WapsiApplication`, ports 8081/8082),
  each with the unpooled `PGSimpleDataSource` (HikariCP absent from the local repository;
  no Maven on this machine to fetch it).
- No load balancer: the driver (`loadtest/run.mjs --base-urls`) round-robins per journey.
  A journey = POST submit → (every 10th: duplicate POST, receipt must match) → poll status
  to `completed`.

## 2. What the two-process setup proved (Phase 1 acceptance, observed)

| Claim | Observation |
|---|---|
| Duplicate across instances → one receipt | Same payload POSTed to 8081 then 8082 → both returned `submissionId 0d2baf67-f380-37ee-bde6-4568999543db`; status `completed` readable from **both** nodes with `totalTaxPaise 18616000` — hand-checked engine-exact (salary 18,60,000 + s.111A gain 1,10,000 → ₹1,86,160), which also proves the asset-class metadata survives the HTTP path into the Java engine. |
| A killed process loses no receipt | `xproc-kill-001` submitted on 8081; 8081 killed (`Stop-Process`); 8082 then served the receipt: `completed`, `totalTaxPaise 0` (salary 7,50,000 → fully rebated, correct). |
| Concurrent first boot is safe | Previously: two JVMs booting together raced `SchemaMigrator` and one **died at startup** (observed). Fixed with a Postgres advisory lock (`pg_advisory_lock`), re-reading applied versions after acquiring it. After the fix both nodes started simultaneously (`Started WapsiApplication` in both logs); regression-tested by `SchemaMigratorTest.concurrentMigratorsBothSucceedAndApplyEachVersionOnce` (suite 103/103). |
| `-parameters` is load-bearing | Status endpoint returned 400 ("parameter name information not available") when compiled without `javac -parameters`; the harness compile command now includes it (PLAN §2). |

## 3. Measured load (T8.3 — publish honest figures)

`node loadtest/run.mjs --base-urls http://127.0.0.1:8081,http://127.0.0.1:8082 --requests 600 --concurrency 24`

```
successfulJourneys 600 / 600      correctnessFailures 0   duplicateChecks 60 (all matched)
logicalRps 18.43 journeys/s       p50 1260 ms   p95 1722 ms   p99 1943 ms
durationMs 32563
```

**What this does and does not support.**
- It supports: correctness under concurrency across processes — zero duplicate receipts,
  zero failures, at 24 concurrent full journeys.
- It does **not** support any claim near the §5.3 target (50,000 submissions/min ≈ 833/s).
  Observed throughput is ~**2.2%** of that target, on hardware and a configuration nothing
  like production. The dominant known costs: a connection per SQL statement (unpooled
  DataSource), one laptop hosting everything, and the journey's completion-polling.
- No extrapolation is offered. The path to a publishable number is (in order): pooled
  connections (T8.2 blocker), a real load generator on separate hardware, a real LB,
  then re-measure.

## 4. Reproduce

```
# scratchpad = the session scratchpad holding cp.txt / cp-app.txt (see PLAN §2)
javac -nowarn -parameters -cp "$CP" -d target/classes-new $(find src/main/java -name "*.java")
java -cp "<scratchpad>/scale;$CP" PgHold                      # embedded PG on :55432
java -cp "target/classes-new;src/main/resources;$CP_APP" com.wapsi.backend.WapsiApplication \
     --server.port=8081 --wapsi.datasource.url="jdbc:postgresql://localhost:55432/postgres?user=postgres"
# (same for 8082; cp-app.txt = cp.txt minus slf4j-api-1.7.36 and commons-logging,
#  which break Spring Boot's Logback init when first on the classpath)
node loadtest/run.mjs --base-urls http://127.0.0.1:8081,http://127.0.0.1:8082 --requests 600 --concurrency 24
```

## 5. B8 questions, settled (T8.1)

1. **Connection pooling** — precondition for any published figure. BLOCKED on a pooling
   dependency reaching `~/.m2` (T8.2). `PersistenceConfig` already defers to any externally
   supplied pooled `DataSource` bean.
2. **SLOs (chosen, to be measured against):** submission-accepted p99 < 500 ms and
   interactive read p99 < 200 ms at the §5.3 peak (833/s sustained), error rate < 0.1%.
   Today's p99 (1943 ms at 18 j/s, unpooled, one laptop) is reported above and does not meet
   them; that is the honest baseline.
3. **Rule-set caching** — rule sets are immutable per assessment year and re-read from the
   classpath per submission; an in-memory cache keyed by version is safe and should land
   with the pooling change so the two are measured together.
4. **CORS origins** — hardcoded annotation defaults must move to configuration per
   environment before any deployment claim.
