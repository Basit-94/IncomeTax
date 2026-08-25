# Rule-source audit — AY 2026–27

Status: **PRIMARY-SOURCE REVIEW COMPLETE FOR MODELED VALUES; SCOPE GAPS REMAIN**.

This audit verifies the values used by the current Java rule resources and the
TypeScript conformance engine. It does not certify the engine as a legal tax
product. The published pages themselves advise checking the governing Act,
rules, and notifications.

## Sources

- [Income Tax Department — Salaried Individuals for AY 2026–27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1)
- [Income Tax Department — Special Regimes for Individuals and HUFs](https://www.incometaxindia.gov.in/w/special-regimes-for-taxation-of-individuals-huf-aop-boi-ajp-companies-and-co-operative-societies)
- [Income Tax Department — Budget 2026 FAQs, rate and marginal-relief examples](https://www.incometaxindia.gov.in/documents/20117/15766092/FAQs-Budget-2026.pdf)
- [Income Tax Department — Threshold limits for AY 2026–27](https://www.incometaxindia.gov.in/web/guest/w/threshold-limits-under-income-tax-act)
- [Income Tax Department — Employees' benefits allowable](https://www.incometaxindia.gov.in/web/guest/w/employees-benefits-allowable)
- [CBDT — ITR-2 validation rules for AY 2026–27](https://www.incometax.gov.in/iec/foportal/sites/default/files/2026-05/CBDT__e-Filing_ITR%202_Validation%20Rules_AY%202026-27_V1.0.pdf)
- [Finance Bill 2026 — 4% Health and Education Cess text](https://www.incometaxindia.gov.in/Budgets%20and%20Bills/2026/Finance_Bill-2026.pdf)

## Mapped values

| Modeled value | Source evidence | Fixture status |
|---|---|---|
| New-regime slabs: ₹0–4L, 5%, 10%, 15%, 20%, 25%, 30% | Budget 2026 FAQs pp.63–65; Special Regimes page | Cited in `2026-27-new.json` |
| New-regime ₹12L rebate threshold and ₹60,000 maximum | Budget 2026 FAQs pp.64–65; AY 2026–27 salaried guidance | Cited; resident/marginal-relief eligibility is a scope note |
| New-regime ₹75,000 standard deduction | Budget 2026 FAQs p.64; Employees' benefits page | Cited |
| Old-regime slabs and age bands | AY 2026–27 salaried and senior-citizen guidance | Cited in `2026-27-old.json` |
| Old-regime ₹50,000 standard deduction | Threshold-limits page; Employees' benefits page | Cited |
| Old-regime ₹5L / ₹12,500 section 87A | AY 2026–27 salaried guidance | Cited |
| 4% Health and Education Cess | AY 2026–27 salaried guidance; Finance Bill 2026 | Cited |
| 80C/80CCC combined ₹1.5L ceiling and 80GG ₹60,000 annual ceiling | AY 2026–27 salaried guidance | Cited, with formula limitation below |
| New-regime 80CCD(2) support | AY 2026–27 salaried guidance | Cited; only this supported subset is enabled in v1 |

## Explicit boundaries

- The engine does not yet model surcharge, special capital-gains rates under
  sections 111A/112/112A, late-filing interest/fee, or the complete 80GG
  least-of-three calculation.
- The v1 claim filter supports employer NPS under 80CCD(2) only. The source
  also describes 80CCH and 80JJAA, but those claim types are outside the
  current synthetic fixtures and are not silently treated as supported.
- Marginal relief is implemented for the published resident-individual
  comparison shape; residency and all surrounding eligibility conditions are
  not modeled by the prototype input.
- These citations remove the old `TODO(verify)` for the values listed above;
  they do not change the synthetic/no-network boundary or imply legal advice.
