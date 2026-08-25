# Wapsi — Living Plan

**Owner:** orchestrator (only the orchestrator edits this file; spawned agents append to `log.md` and report back).
**Seeded:** 2026-08-25 from `docs/AUDIT.md`, after critiquing the PDF's eleven-point plan and `docs/PROTOTYPE.md` §8.

---

## A. Verdicts on the two prior plans

### A.1 The reference PDF's eleven-point plan

| # | Point | Verdict | Reasoning |
|---|---|---|---|
| 1 | Atomic payment + challan transaction | **REFRAME** | No real payments exist in a zero-network prototype; the *principle* survives as "every consequential wait is modelled as named states, never a binary success/error." Applied to filing submission and refund movement instead of challans. |
| 2 | Server-side autosave | **REFRAME** | Correct problem (never lose work), wrong layer — there is no server. Becomes local persistence of the full return state, versioned, with a visible "restored your draft from HH:MM" on resume and undo of corrections. |
| 3 | Circuit breakers / graceful degradation | **KEEP (minimal)** | Already partly built (sandbox dependency-failure toggles). Keep the *degrade-don't-fail* behaviour: stale prefill shown "as of <date>" rather than blocked. No new infrastructure. |
| 4 | Validate at point of entry | **KEEP** | `lib/validate.ts` already encodes the right philosophy (issue codes, incomplete ≠ error). Wire it and extend it; nothing knowable-at-entry may be rejected at submit. |
| 5 | Retire emSigner → eSign | **DROP** | No signing exists and none should be simulated as if real. Mock verification stays explicitly labelled mock; the real-world eSign argument lives on `/honesty`/`/architecture` as prose. |
| 6 | Rewrite error messages, add loading states | **KEEP** | Every error must say what happened, which item caused it, what to do next. Loading skeletons wherever layout is predictable. Directly implements PDF finding #5 ("fail with information"). |
| 7 | Schema version as contract | **REFRAME** | The "schema" we control is our persisted return format. Versioned save format with forward-migration on load; a corrupt/incompatible draft is repaired or honestly discarded with explanation, never silently reset. |
| 8 | Legible refund status machine | **KEEP** | Already designed (`REFUND_SEQUENCE`, holds-with-actions). Fix the drift bug (page.tsx advances through its own shortened list skipping `in_queue`/`determined`) and make cohort framing ("returns filed in your week…") visible. |
| 9 | Public API / intermediary ecosystem | **DROP** | Multi-year policy engineering; meaningless without a government on the other end. Recorded so it isn't silently lost — it belongs in the writeup, not the build. |
| 10 | Default to a completed return, on a phone | **KEEP** | This *is* the simplification thesis (confirm, don't compose). Mobile-first already true; deepen it. |
| 11 | Single source of truth + radical transparency | **KEEP (reframed scope)** | One canonical fact store inside the app (not four views that disagree); transparency delivered by `/architecture` + `/honesty`, which must be re-baselined to match reality after rebuild (audit §6.3). |

### A.2 PROTOTYPE.md §8 remaining-work list

| # | Item | Verdict | Reasoning |
|---|---|---|---|
| 1 | Deploy to Vercel | **DROP (for this mission)** | Submission-logistics concern predating the rebuild; no deployment target in this environment. Revisit if asked. |
| 2 | Split into real routes | **KEEP** | Now justified by architecture, not judging axes: acts become routes (`/file`, `/notices`, `/refund`), enabling SSR for shell content and deep-linkable states. Also the precondition for decomposing page.tsx. |
| 3 | Seed randomness; soften Aadhaar strings | **KEEP** | Two `Math.random()` sites contradict the seeded-RNG discipline and `/honesty`. Use `lib/rng.ts` (currently dead). Remove/replace the two Aadhaar-assertion strings. |
| 4 | Wire zod to PAN/IFSC inputs | **KEEP** | Via `lib/validate.ts` (single source), replacing page.tsx's duplicate schemas with hardcoded English errors — which also fixes an i18n regression. |
| 5 | Decide animejs | **DROP** | Uninstall-or-wire decision resolved: wire nothing decorative during a correctness rebuild; remove the dependency if untouched. Decoration is not on the critical path. |
| 6 | Render the video | **DROP** | Marketing artifact; out of scope for this mission. `video/` stays untouched. |
| 7 | `m` + LazyMotion bundle trim | **DEFER** | Real but low-value vs engine correctness; only after the flow works end to end. |

---

## B. The revised plan

### B.1 Core primitive (named and justified)

> **Everything is a fact awaiting confirmation.**

The official portal's primitive is *the form* — hence every screen inherits form-shaped misery. Wapsi's primitive is the **confirmed fact**: a figure that always carries (a) **provenance** — who reported it, under what identifier, when; (b) a **plain-language meaning** — what it is and why it matters to *your* money; and (c) exactly **one citizen action** — confirm it, or correct it (with a reason).

Justification — what compounds for free once everything is a fact:
- Income rows, TDS credits, deduction claims, notice claims, and refund holds are all the same object with different reporters and stakes. One rendering component, one confirm/correct interaction pattern, one dispute mechanism.
- The review screen is not a new feature — it's the same facts aggregated. The CA's audit trail is not a new feature — it's provenance displayed densely. The explanation layer ("where did this number come from?") is provenance read aloud.
- Progressive disclosure falls out naturally: the default path shows only facts relevant to a salaried filer; expert access is "show all facts," not a different app.
- Complexity placement: legal complexity moves into the engine and the fact definitions (our code); interface complexity collapses to one repeated gesture (confirm/correct).

### B.2 Named segments (never design for the average)

| Segment | Who | What they get |
|---|---|---|
| **First-timer** | 18-year-old, never filed | Defaults excellent; jargon explained in place; one decision per screen; nothing requires outside knowledge |
| **Optimiser** | ~30, files yearly, time-poor | Eligibility-surfaced deductions; regime comparison with visible reasoning on one screen; fast path |
| **CA / Architect** | Professional verifier | Dense audit view: every computed number drills to source facts; direct navigation to any fact; arithmetic traceable line by line |

Every screen must serve segment 1 by default and segment 3 via explicit depth affordances — averaging is forbidden (see mission Step 5 guard).

### B.3 Default path (salaried filer, one Form 16, no capital gains)

1. **Start** — choose language; pick your situation (three synthetic personas + custom). Decision: who's filing.
2. **Verify** — mock OTP, code printed on screen, labelled mock. Decision: prove identity (simulated).
3. **Your money** — pre-filled facts with provenance badges (employer, bank; dates). One at a time on mobile. Decision per fact: confirm / "this is wrong" (inline edit + reason). Progress visible; resumable.
4. **Money you can claim** — eligibility questions in plain language ("Did you pay rent?", "Health insurance?"), each with what it's worth and why it's askable; eligible defaults surfaced automatically. Decision: claim / skip each.
5. **Old vs new regime** — one screen, both outcomes computed live, recommendation with visible reasoning ("because your deductions exceed ₹X, old regime saves ₹Y"). Decision: accept recommendation or override (override allowed, never hidden).
6. **Check** — the whole return on one screen: income − deductions = taxable → tax → already paid → refund/due. Every line expands to its source facts (CA audit path). Deliberate, weighty presentation.
7. **File** — staged confirmation (review → submit with visibly deliberate latency → acknowledgement with what-happens-next). Decision: commit.
8. **After** — receipt, then the refund tracker: named states, holds with release actions, cohort framing.

Screens 3–5 are where progressive disclosure earns its keep: capital gains, foreign assets, business income exist in the data model and appear **only** when a fact implies them ("Add other income" reveals kinds progressively).

### B.4 Government-portal structure imported by current design → replacements

| Imported structure | Where today | Replacement |
|---|---|---|
| Schedule-by-schedule tabs ("PART A/B/C", section-number headings) | statement tab headings | Views named for intent: "Money coming in", "Tax already paid", "Deductions you claim" |
| Acronym-first copy (u/s 192/194A, TAN, DIN as primary labels) | TDS section labels, DIN banner | Plain-language headline first ("Tax your employer already sent in"), identifier demoted to provenance detail; en.ts's own editorial contract restored |
| Form-selection burden (which ITR?) | implicit | Never shown; the engine infers eligibility from facts and says so |
| Jargon validation errors | hardcoded zod strings | Issue codes → dictionary messages (validate.ts design) |
| Binary opaque waits ("Send Return" instant flicker) | handleSendFiling | Named-state progression, weight matched to stakes |

### B.5 Documented user failures → design decisions (each complaint designed out or accepted)

| Failure (PDF evidence) | Decision |
|---|---|
| "Something went wrong, try later" everywhere | Every simulated failure path names cause + next action; sandbox fault-injection demonstrates this deliberately |
| Blank-screen waits; users told to wait 2 minutes | Skeletons for predictable layouts; indeterminate motion only for genuinely unknown outcomes; no blank waits |
| Prefill errors citizens can't argue with | Provenance badge + `onlyReporterCanFix` surfaces *who must fix it*; dispute records reason |
| s.245 set-off against demands never received | Notice decode shows demand origin/year/"did you ever get this?" with one-tap dispute (Rakesh persona) |
| Verified returns shown unverified; lying about state | State machine is single-source (`REFUND_SEQUENCE`), persisted transitions logged in timeline |
| Work lost mid-session ("start a new filing") | Full return state persisted + versioned; resume banner "restored from HH:MM"; corrections undoable before filing |
| Validation rejected at submit (27-char city) | All shape validation at entry via validate.ts philosophy; submit-time checks limited to cross-field rules already previewed earlier |
| Refund variance rage ("60 days, nothing") | Cohort framing + named holds with clear-by estimates; variance explained, not averaged away |
| English-only critical flows (Kar Saathi: 2 of 22 languages) | Full trilingual discipline; i18n keys compile-enforced; stored timeline events keyed, not English literals |
| Desktop-bound utilities exclude mobile | Everything works at 375px first; no desktop-only step anywhere |

Explicitly accepted (with reason): OTP is decorative (prototype has no auth backend — labelled mock); no real bank validation (format-shape only — labelled).

---

## C. Build items

Interfaces between areas (agreed **before** fan-out):

```
lib/engine/types.ts      TaxInput {facts[], claims[], regime, age...}, TaxBreakdown
lib/engine/slab.ts       pure: newRegimeTax(taxable, fy) -> {slabs:[{upto,rate,tax}], total}   TODO(verify) constants
lib/engine/tax.ts        pure: computeTax(input) -> TaxBreakdown {grossIncome, standardDeduction,
                         taxableIncome, slabTax, rebate87A, cess, totalTax, tdsCredits,
                         refundOrDue, regimeComparison?}
lib/return/state.ts      ReturnState {version, facts, disputes, claims, regime, filings...}
lib/return/persist.ts    load()/save()/migrate(versioned) + undo stack (cap depth)
lib/i18n/*               ALL user-facing strings; Dict = typeof en enforced
components/fact-row.tsx  THE primitive renderer: provenance + meaning + confirm/correct
app/(flow)/              screens consume store + engine; no computation inline
```

### P1 — Decompose `app/page.tsx`
- **Status:** DONE · **Owner:** builder-decomp
- **Rationale:** Nothing else can proceed safely on a 2,900-line monolith with dead code and behavioural bugs.
- **Acceptance:** Behaviour-preserving split into components/ + lib modules; typecheck+build pass; no dead imports; seeded personas render identically; REFUND_SEQUENCE drift fixed.
- **Evidence:** page.tsx 2,897→931 lines; 13 modules under components/ (all <400 lines); fidelity check 199/199 classNames + 61/61 text nodes match; typecheck+build exit 0; defects fixed: custom-persona id, 9 dead imports, Math.random→mulberry32 via lib/rng.ts, timeline advancer now iterates canonical REFUND_SEQUENCE. Log entries [2026-08-25 ~04:10] builder-decomp.

### P2 — Test infrastructure
- **Status:** DONE · **Owner:** builder-engine
- **Acceptance:** Vitest wired (`npm test`), CI-runnable locally, example tests green.
- **Evidence:** vitest devDependency added; `npm test` → 50 passed (50) in 408ms.

### P3 — Pure tax engine
- **Status:** DONE · **Owner:** builder-engine
- **Rationale:** Highest-risk area; previously a flat-15%-above-7L formula that contradicted the repo's own narratives (AUDIT §3).
- **Acceptance:** Dependency-free module; every constant sourced or `TODO(verify)`; boundary tests; golden persona tests.
- **Evidence:** lib/engine/{constants,types,slab,tax}.ts — zero framework imports; ALL constants TODO(verify) vs Finance Act 2026 / incometax.gov.in; 50 tests incl. every slab edge ±1, rebate cliff + marginal relief zone, golden Sunita/Priya/Rakesh, monotonicity property sweep 0–3M. Known gaps documented: surcharge absent, capital-gains special rates not modelled, 234A/B/C/F absent.

### P4 — Data model, persistence, forgiveness
- **Status:** DONE · **Owner:** builder-store
- **Acceptance:** Versioned ReturnState, save/resume, undo (capped depth), migration; extends rather than replaces types.ts/validate.ts philosophy.
- **Evidence:** lib/return/{state,persist}.ts — event-sourced corrections replayed over baselinePersona; revert preserves history; legacy v0 drafts auto-migrate under existing `wapsi_active_data` key; undo cap 25; 22 new tests → suite total 72 passing.

### P5 — Core filing flow (default happy path)
- **Status:** DONE · **Owner:** builder-flow
- **Acceptance:** B.3's screens work end-to-end for Sunita-class persona at 375px; staged file confirmation.
- **Evidence:** old flat calculation deleted; all figures via lib/engine through lib/return/compute.ts bridge; deductions eligibility step, regime choice screen, check screen, staged filing step (~1.2s named progression), acknowledgement; typecheck/test/build green. Divergences surfaced not fudged (Sunita ₹8,400 exact match).

### P6 — Progressive disclosure & edge cases
- **Status:** DONE · **Owner:** builder-flow
- **Evidence:** facts-driven rendering — salary-only personas never see CG/business/NR fields; Rakesh's capital gains appear because the fact exists; expert depth via Check drill-down + sandbox drawer.

### P7 — Explanation layer
- **Status:** DONE · **Owner:** builder-flow
- **Evidence:** every Check-screen line expands to contributing facts + provenance + plain-language explanation; regime recommendation shows one-screen money reasoning; claim worth computed by engine.

### P8 — Craft & states
- **Status:** DONE · **Owner:** builder-flow
- **Evidence:** skeletons for predictable layouts; sandbox fault-injection error ladder names cause + next action ("nothing was lost"); restored-draft banner; reduced-motion inherited; 375px single-column stacking.

### P9 — i18n integrity
- **Status:** DONE · **Owner:** builder-flow (binding on all agents)
- **Evidence:** ~100 new keys added to en/hi/ta with Dict=typeof en compile enforcement; zod messages via validate.ts issue codes; persisted timeline headlines migrated to i18n keys (persist v2). Known residual: mock-i18n parallel table for data-layer labels (open consolidation item); actions-tab/sandbox drawer copy partially localize-based.

### P10 — Persona critics (Step 4)
- **Status:** TODO · **Owner:** orchestrator
- **Acceptance:** Critics A/B/C run landing→filed, each exercises ≥1 non-English locale; verdicts recorded.
- **Evidence:** critic reports.

### P11 — Convergence loop (Step 5)
- **Status:** TODO · **Owner:** orchestrator
- **Acceptance:** All three SATISFIED in same round, ≤5 rounds, or honest deadlock report.
- **Evidence:** log.md round summaries.

## D. Out of scope for v1 (critics judge the product we meant to build)

- Capital-gains computation (flagging and routing exist; full CG maths does not), business/professional income, presumptive schemes, NRI/foreign assets.
- Advance tax, challans, e-Pay Tax simulation.
- Appeals, rectification, condonation, ITR-U flows (prose on docs routes only).
- Any network call, any real credential, any government contact — permanently out for this prototype.
- Deployment, video production, analytics.
