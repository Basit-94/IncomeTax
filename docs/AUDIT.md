# Wapsi — Codebase Audit (Step 1)

**Audited:** 25 August 2026 · orchestrator · against working tree at commit state before rebuild.
**Stack:** Next.js 16.3.2 / React 19.2.8 / TypeScript 7.0.2 / Tailwind 4.3.3; `zod` 4.4.3, `motion` 13.1.1, `animejs` 4.5.0, `lucide-react` installed.
**Verification run:** `npm run typecheck` ✅ exit 0 · `npm run build` ✅ static build of `/`, `/architecture`, `/honesty` succeeds.

---

## 1. Structure and how to run it

- **One real route.** `app/page.tsx` (~2,897 lines, `"use client"` on line 1) is the entire product: landing → mock OTP → dashboard with three tabs (`overview` / `statement` / `actions`), modals for disputes/notices/bank-fix/rent-upload, a reviewer sandbox drawer, and a fake dictation widget. No API routes, no server actions, no network calls of any kind (verified — this preserves the synthetic-data property).
- **Docs routes** under `app/(docs)/`: `/architecture` (a genuine engineering design doc: six decisions each with the failure it prevents) and `/honesty` (itemised Works/Invented/Stubbed/Not-built disclosure). Both are server components, English-only by declared design. **Verdict: keep both** — they are assets and directly serve mission non-negotiable #6 (report honestly).
- **Runs clean.** Typecheck and build pass. Nothing broken at the toolchain level.

## 2. `app/page.tsx` — what is in it, and the cost of that concentration

Contents: a **second parallel i18n table** (`LOCALIZED_MOCK_STRINGS`, ~70 keys, lines 44–329) duplicating copy that also exists in `lib/i18n/en.ts`; two decorative animation widgets (`AnimeLens`, `ScrollScatter3D`); inline zod schemas duplicating `lib/validate.ts` (with hardcoded English errors, violating validate.ts's code-based design); an ad-hoc LCG reimplementing `lib/rng.ts`; ~30 `useState` hooks in one mega-component; and all screens.

**Costs observed (not hypothetical):**
- The i18n claim is regressed by construction: ~40+ user-facing English strings bypass the dictionary (header chrome "ASSESSMENT YEAR 2026-27", OTP screen, sandbox drawer, timeline headlines written into persisted data, zod messages). Two sources of truth guarantee drift.
- Dead code accumulates invisibly: `lib/rng.ts`, `lib/speech.ts`, `lib/validate.ts` are imported nowhere; personas.ts helpers (`PERSONA_ORDER`, `PERSONA_LIST`, `getPersona`, `findPersonaByPan`, `daysBetween`) unreferenced; dead imports in page.tsx (`formatDayMonth`, six icons, two types).
- Behavioural bugs hide in the mass: `generateSeededUser` sets `id: "sunita"` on the *custom* persona (line 637); `saveDispute` hardcodes `persona.id === "rakesh"`; the sandbox editor indexes facts positionally; page.tsx:1256 advances refunds through its own state list that skips `in_queue`/`determined`, contradicting canonical `REFUND_SEQUENCE`.
- Parallel work is impossible on this file, and nothing in it is unit-testable.

**Decomposition is mandatory before any feature work.** Proposed target:
```
lib/engine/       pure tax computation (see §3)
lib/return/       return state, persistence, undo
components/       widgets (provenance badge, money row, hold card…)
app/(flow)/       screens: landing, verify, income-review, deductions,
                  regime choice, review, file-confirm, refund tracker
```
Not begun until plan revision (Step 2).

## 3. Where does tax computation live? (inventory)

There is no tax engine. The entire computation is `calculateRefund()`, `app/page.tsx:989–1008`:

```ts
// comment claims "New Tax Regime FY 2026-27 … ≤ ₹7L full s.87A rebate"
if (taxable > 700000) liability = Math.round((taxable - 700000) * 0.15);
return totalTds - liability;
```

One bracket, flat 15% above ₹7,00,000. **Absent from the entire repo:** slab structure, standard deduction, 4% cess, surcharge, regime comparison, s.234A/B/C interest, s.234F fee. Every other rule-shaped constant lives in static persona data (`lib/personas.ts`: TDS §192/§194A rows; 80C ₹1,50,000 / 80D ₹25,000 / 80GG ₹60,000 claims; notice amounts like ₹34,300 and the ₹18,740 AY 2019-20 set-off).

**The arithmetic is already wrong against its own seeded data.** For Priya the engine yields ≈₹7,995 while her narrative says ₹28,400 — the narrative number only reconciles if a standard deduction exists, which the engine doesn't model. Rakesh: engine ≈₹1,17,857 vs seeded ₹41,300. Only Sunita matches. The product currently displays engine output live, so it contradicts its own story files. This is the single worst defect in the repo and confirms the mission's premise: correctness outranks everything.

Every constant lifted from anywhere into a rebuilt engine gets `TODO(verify)` unless primary-sourced. Note the PDF's own warning plus its explicit verify-list (revised-return cutoff split between 31 Dec 2026 / 31 Mar 2027; nil-tax definitions differ).

## 4. Testing — the most serious gap

No test framework in `package.json`; none of the three "Deliberately not used" exclusions is more damaging than this one. A product whose core risk is arithmetic correctness has zero executable checks. Recommendation: **Vitest** (fast, TS-native, works with pure modules, no jsdom needed for engine tests) wired as `npm test`, with the tax engine as first citizen: slab-edge boundaries, regime crossovers, golden files from worked examples. Component-level testing optional later.

## 5. What is genuinely good — preserve explicitly

- **`lib/types.ts` (250 lines):** the provenance model (`Provenance` on every figure, `onlyReporterCanFix`), the nine-state refund machine with holds-that-carry-actions, notice types with DIN + consequence-in-money. This is the intellectual core and it is excellent.
- **`lib/personas.ts`:** three seeded citizens embodying documented failure modes (confirm-don't-compose filing; decoded 143(1)(a)+245 notices; legible wait with named holds), `TODAY = "2026-08-22"` anchor, DEMP-prefix synthetic PANs by construction. Synthetic-by-construction property is structural (prefix-constrained generator), not cosmetic — preserve absolutely.
- **Trilingual `lib/i18n/`**: `Dict = typeof en` makes Hindi/Tamil completeness compile-time enforced; interpolated strings are functions for word-order freedom. Real asset; the monolith bypassing it is the regression, not the dictionary.
- **`lib/money.ts`:** correct en-IN lakh/crore grouping via `Intl`, Latin digits everywhere — deliberate and right.
- **`lib/validate.ts`:** shape-validation with issue *codes*, not messages — exactly right for trilingual validation timing ("incomplete" ≠ error yet).
- **Zero-network architecture:** reviewer isolation via localStorage, no backend to leak through.
- **/architecture + /honesty routes:** honest disclosure as a design principle, already built.

## 6. Correctness, security, data-handling risks

1. **Tax arithmetic wrong vs own seeded data** (§3) — critical.
2. **OTP gate decorative:** master code `949494` accepted universally; any code accepted for custom users. Acceptable *only* if labelled as mock (it partially is); tighten copy honesty.
3. **/honesty overstates:** claims dictation "Works" (it is a scripted `setTimeout` fake inserting canned English chosen by `Math.random()`), "nothing randomly generated" (two `Math.random()` sites), and "every string trilingual" (~40 hardcoded strings). Honesty route must be re-baselined after the rebuild.
4. **Persisted English-only timeline headlines** mean a Hindi/Tamil user's saved history stays English — i18n regression inside stored data.
5. Money as whole-rupee `number` — disclosed on /honesty; fine for prototype.
6. Synthetic-data property intact: DEMP prefix enforced in generator; IFSCs format-valid but invented; no Aadhaar anywhere; zero network calls. **Preserve.**

## 7. Honest pass against `references/review-checklist.md`

| Checklist concern | Verdict |
|---|---|
| One primitive organising the product | ❌ Fails. The primitive inherited from the portal is *the form/tab*. Screens are organised around portal structure ("PART A/B/C", section numbers) not user intent. |
| Progressive disclosure | ⚠️ Partial. Persona acts gate content, but within dashboard all three tabs show everything; a Sunita sees deduction schedules she doesn't need. |
| Forgiveness (undo, staged confirmation) | ❌ Disputes are editable but there is no undo of a dispute, no save-and-resume *of a half-made correction*, no staged confirm before "Send Return". |
| Perceived latency ↔ stakes | ❌ Inverted. "Send Return" fires instantly (high stakes, no deliberation); fake dictation stalls 2s theatrically. |
| Empty states as teaching surfaces | ⚠️ Custom sandbox starts populated; but error states are thin and the "Something went wrong"-style simulated failures show generic text without next-action (ironic given the thesis). |
| Never design for the average | ⚠️ Three personas exist (good) but they are demo acts, not segments served by one adaptive flow. |
| Feedback mandatory | ✅ Generally good micro-feedback (motion, popovers). |
| Validation at entry | ✅ validate.ts philosophy is right (though unused); inline amount editors fire at entry. |
| Defaults decide | ⚠️ No default regime recommendation with visible reasoning anywhere — the optimiser filer is unserved. |
| Complexity conserved — where did it go? | ❌ Complexity was hidden (single flat 15% bracket), not absorbed. The engine lies rather than absorbs. |

## 8. docs/PROTOTYPE.md and plan-review.html

- PROTOTYPE.md is accurate and unusually honest (§7 states gaps plainly). Its §8 remaining-work list is hackathon-submission-oriented (deploy, video, LazyMotion) and predates the simplification thesis — treated as input in Step 2.
- plan-review.html documents the original three-act plan and four self-declared risks; its promised `ExplanationProvider` interface was never built. Noted; feeds Step 2.

---

## Bottom line

The repo contains a strong *story* (types, personas, i18n discipline, honesty doctrine, synthetic safety) wrapped around a weak *engine* (one wrong formula in a 2,900-line component) and an untestable architecture. Priority order: (1) extract a real, tested, pure tax engine; (2) decompose page.tsx so anything can change safely; (3) restore i18n integrity; (4) then redesign the flow around the simplification thesis.
