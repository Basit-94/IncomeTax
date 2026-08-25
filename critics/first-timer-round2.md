# Critic A — first-time filer, round 2

Persona: Sunita, Tamil, 375px mobile first; landing → OTP → facts → claims → regime → check → file → after. Evidence: browser walkthrough on 25 Aug 2026; Tamil final tracker showed the verification-status note and the source/calculation disclosure; locale-switch footer was rechecked separately.

| # | Criterion | Score | Evidence |
|---|---|---|---|
| 1 | Reached filed state at all | PASS | Completed the five-step flow and reached the filed tracker. |
| 2 | Every field's purpose understood without outside help | PASS | Fact cards kept the plain meaning, reporter, date, source statement, and correction action together. |
| 3 | Regime recommendation shown with visible reasoning | PASS | Both regime cards showed taxable income and the refund comparison before accepting the recommendation. |
| 4 | Every ₹ figure traceable to its source | PASS | The final outcome has a visible source/calculation-trail disclosure; Check rows list contributing facts, reporters, dates, and source-record identifiers. |
| 5 | A wrong entry could be corrected without restarting | PASS | Every fact card still exposed wrong/confirm, reason capture, and undo. |
| 6 | Progress survived a page reload | BLOCKED | This run did not deliberately reload after a correction; the saved-draft banner appeared, but that is not a replacement for the fixed reload test. |
| 7 | No unexplained jargon or bare acronyms | PASS | AIS, 26AS, TDS, deduction sections, and IFSC now have point-of-use explanations in the tested surfaces. |
| 8 | Errors stated what to do next | PASS | The existing bank-code validation still gives the length and next action. |
| 9 | One non-English locale exercised end to end | PASS | Tamil was used from landing through filed tracker; the final tracker and footer were Tamil after the locale-sync fix. |
| 10 | Nothing claimed as certain that the engine flagged TODO(verify) | PASS | The filed tracker visibly says the prototype rules still need primary-source verification and shows `TODO(verify)`. |
| 11 | Time to complete vs. expectation | PASS | The five-step path remained direct, with one decision per screen. |
| 12 | Would use again / would use for a client | BLOCKED | No post-run interview was possible; the evidence supports use for a guided prototype review but not a user-research conclusion. |

## Verdict

**SATISFIED** under the fixed rubric: 10 PASS, 0 FAIL, 2 BLOCKED; items 1, 4, 5, and 10 are PASS. The reload test remains the next targeted check.
