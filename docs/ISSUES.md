# Wapsi — Open Issues (Backend + UX)

Audit date: 2026-08-25. Verified by reading source, not by self-report.

Legend — **S1** blocks the scalability claim · **S2** correctness/trust defect ·
**S3** quality/craft · **S4** nice to have.

---

## Part A — Backend

### What is correct and should not be changed

Recording this first so a later refactor does not destroy it.

- **`money/Money.java` is exemplary.** Integer paise; `Math.addExact` / `subtractExact` so
  overflow throws rather than wrapping; `RoundingMode.UNNECESSARY` when constructing from
  `BigDecimal` so a fractional paisa fails loudly; `multiply()` requires an explicit
  `RoundingMode`. Stricter than most production financial code. **Do not "simplify" this file.**
- **`db/migration/V1__fact_ledger.sql` is a correct append-only design.** `supersedes_fact_id` +
  `correction_reason`, `PARTITION BY LIST (assessment_year)`, indexes on
  `(return_id, reported_at)` and on `supersedes_fact_id`.
- **The projection query is right.** `NOT EXISTS (SELECT 1 FROM fact_event successor WHERE
  successor.supersedes_fact_id = event.id)` is the correct way to derive current state from the log.
- **Golden-vector parity is done properly.** 72 vectors, 11 fields compared to the paise
  including slab breakdown. This is the right way to port an engine across languages.
- **Async submission semantics are correct.** `202 Accepted` with a `Location` header.
- **Virtual threads** (`newVirtualThreadPerTaskExecutor`) are the right choice for I/O-bound work.
- **`SubmissionService` documents its own limitation honestly** in the class comment.

---

### B1 · Idempotency is in-process only — breaks under horizontal scaling · **S1**

**Where:** `submission/SubmissionService.java` — `private final Map<String, SubmissionReceipt>
receiptsByKey = new ConcurrentHashMap<>();`

**Problem:** Two instances hold two independent maps. The same idempotency key submitted to
different pods produces two submissions. Horizontal scaling *is* the entire scalability claim,
and this guarantee fails under exactly that condition. It also does not survive a restart.

The class comment already concedes this ("production uses a durable unique idempotency key and
an outbox/queue, not process memory"). The documentation is honest; the load tests are not
measuring what they appear to.

**Fix:** Move to Postgres. `UNIQUE (idempotency_key)` with insert-or-return semantics, so
uniqueness is enforced by the database rather than by process memory.

**Done when:** the linearity load test runs across ≥4 instances behind a load balancer and
produces zero duplicate submissions.

---

### B2 · The client generates a new idempotency key on every click · **S1**

**Where:** `app/page.tsx` ≈ line 910 —
`` const idempotencyKey = `idemp-${persona.id}-${Date.now()}`; ``

**Problem:** `Date.now()` makes the key unique per click, so a double-tap produces two different
keys and therefore two submissions. This defeats the mechanism entirely at the client, and it
would defeat B1's fix too. Deadline-night double-submits are certain.

**Fix:** Generate the key **once per filing attempt**, persist it with the draft, and reuse it on
every retry. It must only change when the user starts a genuinely new submission.

**Done when:** clicking File ten times rapidly yields exactly one submission.

---

### B3 · The fact ledger is not wired into the submission path · **S2**

**Where:** `submission/` package. `grep -rn "FactLedger" backend/.../submission/` returns nothing.

**Problem:** `SubmissionService` computes tax and writes a receipt to an in-memory map. It never
appends a fact event. The append-only ledger — the audit trail, the CA's verification story, and
the product's entire "everything is a fact awaiting confirmation" primitive — is built, tested,
and bypassed by the only write path in the system.

**Fix:** `SubmissionService` appends fact events for every fact and claim in the request, inside
the same transaction as the idempotency insert. The receipt becomes a projection over the ledger.

**Done when:** a submitted return can be fully reconstructed from `fact_event` alone, and a
correction appears as a new superseding row rather than an update.

---

### B4 · Submission failures are invisible to the user · **S2**

**Where:** `app/page.tsx` ≈ lines 935–941. The fetch `.catch()` logs to console, then
`triggerTimelineProgress("filed_unverified")` runs regardless of outcome.

**Problem:** If the backend is unreachable, the UI still tells the user their return was filed.
This is a silent failure at the single highest-stakes moment in the product.

**Fix:** Await the response. On failure, keep the draft, show an honest error stating what
happened and what to do next, and offer retry using the *same* idempotency key (see B2). Only
advance the timeline on a confirmed `202`.

**Done when:** stopping the backend and pressing File produces a visible, recoverable error and
no timeline progression.

---

### B5 · Receipts are memory-only, unbounded, and O(n) to read · **S2**

**Where:** `SubmissionService.receiptsByKey` and `status()`.

**Problems:** (a) nothing survives restart, so `GET /submissions/{id}` loses all history;
(b) `status()` linearly scans every receipt; (c) the map has no eviction — a slow memory leak
under sustained load, which the soak test should eventually surface.

**Fix:** Persist receipts alongside the ledger; look up by primary key.

---

### B6 · Load tests measure a single process · **S1**

**Where:** `loadtest/run.mjs`.

**What is good:** it verifies idempotency (`"idempotency retry returned a different receipt"`)
and reports p95/p99 — well built.

**Problem:** it runs against one node, where the in-memory map behaves correctly. The linearity
result is therefore not evidence of horizontal scalability; with B1 unfixed it would either pass
while permitting duplicate filings, or fail for reasons the harness is not looking for.

**Fix:** after B1, re-run across ≥4 instances behind a load balancer and assert zero duplicates
as a pass condition, not just latency.

**Publishing rule:** until then, describe results as **single-node** throughput. Do not present
them as national-scale capacity.

---

### B7 · Rule-set coverage is a single assessment year · **S3**

`V1__fact_ledger.sql` creates one partition (`fact_event_2026_27`) and `SubmissionService.validate`
rejects any year but `2026-27`. Correct for a fixture, but partition creation must become part of
the yearly rollover before a second year exists.

---

### B8 · Open questions to resolve before publishing any benchmark · **S3**

- No connection pooler (PgBouncer) — at high pod counts Postgres connection limits bite before CPU.
- No stated SLOs. Pick them (p99 interactive read, p99 submission-accepted, error rate) and be
  measured against them.
- No cache on rule sets, which are immutable per assessment year and ideal for indefinite caching.
- CORS origins are hardcoded in the annotation default; move to configuration per environment.

---

## Part B — UX

### The central finding

**The code is better than the interface.** `check-screen.tsx` has expandable rows, source facts
and plain-language explanations — the thinking is sound. But `app/globals.css` is teal `#0f766e`
on blue-grey `#f3f7f8` with uniform 16px radii: the default palette of every gov-tech product
built since 2020. It is competent and completely anonymous, and it is unchanged from before the
refactor.

### U1 · No middle of the type scale · **S3**
`--text-hero: 3.8rem` with body at 17px and little between. Hierarchy is the cheapest way to make
a dense financial screen readable; define a real scale (e.g. 12 / 14 / 17 / 21 / 28 / 40 / 60).

### U2 · One radius for everything · **S3**
`--card-radius: 16px` everywhere flattens importance. A destructive confirmation and a hint should
not share a shape.

### U3 · Provenance is present in data, nearly absent in UI · **S2**
It is the product's entire differentiator and currently reads as a caption. It should be the most
visible attribute of every figure.

### U4 · One accent colour carries every meaning · **S3**
Money owed, money returned, disputed facts and system-applied values are different *kinds* of
fact and must be distinguishable pre-attentively, not by reading.

### U5 · Numbers are not tabular · **S3**
Any column of rupees is ragged without `font-variant-numeric: tabular-nums`.

### U6 · Filing does not feel weighty · **S2**
Perceived latency should match perceived stakes. Filing is irreversible-feeling and currently
completes like any other click. It needs staged, visibly deliberate confirmation.

### U7 · No visible undo affordance · **S3**
`persist.ts` implements an undo stack with `UNDO_CAP = 25`, but the interface does not surface it.
Forgiveness the user cannot see does not reduce their fear.

### U8 · Dark mode is a token swap only · **S4**
`.dark-mode` remaps colours but no contrast or emphasis decisions were revisited.

### U9 · Empty states unverified · **S3**
The empty state is a teaching surface in an open-ended product. Audit each one; none should be
genuinely empty.

### U10 · No motion language · **S3**
`motion` and `animejs` are dependencies but the interface is static. Nothing eases, nothing
confirms itself, nothing settles. This is the single largest contributor to "it doesn't feel right."

---

## Suggested order

1. **B2** (one line, prevents duplicate filings)
2. **B4** (users must not be told a failed filing succeeded)
3. **B1 + B3** (durable idempotency + wire the ledger — these belong in one transaction)
4. **B5**, then **B6** re-run across instances
5. UX: **U10**, **U3**, **U1/U2/U4/U5** as one visual-language pass
6. **U6**, **U7**


## Part C — §4B persona review, round 1 (2026-08-28, live app)

> **Round-2 status (2026-08-28, all live-verified):** P1 ✅ (PAN chip) · P2 ✅ (tooltip was
> clipped off-viewport, re-anchored) · P3 ✅ (visible disabled-reason) · P4 ✅ (confirmation
> caption) · P5 ✅ (TDS-zero warning) · C1 ✅ · C2 ✅ · C3 ✅ · C4 ✅ · C5 ✅ (Escape + logout
> reset). Remaining cosmetic: stray FILL beside the read-only PAN chip.

Both agents harness-checked: real page text quoted, repro steps present, no invented scope.

### Everyday filer, Simple mode — PASS with findings
- **P1 · Identity re-asked after login** — wizard step 1 asks name + PAN while the header shows the logged-in PAN. Skip or pre-fill-and-collapse the identity step when known. · S2
- **P2 · "Explain simply" speaker buttons do nothing visible** — audio-only or dead; they are the promised safety net beside 80C/80D/TDS labels. Add a visible state (or visible text) or remove. · S2
- **P3 · Enabled Next buttons look disabled** — grey-on-grey; persona hesitated twice. Restyle the enabled state. · S3
- **P4 · Employment question still reads as a re-ask** — pre-selection landed (T3.5) but the screen presents as a fresh question; caption it as confirmation ("From your earlier answer — change it if this is wrong"). · S3
- **P5 · "ENTER 0 IF NONE" on TDS zeroes a salaried refund silently** — a first-timer entering 0 got "Comes back to you ₹0" with no warning, contradicting the landing promise. Warn when salaried + TDS 0, or derive TDS from salary meta. · S1

### CA, Full detail — FAIL (dashboard shell)
- **C1 · Interactive Tax Dashboard binds no data** — every row ₹0 / "AWAITING ACTION" for Rakesh; net tax ₹0; the promised slab/87A/cess trail never renders. · S1
- **C2 · Capital gains absent from every surface** — no row in the fact matrix, no field in Quick Edit, no disclosure of the slab-simplification (T1.9's labelling never reaches the UI). · S1
- **C3 · "Cancel Flow" wipes session + onboarding** — back to the language screen, everything lost. Must be a confirm-gated, scoped cancel. · S1
- **C4 · Assessee shows literal "Taxpayer Name"** — logged-in persona's name never bound. · S2
- **C5 · Quick Edit modal cannot be dismissed / banner button always disabled; "Review tools" produces nothing visible. · S2
