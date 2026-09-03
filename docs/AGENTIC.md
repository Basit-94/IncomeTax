# Agentic and Manual (replaces MODES.md)

**Written 2026-09-03.** The Simple / Full-detail register that `docs/MODES.md` described is no longer
what the header switch controls. The product now has two *surfaces*, chosen per account
(`users.mode`, plan D5), and the switch shows the surface being viewed:

| | Agentic (`/app`) | Manual (`/`) |
|---|---|---|
| What it is | One line, "Explain your situation", that becomes a chat on the first keystroke. The assistant classifies the situation, plans, interviews slot by slot, pulls from the vault and DigiLocker before asking, computes with the engine, and files after one confirm click. | The dashboard the product always had (statement, overview, actions, the five-step unfiled flow), plus a grid of tasks that each complete end to end, with tool views in a drawer. |
| Who does the work | The harness (`lib/harness/engine.ts`) | The citizen, with the same engine behind every figure |
| Register | Plain words; "Guide me / Do it for me / Show the details" from onboarding sets pace, not content | The guided register (explainers, per-card confirm). The old Full-detail variant is no longer a switch; its code paths stay behind `mode="full"` props, unused. |

Both surfaces read the same account: the vault (`lib/server/vault.ts`), memories, the filed return
(`returns`), and chat history. A return filed by the assistant shows up in the manual grid's
"Filing history" and "e-Verify" tiles; a persona loaded on the manual side seeds the vault the
assistant reads.

## What the assistant will and will not do

- **Will:** classify the first message (model, or the offline keyword planner when the model is
  down); build a plan from the task schema; ask one question at a time in plain language with the
  form name in brackets; pull PAN/Aadhaar/name/DOB from a linked (mock) DigiLocker; read salary and
  TDS from an uploaded Form 16 PDF; compute both regimes; show a review card; file after the confirm
  click (or without it when `AGENT_REQUIRE_CONFIRMATION=false`); produce the ITR JSON and ITR-V;
  remember non-secret facts across chats.
- **Will not:** decide what to ask (the schema does), type a value into the return (the vault
  does), do arithmetic (the engine does), see an identifier or an amount attached to a name (the
  request builder strips them), or store a value in a memory (the `remember` tool refuses anything
  that validates as an identifier or reads as an amount).

## Onboarding (once per account)

Five pages at `/welcome`, stored on the account, never shown again unless the person opens
"Change answers": language · who you are (work, age band, residency) · where the money comes from
(sources, rough band) · what you have (proofs and holdings, filing history, who filed) · today
(what brought you here, how much help, one optional line). Every answer becomes a proposal the
interview folds into its questions ("Earlier you said yes; tap to confirm or change").

## Where things live

`plan.md` (the executed plan and its status table) · `docs/CONTEXT.md` (the codebase today) ·
`/honesty` (what is real, what is invented) · `lib/harness/*` (the harness) · `components/agentic/*`
(the surface) · `components/dashboard/task-grid.tsx` + `components/tools/tool-drawer.tsx` (manual grid).
