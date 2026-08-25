# Critic B — Optimiser, round 1

Persona: time-poor professional who has filed before. Viewport: 1280x900. Locale: Hindi. Scope: seeded Rakesh dashboard, prefills, correction, refresh persistence, notices. Evidence: `screenshots/b-facts-hindi.png`, `screenshots/b-statement-hindi.png`, `screenshots/b-correct-capital-gains.png`, `screenshots/b-corrected.png`.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Reached filed state at all | PASS | Rakesh opened directly in a filed refund tracker with his ₹94,118 engine-backed outcome. |
| 2 | Every field's purpose understood without outside help | PASS | Income, TDS, claims, correction amount/reason, and notice response controls were understandable from labels and context. |
| 3 | Regime recommendation shown with visible reasoning | BLOCKED | This seeded persona is already filed, so the dashboard run did not expose the filing-time regime comparison. |
| 4 | Every ₹ figure traceable to its source | FAIL | The prefill rows have provenance, but the refund total, notice stakes, and hold amounts are not all linked to a visible source or calculation line in the tracker. |
| 5 | A wrong entry could be corrected without restarting | PASS | Rakesh's capital-gains row accepted a Hindi reason and a zero replacement, then offered undo. |
| 6 | Progress survived a page reload | PASS | After reload, the corrected capital-gains row remained corrected and the restored-draft state was visible. |
| 7 | No unexplained jargon or bare acronyms | FAIL | `AIS/26AS`, `TDS`, `80C`, and `80D` remain visible labels without a point-of-use glossary. |
| 8 | Errors stated what to do next | BLOCKED | This run did not trigger a recoverable filing or validation error. |
| 9 | One non-English locale exercised end to end | PASS | Hindi rendered through dashboard, prefill correction, refresh, and notice views. |
| 10 | Nothing claimed as certain that the engine flagged TODO(verify) | FAIL | The ₹94,118 outcome is displayed definitively even though the active engine constants are explicitly marked for verification. |
| 11 | Time to complete vs. expectation | PASS | The direct filed dashboard and one-row correction were fast enough for a repeat filer. |
| 12 | Would use again / would use for a client | PASS | A persisted correction plus visible reporter/date is materially better than a silent prefill mismatch. |

## Verdict

**NOT SATISFIED.** Highest-impact fix: give the tracker and every material rupee figure an expandable engine/source trail, including verification status.
