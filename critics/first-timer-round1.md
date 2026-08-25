# Critic A — First-timer, round 1

Persona: 18-year-old first-time filer. Viewport: 375x900. Locale: Tamil, selected through the Sunita path. Scope: landing, OTP, facts, deductions, regime, check, staged file, acknowledgement. Evidence: `screenshots/a-start-mobile.png`, `screenshots/a-facts-mobile.png`, `screenshots/a-correction-modal.png`.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Reached filed state at all | PASS | The path reached the filed dashboard and showed the acknowledgement/tracker state. |
| 2 | Every field's purpose understood without outside help | PASS | PAN, OTP, reported money, claim questions, regime cards, and the final send action were introduced in plain language. |
| 3 | Regime recommendation shown with visible reasoning | PASS | The old/new screen showed both computed outcomes and a recommendation button before Check. |
| 4 | Every ₹ figure traceable to its source | FAIL | Fact cards expose provenance, but the final refund summary is a bare outcome with no visible source link on the filing path. |
| 5 | A wrong entry could be corrected without restarting | PASS | The first income row opened a correction form with amount, reason, close, save, and later undo. |
| 6 | Progress survived a page reload | BLOCKED | This critic did not reload during the bounded run; another critic tested persistence separately. |
| 7 | No unexplained jargon or bare acronyms | FAIL | The provenance badge exposes `26AS` without explaining the statement name to a first-time filer. |
| 8 | Errors stated what to do next | BLOCKED | No filing fault was triggered during this run. |
| 9 | One non-English locale exercised end to end | PASS | Tamil rendered from OTP through filed acknowledgement and dashboard controls. |
| 10 | Nothing claimed as certain that the engine flagged TODO(verify) | FAIL | The engine-backed outcome and regime recommendation are presented as settled figures while the rule constants remain verification-marked internally. |
| 11 | Time to complete vs. expectation | PASS | The complete seeded journey was comfortably within a first-timer's expected few minutes. |
| 12 | Would use again / would use for a client | PASS | The guided sequence and reversible correction would be preferable to composing a return from a blank form. |

## Verdict

**NOT SATISFIED.** Highest-impact fix: make engine/rule verification status visible beside the outcome and explain statement acronyms at the point of provenance.
