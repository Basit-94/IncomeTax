/**
 * Lessons in force for Munshi ji (2026-09-07) — the system-level half of the lessons loop.
 *
 * The signal is written for free: every refused reply (`tool_outcome model.converse ok:false`), every tool call the
 * runtime refused (`tool_outcome <tool> ok:false`), every `correction` the person made (the `note_correction` tool),
 * every declined card. `scripts/munshi-lessons-digest.mjs` reads a day of those events and DRAFTS lessons into
 * `docs/MUNSHI-LESSONS.md`. A human promotes a draft by adding one line here. Nothing here is written by the model
 * about itself — a tax agent that revises its own instructions from one person's disagreement is how a wrong claim
 * becomes policy.
 *
 * Each line is one imperative sentence, read by `brain.ts` into the operating rules on every turn. Keep it short: a
 * lesson that has held for months belongs in the rules proper; one tied to a fixed bug comes out.
 */
export const MUNSHI_LESSONS: readonly string[] = [];
