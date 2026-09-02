# Wapsi — Agentic Pivot Plan

**Written:** 2026-09-03 03:15 by claude, on branch `dev` at `215327e`, replacing the previous living
plan in full (user instruction). The old plan's history survives in `git log -- plan.md` and in `log.md`.
**Owner of this file:** the executing agent. It is the resume point: every batch ends by ticking the
status table in §9 and appending to `log.md`. Anyone (human or agent) resuming work reads §9 first.
**Companion:** `docs/CONTEXT.md` (what the codebase is today). This file says what it must become.

---

## 0. Decisions taken without the user (and why)

The user is away and asked for a plan that needs no input. Where a choice was open, this is what was
chosen and the reason. Each is reversible; none is hidden.

| # | Decision | Reason |
|---|---|---|
| D1 | **Harness, vault, memory and auth live in Next.js (TypeScript), not the Java backend.** | Engine, tool registry, Gemini call and streaming UI are already TypeScript; Maven is not installed; one runtime is what the user can reason about. Java stays as the reference implementation pinned by the golden vectors. Spring AI remains a documented alternative (§11). |
| D2 | **Storage is SQLite via Node's built-in `node:sqlite`** (Node 24 on this machine), file `data/wapsi.db`, schema written in portable SQL. | No Postgres and no Docker daemon on the machine; the user's Supabase projects belong to other apps and creating one incurs cost. The schema is column-for-column portable; a `pg` adapter is a later swap (§10, K1). On Vercel the file lives in `/tmp` and is ephemeral; documented on `/honesty`. |
| D3 | **One confirm click before a return is marked filed** (`AGENT_REQUIRE_CONFIRMATION=true`, already set). | Same pattern as CoWork's plan approval; the user said it may be a flag, so it is. Setting it to `false` makes the agent file without the click. |
| D4 | **Sign-in is username + password, seeded `asabs` / `12345`**, stored as a scrypt hash. Anyone can also register a new username. | User instruction. The old PAN → OTP step stays *inside* manual mode as the way to pick a return (persona or custom), not as the site gate. |
| D5 | **Simple → Agentic, Full detail → Manual** by migration (profile v3). The mode question is removed from onboarding; everyone lands in Agentic with the switch visible. | `docs/MODES.md` already defines Simple as "do it for me" and Full as "show me everything"; the mapping is honest. |
| D6 | **The model is whatever `AGENT_MODEL` says** (currently `gemini-3.5-flash`). The adapter verifies the id against `GET /v1beta/models` once per process and logs a clear error if it does not exist. | The user named "Gemini 3.5 Plus"; the id could not be confirmed. Config, not code. |
| D7 | **A deterministic offline planner runs when the model is unavailable** (no key, quota, network, or bad model id). | The demo must work when the user comes back even if the key fails. Every task schema carries its own scripted question order, so the interview still completes; only the phrasing is less natural. The UI labels the run "offline planner". |
| D8 | **DigiLocker is mocked** behind an OAuth-shaped flow with a `DIGILOCKER_MODE=mock|real` switch; the real adapter is a stub that throws "not configured". | Requester access requires a registered organisation (verified 2026-09-03). |
| D9 | **Voice uses the existing `lib/speech.ts`** (browser speech recognition). The mic button carries a one-line disclosure that Chrome sends audio to Google. | Zero dependencies; already written; honesty rule. |
| D10 | **Aadhaar is stored masked (last 4) plus a Verhoeff-validated flag; the full number lives only in the encrypted slot and is never rendered again.** | The full number is needed for the mocked ITR form; anything else is over-collection. |
| D11 | **Memory is facts, never secrets.** What the agent "remembers" (has a PF account, salaried, prefers Hindi) is a `memories` row the user can see and delete; identifiers and amounts stay in slots. | The user asked for persistent memory; keeping it separate from the vault keeps the privacy boundary intact and the memory list readable. |
| D12 | **No `git commit` and no `git push`, ever, by the agent.** All work stays in the working tree; the user reviews and commits. | User instruction 2026-09-03 03:30. |

---

## 1. Goal, in one paragraph

A signed-in citizen lands on one line, **"Explain your situation"**, with a text box, a mic, and four
chips. The first keystroke turns the page into a chat. The agent classifies the situation, builds a
plan (shown top-right as a checklist the moment it exists), interviews the citizen slot by slot in
plain language, pulls documents from the vault and (mock) DigiLocker before ever asking for them,
computes with the engine, shows a review card, and after one confirm click files the return, drops
the ITR-V and ITR JSON into an Outputs panel, and records everything in the ledger. Every step is
visible in a Claude-style activity log. Every chat is kept and can be reopened; what the agent learned
about the citizen is remembered across chats and shown to them. The model never sees a secret value
and never invents a number. Flip the header switch to **Manual** and the same person gets the existing
dashboard plus a grid of tasks the site can actually complete.

## 2. Non-goals (explicitly out)

- Real filing with the Income Tax Department, real DigiLocker, real payments. Everything is mocked and
  `/honesty` says so.
- Self-hosted model. The pseudonymisation boundary (§4.3) is the privacy mechanism for now.
- Postgres migration (K1), Spring AI (§11), multi-device sync of the vault beyond one SQLite file.
- Redesigning the 23-language dictionaries. New copy goes through `localize()` for hi/ta and English
  elsewhere, per the existing rule.

---

## 3. Architecture

```
browser ── /app (agentic) ──┐                     ┌── lib/harness/planner   (plan → steps)
        ── /  (manual)   ──┤  Next.js route        ├── lib/harness/interview (slot state machine)
        ── /vault        ──┤  handlers (server) ───┤── lib/harness/tools     (typed tool registry)
        ── /signin       ──┘        │              ├── lib/harness/model     (Gemini adapter + offline planner)
                                    │              ├── lib/harness/memory    (remember / recall / forget)
                                    │              └── lib/harness/events    (SSE event stream)
                                    ▼
                        lib/server/db.ts        (node:sqlite, migrations)
                        lib/server/auth.ts      (users, sessions, scrypt)
                        lib/server/vault.ts     (slots AES-256-GCM, audit log, documents)
                        lib/server/digilocker.ts (mock adapter; real stub)
                                    │
                        lib/engine/*  (unchanged: the only place numbers come from)
                        lib/return/*  (ledger; agent writes through the same reducers)
```

### 3.1 Routes

| Route | New/Changed | Purpose |
|---|---|---|
| `/signin` | new | Username + password. Register link. Redirects to `/welcome` (first time) or the last mode. |
| `/welcome` | new | Onboarding (language, intent, profession, filing history, focuses; **no mode question**). Shown once per user; `users.onboarded_at` set on completion. |
| `/app` | new | Agentic surface. Hero → chat. Requires session. `/app?run=<id>` reopens a past chat. |
| `/` | changed | Manual surface = existing journey, gated by session; mode switch in header. Onboarding step removed from the page's own state machine (it lives at `/welcome`). |
| `/vault` | new | Documents, details and memory: present / from DigiLocker / missing per task; upload; "what Wapsi remembers"; audit trail. |
| `/api/auth/*` | new | `signin`, `signup`, `signout`, `me`, `preferences` (mode, lang, theme). |
| `/api/agent/stream` | new | POST, returns `text/event-stream`. The harness. |
| `/api/agent` | kept | Legacy one-shot route for the manual-mode panel; cap logic moved to `lib/server/cap.ts`. |
| `/api/vault/*` | new | `slots` (GET status, PUT value, DELETE), `documents` (GET list, POST upload, GET /:id, DELETE), `digilocker/connect`, `digilocker/callback`, `digilocker/pull`, `audit`. |
| `/api/memory` | new | GET list, DELETE one, DELETE all. |
| `/api/runs` | new | GET list (chat history), GET `/:id` (events for replay), DELETE `/:id`. |
| `/api/outputs/:id` | new | Serves generated files (ITR JSON, ITR-V HTML, challan). |
| `/reconcile`, `/honesty`, `/architecture` | kept | `/honesty` gains the vault, memory, DigiLocker-mock, SQLite-ephemeral and voice disclosures. |

### 3.2 Data model (SQLite, `lib/server/schema.sql`)

```
users            (id TEXT PK, username TEXT UNIQUE, password_hash TEXT, created_at, onboarded_at NULL,
                  onboarding_json TEXT NULL, mode TEXT CHECK(mode IN ('agentic','manual')) DEFAULT 'agentic',
                  lang TEXT DEFAULT 'en', theme TEXT DEFAULT 'light', vault_key_wrapped BLOB)
sessions         (token_hash TEXT PK, user_id, created_at, expires_at, last_seen_at)
slots            (user_id, slot_id TEXT, ciphertext BLOB, iv BLOB, tag BLOB, masked TEXT,
                  source TEXT CHECK(source IN ('user','digilocker','document','persona')),
                  verified INTEGER, updated_at, PRIMARY KEY(user_id, slot_id))
documents        (id TEXT PK, user_id, doc_type TEXT, assessment_year TEXT, filename, content_type,
                  bytes BLOB, sha256 TEXT, source TEXT, extracted_json TEXT NULL, uploaded_at)
vault_audit      (id INTEGER PK, user_id, at, actor TEXT CHECK(actor IN ('user','agent','system')),
                  action TEXT, slot_id TEXT NULL, document_id TEXT NULL, run_id TEXT NULL, detail TEXT)
memories         (id TEXT PK, user_id, key TEXT, value TEXT, source_run_id TEXT NULL, at,
                  UNIQUE(user_id, key))                          -- facts, never identifiers or amounts
runs             (id TEXT PK, user_id, task_id TEXT NULL, title TEXT, status TEXT, created_at,
                  updated_at, plan_json TEXT NULL, state_json TEXT)   -- interview state, not values
run_events       (id INTEGER PK, run_id, seq INTEGER, at, type TEXT, payload_json TEXT)
outputs          (id TEXT PK, run_id, user_id, kind TEXT, name TEXT, content_type, bytes BLOB, at)
question_usage   (key TEXT PK, count INTEGER, day TEXT)         -- anonymous cap only
returns          (user_id PK, state_json TEXT, updated_at)      -- server copy of ReturnState
```

Rules: `slots.ciphertext` is AES-256-GCM under a per-user data key, itself wrapped by
`VAULT_MASTER_KEY` (env; if absent in dev, generated once into `data/master.key` with a console
warning). `masked` is the only column ever sent to the browser or the model. Every read of a slot
value writes a `vault_audit` row. `run_events` is append-only and is what the activity log replays;
it is also the chat history. `memories` values are free text under 200 characters, written only by
the `remember` tool or the user, and are shown verbatim on `/vault`.

### 3.3 The harness (`lib/harness/`)

1. **recall** — load the user's memories and the vault status map (slot ids → filled/masked, never
   values). Both are prepended to the model context as "What you already know about this citizen".
2. **classify** — model (or offline keyword table) maps the first message to a `TaskId` and extracts
   what the sentence already contains (income band, profession, "new job", "small business",
   "notice"). Extracted facts are *proposals*; each becomes a pre-filled answer the user confirms.
3. **plan** — the task schema yields ordered steps; the model may reorder or drop optional steps but
   cannot add tools. The plan is emitted as one `plan` event → the right panel's Progress list.
4. **interview** — a deterministic slot machine: `nextSlot(state)` returns the first unfilled required
   slot whose `dependsOn` are satisfied. The model's only job is to *phrase* the question (with the
   plain-language template as fallback). The UI renders the matching input component; the value goes
   to `/api/vault/slots` directly, never through the model. The model receives
   `{slot, status:"filled", masked}`. Non-secret answers (yes/no, choices) also call `remember`.
5. **gather** — before asking for any document slot, run the source chain: vault → DigiLocker (mock)
   → ask. Each attempt is an event ("Checked your vault: Form 16 found (uploaded 2 Sep)").
6. **compute** — engine only. `compute_tax_ay2026` and `compare_regimes` over the ledger built from
   slots. Emits a `card:review`.
7. **act** — `prepare_filing` → `card:confirm` → user clicks → `file_return` writes to the ledger
   (`markFiled`), the context (`MARK_FILED`), produces ITR JSON + ITR-V → `output` events.
8. **persist** — every event is written to `run_events` before it is streamed, so a reload replays
   and the run appears in chat history with a title derived from the first message.

Tool calls are validated with zod schemas before execution; a malformed call is an `error` event and
the offline planner takes over that step.

### 3.4 Event protocol (`lib/harness/events.ts`)

```
type RunEvent =
  | { type:"run.start";   runId; taskId?; title }
  | { type:"thinking";    text }                      // model thought summaries or planner notes
  | { type:"plan";        steps:[{id,title,detail?}] } // Progress panel appears on this
  | { type:"step.start";  stepId }
  | { type:"step.done";   stepId; note? }
  | { type:"tool.call";   name; argsMasked }
  | { type:"tool.result"; name; summary }
  | { type:"message";     role:"user"|"assistant"; text }   // assistant text via components/agent/format.tsx
  | { type:"ask";         slotId; prompt; input:SlotInput; prefill? }   // renders the isolated form
  | { type:"card";        card:Card }                  // review | confirm | document | itrv | challan | vaultStatus | memory
  | { type:"output";      outputId; kind:"itr-json"|"itr-v"|"challan"|"summary"; name; href }
  | { type:"context";     items:[{kind:"document"|"slot"|"source"|"memory", label, status}] }
  | { type:"memory";      op:"remember"|"forget"; key; value? }
  | { type:"error";       message; recoverable }
  | { type:"run.done";    status:"complete"|"waiting"|"failed" }
```

### 3.5 Task schemas (`lib/harness/tasks/*.ts`)

Each: `{ id, title, triggers[], steps[], slots[], documents[], outputs[] }`. Slots:
`{ id, label, question, why, input, validate, required, secret, dependsOn?, sources:["vault","digilocker","document","ask"] }`.

| Task | Slots (required unless marked `?`) | Documents | Outputs |
|---|---|---|---|
| `file_return` | pan, full_name, dob, aadhaar, mobile, email, employment_type, gross_salary, tds_192, has_pf (→80CCD(2)/80C), savings_interest?, other_income?, rent_paid?, insurance_premium?, investments_80c?, bank_account, ifsc, regime_choice | Form 16 (preferred), bank statement? | ITR JSON, ITR-V, summary |
| `compare_regimes` | gross_salary, deductions bundle (80C, 80D, HRA/rent, 24b?) | none | comparison card, summary |
| `business_benefits` | business_type, revenue, expenses?, gst_registered?, presumptive_opt (44AD/44ADA) | none | benefits card, summary |
| `respond_notice` | notice_din, notice_section, notice_amount, agree/disagree, reason | notice PDF | draft response, summary |
| `pay_tax` | (from ledger) outstanding, bank | none | Challan 280 receipt |
| `check_refund` | pan, ack_number? | none | refund timeline card |
| `demo_persona` | which (sunita/rakesh/priya) | none | loads the persona into the ledger and vault |

Plain-language question phrasing rule (from the user): never lead with the form name. Ask what the
thing *is* ("the salary statement your employer gives you each year, usually in June; do you have
it?"), then name it in small print so the user learns the term.

### 3.6 Memory and chat history (user requirement, added 2026-09-03 03:15)

- **Chat history.** Every run persists (`runs`, `run_events`, `outputs`). The agentic surface has a
  history drawer (clock icon in the header) listing runs newest first with title, task, status and
  date; opening one replays its events, restores the side panel, and lets the user continue if it was
  `waiting`. Delete removes the run, its events and outputs (documents and slots stay; they belong to
  the vault, not the chat).
- **Persistent memory.** `memories(key, value)` rows such as `employment=salaried`,
  `has_pf=yes`, `preferred_language=hi`, `filed_ay_2026_27=yes`. Written by the `remember` tool
  when the interview learns a non-secret fact, and by the user from `/vault`. Read at the start of
  every run and shown to the model as plain sentences. Shown on `/vault` under "What Wapsi remembers"
  with per-item delete and "forget everything". The agent never stores identifiers, amounts, or
  document contents as memories; the tool's zod schema rejects values that match any identifier
  validator or contain a rupee amount.
- **Context panel** lists memories that influenced the current run.

### 3.7 Validation (`lib/validation/`)

One module per identifier, each exporting `validate(raw) → {ok,value,masked?} | {ok:false, issue}` with
issue codes (never messages), plus tests:

| Identifier | Rule |
|---|---|
| PAN | `^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$`; 4th letter = holder type, `P` required for an individual; 5th letter should equal surname initial (warning, not error). |
| Aadhaar | 12 digits, first digit 2–9, Verhoeff checksum valid. Stored masked `XXXX XXXX 1234`. |
| VID | 16 digits, first digit 2–9, Verhoeff. |
| TAN | `^[A-Z]{4}[0-9]{5}[A-Z]$`. |
| IFSC | `^[A-Z]{4}0[A-Z0-9]{6}$` (existing). |
| Bank account | 9–18 digits. |
| Mobile | 10 digits, first 6–9. |
| Email | RFC-lite. |
| PIN code | 6 digits, first 1–9. |
| UAN | 12 digits. |
| GSTIN | 15 chars `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`, state code 01–38, embedded PAN valid, mod-36 checksum. |
| DIN | 20 alphanumeric (ITD document identification). |
| Acknowledgement no. | 15 digits. |
| BSR / challan serial | 7 digits / 5 digits (existing in challan280). |
| DOB | ISO date, age 18–120 for filer. |
| Money | whole rupees, ≥0, ≤ 10^10; Indian grouping on display only. |

### 3.8 UI (`components/agentic/`)

- `Hero.tsx` — big serif line, sub-line, pill input (mic + Ask), four chips (File my return · Compare
  regimes · I received a notice · Load a demo). Chips insert text, not run scripts.
- `ChatShell.tsx` — morph from hero to two-column chat on first submit (`motion` layout animation;
  content never gated on animation, per repo rule).
- `Transcript.tsx` — messages; `ActivityLog.tsx` ("Worked for 22s" collapsible: thinking, tool calls,
  files); `AskForm.tsx` (isolated input per `SlotInput`: text, number, date, select, upload, yes/no);
  `Cards.tsx` (review, confirm, document, ITR-V, challan, vault status, memory).
- `SidePanel.tsx` — Progress (hidden until `plan`), Outputs, Context, matching the CoWork screenshot.
- `HistoryDrawer.tsx` — past chats (§3.6).
- `ModeSwitch.tsx` — Agentic | Manual segmented control in the header of both surfaces; persists to
  `users.mode`.
- Manual grid `components/dashboard/task-grid.tsx` — tiles listed in §5.

---

## 4. Security & privacy design

### 4.1 Auth
- scrypt (`node:crypto`), 16-byte salt, N=2^15. Seed `asabs`/`12345` on first boot only if absent.
- Session token: 32 random bytes, stored as SHA-256 hash, `HttpOnly; SameSite=Lax; Secure` (secure
  only when `NODE_ENV=production`), 30-day expiry, sliding.
- Rate limit sign-in: 10 failures / 15 min per username (in-memory map).
- Signed-in sessions: **no question cap**. Anonymous `/api/agent`: cap 4 (unchanged).

### 4.2 Vault
- Values never appear in: run_events, memories, model prompts, logs, URLs, or React state beyond the
  input component that captured them. After PUT, the input clears and shows the masked form.
- Per-user data key generated at sign-up, wrapped with the master key; rotating the master re-wraps.
- Audit row on every decrypt, including the run id and the tool that asked.
- Documents: 5 MB cap, PDF/PNG/JPEG only, sha256 dedupe per user, `pdfExtract` runs server-side and
  stores only structured fields (amounts) in `extracted_json`; identifiers found in PDFs go to slots.

### 4.3 What the model sees
- Slot *status* and masked values only. Financial figures go to the model **without** name, PAN,
  Aadhaar, account numbers, or email: the request builder strips them and replaces the citizen name
  with "the citizen". This is the pseudonymisation boundary; it is documented on `/honesty`.
- Memories are sent as plain sentences; they cannot contain identifiers or amounts by construction.
- Tool results are summarised server-side before being returned to the model (already the pattern).

---

## 5. Manual mode grid (real tiles only)

| Tile | Backed by | Status |
|---|---|---|
| File / check my return | existing 5-step flow | exists |
| Reconcile with AIS/26AS | `/reconcile` | exists |
| Pay outstanding tax | Challan 280 modal | exists |
| Respond to a notice | Actions tab | exists |
| Tax calculator | engine, new `components/tools/calculator.tsx` | build |
| Compare regimes | `compareRegimes`, new tile view | build (engine exists) |
| Advance-tax schedule | engine + 15 Jun/15 Sep/15 Dec/15 Mar split | build |
| HRA helper | new pure `lib/tools/hra.ts` (min of actual, 50%/40% basic, rent−10% basic) | build |
| Capital-gains helper | s.111A/112A/112 via engine | build |
| Tax calendar | static AY 2026-27 dates, `lib/tools/calendar.ts` | build |
| TDS mismatch check | ledger TDS vs Form 16 extracted | build |
| e-Verify (mock) | new step after filing, Aadhaar-OTP-shaped, `949494` | build |
| Download ITR-V | existing | exists |
| Filing history | `returns` + runs | build |
| My documents & memory (vault) | `/vault` | build |
| Connect DigiLocker (mock) | `/api/vault/digilocker/*` | build |
| Refund status | existing tracker | exists |
| Chat history | `/app` history drawer | build |

Excluded deliberately (would need invented registries): Know your JAO, TAN lookup, CSI file,
Instant e-PAN, Aadhaar-link status, NUDGE campaign.

---

## 6. Onboarding-once (user requirement)

- `/welcome` renders only when `users.onboarded_at IS NULL`. Completion writes `onboarding_json` and
  `onboarded_at`; the localStorage profile is written too (existing consumers), keyed by user id.
- Middleware: `/app`, `/`, `/vault` redirect to `/signin` without session; to `/welcome` without
  `onboarded_at`; `/welcome` redirects to the mode surface if already onboarded.
- "Edit preferences" in the header reopens the same form in edit mode without resetting `onboarded_at`.
- Sign-out clears the cookie and the per-user localStorage keys; a different user on the same browser
  never sees the previous user's profile (keys are suffixed with user id; legacy unsuffixed keys are
  migrated to the first user who signs in, then removed).

---

## 7. Edge-case register

| Area | Case | Handling |
|---|---|---|
| Auth | wrong password | generic "username or password is wrong", counter increments, lockout message after 10 |
| Auth | duplicate username on signup | 409 → "that name is taken" |
| Auth | expired cookie mid-chat | SSE closes with `error{recoverable:false}`; UI shows "sign in again", run persists, resumes after sign-in |
| Auth | two tabs | sessions are server-side; both work; mode switch syncs on focus (`visibilitychange` refetch of `/api/auth/me`) |
| Onboarding | user closes mid-way | draft stored in localStorage as today; `/welcome` resumes at the same step |
| Onboarding | v1/v2 profiles in localStorage | migrated to v3 (mode dropped; `simple`→agentic, `full`→manual written to `users.mode`) |
| Harness | first message is off-topic ("hi") | classify → `unknown` → assistant asks one clarifying question with the four chips |
| Harness | model down / bad key / bad model id | offline planner, run labelled; the run still completes |
| Harness | model returns a tool not in registry or bad args | zod fails → `error{recoverable:true}` → planner supplies the deterministic next step |
| Harness | user answers a different question than asked ("actually my salary is 14L") | free-text answers are classified as slot proposals; if it matches another slot, that slot is filled (after validation) and the current question is repeated |
| Harness | user says "I don't have that document" | slot marked `unavailable`; task schema defines the fallback (Form 16 → ask salary + TDS directly) |
| Harness | user changes an earlier answer | `ask` for any filled slot is allowed via the Context panel; dependent slots re-validated, plan step re-opened |
| Harness | reload mid-run | `/api/runs/:id` replays `run_events`; the last `ask` re-renders |
| Harness | two runs in parallel | one active run per user; a new first message while a run is `waiting` asks "continue or start over" |
| Harness | SSE not supported / proxy buffering | response sets `X-Accel-Buffering: no`, flushes a comment line every 15 s; client falls back to polling `/api/runs/:id` if no event for 30 s |
| Memory | model tries to remember an identifier or amount | `remember` schema rejects; event `error{recoverable:true}`; nothing stored |
| Memory | conflicting fact ("I'm salaried" then "I run a business") | latest wins (`UNIQUE(user_id,key)` upsert); the old value is written to `vault_audit` as `memory.replaced` |
| Memory | user deletes a memory mid-run | next `recall` omits it; the current run's context panel updates on the next event |
| History | run deleted while open in another tab | replay returns 404 → "this chat was deleted", hero shown |
| History | very long run (hundreds of events) | replay paginates by `seq`; activity log virtualises beyond 200 rows |
| Vault | Aadhaar fails Verhoeff | inline "that number doesn't check out; one digit may be off", no save |
| Vault | PAN 4th letter not P | "this looks like a company/firm PAN, not a person's" (block for `file_return`) |
| Vault | upload >5 MB or wrong type | 413/415 with plain message; nothing stored |
| Vault | scanned/compressed PDF | extraction returns nothing → assistant says so and asks for the figures directly |
| Vault | same file uploaded twice | sha256 match → reuse, no duplicate row |
| Vault | DigiLocker mock "connected" but doc missing | chain falls to `ask` with the reason shown |
| Vault | master key missing in production | boot fails loudly with instructions; never falls back to plaintext |
| Filing | outstanding tax > 0 | the confirm card becomes "Pay first" (existing 139(9) rule) and routes to the challan step |
| Filing | already filed this AY | `file_return` becomes revised return u/s 139(5) staging (existing) |
| Filing | confirm flag false | `card:confirm` skipped; `file_return` runs; the review card still shows |
| Manual | persona vs real user | demo personas populate slots with `source:'persona'`, clearly badged; real user starts empty |
| i18n | new UI strings | `localize()` (en/hi/ta) for component strings; no new `Dict` keys unless all 23 files get them |
| Deploy | Vercel `/tmp` SQLite | documented; app boots, data does not persist across deploys |
| Tests | no jsdom | logic (planner, interview, validation, vault crypto, auth, memory) unit-tested in node; UI verified in the browser pane with `data-testid` hooks |

---

## 8. Phases and tasks

Each task lists the files it touches and its acceptance check. Gates after every phase:
`npx tsc --noEmit` (0), `npx vitest run` (all green, count updated in CONTEXT.md), `npx next build`
(exit 0), browser check of anything visual.

### Phase 0 — Foundation (auth, DB, onboarding-once, mode rename)
- 0.1 `lib/server/db.ts` + `schema.sql` + migration runner; `data/` gitignored. Test: opens, migrates, inserts.
- 0.2 `lib/server/auth.ts` (scrypt, sessions, seed asabs) + `/api/auth/{signin,signup,signout,me,preferences}` + `app/signin/page.tsx`. Test: seed, wrong password, lockout; browser: sign in as asabs.
- 0.3 `middleware.ts` gating `/`, `/app`, `/vault`, `/welcome`. Browser: redirects.
- 0.4 `app/welcome/page.tsx` reusing `components/onboarding.tsx` with the mode step removed; `users.onboarded_at`. Shows once; not again after reload or re-sign-in.
- 0.5 Mode rename: `lib/onboarding.ts` v3 (`mode` removed from profile; `UiMode = "agentic"|"manual"` in `lib/mode.ts`), i18n `modeSimple/modeDetailed` → `modeAgentic/modeManual` in all 23 files, `portal-header.tsx`, `personalized-dashboard.tsx`, agent `set_mode` tool, `pushModePreference`, tests. The *register* seam (explainers vs sign-off) is kept internally as `guided = mode==="agentic"` so nothing visual regresses in manual mode. MODES.md rewritten as AGENTIC.md.
- 0.6 Cap: `lib/server/cap.ts`; `/api/agent` skips the cap when a session cookie is valid. Test.

### Phase 1 — Agentic surface (UI)
- 1.1 `app/app/page.tsx` shell + `components/agentic/Hero.tsx` (serif line, pill input, mic via `lib/speech.ts`, chips). Screenshot.
- 1.2 `ChatShell.tsx` morph on first submit; `Transcript.tsx`; `ActivityLog.tsx`; `SidePanel.tsx`; `AskForm.tsx`; `Cards.tsx`; `HistoryDrawer.tsx`. Static event fixtures first so the UI is verifiable before the harness exists. Screenshots of hero, chat, panel, history; dark mode.
- 1.3 `ModeSwitch.tsx` in both headers; `/` reads `users.mode`. Switch round-trips.

### Phase 2 — Harness
- 2.1 `lib/harness/events.ts`, `tasks/*.ts` (7 schemas), `interview.ts` (nextSlot, apply answer, unavailable, revisit), `planner.ts` (schema → steps), `offline.ts` (deterministic phrasing + keyword classifier). Unit tests for every transition in §7.
- 2.2 `lib/harness/model.ts`: Gemini adapter with tool calling, thought summaries, model-id check, timeouts, retries, pseudonymised context builder. Test with a fake fetch.
- 2.3 `lib/harness/tools.ts`: typed registry (zod): `classify_situation`, `request_slot`, `mark_unavailable`, `check_sources`, `compute_tax`, `compare_regimes`, `prepare_filing`, `file_return`, `generate_itr_json`, `generate_itrv`, `pay_challan`, `draft_notice_response`, `load_demo_persona`, `remember`, `forget`, `set_mode`, `set_theme`. Each tool has a test.
- 2.4 `lib/harness/memory.ts` + `/api/memory`; `runs` persistence + `/api/runs` (list, replay, delete). Tests: upsert, reject identifier, list order, delete cascade.
- 2.5 `app/api/agent/stream/route.ts`: SSE, persistence to `run_events`, resume. Curl-level test with the offline planner; browser end-to-end.
- 2.6 Wire the UI to the stream and the history drawer; remove fixtures. Full run "I got a job with a 14 lakh package" completes to a filed return with outputs; reopening it from history replays.

### Phase 3 — Vault, validation, DigiLocker mock
- 3.1 `lib/validation/*` with tests (§3.7); `lib/validate.ts` re-exports for existing callers.
- 3.2 `lib/server/vault.ts` (crypto, slots, audit, documents, source chain) + `/api/vault/*`. Tests: encrypt/decrypt round trip, audit row per read, masked-only output, dedupe.
- 3.3 `lib/server/digilocker.ts` mock (connect → consent page → callback → issued docs: PAN, Aadhaar; never Form 16) + `app/digilocker/consent/page.tsx`. Browser flow.
- 3.4 `app/vault/page.tsx`: per-task requirement matrix, upload, memories with delete, audit list, DigiLocker connect. Screenshot.
- 3.5 Persona → slots + memories loader (`source:'persona'`) so demo accounts have a pre-filled vault. Test.

### Phase 4 — Manual grid and new functions
- 4.1 `components/dashboard/task-grid.tsx` with the §5 tiles, routed. Screenshot.
- 4.2 `lib/tools/{hra,calendar,advanceTax,tdsMismatch}.ts` + tests; tile views.
- 4.3 e-Verify mock step after filing (both modes). Test + browser.
- 4.4 Filing history from `returns`/`runs`.

### Phase 5 — Filing end-to-end through the agent
- 5.1 `file_return` writes ledger + context (`MARK_FILED`), ITR JSON per a documented subset of the ITD ITR-1/ITR-2 schema (`lib/itr/schema.ts`), ITR-V via existing `ItrVReceipt` rendered to static HTML, both stored in `outputs` and served from `/api/outputs/:id`. Outputs panel shows both; files open.
- 5.2 Regime chosen by comparison unless the user overrides; review card explains the choice.
- 5.3 Confirm flag honoured. Test both values.

### Phase 6 — Docs, honesty, gates
- 6.1 `docs/CONTEXT.md` rewritten sections (routes, models, storage keys, test count, hooks), `docs/AGENTIC.md` (replaces MODES.md), `/honesty` and `/architecture` updated, `.env.example` new keys (`VAULT_MASTER_KEY`, `DIGILOCKER_MODE`, `SESSION_TTL_DAYS`), `README.md` quick start with `asabs`.
- 6.2 Final gates, browser walkthrough of both modes in light and dark, `log.md` entry. **No commit, no push (D12)**; leave the tree for the user to review.

---

## 9. Status (the resume table; update after every batch)

Legend: `[ ]` not started · `[~]` in progress · `[x]` done and gated · `[!]` blocked (say why in log.md)

| Task | Status | Note |
|---|---|---|
| 0.1 db | [ ] | |
| 0.2 auth + signin | [ ] | |
| 0.3 middleware | [ ] | |
| 0.4 welcome (onboarding once) | [ ] | |
| 0.5 mode rename | [ ] | |
| 0.6 cap | [ ] | |
| 1.1 hero | [ ] | |
| 1.2 chat shell + panels + history drawer | [ ] | |
| 1.3 mode switch | [ ] | |
| 2.1 schemas/interview/planner/offline | [ ] | |
| 2.2 model adapter | [ ] | |
| 2.3 tool registry | [ ] | |
| 2.4 memory + runs persistence | [ ] | |
| 2.5 stream route + resume | [ ] | |
| 2.6 wire UI + history | [ ] | |
| 3.1 validation | [ ] | |
| 3.2 vault | [ ] | |
| 3.3 digilocker mock | [ ] | |
| 3.4 vault page (docs + memories) | [ ] | |
| 3.5 persona → slots + memories | [ ] | |
| 4.1 grid | [ ] | |
| 4.2 new tools | [ ] | |
| 4.3 e-verify | [ ] | |
| 4.4 history tile | [ ] | |
| 5.1 file_return + outputs | [ ] | |
| 5.2 regime choice | [ ] | |
| 5.3 confirm flag | [ ] | |
| 6.1 docs | [ ] | |
| 6.2 final gates (no commit) | [ ] | |

**Resume protocol.** On every wake-up: read this table, run the three gates to learn the true state
(the table can lag a crash), continue from the first `[ ]`/`[~]`, and before stopping for any reason
tick what is done, write a `log.md` entry, and re-schedule the wake-up. Never leave the tree failing
`tsc`: if a batch is half-done, stub the missing piece so the gates pass, mark `[~]`, and note the stub.

---

## 10. Known follow-ups (not in this plan's scope)

- K1 Postgres adapter (`pg`) behind `DATABASE_URL`; same schema.
- K2 Real DigiLocker requester (needs organisation registration).
- K3 Self-hosted model for full data residency.
- K4 Translating new agentic copy into all 23 languages.
- K5 Java backend parity for the vault/auth (or retirement).

## 11. Alternative kept on record: Spring AI

If the Java story is wanted later: Spring AI's `@Tool` methods give typed, validated tool calls with
Gemini via Google GenAI; the harness's `tools.ts` maps 1:1 to `@Tool` methods. Requires JDK 21
(present) and Maven (absent). Not pursued now per D1.
