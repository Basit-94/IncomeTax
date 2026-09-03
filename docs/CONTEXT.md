# Wapsi — Project Context (read this before touching the code)

**Purpose of this file.** One document that tells an agent everything it needs to work on this repo
without auditing it: what the product is, how it is built, where every piece lives, what the numbers
are, what is real and what is mocked, and how to verify a change. Keep it current: when you change
architecture, a contract, a storage key, a route, or a test count, update the matching line here and
append the detail to `log.md` (append-only, `## [YYYY-MM-DD HH:MM] who (title)` entries).

**Last verified against the tree:** 2026-09-03 (branch `dev`, uncommitted working tree on top of
`13791a1`; the agent never commits, plan D12). Gates at that point: `npx tsc --noEmit` 0 errors ·
`npx vitest run` 262/262 across 26 files · `npx next build` exit 0.

**The plan that produced this version:** `plan.md` (decisions D1–D12, phases, the status table).
**The two surfaces:** `docs/AGENTIC.md`.

---

## 1. What Wapsi is

Wapsi (वापसी, "return") is an independent, synthetic prototype of a simpler Indian income-tax filing
journey for **AY 2026-27 (FY 2025-26)**. Thesis: every number is a *fact awaiting confirmation*, with
provenance, a plain-language meaning, and one citizen action: confirm or correct. Since 2026-09-03
the product has an **agentic surface** that does the work through a deterministic harness, and a
**manual surface** (the original dashboard plus a task grid). Live demo: https://wapsi-amber.vercel.app/
(deploys from `main`; work happens on `dev`).

Everything is invented: personas, PANs (`DEMP…` prefix), employers, banks, amounts, notices, the
DigiLocker consent flow, the acknowledgement numbers (`DEMO…`). Nothing contacts the Income Tax
Department, UIDAI, DigiLocker, NPCI or any bank. `/honesty` and `/architecture` say so; keep them true.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js **16.3** (App Router, Turbopack; middleware is called `proxy` and is not used), React **19.2**, TypeScript **7** strict | `AGENTS.md` warns: APIs differ from training data — read `node_modules/next/dist/docs/` when unsure |
| Styling | Tailwind **4**; tokens in `app/globals.css`; the "Direction 13" index-card look in `app/d13.css` | Money: `.tabular` / `font-mono tabular-nums`, always via `formatMoney` |
| Motion | `motion` v13, `m.*` under `<LazyMotion features={domMax} strict>` | Never gate correctness or a figure's visibility on an animation |
| Storage | **SQLite via Node's built-in `node:sqlite`** (`lib/server/db.ts`, `schema.ts`, 4 migrations), file `data/wapsi.db` (gitignored); tests use `:memory:` | On Vercel the file is ephemeral (documented on `/honesty`); Postgres is plan K1 |
| Auth | Username + password (scrypt), hashed session cookie `wapsi_session`, seeded reviewer account **`asabs` / `12345`** (`lib/server/auth.ts`, `session.ts`) | Signed-in sessions have no question cap; anonymous `/api/agent` keeps the cap of 4 |
| Vault | AES-256-GCM per account, key wrapped by `VAULT_MASTER_KEY` (dev: generated into `data/master.key`); audit row per read (`lib/server/vault.ts`) | The model never sees a value, only a mask |
| Model | Gemini via `lib/harness/model.ts`: `AGENT_MODEL` (currently `gemini-3.5-flash`), `AGENT_FALLBACK_MODEL` (`gemini-3.5-flash-lite`), model-id check, thought summaries, JSON mode, 503 retry | Offline planner (`lib/harness/offline.ts`) runs when the model is unavailable; the run is labelled |
| Tests | `vitest` 4, node, **no jsdom**; browser checks are done live | |
| Backend (optional) | Spring Boot / Java 21 under `backend/`; reference for integer-paise money and the ledger | Not used by the agentic build (plan D1). `mvn` is not installed here |

Scripts: `npm run dev` · `npm run typecheck` · `npm test` · `npm run build`.
Env (see `.env.example`): `GEMINI_API_KEY`, `AGENT_MODEL`, `AGENT_FALLBACK_MODEL`, `AGENT_MAX_TOKENS_PER_REPLY`,
`AGENT_TIMEOUT_MS`, `AGENT_REQUIRE_CONFIRMATION` (true: one click before filing), `WAPSI_DB_PATH`,
`VAULT_MASTER_KEY`, `SESSION_TTL_DAYS`, `DIGILOCKER_MODE` (`mock`|`real`), `NEXT_PUBLIC_MOCK_MODE`,
`NEXT_PUBLIC_BACKEND_URL`.

## 3. Routes

| Route | File | What it is |
|---|---|---|
| `/signin` | `app/signin/page.tsx` + `components/auth/signin-form.tsx` | The site gate. Sign in or create an account. Redirects a signed-in user to `/welcome` (first time) or their surface. |
| `/welcome` | `app/welcome/page.tsx` + `components/auth/welcome-client.tsx` + `components/onboarding.tsx` | Onboarding v4, five pages, **once per account** (`users.onboarded_at`); `?edit=1` reopens without resetting. |
| `/app` | `app/(gated)/app/page.tsx` → `components/agentic/surface.tsx` | The agentic surface: hero → chat, activity log, side panel (Progress/Outputs/Context), history drawer. |
| `/` | `app/(gated)/page.tsx` (~2,300 lines, client) | The manual surface: landing (PAN or persona) → OTP (`949494`) → dashboard. Since 2026-09-03 the dashboard is the **7-card grid** (`components/dashboard/TaxDashboardGrid.tsx`, ids `file_return · match_records · regime_optimizer · pay_tax · notices · return_status · calendar`) under a DigiLocker `QuickStartBanner.tsx`, with a docked `copilot-bar.tsx` (hands its text to `AgentPanel` via `externalPrompt`; the HRA chip opens the tool drawer) and a `profile-sheet.tsx` slide-over behind the header's profile icon (documents, DigiLocker, sign-out). The header also shows a regime toggle preview with both regimes' payable figures. Tool views still open in `components/tools/tool-drawer.tsx` (`compare`, `calendar` now carries the advance-tax schedule, `history` now carries e-verify; `calculator`, `hra`, `capital_gains`, `tds_check`, `advance_tax`, `everify` remain as ids but only `hra` is reachable, from the copilot chip). The 18-tile `task-grid.tsx` is gone. |
| `/vault` | `app/(gated)/vault/page.tsx` → `components/vault/vault-page.tsx` | Per-task requirement matrix, documents + upload, memories (delete), DigiLocker link, audit trail. |
| `/digilocker/consent` | `app/digilocker/consent/page.tsx` | The mock consent screen (Allow/Deny). |
| `/reconcile` | `components/InteractiveTaxDashboard.tsx` | The AIS/26AS reconciliation matrix (unchanged). |
| `/honesty`, `/architecture` | `app/(docs)/…` | Zero-JS disclosure pages. |
| `/api/auth/*` | `signin`, `signup`, `signout`, `me` (GET/DELETE account), `preferences` (mode/lang/theme), `onboarding` | |
| `/api/agent/stream` | `app/api/agent/stream/route.ts` | **The harness.** POST `{runId?, text?, answer?, confirm?, cancel?}` → SSE of `RunEvent`s, each persisted before it is streamed. |
| `/api/agent` | legacy one-shot copilot for the manual panel | cap applies to anonymous sessions only |
| `/api/vault/slots` (GET/PUT/DELETE), `/api/vault/documents` (GET/POST), `/api/vault/digilocker` (+ `connect`, `callback`) | the isolated write path: values go here, never to the model | |
| `/api/runs`, `/api/runs/:id` (GET replay, DELETE), `/api/memory` (GET/POST/DELETE), `/api/outputs/:id`, `/api/returns` (GET, POST e-verify with `949494`) | | |

The gate is `app/(gated)/layout.tsx` (server): no session → `/signin`; not onboarded → `/welcome`;
otherwise `UserProvider` (`lib/user-context.tsx`, `useUser()`).

## 4. State models

### 4a. The ledger (manual journey) — `lib/return/state.ts` (unchanged)
`ReturnState` in localStorage `wapsi_active_data`; arithmetic via `lib/return/compute.ts` → `lib/engine/tax.ts`.

### 4b. The reconciliation context — `context/TaxReturnContext.tsx` (unchanged)
Persisted to `wapsi_reconciliation`; bridged one way from the ledger by `lib/return/upstreamSync.ts`.

### 4c. The account (server) — SQLite tables (`lib/server/schema.ts`)
`users` (mode `agentic|manual`, lang, theme, `onboarding_json`, `onboarded_at`, wrapped vault key) ·
`sessions` · `slots` (ciphertext, iv, tag, `masked`, `source` user|digilocker|document|persona, verified) ·
`documents` (bytes, sha256 dedupe, `extracted_json`) · `vault_audit` · `memories` (key, value; facts only) ·
`runs` (`state_json` = `InterviewState`, plan) · `run_events` (append-only, `seq`) · `outputs` ·
`returns` (the `FiledReturn` JSON, incl. `everifiedAt`) · `digilocker_links` · `question_usage`.

### 4d. The harness — `lib/harness/`
- `events.ts`: the `RunEvent` protocol (run.start, thinking, plan, step.*, tool.*, message, ask,
  answered, card, output, context, memory, error, run.done) and `Card`/`SlotInput` types.
- `tasks.ts`: seven `TaskSchema`s (`file_return`, `compare_regimes`, `business_benefits`,
  `respond_notice`, `pay_tax`, `check_refund`, `demo_persona`) with ordered `SlotSpec`s: plain-language
  question, `input`, `required`, `secret`, `memoryKey`, `dependsOn`, `sources`, `fromOnboarding`, `fills`.
- `interview.ts`: `nextSlot` (first open required slot whose dependencies hold), `applyAnswer`,
  `reopen`, `proposeFromText`, `parseIndianAmount`. State holds masks and choices, never values.
- `engine.ts`: `runTurn(TurnInput)` async generator. Source chain per slot: vault → DigiLocker (when
  linked, for pan/aadhaar/full_name/dob) → onboarding proposal → ask. Model (or offline) classifies
  the first message and rephrases questions; everything else is deterministic. Completion per task:
  compare/review/confirm cards → `fileReturn` (ITR JSON + ITR-V into `outputs`, `returns` row,
  memories). `AGENT_REQUIRE_CONFIRMATION=false` files without the click.
- `tools.ts`: zod-validated `callTool` (`compute_tax`, `compare_regimes`, `presumptive_income`,
  `load_demo_persona`, `pay_challan`, `draft_notice_response`); numbers only ever come from `lib/engine`.
- `model.ts`, `offline.ts`, `memory.ts` (refuses identifiers/amounts), `runs.ts`, `returns.ts`, `view.ts`
  (pure reducer events → `RunView`, the shape the surface renders).
- Client: `components/agentic/use-run.ts` streams SSE; on an answer it PUTs the value to
  `/api/vault/slots` (or POSTs the file to `/api/vault/documents`) and sends only the mask to the harness.

## 5. The seeded personas (`lib/personas.ts`, `TODAY = 2026-08-22`) — unchanged
Sunita Devi `DEMPS4417K` (unfiled, refund ₹8,400) · Rakesh Kumar `DEMPK8823R` (filed, two notices) ·
Priya Sharma `DEMPS9052M` (filed, rent-receipt hold). "Show me a demo" in the assistant seeds one of
them into the vault (`source: persona`).

## 6. The tax engine — `lib/engine/` (unchanged)
New-regime slabs 0–4L nil … >24L 30%; standard deduction ₹75,000 new / ₹50,000 old capped at salary;
s.87A full rebate ≤ ₹12L with marginal relief; s.111A 20%, s.112A 12.5% above ₹1.25L, s.112 12.5%; 4% cess.
72 golden vectors pin it to the Java engine. Known gaps: surcharge, s.234A/B/C, s.234F.
Presumptive scheme (s.44AD 8%/6%, s.44ADA 50%, limits ₹2/3 crore and ₹50/75 lakh) lives in `lib/harness/tools.ts`.

**`lib/taxEngine.ts` (2026-09-03) — the dashboard's exact-paise engine.** Pure, BigInt-paise inside,
imports every slab edge and rate from `lib/engine/constants.ts` (one table, no drift). Applies s.288A
(total income → nearest ₹10) and s.288B (tax → nearest ₹10) once each at the statutory boundaries;
exposes `MARGINAL_RELIEF_UPPER_BOUND_RUPEES` (₹12,70,588, solved from the slab table — note that with
s.288A applied the last income that actually receives relief is ₹12,70,584). API: `computeRegime /
computeNewRegime / computeOldRegime / compareRegimesExact / returnFactsFromPersona / toPaise / toWholeRupees`;
types in `types/tax.ts` (`ReturnFacts`, `RegimeComputation`, `AISVariance`, `AISDiscrepancyAttribution`,
`DashboardCardId`). `lib/__tests__/taxEngine.test.ts` pins it to `lib/engine/tax.ts` on the pre-288B figure
for a salary sweep and the three personas. The ledger and the harness still use `lib/engine`.

## 7. Compliance and helpers
`lib/compliance/` (CBDT codes, CASS radar, Challan 280 identifiers, PDF extraction). **CBDT code table
remapped 2026-09-03** to the pre-audit spec (single source `aisFeedback.ts`, all dependents updated):
CODE_1 correct · CODE_2 not fully correct (needs explanation, `AIS_FEEDBACK_REQUIRES_EXPLANATION`) ·
CODE_3 other PAN / financial year · CODE_4 duplicate · CODE_5 denied. `inferFeedbackCode` in
`context/TaxReturnContext.tsx`, the dispute modal, the reconciliation surface, the copilot engine and the
agent prompt follow it. `cass.ts` gained `assessAisVariance(preFilled, declared)` (exact basis points,
strict `> 20%`). `Correction.attribution?: AISDiscrepancyAttribution` (`lib/return/state.ts`) records the
code, figures, variance, explanation and proof name when the radar fired; `handleFileCommit` sends the
active attributions as `aisFeedback` on the submission payload.
`lib/validation/index.ts`: PAN (holder-type letter, surname-initial warning), Aadhaar/VID (Verhoeff),
TAN, IFSC, bank account, mobile, email, PIN, UAN, GSTIN (state, embedded PAN, mod-36), DIN, ack, BSR,
challan serial, money, DOB; issue codes, plain-language `issueText`. `lib/tools/index.ts`: HRA
exemption, advance-tax schedule, tax calendar, TDS mismatch. `lib/itr/index.ts`: ITR JSON subset, ITR-V HTML.

## 8. Product rules that are not obvious from the code
- The Agentic|Manual switch shows the surface being viewed and persists the preference (`users.mode`).
- Onboarding shows once per account. "Change answers" edits without re-gating.
- Questions never lead with a form name; the name goes in brackets at the end (`tasks.ts`).
- The model never sees a value: `pseudonymisedContext` in `engine.ts` sends onboarding facts, memories
  and slot *ids*, never masks with digits or names; identifiers are stripped by construction.
- Memories are facts. `remember` throws on anything that validates as an identifier or reads as an amount.
- Filing with tax owing shows "Pay the balance first" (mock challan) before filing.
- **Pre-audit scrutiny radar.** Any correction that reduces a pre-filled (non-`self`) income fact by
  more than 20% of the BASELINE figure does not enter the ledger until the citizen binds it to a CBDT
  code in `components/modals/AISDiscrepancyModal.tsx` (`commitCorrection` in `page.tsx`). CODE_1
  withdraws the reduction; CODE_2 needs ≥10 characters of explanation. The grid header shows a
  "CASS scrutiny trigger warning · N" badge while such attributions are active.
- Citizen-facing copy never names a section as the subject; consequence, not rule.
- New UI copy goes through `localize()` (`components/mock-i18n.ts`, en/hi/ta); `Dict` keys need all 23 files.

## 9. Verification protocol
1. `npx tsc --noEmit` (0 errors; zero `any`).
2. `npx vitest run` — 26 files / 262 tests: engine + slab, exact-paise engine (`lib/__tests__/taxEngine.test.ts`), golden export, return state/persist/compute,
   upstreamSync, context reducer, compliance, agent, onboarding v4, submission key, db, auth, view
   reducer, validation, interview + offline planner, vault/memory/runs/tools, DigiLocker, engine
   integration (offline filing run, confirm flag both ways, DigiLocker pull, business + notice), rate-limit, env, tools.
3. `npx next build`.
4. Browser hooks: `data-testid="signin-card|onboarding|onboarding-next|hero|composer|composer-input|composer-submit|composer-mic|hero-chip|chat-shell|run-status|transcript|msg-user|msg-assistant|activity-log|ask-form|ask-answered|ask-yes|ask-no|ask-submit|ask-skip|ask-issue|card-review|card-confirm|card-comparison|card-itrv|card-document|confirm-action|side-panel|progress-list|outputs-list|history-button|history-drawer|new-chat|run-problem|mode-switch|task-grid|tool-drawer|vault-page|vault-matrix|vault-documents|vault-memories|vault-audit|vault-danger-zone|digilocker-consent|consent-allow|everify-code|everify-submit"`,
   dashboard 2026-09-03: `quick-start-banner|quick-start-cta|cass-radar-badge|ais-discrepancy-modal|cass-scrutiny-badge|ais-variance|ais-explanation|ais-attach|copilot-bar|copilot-input|copilot-submit|copilot-chip|profile-button|profile-sheet|profile-documents|profile-digilocker|regime-preview`
   (`data-code` on each CBDT option, `data-regime` on the header seg);
   `data-slot-id`, `data-tile` (now the seven card ids), `data-tool`, `data-step-status`, `data-mode`, plus the older
   `net-position`, `cass-radar`, `itrv-timestamp`, `#fact-<id>`, `#dashboard-tabs`.
   The automation's synthetic "Return" key does not reach React's `onKeyDown`; dispatch a real
   `KeyboardEvent("keydown", {key:"Enter"})` when scripting the composer.
5. Append what you did to `log.md`; update this file if a contract changed. **Never `git commit` or `git push`** (plan D12).

## 10. Where else to look
`plan.md` (the executed plan), `docs/AGENTIC.md`, `docs/PROTOTYPE.md`, `docs/PLAN.md`, `docs/DESIGN.md`,
`docs/ISSUES.md`, `docs/scale/*`, `fixtures/golden/README.md`, `backend/README.md`, `critics/*`, `log.md`.
