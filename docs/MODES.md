# The two modes, screen by screen (T5.4)

**Written 2026-08-29.** Phase 5 acceptance: for every screen, a written answer to
*"what does Simple show, what does Full detail show, and why are they different?"*
Mode lives on the onboarding profile (`mode: "simple" | "full"`), switchable in one tap
from the dashboard profile block, and — once real sessions exist in the front end — synced
server-side via `PUT /api/v1/preferences` (backend live since T5.1; the front end holds no
session token yet, so localStorage remains the client's source of truth for now).

> The organising rule (PLAN §3.2): the switch is not a density slider. Anything whose only
> job is to explain tax vocabulary belongs in Simple and is ABSENT from Full detail.
> Anything that gates a professional's flow to force reading is absent from Full detail too.

| Screen | Simple ("Do it for me") | Full detail ("Show me everything") | Why different |
|---|---|---|---|
| **Onboarding** | Same for both — the mode question IS one of its five answers. | Same. | You cannot mode-split the screen that asks which mode you want. |
| **Landing / OTP** | Same for both. | Same. | Identity has one correct shape; nothing here is tax vocabulary. |
| **Statement (facts)** | Per-kind plain-words explainer under every figure; per-card "Yes, that's right" / "No, this is wrong" — the read-then-confirm gate. | No explainers; no per-card confirm. Cards are reading matter with provenance + dispute links, and ONE sign-off declaration confirms everything ("signed, not crossed off"). | A CA has already done the checking the gate simulates (user directive). The explainer's only job is vocabulary. Dispute stays in both — it is substance, not hand-holding. |
| **Claims rows** | Confirm per row; evidence status shown. | No per-row confirm (sign-off covers them); evidence status STAYS — evidence is substance a CA needs. | Same reasoning as facts. |
| **Overview (money view)** | Three headline boxes + honest proportion bar; refund status in plain words; computation trail CLOSED behind "Show source and calculation trail". | Same headline channels; the trail is OPEN on arrival, summary hidden — no progressive disclosure for its own sake. | The trail is the professional's first read, and friction there is pure cost. A first-timer needs the outcome first. |
| **Trail contents** | Slab slices, special-rate lines (s.111A/112A/112), rebate, cess — same numbers as Full. | Identical numbers. | The arithmetic itself never dumbs down; only its packaging differs. One engine, one truth. |
| **Actions / notices** | Plain-words consequence framing ("If you say nothing by 10 September, ₹1,10,000 is added…"). | Same today. Candidate refinement: DIN/section references promoted, response drafting denser. | Notices are high-stakes for both users; recorded as an open refinement, not a defect. |
| **Wizard (custom PAN)** | Guided steps, hints under disabled buttons, TDS-zero warning, autofill affordances. | Same today — the wizard is inherently a guided surface. A CA entering a client from scratch still benefits from validation. | Deliberate compromise, recorded per T5.4: splitting the wizard would duplicate a data-entry surface for little gain. |
| **ITR-V receipt** | Paper-white replica in both themes. | Same. | It is a picture of a printed form. |
| **Assistant (agent)** | Answers in plain words (the system prompt keys off the mode). | Precise, cites sections, shows arithmetic. | Same tools, same guardrails, different register. |

## Known residual compromises (deliberate, revisit when warranted)

- The wizard and the actions tab are not yet designed twice (rows above say why).
- The "Redesigned Dashboard" judge view has its own coarse model (dividend+capital gains
  folded at slab, disclosed inline) and only 3 translated languages; it is a demo surface,
  not part of the citizen product.
