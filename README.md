# Wapsi (वापसी)

Wapsi is a synthetic prototype of a simpler Indian income-tax filing journey for AY 2026-27.
Its thesis has not changed: every number is a fact awaiting confirmation, with a source, a
plain-language meaning and one citizen action. What changed on 2026-09-03 is *who does the
work*. Sign in, answer five onboarding pages once, and pick a surface:

- **Agentic** (`/app`): one line, "Explain your situation". Type it the way you would to a friend.
  The assistant works out which job it is, shows its plan top-right, asks only for what it cannot
  find in your vault or (simulated) DigiLocker, computes both regimes with the tax engine, shows the
  return in plain words, and files after you press one button. Every step it takes is visible in a
  "Worked for 12s" log under each reply; every file it produces lands in Outputs; every chat is kept.
- **Manual** (`/`): the dashboard, the five-step filing flow, and a grid of tasks that each work end
  to end (calculator, regime comparison, advance-tax dates, rent-allowance check, capital gains,
  tax calendar, TDS check, e-Verify, filing history, vault, DigiLocker).

Everything is invented and nothing contacts the Income Tax Department, UIDAI, DigiLocker or a
bank. `/honesty` says exactly what is real.

## Run it

Requirements: Node.js 24 (the database is Node's built-in SQLite) and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, sign in with the reviewer account **`asabs` / `12345`** (or create your
own), answer the five onboarding pages, and try:

- "I got a job with a 14 lakh package and I need to file my taxes. What is the best play here?"
- "I have a small business with 40 lakh revenue. What are the best tax benefits I could get?"
- "I got a letter from the income tax department and I am not sure what it means."
- "Where is my refund?" (after filing)
- "Show me a demo" (loads one of three sample citizens into your vault)

The assistant needs `GEMINI_API_KEY` and `AGENT_MODEL` in `.env` (see `.env.example`). Without a
key, or when the model is overloaded, an **offline planner** runs the same interview from the task
templates and the run is labelled as such; the demo never depends on the model being up.

## What is where

| Piece | Path |
|---|---|
| Accounts, sessions, the gate | `lib/server/auth.ts`, `lib/server/session.ts`, `app/(gated)/layout.tsx`, `/signin`, `/welcome` |
| The vault (AES-256-GCM, per-account key, audit per read) | `lib/server/vault.ts`, `/vault`, `/api/vault/*` |
| DigiLocker (mock consent flow) | `lib/server/digilocker.ts`, `/digilocker/consent` |
| The harness | `lib/harness/` — `tasks.ts` (what is asked), `interview.ts` (state machine), `engine.ts` (orchestrator), `model.ts` (Gemini), `offline.ts`, `tools.ts` (zod-typed), `memory.ts`, `runs.ts` |
| The agentic surface | `components/agentic/`, `app/(gated)/app/page.tsx`, `/api/agent/stream` (SSE) |
| The manual grid and tools | `components/dashboard/task-grid.tsx`, `components/tools/tool-drawer.tsx`, `lib/tools/` |
| The tax engine (unchanged) | `lib/engine/`, pinned to the Java engine by `fixtures/golden/` |
| Validation (PAN, Aadhaar+Verhoeff, GSTIN+mod-36, …) | `lib/validation/` |
| Outputs (ITR JSON, ITR-V) | `lib/itr/`, `/api/outputs/:id` |

`docs/CONTEXT.md` is the one-file orientation for anyone (or any agent) working on the repo;
`plan.md` is the plan that produced this version and its status table; `docs/AGENTIC.md` explains
the two surfaces; `log.md` is the history.

## Verify

```bash
npm run typecheck
npx vitest run
npm run build
```

Typecheck is zero-error and zero-`any`; the suite covers the engine, the ledger, the harness
(interview, planner, tools, memory, vault crypto, DigiLocker, the full offline filing run), the
validators and onboarding. Anything visual is checked in a browser; the `data-testid` hooks are
listed in `docs/CONTEXT.md`.

## Privacy model, in one paragraph

Identifiers and amounts you type go straight into the vault, encrypted with a key wrapped by
`VAULT_MASTER_KEY`; the assistant is told only that the box is filled and sees a masked form. The
figures sent to the model carry no name, PAN, Aadhaar, account or email. Memories are facts
("has a PF account"), never values, and you can read and delete them on `/vault`. Voice uses the
browser's own recognition, which in Chrome sends audio to Google; the mic button says so.

## Security and Secret Management Pass

Before deploying to staging or production:
1. **Never commit real secrets.** All API keys, database connection strings, JWT/session keys, and vault encryption keys must be configured solely via server-side environment variables (see `.env.example`).
2. **Frontend Exposure Guard:** Only variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript. No private API keys (e.g. Gemini, Supabase Service Role, Stripe Secret, DB credentials) should ever have a `NEXT_PUBLIC_` or `REACT_APP_` prefix.
3. **Vault & Database:** Ensure `VAULT_MASTER_KEY` is provided as a 64-character hex key in production. Production will refuse to start without it. Set `SEED_DEMO_ACCOUNT=false` or change `DEMO_PASSWORD` in production.

> [!WARNING]
> **Git History Secret Rotation Warning:**
> If any API key, database credential, token, or secret was previously hardcoded or committed to any git branch or local environment in history, that value remains discoverable in git history. **Rotate all previously used keys and credentials immediately** in the respective provider consoles (Google AI Studio, database providers, etc.) before any public or production deployment.

## The Java backend

`backend/` is the Spring Boot / Java 21 reference for exact-paise money, versioned rules and the
append-only ledger, pinned to the TypeScript engine by the golden vectors. The agentic build does not
depend on it (plan D1). See `backend/README.md`.

