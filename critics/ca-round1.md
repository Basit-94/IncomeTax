# Critic C — Chartered accountant, round 1

Persona: CA who files dozens of returns and distrusts simplification that hides liability. Viewport: 1440x1000, then Hindi locale. Scope: Priya tracker, prefills, notices/holds, bank-fix validation, Hindi custom-flow spot check. Evidence: `screenshots/c-overview.png`, `screenshots/c-prefills.png`.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Reached filed state at all | PASS | Priya opened in a filed tracker with timeline, holds, bank accounts, and ₹34,800 outcome. |
| 2 | Every field's purpose understood without outside help | PASS | Bank routing, rent evidence, source facts, and correction controls were clear enough for a professional user. |
| 3 | Regime recommendation shown with visible reasoning | BLOCKED | A filed persona does not provide a direct path back to the filing-time regime comparison. |
| 4 | Every ₹ figure traceable to its source | FAIL | Tracker outcomes and hold amounts are visible, but the CA cannot open a source/calculation trail from those figures. |
| 5 | A wrong entry could be corrected without restarting | PASS | Prefill rows expose correction and undo; the bank hold also opens a focused validation modal. |
| 6 | Progress survived a page reload | BLOCKED | This critic did not reload after a correction; persistence was not independently established in this run. |
| 7 | No unexplained jargon or bare acronyms | FAIL | The interface still surfaces `AIS/26AS`, `IFSC`, `80C`, and `80GG`; the CA understands them, but the fixed rubric forbids unexplained jargon. |
| 8 | Errors stated what to do next | PASS | Entering `BAD` in the bank modal produced a concrete length message: the code has 3 characters and must have 11. |
| 9 | One non-English locale exercised end to end | FAIL | Hindi was exercised in the filed dashboard and the custom flow, but the custom Hindi facts still displayed English labels such as “Savings interest” and “Tax withheld (TDS)”. |
| 10 | Nothing claimed as certain that the engine flagged TODO(verify) | FAIL | The tracker treats the engine outcome as final without surfacing which rule inputs still require verification. |
| 11 | Time to complete vs. expectation | PASS | Direct access to a filed review dashboard was quick and dense enough for a CA. |
| 12 | Would use again / would use for a client | FAIL | The missing source trail and residual English in a Hindi flow leave too much liability with the professional to trust this for a client. |

## Verdict

**NOT SATISFIED.** Highest-impact fix: add a CA-grade source/calculation inspector while preserving the first-timer's default progressive disclosure, then remove the remaining English custom-fact labels from Hindi/Tamil.
