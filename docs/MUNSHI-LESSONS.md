# Munshi ji's lessons — the loop, and the drafts

Added 2026-09-07, on the user's question "can the same logic improve Munshi ji?" after the second brain's `Lessons.md`
got its read-back hook. The answer was yes, split in two, because the two halves need different guardrails.

## Loop 1 — what this person taught him (per user)

Mostly the return itself, which was already the memory:

- **Corrections ledger** — `correct_fact` is event-sourced and replayed on every read; a disputed reported figure lives
  there, never in a note.
- **`yearIntake.answers`** — what they told him this year (housing, extras, deductions), so he never asks twice.
- **`remember`** — the four allow-listed preference keys (§5.5: never an amount, never an identifier).
- **Earlier chats in the situation block** (new) — `brain.ts previousChats`: the person's last three runs, newest first —
  title, date, status, whether a review card or a question was left open, the last thing he said, and any corrections
  they made (`note_correction` entries in that run's transcript). About 200 tokens. A new chat no longer starts blank.
- **`note_correction`** (new tool) — when the person corrects him (a figure he misread, a rule he misstated, a tone that
  landed badly, a step he skipped) he records `{scope, what, correct?}` before answering. It is persisted as a
  `correction` event (redacted), shown in the transcript as "Noted — …", remembered in later chats through
  `previousChats`, and counted by the digest. A disagreement about a *reported* figure is a `correct_fact`, not this.

## Loop 2 — what everyone taught him (system level)

The signal was already on disk. Every run event is persisted before it is streamed, so a day of chats leaves:

| Signal | Event |
|---|---|
| a reply the figure check refused | `tool_outcome` `model.converse` `ok:false`, with the reason |
| a tool call the runtime refused or rejected (consent missing, unknown section, blocked card) | `tool_outcome <tool>` `ok:false` (emitted since 2026-09-07) |
| a correction the person made | `correction` |
| a review card or consent declined | `confirmation accepted:false`; `answer false` on a `consent:*` question |

`scripts/munshi-lessons-digest.mjs [--days N] [--dry]` reads that window from the database, tallies it, and appends a
dated block of **draft** lessons under *Drafts (unreviewed)* below. Without a database (demo runs in process memory)
it says so and exits.

**Promotion is by hand.** A draft that holds becomes one line in `lib/agentic/lessons.ts` (`MUNSHI_LESSONS`), which
`brain.ts` appends to the operating rules on every turn under "Lessons in force". The model never writes to that
file: a tax agent that revises its own instructions from one person's disagreement is how a wrong claim becomes
policy. Keep the list short — a lesson that has held for months belongs in the rules proper; one tied to a fixed bug
comes out. Cost of the whole loop at runtime: the lessons block (~20 lines when full) plus ~200 tokens of earlier
chats, both inside the cached system prompt.

Suggested schedule: the same 09:00 job that runs the second brain's digest (`C:\Claude\second-mind`), one extra step:
`node scripts/munshi-lessons-digest.mjs --days 1` in this repo.

## In force

See `lib/agentic/lessons.ts` — empty at creation. The first drafts come from the first day the digest runs against a
database-backed deployment.

## Drafts (unreviewed)
