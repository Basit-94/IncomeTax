# Tax knowledge RAG and the recommendation guard

**Status (2026-09-05):** implemented, unit-tested, and wired into the Agentic runtime and the tool
registry. **Not** tax-reviewed: every rule is an engineering draft awaiting a qualified Indian tax
reviewer (plan.md §5.7). Citizens therefore never receive a personal recommendation from it; the
three synthetic demo personas do, inside a deliberately small supported slice. Nothing here files,
pays, or contacts any authority.

This document describes what exists. `docs/knowledge-tax-review-2026-09-05.md` holds the review
findings that shaped it; `docs/TAX-RAG-AGENT-HANDOFF-2026-09-05.md` is the handoff it completed.

## 1. Architecture

```
question ──► lib/knowledge/query.ts   normalise · aliases (23 dictionaries) · sections · FY/AY/TY
          ──► lib/knowledge/retrieval.ts   BM25 over the corpus · hard Act/year/category filters · linked context
          ──► lib/knowledge/rag.ts   exact stored paraphrases + citations, or an explicit stop
return   ──► lib/knowledge/advice.ts   the shared guard: may this release recommend / act on this return?
          ──► lib/knowledge/applicability.ts   three-outcome predicates (eligible · ineligible · insufficient_information)
corpus   ──► lib/knowledge/provisions.ts + supplemental.ts   19 records · lib/knowledge/release.ts   sealed manifest
```

- **Corpus** — 19 `LegalProvision` records for FY 2025-26 (AY 2026-27, Income-tax Act 1961) plus the
  1961→2025 transition note. Legal values are transcribed independently of `lib/engine/constants.ts`
  so a disagreement between corpus and calculator is detectable, not hidden. Help pages are labelled
  `departmental_faq`, never as an enactment. Every record carries `reviewer`, `reviewedOn`, an
  official `sourceUrl`, a `locator`, categories, income heads, keywords and links.
- **Release manifest** (`release.ts`) — `TAX_RELEASE` is a checked-in literal: id `2026-09-05.2`,
  `checkedOn` / `recheckBy` window, `review: "engineering_draft"`, `reviewer: null`, and
  `corpusHash` = SHA-256 of the sorted full records (text *and* metadata). `releaseHealth(today)` is
  `ok` only when the id matches the code, the digest matches the current corpus, and today is inside
  the window; otherwise `integrity_failure` or `stale`, and every answer and recommendation abstains.
  There is no runtime self-approval: an edited corpus fails until someone recomputes and re-seals the
  digest (a throwaway vitest that prints `corpusHash()` is enough). `approvedForAdvice()` is false
  until a reviewer is recorded.
- **Retrieval** — lexical BM25 with exact-section and phrase bonuses, minimum score 1.2, 4 primaries
  by default (max 8). Act and financial year are hard filters; category is a hard filter when known
  and *retained with a named missing attribute* when unknown; linked provisions (definitions,
  exceptions) are added only if they pass the same filters. A 2025-Act period returns only the
  transition note. This is not an embedding or vector search and does not claim to be.
- **Public QA** (`rag.ts`) — `answerTaxQuestion(query, today)` redacts identifiers, strips injection,
  resolves the period (`AY 2026-27` → FY 2025-26; `FY 2026-27` → 2025 Act; a bare year range asks for
  clarification), checks release health, retrieves, and returns `claims` that are *verbatim stored
  rule text* with provision ids, plus citations. No model rewrites tax prose or arithmetic. Statuses:
  `grounded · no_evidence · unsupported_period · clarify_period · unsafe_query · unavailable`.
- **The guard** (`advice.ts`) — `assessAdvice(persona, context)` returns issue codes, status
  (`supported_demo · supported_reviewed · needs_information · unsupported · review_required`),
  `canRecommend`, `canAct`, the applicability results, a redacted input fingerprint, and the
  comparison only when nothing blocks it. It blocks: unhealthy release, wrong AY, unknown or
  non-resident status, incomplete citizen fact inventories, invalid or unsafe values (per item **and**
  per aggregate), empty returns, income above ₹50 lakh (surcharge not modelled), any capital gains,
  business/professional or house-property income, any deduction other than 80C, unverified claims,
  aggregate 80C above ₹1,50,000, and an old-regime recommendation without an established timely
  election. Special-rate income is *derived* from the return's capital-gains facts, never asserted.
  `canAct` equals `canRecommend`; the runtime adds the snapshot-bound confirmation on top.

## 2. Where it is enforced

- **Runtime** (`lib/agentic/runtime.ts`) — an informational question (`explain`) skips private reads
  and answers from the public corpus; the answer text is emitted verbatim. Recommendation tasks assess
  the *projected* return (staged commands applied in memory) and, if the guard says no, emit
  `noteAdviceUnavailable` with the reasons, stage no commands, show no review card, produce no
  outputs, and mark review/confirm/act/outputs skipped. Confirmation re-runs the guard and re-checks
  release id and corpus digest at the action boundary; a stale snapshot re-prepares the review.
- **Tool registry** (`lib/agentic/tools.ts`) — the guard sits *inside* `get_current_return` (raw
  facts stay readable; derived figures become `null` with a `limitation`), `compute_current_tax`,
  `compare_regimes`, `review_return`, `prepare_filing` and `prepare_simulated_payment`, so a direct
  call cannot bypass it. `retrieve_tax_knowledge` exposes the public QA with a bounded schema.
  `check_applicability` validates money (whole, non-negative, safe integers), bounds arrays, accepts
  period/category/age/timely-election/special-rate fields, and never defaults an unknown category to
  eligible. `ToolContext.today` is injected so the release window is deterministic in tests.

## 3. Supported scope and abstention

Supported today: the three demo personas' salaried returns under the guard above — in practice
Sunita. Rakesh (capital gains, 80D) and Priya (unverified 80GG) are shown the calculator's honesty
message, not a recommendation. Within the supported slice the new regime is never dearer than the
old, so the old-regime election path is guarded but not reachable by any demo persona.

Known open items (see the review document for detail): engine-level caps (s.80CCE aggregation, 80D
senior cap, 80CCD(2) salary percentage, s.112A/112 basic-exemption adjustment) are **guarded, not
fixed** — `lib/engine` is pinned to the 72 Java golden vectors and must change on both sides together;
the runtime still collects residency and timely-election answers only as booleans; source extracts and
limitation messages are English (alias discovery across the 23 dictionaries is not translated legal
reasoning); the corpus hash covers stored records, not remote source bodies or predicate code.

## 4. Privacy and audit

Queries are redacted before hashing and never persisted raw; the query hash of a question with a PAN
equals that of the same question with `[PAN]`. Assessments fingerprint amounts and kinds, never
identifiers. Persisted runs carry `taxAnswer` and `advice` for replay and audit; outputs embed the
release id, corpus digest, applicability results and citations.

## 5. Changing the corpus

1. Edit `provisions.ts` / `supplemental.ts` with an official source and locator.
2. Recompute `corpusHash()` and patch `TAX_RELEASE.corpusHash`; update `checkedOn` / `recheckBy`.
3. Run `npx vitest run lib/knowledge lib/agentic` — integrity, retrieval and guard tests must pass.
4. Record the change in `log.md`. Never flip `review` to `tax_reviewed` without a named reviewer.

## 6. Verification (2026-09-05)

`npx tsc --noEmit` 0 errors · knowledge + agentic suites 64/64 (`knowledge.test.ts`, `rag.test.ts`,
`redact.test.ts`, `planner.test.ts`, `runtime.test.ts`, `tools.test.ts`) · full suite and build:
see `docs/CONTEXT.md` header and `log.md`.
