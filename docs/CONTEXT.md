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
| Styling | Tailwind **4** via `@tailwindcss/postcss`; design tokens in `app/globals.css`. **Redesign 2026-09-06** (`docs/redesign/README.md`, "Sunrise/Lilac" light + "Navy & Coral" dark): the token NAMES stayed (`paper/ink/money/line/amber-*`) and were remapped — paper = lilac `#F3EEFF`, paper-2 = glass `rgba(255,255,255,.62)`, money = tangerine `#FF7A1A`, amber-bg/ink = the accent-soft pair — plus new `glass / glass-edge / ink-surface / on-ink / soft / ok(-soft,-ink) / bad / tertiary` colours, `shadow-glass`, `shadow-glow`, soft radii (14/20/24 px) and the component classes `.glass .glass-flat .ink-surface .munshi-bubble .btn-primary`. `app/d13.css` keeps its verbatim classes; its palette variables are remapped unlayered at the top of `globals.css`. Fonts: **Outfit** for everything (`--font-outfit`; `font-serif` classes are an alias), JetBrains Mono for numbers, Caveat for Munshi ji's notes. Mascot: `components/brand/munshi-art.tsx` is the editable identity-master-derived SVG rig, `components/brand/munshi.tsx` exposes `Munshi`/`MunshiAvatar`/`MunshiBubble`, and `components/brand/munshi.css` owns 19 semantic animation states including the document-reading/glasses-adjusting loop, signed-net regime reactions, CA-review delivery, urgent deadline, guidance, ledger notation, live voice and patient chai. Standalone SVG/PNG/logo/character-sheet exports and an interactive studio live in `public/brand/munshi/`; see `docs/MUNSHI-JI.md`. The ground is the lilac page with two drifting blobs (`.paper::before/::after`), no graph paper. | Money classes: `.tabular` (journey) or `font-mono tabular-nums` (spec surfaces) |
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
(`false` hides `/app`), `AGENT_MODEL_TIMEOUT_MS` (code default 8000 since 2026-09-07; was 3500), `AGENT_MAX_TOOL_CALLS_PER_RUN` (40),
`AGENT_MAX_MODEL_CALLS_PER_RUN` (12).

## 3. Routes

| Route | File | What it is |
|---|---|---|
| `/` | `app/page.tsx` (~2,100 lines, `"use client"`) | **Signed out (2026-09-06): the public landing page** (`components/marketing/landing-page.tsx` — serif thesis, live fact card, "Sign in" / "Try a demo citizen" → `/signin`; no mode switch). **Signed in:** the Manual citizen journey, reached via the mode switch: onboarding → landing hub → dashboard. Unfiled returns walk a 5-step flow (facts → deductions → regime → check → file); filed returns get three tabs (overview/refund tracker, tax prefills, pending actions). |
| `/signin` | `app/signin/page.tsx` | **Sign-in as its own page (2026-09-06; rebuilt 2026-09-07 to handoff 2):** `AuthPortal` has two tabs — **Citizen** (PAN → "New here? Create your account" link → OR → "Or sign in with a document" row → quick demo PANs) and **Chartered Accountant** (review code + PIN + optional stamp, verified with `lib/ca/ca-store` and handed to `/ca` through the read-once `sessionStorage` key `wapsi_ca_handoff` = `{code, pin, name, membershipNo}`); sign-up, document and the demo list are sub-views with a Back link (`?tab=signup|document|personas` opens them). `OtpScreen` follows (glass card, 6 mono boxes). **Onboarding v3, for new accounts only (2026-09-07 — "only what never changes"):** `arrive({ newAccount: true })` — reached solely from the Create-account path — shows `components/onboarding.tsx` when no `wapsi_onboarding_profile` exists. Three screens: language (skipped when set), **This is you** (link DigiLocker → consent card → `GET /api/digilocker` fills name/DOB/masked Aadhaar/address/banks, identity locked, contact editable, residency), **Refunds and how you like to work** (nominate a pre-validated account, Simple/Full, a collapsed standing-facts row for representative assessee / disability). Nothing with a tax year on it — intent, employer, salary, housing, deductions, regime are the yearly intake (§13). The profile (`lib/onboarding.ts` v3: identity, contact, residency, banks, refundAccountId, standing, `connections.digilocker`) is saved, `wapsi_user_mode` seeded from the mode, then the mode choice; every returning sign-in goes straight to the mode choice. v1/v2 profiles migrate silently (`migratedFrom`, blank identity) — nobody is re-onboarded. A plain brand bar (language, theme, no mode switch); on phones a 56 px back-circle + title header. `lib/signin-flow.ts` verifies the code (`949494`) with the backend, saves the client session + seeded/blank `ReturnState`, tries for a server session, then `router.replace("/app")` — no filing flow starts. A stale client-only session is cleared here; `/app` redirects signed-out visitors to `/signin`. |
| `/reconcile` | `app/reconcile/page.tsx` → `components/InteractiveTaxDashboard.tsx` | The flat **reconciliation matrix**: 13 AIS/26AS rows, confirm/dispute per row, net-position headline, live both-regimes rail (regime tiles, net figure, file/pay CTA), Challan 280, s.139(9) card, CASS radar, PDF dropzone, ITR-V preview. Starts from a synthetic prefill (₹15,00,000 salary etc.). Reachable by URL only. |
| `/app` | `app/app/page.tsx` (`"use client"`, `Suspense`-wrapped for `useSearchParams`) | The **Agentic workspace** (plan.md §6). Without `?run=` it is a standalone landing (`components/agentic/landing.tsx`: no sidebar, serif question, "Ask →" box, icon shortcuts, sign-in when there is no session). A question or shortcut creates a run and routes to `?run=<id>`, which renders the same `AppShell` as `/` with the transcript, question/review cards and inspector. Disabled by `NEXT_PUBLIC_WAPSI_AGENTIC=false`. |
| `/api/agent` | `app/api/agent/route.ts` | The legacy copilot endpoint (§8). |
| `/api/session`, `/api/session/demo`, `/api/session/bridge` | `app/api/session/…` | HttpOnly `wapsi_sid` cookie sessions: read / revoke; issue a demo session for one of the three synthetic PANs; bridge a Java backend token via `GET /api/v1/auth/session`. |
| `/api/vault`, `/api/vault/documents[/:id[/bytes|/extract]]` | `app/api/vault/…` | Owner-scoped vault: user record GET/POST; upload (5 MB, MIME-sniffed, sha256-deduped, AES-256-GCM), list, metadata, original bytes, re-extract. |
| `/api/return`, `/api/return/command` | `app/api/return/…` | The shared return snapshot: GET / PUT (`expectedRevision`, 409 on conflict) and the single command endpoint (zod-validated `ReturnCommand`). |
| `/api/runs`, `/api/runs/:id[/events|/cancel|/outputs/:outputId]` | `app/api/runs/…` | Agent runs: create/list, replay + input (message / answer / confirm) + delete, SSE event stream with cursor, cancel, output download. **Response-first (2026-09-06):** POST create / POST input record the run or input and answer in ~0.3 s; the agent's steps run in `after()` from `next/server` while the client streams `/events` (`advance(..., "input_only" | "steps_only")`). `PostgresRunStore.appendEvent` is one statement (owner check + next seq + insert, PK retry) — previously a six-trip transaction that made every turn 6–10 s against Supabase. |
| `/api/memory` | `app/api/memory/route.ts` | Owner-scoped memory entries (list / forget). |
| `/api/digilocker` | `app/api/digilocker/route.ts` → `lib/agentic/digilocker.ts` | **DigiLocker mock for the non-agent shells (2026-09-07).** GET = the standing record (`readProfile`: PAN identity, masked Aadhaar, address, pre-validated banks) for onboarding's "This is you" screen; POST `{assessmentYear}` = this year's issued Form 16 (Part B rows) and AIS (lines with real SFT codes), imported into the vault when one exists and returned with fields for the Manual facts step. Owner-scoped; the consent card is the caller's job. |
| `/api/transcribe`, `/api/speech` | `app/api/transcribe/route.ts`, `app/api/speech/route.ts` → `lib/server/transcriber.ts` | **Dictation & Speech Transcription (2026-09-07, upgraded):** POST multipart `audio` (≤ 8 MB) + optional `language` → `{ ok, text, language }`. Session required. Powered primarily by **Google Gemini audio transcription** (`transcribeWithGemini`) with multi-key rotation and native support for all 23 languages and Latin numerals; falls back to the local faster-whisper worker if Gemini key is not configured. The client side is `lib/speech.ts` (MediaRecorder + Web Audio `AnalyserNode` live audio level reporting) and `components/agentic/audio-waveforms.tsx` (real-time equalizer waveform while speaking, and flowing harmonic sine ribbon animation while transcribing in Sunrise/Lilac + Navy & Coral styling). |

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
- **Agent runtime — SUPERSEDED 2026-09-07 by §14 (the step machine, the intent classifier and the canned answers are gone; kept here as history):** `lib/agentic/runtime.ts`: server-owned steps classify → plan → gather →
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
  **Yearly intake (2026-09-07, papers-first v2 — see §13):** the intake is the yearly half of onboarding. A run
  created with the profile's seed (`ProfileSeed` on `POST /api/runs`, `RunWorkingState.profile`: first name,
  masked refund account, residency, DigiLocker link, mode — never an identifier) opens with Munshi ji's greeting
  (`openerFallback`, phrased by the model), puts DigiLocker first on the source card when linked, and builds the one
  form from `gapGroups()` (`lib/return/year-intake.ts`): housing (skipped when Form 16 shows HRA and nothing points
  at a property), "anything else this year" (always once — the ITR-1 gate), deductions (skipped when `regimeLean()`
  says the new regime wins even at the ₹4.5L ceiling), the no-papers figures. Documents stage the Part B rows and
  AIS lines through `import_document` (`ExtractedFields` grew: `exemptAllowances`, `employerClaims`, `otherIncome`,
  `ltcg112A`, `tdsOther`, `professionalTax`, `tan`) plus a `record_year_intake` command; the verdict
  (`inferForm()` from the ITR-1 eligibility text + regime lean) is said once per run. Field specs are shared with the
  Manual facts step (`lib/return/year-form.ts` → `components/flow/year-papers-card.tsx`, `year-gap-form.tsx`).
  **Intake — document-first, one form** (`lib/agentic/intake.ts`, rewritten 2026-09-06 on the user's
  correction "one question at a time feels worse than manual mode"): the opening sentence (English or
  Hinglish) is parsed deterministically into a `Situation`; a blank return is first asked where the money
  came from (`income_source`); then a **source card** (`Question.expects: "source"`, `sourceOptions`) —
  upload Form 16 (answers `upload:<documentId>`), fetch from the **DigiLocker mock**
  (`lib/agentic/digilocker.ts`: seeded figures for demo PANs, deterministic SAMPLE figures for any other,
  imported via `VaultService.importIssued` as `provenance: "synthetic"` with an extraction record), use a
  Form 16 already in the vault, or type; DigiLocker and vault reads sit behind a **consent card**
  (`yes_no` with `items`) and nothing is fetched or read before "yes" — a readable Form 16 already stored
  is offered behind consent at the start of every working run; then **one form**
  (`Question.expects: "form"`, `fields`; the answer is a JSON object — PF, health insurance, interest,
  residency for citizens; salary only when no document supplied it); then at most one proof upload
  (`proof`). Typed salary → `declare_income` (self); Form 16 → `import_document`; deductions count only
  with the proof attached. The guard receives `completeFacts` once the form is answered and `resident`
  from it. **Voice** (`lib/agentic/say.ts`, `docs/VOICE.md`, rewritten 2026-09-06): every conversational
  sentence is phrased by the model from a brief and checked (`whyRejected`: no figure outside the brief,
  no filed/paid claim, no advice words, no self-description, required terms kept, no repeat of the run's
  recent sentences); templates (`agenticStrings.ts`, trimmed of all self-description) are fallbacks only,
  and every fallback is recorded as `tool_outcome model.phrase ok:false` with its reason. Questions carry
  no lead-ins (`Question.lead` unused; `voice.ts questionLead` is dead code kept for now). Hinglish is a
  register (`detectRegister`, `RunWorkingState.register`) applied by the model. `geminiModel` rotates
  through `GEMINI_FALLBACK_API_KEY*` on HTTP 429 and exposes `lastFailure()`; the primary key was found
  out of quota on 2026-09-06, which is why the agent had read as templates. `PostgresRunStore.saveRun` persists
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
  "Pay outstanding tax (Challan 280)" (`before-filing.tsx`, `filing-step.tsx`, the `/reconcile` rail).
  This is a product choice, not s.139(9) law — unpaid s.140A tax stopped making a return defective from
  AY 2017-18 (clause (aa) omitted; CBDT Circular 3/2017). UI copy that still says "defective u/s 139(9)"
  is an open follow-up from the 2026-09-05 knowledge review.
- A revised return u/s 139(5) is staged, never silently rewritten: superseded figures are kept on the
  row and the whole stage is one undo step.
- Tester chrome (mock-fill buttons) exists but "is not part of the product"; it disappears with
  `NEXT_PUBLIC_MOCK_MODE=false`.

## 10. Verification protocol

1. `npx tsc --noEmit` (0 errors) — zero `any` is a project rule.
2. `npm test` — 40 files / 372 tests (2026-09-07): engine + slab, golden export, return state/persist/compute/
   commands/filing/snapshot store, `upstreamSync`, context reducer, compliance (cass, pdfExtract),
   agent, onboarding, submission key, server sessions, vault service, migrations, knowledge
   (corpus integrity, predicates, retrieval, release/RAG/guard), agentic (redact, planner, runtime, tools,
   intake, voice, say, model, digilocker, store).
3. `npx next build`.
4. Anything visual or animation-related must be checked in a browser; unit tests cannot see it. Test
   hooks exist for automation: `data-testid="net-position"` + `data-position`, `data-fact-id`,
   `data-fact-status`, `data-action="confirm|dispute|save-dispute|auto-reconcile|attach-proof|pay-outstanding|download-itrv"`,
   `data-testid="cass-radar"` + `data-risk`, `data-testid="itrv-timestamp"`, `#fact-<personaFactId>`,
   `#dashboard-tabs`. The `/reconcile` header and the `/ca` client strip are sticky; scroll a row into the clear before clicking.
5. Append what you did to `log.md`; update this file if a contract changed.

## 11. Where else to look

`docs/PROTOTYPE.md` (stack narrative), `docs/PLAN.md` + `plan.md` (milestones, resume protocol),
`docs/DESIGN.md` (Direction 13 design language), `docs/MODES.md` (Simple/Full and Manual/Agentic),
`docs/TAX-RAG.md` (knowledge release, retrieval, guard), `docs/VOICE.md` (the agent's voice: small talk, lead-ins, validated model warmth), `docs/knowledge-tax-review-2026-09-05.md`
(tax-knowledge findings), `docs/TAX-RAG-AGENT-HANDOFF-2026-09-05.md` (completed handoff), `docs/ISSUES.md` (backend/UX audit
2026-08-25), `docs/scale/*` (capacity, load, rule-source audit), `fixtures/golden/README.md`,
`backend/README.md`, `critics/*` (round-by-round critiques), `log.md` (the full history).

## 12. Mobile (handoff 2, 2026-09-07)

Below `md` (767 px) the same components render the phone layouts from `Wapsi Mobile.dc.html` (M1–M10);
desktop is unchanged from `md` up. Shared pieces in `components/mobile/`: `MobileTabBar` (Manual: Overview ·
Statement · Actions, fixed, `data-testid="mobile-tab-bar"`, rendered by `app/page.tsx` after the main element for
the hub and the dashboard **only once the return is filed** (`returnState.filedAt`; before that the steps are the
journey, and the page has its own Tax Vault button — user, 2026-09-08); each tab sets the dashboard tab),
`BottomSheet` (the Agentic inspector below `lg`: scrim, grab handle, ink icon square, segmented Progress ·
Outputs · Sources; `InspectorPanel` renders it and takes `onClose`), `MobileDrawer` (the Agentic sidebar below
`lg`, with a Mode section that carries the full-width `ModeSwitch` and the language menu). `HeaderBar` gained
`leading` (back circle / hamburger), `mobileTitle` and `mobileSwitchBelow` (56 px bar; the pill compact in the
bar or centred under it). Primary actions on the sign-in, CA login, onboarding, wizard (deductions, regime,
file), reconcile and CA review are pinned above the home indicator in a paper fade (`md:contents` wrapper, so
the desktop DOM is untouched). Modals carry the `sheet-m` class: on phones they become bottom sheets (28 px
corners, 44×5 handle, overlay `max-md:items-end`). Fact cards sit flat (`--tilt: 0deg`) with 14/16 padding.
Two d13.css element rules leak into any bare `<nav>` / `<main>`; `globals.css` resets `header > nav` and
`main.shell-main` right after the d13 import — do not put responsive `hidden` variants on the mascot's SVG
(`munshi.css` is unlayered) or on component-layer classes (`md:glass` does not exist); wrap in a span instead.

## 13. Papers-first onboarding v2 — once vs every year (2026-09-07)

User direction: "only mention those questions that can be exactly the same every year… if something gets
updated every year, add it in the agentic mode." The test for every field is *"will this answer be the same in
five years?"*

- **Once — the profile** (`lib/onboarding.ts` v3, `components/onboarding.tsx`, `lib/i18n/onboardingStrings.ts`
  en + hi, others fall through to English): identity from the PAN record via the DigiLocker mock
  (`GET /api/digilocker` → `readProfile`), contact, residency, banks + refund nominee, Simple/Full, standing facts
  (representative assessee, disability), `connections.digilocker.linked`. Dropped: intent, profession, filing
  history, focus areas. `profileSeed()` is the only part the runtime sees.
- **Every year — the intake** (`lib/return/year-intake.ts`, stored as `ReturnState.yearIntake` through the
  `record_year_intake` command; `lib/return/year-form.ts` field specs shared by both shells): sources + consent,
  the Form 16 Part B breakup, SFT flags, the verdict (`inferForm` from the ITR-1 eligibility text; `regimeLean` =
  `compareRegimes` as-is and at the ₹4.5L `DEDUCTION_CEILING`; `filingSection` by 31 July), the one form's answers
  (housing, extras, deductions, no-papers figures), `carriedFrom` for next April's defaults (`carryDefaults` —
  answers carry, documents never).
- **Agentic** (`lib/agentic/runtime.ts`; `intake.ts` removed the same evening — see §14, the model now orders the journey itself): opener → DigiLocker-first source card → consent → review
  (facts spoken with provenance) → one form (`gapGroups`) → verdict; ITR-2/3 verdicts are said and left to the
  guard. **Manual** (`app/page.tsx` facts step): `YearPapersCard` (POST `/api/digilocker` → `import_document` +
  `record_year_intake`) and `YearGapForm` (→ `record_year_intake`, `declare_income`, `declare_claim`).
- **DigiLocker mock** now issues Part B rows and AIS lines with the real SFT codes (016 interest, 015 dividend,
  017 securities) under the FY 2025-26 TDS thresholds (194A ₹50,000; 194 ₹10,000). `pdfExtract` reads only the
  five original fields (Phase B extends it; names with apostrophes now parse).
- **Voice** (`lib/agentic/model.ts`): `MUNSHI_VOICE` is the model's persona; phrasing timeout 8 s; the greeting
  menu goes through `speak()`; the tax-expert prompt carries the FY 2025-26 slabs, 87A ₹60,000 / ₹12L, and the
  new TDS thresholds (the previous facts were FY 2024-25's).
- Open: 21 languages on the English fallback for the new strings; `ta` agentic strings written but unreviewed;
  a `carriedFrom` rollover has no UI trigger yet (next AY); the review card is spoken facts, not row-level
  "wrong?" links (disputes stay on the Manual statement).

### 13.1 Phase B + Phase C, and the character (2026-09-07, later the same day)

- **Phase B — the extractor reads the rows** (`lib/compliance/pdfExtract.ts` `extractRichFieldsFromText`,
  run on the raw byte scan and on the decompressed text layer): TAN; Part B 17(1)/(2)/(3) (`salaryParts`);
  allowances exempt u/s 10 by label (HRA 10(13A), LTA 10(5), gratuity 10(10), commuted pension 10(10A), leave
  encashment 10(10AA)); professional tax; Chapter VI-A rows as the employer reports them (80C/80CCC/80CCD(1)/
  (1B)/(2)/80D/80E/80G/80TTA → the engine's section spellings); the 115BAC(1A) opt-out flag (`regimeOptOut`);
  AIS Part B lines with reporter, amount and TDS (TDS-194A/SFT-016/SFT-005 → interest, DIV-/SFT-015/TDS-194 →
  dividend, SFT-017 → 112A) with TIS summary rows as the fallback; `readFields` names what was read. Names with
  apostrophes and the compact "Name: … PAN:" layout parse. Tests: `lib/compliance/__tests__/pdfExtractRich.test.ts`.
- **DigiLocker, generated per person and kept** (`lib/digilocker/`): `generate.ts` builds a whole person from
  one seed (identity with a PAN-consistent surname initial, 12-digit Aadhaar, address, employer with TAN and
  category, salary structure with HRA exemption when renting, employer-reported 80C/80CCD(2)/80D, quarterly TDS
  computed by the engine and jittered so refunds and dues both occur, AIS interest/deposits/dividends/112A/rent
  with TDS at the FY 2025-26 thresholds, banks); `fromPersona` derives the three seeded personas' records so the
  locker agrees with the return. `store.ts`: `PostgresLockerStore` (migration `0006_digilocker_records`) when
  a database exists — random seed, durable, a returning person sees the same papers — else `MemoryLockerStore`
  with a PAN-derived seed so a restart regenerates the same record. `provider.ts`: `MockDigiLockerProvider`
  implements the Phase C seam `DigiLockerProvider` — `record` (create once, extend for a new AY), `status`,
  `link`/`unlink`, `profile`, `documents` (catalogue: PAN card, Aadhaar (masked), Form 16, AIS, Form 26AS with
  DigiLocker-style URIs), `pull(scope)`. `index.ts`: `digiLockerFor(pool)`; `DIGILOCKER_PROVIDER` accepts only
  `mock`. `Services.locker`, `RuntimeDeps.locker` (optional; tests rebuild the PAN-seeded record in-process via
  `lib/agentic/digilocker.ts`, whose sync helpers read the provider's `lockerCache`).
- **Routes**: `GET /api/digilocker` → profile + link status + catalogue; `POST /api/digilocker {assessmentYear,
  scope}` → pull, imported into the vault as issued documents (ids carry the URI so two identity cards do not
  collide); `POST|DELETE /api/digilocker/link` → link/unlink, and on link the identity is merged into
  `tax_vault_users` (name, Aadhaar, DOB, mobile, email, address, banks) so the vault's PAN/Aadhaar cards show
  the generated person; `GET /api/digilocker/documents?scope=` → catalogue only.
- **Showing the pull**: onboarding O2 links, then ticks PAN record → Aadhaar → banks as they arrive; the Manual
  papers card lists the year's catalogue and ticks each document; the agent emits one `activity` per document
  ("Fetching from DigiLocker: …") before importing it, then Munshi ji says what came over. After onboarding the
  PAN record's name replaces the sign-up placeholder on the return and the session (`applyProfileToPersona`).
- **Character** (`lib/agentic/munshi-character.ts`, `docs/VOICE.md`, `docs/MUNSHI-JI.md`): one bible for the
  Agentic model, the tax-expert prompt, the Manual copilot (titled Munshi ji in all 18 dictionaries that carry
  a title) and the who-am-I path (Hinglish spellings heard). **Natural vs template policy** in code:
  `speakResult` phrases task results, RAG/smart answers and CA lines with every figure and table row kept;
  the recommendation is phrased around `recommendationText`; the task close is one sentence; receipts, review
  cards, badges and legal lines stay templates. `SayInput.shape` (`review`) tells the model to keep rows.

## 14. Munshi ji thinks, the engine counts — the model-first agent (2026-09-07, evening)

User direction, verbatim in spirit: "Why are we training it for only these few questions? I want it to be completely free of
any gates… respond naturally, not templatized… guide them through the whole journey… it feels like an if-else chatbot…
remove every single template." Approved as three phases in one go; all three landed.

- **What went** — `lib/agentic/planner.ts` (intent regexes, capability inquiry, 9-step plan), `voice.ts` (small-talk
  detector, canned replies, warm line), `response.ts` (recommendation template), `intake.ts` (the deterministic question
  sequencer), `lib/knowledge/smart-answers.ts` (14 hand-written Q&A), `emitGreetingCapabilities` / `emitTaskCapabilitiesSummary`
  (the seven-task menus), `handleChosenTask` (canned task results), `askTaxExpert` and `classify` on the model adapter,
  50 dead template keys in `agenticStrings.ts` + `agentic/bn.ts`, and their tests (planner, voice, intake).
- **What is** — `lib/agentic/brain.ts` `think()`: one turn = one bounded loop (≤ 8 hops) of Gemini **function calling**
  (`model.ts` `converse`: `tools`, `functionCall` / `functionResponse`, raw parts echoed so thought signatures survive).
  The system prompt is the character bible (`munshi-character.ts`) + operating rules + a **statutory facts block** for
  FY 2025-26 + **the person's situation** (profile seed, the return with engine figures under both regimes, papers in the
  vault with ids and consent state, the DigiLocker catalogue, staged changes, pending cards, what already happened, memory,
  model budget left — never an identifier). The transcript (`RunWorkingState.transcript`, last 40 entries: user, assistant,
  compact tool results) is replayed each turn.
- **Tools** (all in `brain.ts` `TOOLS`, executed by `runCall` through `lib/agentic/actions.ts`): `get_return`,
  `compute_tax` (what-ifs: extra claims / income / regime / smaller salary), `scan_opportunities`, `lookup_rules`
  (BM25 retrieval, cited), `list_documents`, `read_document` (refused until consent), `request_consent` (digilocker |
  documents — a yes/no card, STOP), `ask` (yes_no / choice / number / text / file — a card, STOP), `ask_year_form` (the gap
  form, STOP), `stage_changes` (declare_income / declare_claim / correct_fact / choose_regime → `pendingCommands`),
  `show_review` (filing | regime | corrections → review card, STOP; blocked: balance_due / already_filed / unsupported /
  regime_election), `offer_payment` (challan card, STOP), `refund_status`, `notices`, `reconcile`, `remember`.
  A model tool call is never a confirmation: every STOP tool leaves `waiting_for_input` / `waiting_for_review`, and the
  runtime (`runtime.ts`) turns the answer into its consequence — the pull, the read, the staged form, the payment, the
  applied commands (bound to `{revision, snapshotHash}`, stale → dropped, replay → no-op) — then hands the model a
  `[what just happened]` note and lets it speak.
- **Opportunities engine** — `lib/knowledge/opportunities.ts` `scanOpportunities(persona, {regime, intake})`: every
  saving is `computeTax` twice, measured against the cheaper regime as things stand. Lanes: `claim_now` (80C headroom,
  80CCD(1B), 80D self/parents, 80TTA on interest on record, 80GG when renting without HRA, 24(b) when own home, the regime
  switch), `next_year` (employer NPS 80CCD(2) both regimes — priced at 10% of salary as an illustration, meal vouchers
  ₹26,400 old regime only, LTA), `check` (housing unknown, 87A marginal relief in play). The "12 LPA food coupons" case
  is answered honestly: nothing received this year is relabelled; the structure is arranged with the employer for next year.
- **The check** — `say.ts` `whyRejected(text, {allowed, actionHappened})`: every digit sequence in a reply must exist in
  what the model was shown this turn (system prompt, transcript, tool results, the person's words; numbers ≤ 31 pass as
  dates/counts); no filed/paid claim unless it happened; no PAN/Aadhaar shape; no self-description. A refused reply gets
  one `[check]` nudge, then `replyUnverified` is said and the refusal is recorded as `tool_outcome model.converse ok:false`.
  Advice words are allowed — Munshi ji advises; the figures are still the engine's.
- **Gates** — the reviewer gate (plan §5.7) is now a *disclosure*, not a stop: `actions.ts isSoftIssue` treats
  `tax_review_required`, `facts_incomplete`, `claim_unverified`, `election_unverified`, `residency_unknown` and a
  `deduction_unsupported` on a section the engine knows as things to say once; `capital_gains_unsupported`,
  `income_head_unsupported`, `surcharge_unsupported`, `invalid_values`, `income_unknown`, `unsupported_period`,
  `nonresident_calculation`, `aggregate_cap_unsupported` still block a card. The guard is re-run at confirmation.
- **Templates that remain** (docs/VOICE.md): the challan receipt table, the filing receipt line, the review card and its
  rows, the "simulated" badge, the consent/ form cards' fallback labels, legal lines (injection, budget, stale review,
  error), and the two honest fallbacks `modelOffline` / `replyUnverified`. Activity lines for tool calls are English.
- **Model** — `converse` only; `AGENT_MODEL_TIMEOUT_MS` default 20 000 (a thinking turn with tools). HTTP 429 handling
  rebuilt the same evening: a `retry in Ns` ≤ 30 s is waited out once on the same key+model; otherwise the pair rests
  until the hint (an hour without one); free-tier quotas are **per model**, so `AGENT_FALLBACK_MODEL` / `AGENT_SMALL_MODEL`
  are tried on the same key before the next key (found live: 20 requests/day on gemini-3.5-flash, the lite model
  untouched). `nullModel` → `modelOffline` in the interface language, no menu. `AGENT_MAX_MODEL_CALLS_PER_RUN` is per
  chat; a turn costs 2–4 calls, so the example is now 120 and `budgetExhausted` says "start a new chat", not "tomorrow".
- **Reply language** (user direction the same evening) — follows the person's latest message, not the interface:
  Devanagari → Hindi, romanised Hindi (two or more Hindi function words) → Hinglish, anything else → English
  (`say.ts detectReplyLanguage`, `RunWorkingState.replyLanguage`, set in `createRun` and on every message; the system
  prompt says "Reply in …" and the character prompt is rendered for that language). Only these three for now; cards keep
  the interface language's labels.
- **UI** — unchanged except `app/app/page.tsx` collects every `model.*` outcome for the Progress panel notes; the
  completed-run "Next Available Tasks" strip was removed earlier the same day; the empty-state chips post their label as
  the opening sentence (`createRun` with `task`).
- **Tests** — `lib/agentic/__tests__/runtime.test.ts` rewritten around a scripted model: end-to-end filing with consent →
  form → card → confirm → outputs; replay; stale card; decline; the figure check (refuse, nudge, hold back; pass with a
  ledger figure); consent gate on `read_document`; balance due → challan → card at ₹0; Rakesh blocked with the reason;
  typed answers to cards; budget/cancel/redaction; model off; the system prompt's contents. `model.test.ts` (function
  calls, raw parts, functionResponse mapping), `say.test.ts`, `knowledge/__tests__/opportunities.test.ts` new.
- **Lessons loop for Munshi ji (2026-09-07, night — `docs/MUNSHI-LESSONS.md`)** — per person: `brain.ts previousChats` puts
  the last three chats (title, status, open card/question, last thing said, corrections) into the situation block, so a
  new chat is not blank; `note_correction` tool → `correction` event (redacted), shown as "Noted — …". System level:
  refused tool calls now emit `tool_outcome <tool> ok:false`; `scripts/munshi-lessons-digest.mjs [--days N] [--dry]`
  tallies refusals / corrections / declines from the database into dated drafts under *Drafts (unreviewed)*; a human
  promotes a line into `lib/agentic/lessons.ts` (`MUNSHI_LESSONS`, appended to the rules). The model never edits it.
  Transcript entries redact the model's own tool arguments too.
- **First reply latency (same night)** — `POST /api/runs` and `POST /api/runs/[id]` answered only after the whole first
  model turn; the landing page sat there for the length of a Gemini call. Both routes now respond as soon as the run /
  input is recorded and run the turn in `after()`; the client streams the events. Measured: run id and the person's
  bubble on screen within ~1 s of Send.

## 15. The CA system — Wapsi certified CAs, broadcast requests, inline comments, the comparison (2026-09-08)

Redesign of the whole CA path. The own-CA flow (code + PIN, WhatsApp link, `/ca?code=`) is kept as one of two doors.

- **Server truth: `lib/ca/server-store.ts`** — `CAStore` (Memory via `globalThis.__WAPSI_CA_SERVER_STORE__`, Postgres via
  migration `0007_ca_system`: `ca_accounts`, `ca_sessions`, `ca_reviews`, `ca_comments`). Types: `CAAccount` (scrypt
  password hash, `certified`, `reviewCount`), `CAReviewRequest extends CAReviewRecord` (+ `mode: "wapc" | "own"`,
  `background`, `claimedByCaId/Name`, `updatedAt`), `ReviewComment` (`anchor`, `author {role: ca|citizen, name}`).
  Statuses: `pending → claimed → reviewed → accepted | declined` (`rejected` kept for the old route). CA cookie
  `wapsi_ca_sid` (12 h), separate from the citizen's `wapsi_sid`. `Services.caStore`, `RuntimeDeps.caStore`.
- **Logic: `lib/ca/server-actions.ts`** — `registerAccount` / `loginAccount`, `createReview` (persona PAN must be the
  owner's; `own` needs a PIN), `claimReview` (first come, first served — a second CA gets 409), `submitReview` (sets
  `reviewed`, bumps `reviewCount`, mirrors the CA's figures onto the server return as before), `decideReview`,
  `addComment`, `publicReview` (strips `pinHash`), `mirrorLegacy` (keeps `getLatestReviewForPan` working).
- **Comparison: `lib/ca/compare.ts` `compareReturns()`** — both versions through the engine, row changes with the same
  anchors the comments use (`income:<kind>`, `deduction:<section>`, `taxPaid:tds`, `regime`, `summary`), flags
  (`risk`: income below a third-party statement, TDS raised beyond 26AS; `warn`: claim without proof or above the cap;
  `info`: VI-A under the new regime), and a deterministic recommendation (`ca | original | either`) where a risk flag
  outranks a bigger refund. `/compare` adds a short narrative from `services.model.converse`, checked by `whyRejected`.
- **Routes** — `/api/ca/auth` (GET me + registeredCount; POST register | login | logout), `/api/ca/inbox` (CA: open +
  mine), `/api/ca/reviews` (citizen: GET mine, POST create `{mode, regime, persona, background, clientNotes, pinHash?}`),
  `/api/ca/reviews/[code]` (GET review + comments + viewer; POST claim | submit (CA), accept | decline (citizen)),
  `/api/ca/reviews/[code]/comments` (GET / POST / PATCH resolve), `/api/ca/reviews/[code]/compare`. The old
  `/api/ca/review` now reads and writes the same store. Client wrapper: `lib/ca/client.ts` (`caAuth`, `caInbox`,
  `reviewApi`, `citizenReviews`, `reviewStatusLabel`).
- **CA portal `app/ca/page.tsx`** — register as a Wapsi certified CA / sign in → dashboard (incoming broadcast requests
  with "Take this return", my reviews, the client-code card) → workspace: who the client is (`review.background` —
  situation, their own words, housing, extras), editable Income / Deductions / Taxes-paid worksheets, a comment bubble
  on every row plus "overall" and "regime" threads (Figma-style: click → box → post), regime rail, "Send my version to
  the client". Comments need an account; code+PIN CAs can edit and send but not comment.
- **Citizen side** — `components/ca/ca-share-modal.tsx` opens on two doors: "Get it verified by a Wapsi certified CA"
  (`citizenReviews.create({mode:"wapc"})` with `backgroundFor(persona, regime, state, notes)`) and "I have my own CA"
  (unchanged). `components/ca/ca-comparison-modal.tsx` shows both versions with the recommended column highlighted,
  the changes, the flags, the CA's comments beside their rows, Munshi ji's narrative, and "Keep my version" /
  "Adopt the CA's version". `app/app/page.tsx` polls `citizenReviews.list()` every 6 s and feeds the sidebar's
  **"Your return"** block (`AppShell.workItems`, above Recent chats): the draft midway (rows, position, "not filed")
  and every live review ("Being reviewed by a CA" / "CA review ready"). Banners treat `claimed` like `pending`.
- **Munshi ji** — `ca_review` tool (the person's requests, comments, and the comparison for a reviewed one) and a
  situation line when a review is live. He weighs in; the person decides on the card.
- **Decisions** — "Wapsi certified" is Wapsi's own mark (registered and checked on Wapsi), said so on the register form;
  broadcast requests have no PIN; the CA sees the client's PAN (they need it to file); routes keep the open posture of
  the old `/api/ca/review`. Tests: `lib/ca/__tests__/ca-system.test.ts`.
