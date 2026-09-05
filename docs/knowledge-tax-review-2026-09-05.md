# Tax knowledge review — 5 September 2026

Scope: all five files in `lib/knowledge`, plus the engine and agentic consumers where needed to verify a claim. Branch: `dev-2`. Release: `2026-09-05.1`. This is a review, not an implementation or professional tax sign-off.

**Verdict: the 12-entry corpus is an engineering draft and is not ready to support reliable tax recommendations.** Several headline amounts are correct, but material legal exceptions, current filing rules, and executable eligibility checks are wrong or incomplete. Passing the current tests does not resolve these findings.

## Findings

### 1. High — the defective-return rule repeats a repealed condition

Location: `lib/knowledge/provisions.ts:240–241`.

The corpus says an unpaid self-assessment tax balance makes a return defective. Clause (aa) of the explanation to section 139(9) was removed, effective from AY 2017–18. An otherwise valid return is not defective merely because section 140A tax/interest was unpaid. The payment obligation remains; it is a different legal consequence. [CBDT Circular 3/2017, paragraphs 55.9–55.10](https://incometaxindia.gov.in/communications/circular/circular03_2017.pdf).

The adjacent summary also treats a shortfall against third-party reporting as sufficient explanation for a defective return. A mismatch needs its actual notice type and statutory ground checked; it is not a general definition of a section 139(9) defect. This error is repeated in `docs/CONTEXT.md` and should be corrected together with affected product explanations in a follow-up change.

### 2. High — filing dates are not current for AY 2026–27

Location: `lib/knowledge/provisions.ts:222–228`.

The entry combines belated and revised returns under a single 31 December 2026 deadline. Current departmental guidance permits revision through 31 March 2027, subject to earlier completion of assessment, and identifies an additional section 234-I fee for revisions after December. The ordinary belated-return deadline remains separate. [ITR-1 FAQs, questions 19–20](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/ITR1-FAQ?mobile-app=1), [return transition FAQs, question 6](https://www.incometax.gov.in/iec/foportal/node/11724).

The same entry covers business/professional income but says all non-audit individuals have a 31 July deadline. The current calendar distinguishes 31 July and 31 August non-audit categories; business/professional cases need their own rule. [Departmental return FAQs](https://www.incometax.gov.in/iec/foportal/node/11724).

Use a versioned deadline table with filing category, assessment year, amendments/extensions, and assessment-completion status. Do not infer universal section 234A interest from lateness alone: the applicable unpaid-tax base also matters. Verification limitation: the Finance Act 2026 Gazette PDF returned HTTP 502; the deadline findings above use current official portal guidance, not an independently downloaded enactment. One transition FAQ still labels its March date as a Finance Bill proposal; the current ITR-1 FAQ explicitly describes the change as applicable from AY 2026–27.

### 3. High — section 87A eligibility is overstated

Locations: `lib/knowledge/applicability.ts:55–70`; `lib/knowledge/provisions.ts:85`.

`rebate87A` returns `eligible` with “marginal relief applies” for every new-regime income above ₹12 lakh. Reproduced at ₹20 lakh total income. With ordinary slab income, pre-cess tax there is ₹2 lakh, below the ₹8 lakh excess over the threshold, so no marginal relief arises. The existing test even expects relief wording at ₹12.85 lakh **total income**, where ordinary slab tax is ₹72,750 and the excess is ₹85,000. This must not be confused with ₹12.85 lakh gross salary before the standard deduction.

The text names only section 112A as excluded special-rate tax. For AY 2026–27 the new-regime rebate is capped at tax calculated under section 115BAC(1A), so its description needs to cover other special-rate income too. Old-regime treatment must remain distinct. [Finance Act 2025, section 20](https://incometaxindia.gov.in/Documents/Act/Finance-Act-2025.pdf).

The predicate also accepts a missing taxpayer category, despite the resident-individual condition. It needs the tax composition and actual relief amount, not just total income and regime. The mixed-income marginal-relief calculation in the engine deserves independent statutory examples; corpus/engine agreement alone is insufficient.

### 4. High — capital-gains rules omit relief that changes tax payable

Locations: `lib/knowledge/applicability.ts:118–128`; `lib/knowledge/provisions.ts:171,188,205`.

The section 112A helper always subtracts only ₹1.25 lakh and declares the balance taxable at 12.5%. It ignores the unused basic exemption available to resident individuals/HUFs. A resident individual in the new regime with only ₹3 lakh of qualifying section 112A gains has nil tax after the basic-exemption adjustment. The helper instead declares ₹1.75 lakh taxable; the engine actually returns ₹22,750 including cess. [Section 112A(2), resident individual/HUF proviso](https://www.incometaxindia.gov.in/w/section-112a-61).

Section 112's blanket “12.5% without indexation” also omits protection for resident individuals/HUFs transferring land/buildings acquired before 23 July 2024: excess over the pre-amendment tax computation is ignored. The section also contains a basic-exemption adjustment. [Section 112(1)(a), provisos](https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-112-63).

The headline 20%/12.5% rates are not the problem. Eligibility needs asset classification, acquisition/transfer details, residency, ordinary income, losses and applicable exemptions. A single positive gain amount cannot establish the final taxable base.

### 5. High — deduction eligibility promises caps the engine does not enforce

Locations: `lib/knowledge/applicability.ts:76–89`; `lib/knowledge/provisions.ts:119,136,154`; related implementation `lib/engine/tax.ts:49`.

Direct executions reproduced these discrepancies:

| Case | Current engine result | Required treatment |
| --- | --- | --- |
| ₹1.5 lakh each under 80C and 80CCC | ₹3 lakh deduction | Shared ₹1.5 lakh ceiling under 80CCE |
| ₹50,000 qualifying self-premium for a resident senior | ₹25,000 deduction | Up to ₹50,000, subject to conditions |
| ₹5 lakh employer NPS claim against ₹15 lakh gross salary | Entire ₹5 lakh deduction | Salary-percentage cap; even 14% of the entire gross salary is only ₹2.1 lakh |

The 80C/80CCC ceiling is confirmed in [official deduction guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1). The NPS percentage and salary definition are in [section 80CCD(2) and its explanation](https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-80ccd-20). The corpus's “basic plus DA” wording should specify qualifying DA under the employment terms.

The 80D entry omits preventive check-ups (₹5,000 within overall limits, cash permitted), uninsured senior medical expenditure, and the separate HUF treatment despite including HUFs in its categories. The higher senior limit requires the statutory residency/age conditions. [Departmental 80D tutorial](https://incometaxindia.gov.in/Tutorials/20.%20Tax%20benefits%20due%20to%20health%20insurance.pdf).

The predicate returns `eligible` for `{regime:'old', claims:[{section:'80D', amount:50000}]}` without knowing beneficiary, age, payment mode, or qualifying expense. Unknown evidence also passes, whereas explicit `evidence:false` blocks reliance. Distinguish eligibility, amount allowed, evidence status, and software support.

### 6. High — opting into the old regime ignores timely filing

Location: `lib/knowledge/applicability.ts:97–104`.

With `hasBusinessOrProfessionIncome:false`, the helper permits switching without checking election direction, filing timing or existing election. Choosing the old regime requires exercising the option in a return filed by the section 139(1) due date. That condition is in the corpus but absent from the executable rule. [Official regime-choice guidance](https://www.incometax.gov.in/iec/foportal/help/new-tax-vs-old-tax-regime-faqs?mobile-app=1%2Fe-Campaigns%2Fe-mail%2Fhelp%2Fhow-to-manage-itdrein%2Fhelp%2Fhow-to-use-e-filing-dashboard-worklist%2Fhelp%2Fhow-to-use-e-filing-dashboard-worklist%2Flatest-news%2Fhelp%2Fhow-to-log-in-e-filing-portal).

The business-income branch appropriately refrains from executing an unverified election, but a single `priorRegimeOptOut` boolean cannot represent the election/withdrawal history it asks about.

### 7. High — unsupported periods still produce affirmative tax advice

Location: `lib/knowledge/applicability.ts:133–142`.

For `PERIOD_FY_2026_27`, the combined evaluator returns `period_supported: ineligible` followed by eligible standard deduction, rebate and regime-switch results citing FY 2025–26 provisions. Missing periods have the same structural problem. Period validation is another result in an array, not a prerequisite.

The FY/AY/TY distinction itself is correct: FY 2025–26 remains governed by the 1961 Act; the 2025 Act applies from 1 April 2026. [Official transition guidance](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/objective-and-scope-new-act-faq).

Unsupported coverage should stop downstream applicability or explicitly mark all dependent decisions unsupported. It should not imply the taxpayer is legally ineligible for relief merely because this release lacks rules.

### 8. Medium — retrieval can exclude valid rules and reintroduce excluded ones

Locations: `lib/knowledge/provisions.ts:160`; `lib/knowledge/retrieval.ts:64–70,87–94`.

An exact NPS request for category `senior` returns no provision because 80CCD(2) is tagged only `individual`. A senior employee remains an individual; age and legal entity type should be separate attributes.

Conversely, an exact `115BAC` request for an HUF with other-source income returns linked salary-standard-deduction and resident-individual rebate provisions. Link expansion rechecks only financial year. Contextual exceptions may be useful, but they must retain their applicability status rather than appearing as unqualified evidence.

The Hindi query `मानक कटौती` returns zero provisions. The public search is English lexical matching with Unicode tokenization; that does not provide multilingual retrieval. No language dictionaries were changed during this review.

### 9. Medium — provenance and tests do not establish legal review

Locations: `lib/knowledge/provisions.ts:30–55`; `lib/knowledge/__tests__/knowledge.test.ts:15–35`; `lib/knowledge/retrieval.ts:107–111`.

Ten of twelve entries cite the same changing salaried-help URL, several labelled `sourceKind:'act'` or `'finance_act'`. A section locator in metadata does not turn a help page into the statutory text. Attach exact enactment/section sources and amendment history, retaining help pages as secondary explanatory sources.

The content hash is recalculated from the current rule text at module load. Its test recalculates the same hash. Likewise, parity tests compare text generated from imported constants against those same constants. These detect neither legal errors shared with the engine nor an unapproved edit against an immutable release. Hashes also exclude summaries, predicates, links and other answer-affecting metadata.

The draft reviewer string is honest, but `cite()` drops review status; the inspected agentic runtime marks citations `verified:true`. The runtime also hardcodes residency to true. These are adjacent integration risks: adding citations does not validate either the taxpayer facts or the legal conclusion. Those files already had user changes and were not edited.

## Correct foundations and coverage limits

The AY 2026–27 slab constants, ₹75,000/₹50,000 salary standard deductions, ₹12 lakh/₹60,000 new-regime rebate threshold/cap, ₹5 lakh/₹12,500 old-regime threshold/cap, and headline equity-gains rates are broadly aligned with official guidance. The business-election distinction and separation of Act from regime are useful foundations. [AY 2026–27 guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1).

The knowledge corpus itself has no complete slab/surcharge/cess provisions and no comprehensive salary-exemption, house-property, loss-set-off, senior-interest, foreign-income, or tax-credit reconciliation coverage. It also lacks substantive 2025-Act rules. These are coverage limits, not proof that every absent feature is a bug. The supported slice and abstention rules must match what is actually implemented.

## Verification and follow-up

- Existing knowledge suite: `npm.cmd test -- lib/knowledge/__tests__/knowledge.test.ts` — **13/13 passed**. The initial `npm` invocation was blocked by PowerShell's script policy; the installed `.cmd` launcher succeeded.
- Read-only diagnostic executions used the installed Vite module loader; no diagnostic source files were added. Cases and observed outputs are recorded above.
- No full build, UI/browser checks, Java tests or full application suite were run for this review. No application code, UI, dictionaries, or contracts were changed.
- Recommended order: correct legal text and source records; implement period/eligibility guards and independent tax examples; reconcile engine caps/calculations; repair retrieval and review-status propagation; then obtain qualified tax review before treating the release as approved.
- No commits, pushes, merges or deployments performed. Existing and concurrently appearing user changes were preserved.
