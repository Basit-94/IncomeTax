# Wapsi — Project Context (read this before touching the code)

**Purpose of this file.** One document that tells an agent everything it needs to work on this repo
without auditing it: what the product is, how it is built, where every piece lives, what the numbers
are, what is real and what is mocked, and how to verify a change. Keep it current: when you change
architecture, a contract, a storage key, a route, or a test count, update the matching line here and
append the detail to `log.md` (append-only, `## [YYYY-MM-DD HH:MM] who (title)` entries).

**Last verified against the tree:** 2026-09-05 (branch `dev-2`, uncommitted working tree after the
plan.md Phase A–G execution and the tax-RAG continuation). Gates at that point: `npx tsc --noEmit`
0 errors · `npx vitest run` 305/305 across 30 files · `npx next build` exit 0 · `git diff --check` clean. Work happens on `dev-2`; nothing is merged or pushed
by agents.

---

> **Tax knowledge RAG (2026-09-05, release `2026-09-05.2`):** implemented and verified — sealed corpus
> digest, public QA from exact stored paraphrases, and a shared recommendation guard enforced in the
> runtime and inside every arithmetic tool. Still an **engineering draft awaiting a qualified Indian
> tax reviewer**; citizens get no personal recommendation until one is recorded. See `docs/TAX-RAG.md`.

## 1. What Wapsi is

Wapsi (वापसी, "return") is an independent, synthetic prototype of a simpler Indian income-tax filing
journey for **AY 2026-27 (FY 2025-26)**. Thesis: every number is a *fact awaiting confirmation* — it
carries who reported it (provenance), a plain-language meaning, and one citizen action: confirm or
correct. Live demo: https://wapsi-amber.vercel.app/ (deploys from `main`; work happens on `dev`).

Everything is invented: personas, PANs (`DEMP…` prefix), employers, banks, amounts, notices. Nothing
contacts the Income Tax Department, UIDAI, NPCI or any bank. The former disclosure pages `/honesty`
and `/architecture` no longer exist on `dev-2`; the disclosure lives in `README.md` and the
"Simulated"/"Synthetic" labels on every filing surface — keep those true.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js **16.3** (App Router, Turbopack), React **19.2**, TypeScript **7** strict | `AGENTS.md` warns: APIs differ from training data — read `node_modules/next/dist/docs/` when unsure |
| Styling | Tailwind **4** via `@tailwindcss/postcss`; design tokens in `app/globals.css`; the "Direction 13" index-card look in `app/d13.css` | Money classes: `.tabular` (journey) or `font-mono tabular-nums` (spec surfaces) |
| Motion | `motion` v13 (framer-motion's successor). `m.*` components under `<LazyMotion features={domMax} strict>` | Rule: never gate correctness or the visibility of a figure on an animation (`AnimatePresence mode="wait"` is banned where content matters — see log 2026-09-02 22:32) |
| Icons / QR | `lucide-react`, `qrcode.react` | |
| Tests | `vitest` 4, node environment, **no jsdom** — nothing mounts a component; browser checks are done live (agent-browser CLI or the Chrome extension) | |
| Backend (optional) | Spring Boot / Java 21 under `backend/` — integer-paise money, versioned rule sets, append-only Postgres ledger, idempotent async `POST /api/v1/returns/submit`, auth, preferences | Not required to run the UI; sign-in falls back to a mock session flagged `isMock`. Maven 3.9.11 lives at `%TEMP%\wapsi-maven` (re-downloaded and SHA-512-verified 2026-09-05 after Temp cleanup emptied it); build with `mvn -q -f backend/pom.xml -DskipTests package`, run with `java -jar backend/target/wapsi-backend-0.1.0-SNAPSHOT.jar` (also `.claude/launch.json` → `backend`). Last Java test run 103/103 on 2026-08-29; jar rebuilt and run live 2026-09-05 |
| AI copilot | Gemini via `app/api/agent/route.ts` (server-only key) | See §8 |

Scripts: `npm run dev` · `npm run typecheck` · `npm test` (`vitest run`) · `npm run build`.
Env (see `.env.example`): `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:8080`),
`NEXT_PUBLIC_MOCK_MODE` (tester autofill buttons), `GEMINI_API_KEY`, `AGENT_MODEL`,
`AGENT_MAX_TOKENS_PER_REPLY` (2048), `AGENT_MAX_TURNS_PER_SESSION`, `AGENT_MAX_QUESTIONS_PER_SESSION`
(hard-clamped to 4), `AGENT_DAILY_TOKEN_BUDGET`. Added 2026-09-05 (server-only unless prefixed):
`DATABASE_URL` / `POSTGRES_URL` / `WAPSI_DATASOURCE_URL` (any one enables the durable stores),
`WAPSI_VAULT_KEY` (32 bytes base64; without it uploads are refused), `NEXT_PUBLIC_WAPSI_AGENTIC`
(`false` hides `/app`), `AGENT_MODEL_TIMEOUT_MS` (12000), `AGENT_MAX_TOOL_CALLS_PER_RUN` (40),
`AGENT_MAX_MODEL_CALLS_PER_RUN` (12).

## 3. Routes

| Route | File | What it is |
|---|---|---|
| `/` | `app/page.tsx` (~2,100 lines, `"use client"`) | The main citizen journey: onboarding → landing (PAN or one of three personas) → OTP (`949494`) → dashboard. Unfiled returns walk a 5-step flow (facts → deductions → regime → check → file); filed returns get three tabs (overview/refund tracker, tax prefills, pending actions). |
| `/reconcile` | `app/reconcile/page.tsx` → `components/InteractiveTaxDashboard.tsx` | The flat **reconciliation matrix**: 13 AIS/26AS rows, confirm/dispute per row, net-position headline, calculation dock, Challan 280, s.139(9) card, CASS radar, PDF dropzone, ITR-V preview. Starts from a synthetic prefill (₹15,00,000 salary etc.). Reachable by URL only. |
| `/app` | `app/app/page.tsx` (`"use client"`, `Suspense`-wrapped for `useSearchParams`) | The **Agentic workspace** (plan.md §6). Without `?run=` it is a standalone landing (`components/agentic/landing.tsx`: no sidebar, serif question, "Ask →" box, icon shortcuts, sign-in when there is no session). A question or shortcut creates a run and routes to `?run=<id>`, which renders the same `AppShell` as `/` with the transcript, question/review cards and inspector. Disabled by `NEXT_PUBLIC_WAPSI_AGENTIC=false`. |
| `/api/agent` | `app/api/agent/route.ts` | The legacy copilot endpoint (§8). |
| `/api/session`, `/api/session/demo`, `/api/session/bridge` | `app/api/session/…` | HttpOnly `wapsi_sid` cookie sessions: read / revoke; issue a demo session for one of the three synthetic PANs; bridge a Java backend token via `GET /api/v1/auth/session`. |
| `/api/vault`, `/api/vault/documents[/:id[/bytes|/extract]]` | `app/api/vault/…` | Owner-scoped vault: user record GET/POST; upload (5 MB, MIME-sniffed, sha256-deduped, AES-256-GCM), list, metadata, original bytes, re-extract. |
| `/api/return`, `/api/return/command` | `app/api/return/…` | The shared return snapshot: GET / PUT (`expectedRevision`, 409 on conflict) and the single command endpoint (zod-validated `ReturnCommand`). |
| `/api/runs`, `/api/runs/:id[/events|/cancel|/outputs/:outputId]` | `app/api/runs/…` | Agent runs: create/list, replay + input (message / answer / confirm) + delete, SSE event stream with cursor, cancel, output download. **Response-first (2026-09-06):** POST create / POST input record the run or input and answer in ~0.3 s; the agent's steps run in `after()` from `next/server` while the client streams `/events` (`advance(..., "input_only" | "steps_only")`). `PostgresRunStore.appendEvent` is one statement (owner check + next seq + insert, PK retry) — previously a six-trip transaction that made every turn 6–10 s against Supabase. |
| `/api/memory` | `app/api/memory/route.ts` | Owner-scoped memory entries (list / forget). |

## 4. The two state models, and the bridge between them (the most important thing to understand)

There are **two** models of "the return", deliberately kept separate, joined one way.

### 4a. The ledger (main journey, `/`) — `lib/return/state.ts`
`ReturnState { baselinePersona, persona, corrections: Correction[], confirmedFactIds, regime, filedAt, lang, version }`.
`baselinePersona` is the department's prefill, never mutated by a correction; `persona` is the
*effective* return = baseline replayed through non-reverted corrections (`effectivePersona`).
A `Correction` is `{ id, factId, field: "amount"|"existence", previous, next, reason, feedbackCode?, at, reverted?, target?: "fact"|"tax"|"claim" }`.
Reverting marks, never deletes (forgiveness ladder). `applyCorrection` also removes the fact from
`confirmedFactIds` — "yes" and "no" are mutually exclusive answers. Persisted to localStorage
`wapsi_active_data` (`lib/return/persist.ts`, versioned, migrates v0/v1, undo cap 25).
Arithmetic: `lib/return/compute.ts` → `lib/engine/tax.ts` (§6). Nothing in the UI does its own math.

### 4b. The reconciliation context (spec surface) — `context/TaxReturnContext.tsx`
`TaxProvider` is mounted in `app/layout.tsx`, so the context is shared by `/` and `/reconcile` and
outlives navigation. Schema (per the AY 2026-27 upgrade spec):
- `TaxFact { id: FactId, label, category: income|tax_paid|deduction, reportedAmount, declaredAmount, status: PENDING|CONFIRMED|DISPUTED, feedbackCode?: CODE_1..CODE_5, disputeReason?, hasAttachment?, attachmentName?, reportedBy?, statement?, capitalGains?, supersededAmount?, origin?: "upstream" }`
- 13 `FactId`s: `salary, consulting, savings_interest, dividend, capital_gains, rental, tds_salary, tds_bank, tds_other, advance_tax, sec_80c, sec_80d, sec_80ccd2`.
- State also holds `selectedRegime`, `selfAssessmentPayments` (Challan 280), `filingSection: "139(1)"|"139(5)"`, `revisedReturnStaged`, `ingestedDocuments`, `additionalClaims` (VI-A claims with no row, forwarded by section), `filedAt`, `history` (25-level undo of the mutable slice), `hydrated`.
- Actions: `CONFIRM_FACT`, `DISPUTE_FACT` (requires a CBDT code), `RESET_FACT`, `ATTACH_EVIDENCE`, `ADD_SELF_ASSESSMENT_PAYMENT`, `UNDO_LAST_ACTION`, `SET_REGIME`, `INGEST_DOCUMENT`, `STAGE_REVISED_RETURN`, `MARK_FILED`, `HYDRATE`, `RESET`, `SYNC_STATE`.
- `deriveTaxReturn(state)` is one memo per dispatch: both regimes' results, `netPayable`/`netRefund`/`isPayable`/`isSettled` (three positions — nil is not a refund), CASS assessment over **DISPUTED** income rows, progress counts, `incomeReported`/`incomeDeclared`.
- Persisted to localStorage `wapsi_reconciliation` (`PERSIST_VERSION` 1), hydrated in an effect after mount (never in the initialiser: the server renders `INITIAL_STATE`). `RESET` on logout.

### 4c. The bridge — `lib/return/upstreamSync.ts` (pure, tested)
`buildSyncPayload(returnState)` is dispatched as `SYNC_STATE` from an effect in `app/page.tsx`
whenever `returnState` changes. For every row it sends **both sides**: `reported` (Σ baseline items),
`declared` (Σ effective items; a denied fact counts 0), `disputed` (an active correction touches the
row) with its `feedbackCode`/`disputeReason`, `confirmed` (every item confirmed), `reportedBy`,
`statement`; plus `age`, `regime`, `capitalGainsMeta`, `filedAt`, `additionalClaims`.
Reducer rule: `reportedAmount` always follows the ledger. If the ledger holds a correction → row
DISPUTED at the ledger's figure (`origin: "upstream"`); if confirmed → CONFIRMED; if the ledger says
nothing → a row answered on `/reconcile` keeps its answer, a row the ledger answered earlier goes back
to PENDING, a PENDING row follows the reported figure. The ledger wins conflicts.
Mappings: income by kind (`other`→`consulting`, `interest`→`savings_interest`, `rent`→`rental`);
TDS by section (`192`→`tds_salary`, `194A`→`tds_bank`, else `tds_other`, **`140A` excluded** — the
context records challans itself, so the credit is never counted twice); claims `80C`, `80D`/`80D_SELF`,
`80CCD(2)`; everything else (`80GG`, `80E`, `80TTA`, `24(b)`, `80D_PARENTS`) → `additionalClaims`.
History: the one-sided version of this bridge was the root cause of "No, this is wrong changes the
card but not the summary" (log 2026-09-02 and 2026-09-03 00:50).

### 4d. Which surfaces read which model
- Ledger (`persona` + `computeForPersona`): fact cards (`components/fact-row.tsx` via
  `components/dashboard/statement-tab.tsx`), `check-screen.tsx`, `before-filing.tsx`, `filing-step.tsx`,
  `overview-tab.tsx` headline channels and refund ticket, `regime-step.tsx`, `deductions-step.tsx`.
- Context (`useTax()`): everything in `components/InteractiveTaxDashboard.tsx`, and on `/`:
  `ItrVReceipt` (inside the filed overview), `AuditRiskRadar` (facts, check, statement views),
  `DefectiveNoticeCard` (Actions tab), `Challan280Modal`, `PdfIngestionDropzone` (top of the facts step).
- Where `/` mounts a context component that changes state, `app/page.tsx` mirrors the change into the
  ledger through a callback so the next sync agrees: `handleAutoReconcile` (reverts the short rows'
  corrections and confirms them), `handleChallanPaid` (adds a `140A` tax-paid row, confirmed),
  `handlePdfIngested` (writes salary/TDS-192 into the baseline, adds them for a first-time filer).

### 4e. The server side added by plan.md (2026-09-05) — sessions, vault, commands, runs, knowledge

- **Sessions** — `lib/server/session.ts`: `SessionResolver` issues demo sessions (three synthetic
  PANs only) or bridged sessions (Java token verified server-side); owner = `{ pan, kind:
  "demo" | "citizen", displayName }`. Every data route calls `requireSession` (`lib/server/context.ts`)
  and every store checks the owner. Client-minted `vault_session_*` / `mock-token-*` never authorise
  anything; `lib/session-client.ts` (`ensureServerSession`) turns the client copy into a server session.
  With the Java backend running on 8080, the ordinary `/` OTP sign-in (`lib/auth-client.ts
  ensureSession`) registers the PAN server-side and returns a real token, so even the seeded personas
  become **citizen** sessions (verified 2026-09-05); without it they are **demo** sessions. A citizen
  session with no `DATABASE_URL` gets `storage_unavailable` (503) — never a silent in-memory store.
- **Storage reality** — no `DATABASE_URL` in this deployment. `isDbConfigured()` gates the Postgres
  stores; demo owners get process-memory stores and every response carries `durable: false` (the UI
  says "this history clears when the server restarts"); citizen owners get `storage_unavailable` (503).
  Migrations `0001–0005` live in `lib/db/migrations.ts` and run from `initDb`.
- **Vault service** — `lib/vault/service.ts` over `VaultRepository` (memory for tests, Postgres):
  provenance `uploaded | legacy_backend | synthetic | metadata_only | generated_output`, bounded
  extraction (5 s, 32 MB decompressed), access audit. The UI vault (`CitizenVaultModal`) is the same
  component in both modes; seeded documents are `provenance: "synthetic"`.
- **One return mutation path** — `lib/return/commands.ts` `applyReturnCommand` (confirm_fact,
  sign_off_all, correct_fact, revert_correction, choose_regime, record_payment, stage_revision,
  import_document, finalize_filing, declare_income, declare_claim). `ReturnSnapshotStore` keeps a
  monotonic `revision` + idempotency keys. Manual mirrors its `ReturnState` through `PUT /api/return`
  (`lib/return-sync-client.ts`; 409 → adopt) and pulls on arrival, so an agent filing shows on `/`.
  Filing (`lib/return/filing.ts`): accepted | failed (non-2xx → never "filed") | unreachable →
  explicit `simulatedFiling` (`SIM-…`, deterministic from the idempotency key).
- **Agent runtime** — `lib/agentic/runtime.ts`: server-owned steps classify → plan → gather →
  resolve → compute → review → confirm → act → outputs; events persisted before streaming; review
  cards bound to `{ revision, snapshotHash }` (stale → re-review); replay never re-executes; PAN /
  Aadhaar / mobile / email / IFSC / token redaction and injection stripping (`redact.ts`); Gemini
  only classifies and phrases a server-written brief (`model.ts`), `nullModel` fallback; budgets.
  Choosing the old regime is staged only when `regime_switch_115BAC` is `eligible`; otherwise the
  comparison is shown and the switch is not made (`noteRegimeNotExecuted`).
- **Tax knowledge** — `lib/knowledge/`: 19 provisions (FY 2025-26, 1961 Act; `provisions.ts` +
  `supplemental.ts`) with legal values transcribed independently of the engine, a sealed release
  manifest (`release.ts`: id `2026-09-05.2`, SHA-256 over full records, date window, `reviewer: null`),
  BM25 retrieval with hard Act/year/category filters (`retrieval.ts`, `query.ts` — FY/AY/TY parsing and
  aliases from all 23 dictionaries), public QA that returns exact stored paraphrases or an explicit stop
  (`rag.ts`), three-outcome predicates (`applicability.ts`) and the shared guard (`advice.ts`).
  **Plain-English intake** (`lib/agentic/intake.ts`, 2026-09-05): the opening sentence is parsed
  deterministically into a `Situation` (employment, stated package, business, PF, health insurance,
  rent, home loan, capital gains); the run acknowledges what it understood, then asks one question at a
  time in plain words — a salary-figure conflict first, then "Do you have a document called Form 16?"
  with a description and an inline upload (`Question.expects: "file"`, answered with the vault
  document id, or `"none"`), then PF / health insurance, each followed by a proof upload before the
  deduction is staged (`evidenceAttached: true`); unproven amounts are left out and said so. Business
  situations are told plainly what the release will not do. **Voice** (`lib/agentic/voice.ts`, `docs/VOICE.md`):
  small talk (hi/thanks/who/help/how are you/bye) gets a deterministic friendly reply with the first name and no
  return read; questions carry rotating lead-ins (`Question.lead`); the recommendation ends with a human outcome
  sentence that repeats the figure; a review intro precedes every card; the model may add ONE warm figure-free
  sentence (`warmLine`, validated: no digit in any script, no ₹/%, no section, no filed/paid claim) else a
  deterministic lead. `PostgresRunStore.saveRun` now persists
  `task` and `knowledge_release` (it previously wrote only status/state/title, so a DB-backed run
  re-read as `explain` after classification).
  The guard is enforced in `lib/agentic/runtime.ts` (explain → public QA; recommendations abstain with
  `noteAdviceUnavailable`, stage nothing, re-check at confirmation) and inside every arithmetic tool in
  `lib/agentic/tools.ts` (structured `limitation` instead of figures; `retrieve_tax_knowledge` added).
  **Gate open:** plan §5.7 requires a qualified Indian tax reviewer before rule-based recommendations
  reach citizens. Engine-level findings from `docs/knowledge-tax-review-2026-09-05.md` (s.80CCE
  aggregation, 80D senior cap, 80CCD(2) salary percentage, s.112A/112 basic-exemption adjustment) are
  **guarded, not fixed**: `lib/engine` is pinned to the 72 Java golden vectors. Full description:
  `docs/TAX-RAG.md`.

## 5. The seeded personas (`lib/personas.ts`, `TODAY = 2026-08-22`)

| Persona | PAN | Act | Facts | Refund state |
|---|---|---|---|---|
| Sunita Devi | `DEMPS4417K` | 1 — confirm, don't compose | salary ₹4,20,000, interest ₹1,240, TDS-192 ₹8,400 | not filed, refund ₹8,400 |
| Rakesh Kumar | `DEMPK8823R` | 2 — a letter came | salary ₹18,60,000, interest ₹22,400, dividend ₹9,150, STCG (s.111A) ₹1,10,000 mis-tagged by the broker, TDS ₹2,84,600 + ₹2,240, 80C ₹1,50,000, 80D ₹25,000 | filed, under review, two notices (143(1)(a), 245 set-off), AIS-mismatch hold |
| Priya Sharma | `DEMPS9052M` | 3 — the wait | salary ₹9,80,000, interest ₹6,700, TDS ₹34,800, 80C ₹48,000, 80GG ₹60,000 (no receipt) | filed, under review, rent-receipt hold, stale-IFSC bank |

A typed PAN that is not one of these builds a blank `custom` persona and opens the real-user wizard
(`components/flow/real-user-wizard.tsx`).

## 6. The tax engine (pure, framework-free) — `lib/engine/`

`constants.ts` (every rate/threshold, sourced), `slab.ts`, `tax.ts` (`computeTax`, `compareRegimes`),
`types.ts`. `lib/taxEngineAY2026.ts` is a flat adapter over it for the context; `lib/return/compute.ts`
adapts personas. Money is whole rupees; slices rounded half-up per slab; cess rounded after rebate.
Pinned to the Java engine by **72 golden vectors** (`fixtures/golden/`, 11 fields incl. slab breakdown).

AY 2026-27 rules as implemented:
- New regime slabs 0–4L nil, 4–8L 5%, 8–12L 10%, 12–16L 15%, 16–20L 20%, 20–24L 25%, >24L 30%.
  Old regime 2.5L/5L/10L at 5/20/30% with age-banded basic exemption.
- Standard deduction u/s 16(ia): ₹75,000 new / ₹50,000 old, **capped at the salary**, nil without salary.
- New regime allows only `80CCD(2)`; old regime caps per section (`80C` 1.5L, `80D` 25k, `80D_PARENTS` 50k, `80GG` 60k, `24B` 2L, `80TTA` 10k).
- s.87A: full rebate (cap ₹60,000) when total income ≤ ₹12,00,000; above it, marginal relief caps
  pre-cess slab tax at the excess over ₹12,00,000 (spec-conformant; the Act-literal variant that counts
  special-rate tax is a noted P2). Old regime: ₹12,500 rebate ≤ ₹5,00,000.
- Special rates (Finance (No. 2) Act 2024): s.111A 20%, s.112A 12.5% above a ₹1,25,000 annual
  threshold, s.112 12.5%. **Total income carries the whole s.112A gain**; the threshold is a tax rule,
  reported as `specialExemptTotal` / `specialExemptAmount`. Deductions cannot erode special-rate gains.
- 4% cess after rebate/relief. Net = liability − (TDS + advance tax + self-assessment).
- Known gaps (documented, not modelled): surcharge, s.234A/B/C interest, s.234F fee, full 80GG test.

Mandatory vectors (all tested in `lib/__tests__/taxEngineAY2026.test.ts` and the context tests):
₹12,75,000 salary + ₹30,000 TDS → refund ₹30,000 · ₹12,85,000 → payable ₹10,400 (₹10,000 + ₹400 cess)
· prefilled ₹15,00,000 disputed to ₹10,00,000 → payable flips to refund and CASS goes HIGH.

## 7. Compliance modules — `lib/compliance/`

- `aisFeedback.ts` — the single CBDT code table: CODE_1 correct · CODE_2 not taxable/exempt · CODE_3 not fully correct · CODE_4 other PAN/joint · CODE_5 denied/duplicate. Dispute UIs map plain-language choices to these; `inferFeedbackCode` in the context covers old corrections without one.
- `cass.ts` — Computer-Assisted Scrutiny Selection radar: HIGH if any disputed income row is >20% below reported or the aggregate shortfall exceeds ₹1,00,000; the "94%" is an illustrative label, said so on screen. Attach-proof keeps only the file name.
- `challan280.ts` — ITNS 280 heads (major `0021`, minor `300` self-assessment u/s 140A), 4/104 base+cess split of the amount, synthetic 7-digit BSR and 5-digit serial seeded by amount + PAN + payment ordinal, UPI intent string, 300-second QR TTL (expired → cannot pay).
- `pdfExtract.ts` — byte-level regex over uncompressed PDF text (no pdf.js by design): PAN label-anchored then bounded, gross salary, TDS, document-kind sniffing. Compressed/scanned PDFs honestly return nothing.

## 8. The copilot (`app/api/agent/route.ts`, `lib/agent/`, `components/agent/`)

Gemini with a typed tool registry (`lib/agent/tools.ts`): `compute_tax_ay2026`, `reconcile_fact`
(CBDT codes), `predict_audit_risk` (shares `cass.ts` thresholds), `generate_statutory_artifact`,
sandboxed `hypothetical_tax`, backend reads as the user. Filing is never done by the agent — it
returns a confirmation card the human must click. Limits: hard cap **4 questions per session** (server
counts user turns, returns `limitReached: true`; the panel locks with "Sorry, we have limited our chat"),
turns and daily-token ceilings from env. Replies are rendered by `components/agent/format.tsx`
(paragraphs, lists, bold, code, tabular rupees; React elements only). The system prompt is
brevity-first: answer only what is asked, one or two sentences, long form only for a walk-through,
procedure or regime comparison.

## 9. Product rules that are not obvious from the code

- **Simple vs Full detail** is a real seam, not a density slider (`docs/MODES.md`, `lib/onboarding.ts`
  `mode`). Simple mode gates confirmation behind reading the pencil note once.
- Citizen-facing copy never names a form or a section; consequence, not rule (`lib/i18n/en.ts` header).
  `Dict` is derived from `en`, so a new key must exist in all 23 language files — for one-off strings
  in components use `localize()` from `components/mock-i18n.ts` and add hi/ta there.
- Money: Indian grouping via `Intl` `en-IN` (`lib/money.ts`), always through `formatMoney` /
  `<Rupees>` / `<AnimatedAmount>`; never a raw float; Latin digits in every language.
- Provenance is the differentiator: every figure says who reported it and whether only the reporter
  can fix it.
- Filing with tax outstanding is blocked by the product: while a balance is due, the file button becomes
  "Pay outstanding tax (Challan 280)" (`before-filing.tsx`, `filing-step.tsx`, the `/reconcile` dock).
  This is a product choice, not s.139(9) law — unpaid s.140A tax stopped making a return defective from
  AY 2017-18 (clause (aa) omitted; CBDT Circular 3/2017). UI copy that still says "defective u/s 139(9)"
  is an open follow-up from the 2026-09-05 knowledge review.
- A revised return u/s 139(5) is staged, never silently rewritten: superseded figures are kept on the
  row and the whole stage is one undo step.
- Tester chrome (mock-fill buttons) exists but "is not part of the product"; it disappears with
  `NEXT_PUBLIC_MOCK_MODE=false`.

## 10. Verification protocol

1. `npx tsc --noEmit` (0 errors) — zero `any` is a project rule.
2. `npx vitest run` — 30 files / 305 tests: engine + slab, golden export, return state/persist/compute/
   commands/filing/snapshot store, `upstreamSync`, context reducer, compliance (cass, pdfExtract),
   agent, onboarding, submission key, server sessions, vault service, migrations, knowledge
   (corpus integrity, predicates, retrieval, release/RAG/guard), agentic (redact, planner, runtime, tools).
3. `npx next build`.
4. Anything visual or animation-related must be checked in a browser; unit tests cannot see it. Test
   hooks exist for automation: `data-testid="net-position"` + `data-position`, `data-fact-id`,
   `data-fact-status`, `data-action="confirm|dispute|save-dispute|auto-reconcile|attach-proof|pay-outstanding|download-itrv"`,
   `data-testid="cass-radar"` + `data-risk`, `data-testid="itrv-timestamp"`, `#fact-<personaFactId>`,
   `#dashboard-tabs`. Note the fixed dock on `/reconcile` covers the bottom ~90px; scroll before clicking.
5. Append what you did to `log.md`; update this file if a contract changed.

## 11. Where else to look

`docs/PROTOTYPE.md` (stack narrative), `docs/PLAN.md` + `plan.md` (milestones, resume protocol),
`docs/DESIGN.md` (Direction 13 design language), `docs/MODES.md` (Simple/Full and Manual/Agentic),
`docs/TAX-RAG.md` (knowledge release, retrieval, guard), `docs/VOICE.md` (the agent's voice: small talk, lead-ins, validated model warmth), `docs/knowledge-tax-review-2026-09-05.md`
(tax-knowledge findings), `docs/TAX-RAG-AGENT-HANDOFF-2026-09-05.md` (completed handoff), `docs/ISSUES.md` (backend/UX audit
2026-08-25), `docs/scale/*` (capacity, load, rule-source audit), `fixtures/golden/README.md`,
`backend/README.md`, `critics/*` (round-by-round critiques), `log.md` (the full history).
