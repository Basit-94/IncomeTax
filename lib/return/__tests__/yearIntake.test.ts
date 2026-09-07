import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import type { Persona } from "../../types";
import { applyReturnCommand, defaultCommandContext } from "../commands";
import type { ReturnState } from "../state";
import {
  DEDUCTION_CEILING,
  carryDefaults,
  emptyYearIntake,
  filingSection,
  gapGroups,
  inferForm,
  mergeYearIntake,
  regimeLean,
  verdict,
} from "../year-intake";
import { formFieldsFor, yearAnswersFrom } from "../year-form";
import { agenticStrings } from "../../i18n/agenticStrings";

const sunita = PERSONAS.sunita;
const rakesh = PERSONAS.rakesh;
const s = agenticStrings("en");

function heavy(base: Persona, salary: number): Persona {
  // A salaried filer whose old-regime deductions can win: high salary, HRA, 80C and a home loan already claimed.
  return {
    ...base,
    facts: [{ ...base.facts[0], kind: "salary", amount: salary }],
    claims: [
      { id: "c1", section: "80C", label: "80C", amount: 150_000, evidenceAttached: true },
      { id: "c2", section: "24B", label: "24(b)", amount: 200_000, evidenceAttached: true },
      { id: "c3", section: "HRA", label: "HRA", amount: 240_000, evidenceAttached: true },
    ],
  };
}

describe("the year's intake (2026-09-07) — what changes every April", () => {
  it("Sunita's return: the new regime wins even at the deduction ceiling, so the deductions group is skipped", () => {
    const lean = regimeLean(sunita);
    expect(lean.lean).toBe("new");
    expect(lean.decidedWithoutDeductions).toBe(true);
    expect(lean.ceiling).toBe(DEDUCTION_CEILING.reduce((n, c) => n + c.amount, 0));
    const groups = gapGroups(sunita, emptyYearIntake("2026-27", "2026-09-07T00:00:00.000Z"));
    expect(groups).not.toContain("deductions");
    expect(groups).not.toContain("manual"); // her salary is on record
    expect(groups).toContain("extras"); // the ITR-1 gate is always asked once
    expect(groups).toContain("housing"); // no HRA in her Form 16, no property on record
  });

  it("housing is skipped when Form 16 shows an HRA exemption and nothing points at a property", () => {
    const intake = mergeYearIntake(emptyYearIntake("2026-27", "t0"), { read: { salary: { gross: 420_000, exempt10: [{ section: "10(13A)", amount: 60_000 }] }, sftFlags: [] } }, "t1");
    expect(gapGroups(sunita, intake)).not.toContain("housing");
  });

  it("a blank return asks the no-papers figures and keeps the deductions in the same form", () => {
    const blank: Persona = { ...sunita, facts: [], taxPaid: [], claims: [] };
    const groups = gapGroups(blank, emptyYearIntake("2026-27", "t0"));
    expect(groups).toContain("manual");
    const fields = formFieldsFor({ gaps: groups, ownerKind: "citizen", answers: {}, s }, false);
    const keys = fields.map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(["salary_amount", "employer_category", "interest_amount", "resident", "housing", "extras", "pf_amount", "health_amount"]));
    // A profile that already knows the residency never asks it again.
    expect(formFieldsFor({ gaps: groups, ownerKind: "citizen", residencyKnown: true, answers: {}, s }, false).map((f) => f.key)).not.toContain("resident");
  });

  it("the old regime can win for a heavy-deduction filer, so the deductions group stays", () => {
    // ₹15 lakh: under the FY 2025-26 slabs the new regime needs ₹6+ lakh of deductions to lose — this filer has them.
    const p = heavy(sunita, 1_500_000);
    const lean = regimeLean(p);
    expect(lean.lean === "old" || lean.lean === "open").toBe(true);
    expect(lean.decidedWithoutDeductions).toBe(false);
    expect(gapGroups(p, emptyYearIntake("2026-27", "t0"))).toContain("deductions");
  });

  it("infers the form from the ITR-1 eligibility text, verbatim", () => {
    expect(inferForm(sunita, {}).itrForm).toBe("ITR-1");
    // Rakesh sold listed shares within the year: STCG u/s 111A is not the one gain ITR-1 accepts.
    expect(inferForm(rakesh, {})).toMatchObject({ itrForm: "ITR-2", reasons: ["Capital gains other than listed-equity LTCG"] });
    // Listed-equity LTCG within ₹1.25 lakh stays on ITR-1.
    const ltcg: Persona = { ...sunita, facts: [...sunita.facts, { ...sunita.facts[0], id: "ltcg", kind: "capital_gains", amount: 90_000, capitalGains: { assetClass: "equity_stt", holding: "long" } }] };
    expect(inferForm(ltcg, {})).toMatchObject({ itrForm: "ITR-1", reasons: [expect.stringMatching(/LTCG u\/s 112A within/), expect.any(String)] });
    expect(inferForm(sunita, { extras: ["business"] })).toMatchObject({ itrForm: "ITR-3/4" });
    expect(inferForm(sunita, { extras: ["foreign", "director"] })).toMatchObject({ itrForm: "ITR-2", reasons: expect.arrayContaining([expect.stringMatching(/Foreign/), expect.stringMatching(/Director/)]) });
    expect(inferForm(sunita, {}, "nri").itrForm).toBe("ITR-2");
    const rich: Persona = { ...sunita, facts: [{ ...sunita.facts[0], amount: 6_000_000 }] };
    expect(inferForm(rich, {}).reasons).toContain("Total income above ₹50 lakh");
    const bigGains: Persona = { ...sunita, facts: [...sunita.facts, { ...sunita.facts[0], id: "ltcg-big", kind: "capital_gains", amount: 400_000, capitalGains: { assetClass: "equity_stt", holding: "long" } }] };
    expect(inferForm(bigGains, {}).reasons).toContain("LTCG u/s 112A above ₹1.25 lakh");
  });

  it("dates the filing section by the 31 July due date", () => {
    expect(filingSection("2026-07-31", "2026-27")).toBe("139(1)");
    expect(filingSection("2026-08-01", "2026-27")).toBe("139(4)");
    const v = verdict(sunita, emptyYearIntake("2026-27", "t0"), "resident", "2026-09-07");
    expect(v).toMatchObject({ itrForm: "ITR-1", filingSection: "139(4)", regime: { lean: "new" } });
  });

  it("carries last year's answers as defaults, never its documents", () => {
    const last = mergeYearIntake(emptyYearIntake("2025-26", "t0"), { answers: { housing: "rent", extras: ["none"], deductions: [{ section: "80C", amount: 120_000 }] }, sources: { chosen: "digilocker", documents: { form16: ["doc-1"] } } }, "t1");
    const defaults = carryDefaults(last);
    expect(defaults).toEqual({ housing: "rent", extras: ["none"], deductions: [{ section: "80C", amount: 120_000 }] });
    expect(JSON.stringify(defaults)).not.toContain("doc-1");
    const fields = formFieldsFor({ gaps: ["housing", "extras", "deductions"], carried: defaults, ownerKind: "demo", answers: {}, s }, true);
    expect(fields.find((f) => f.key === "housing")?.defaultValue).toBe("rent");
    expect(fields.find((f) => f.key === "pf_amount")?.defaultValue).toBe(120_000);
  });

  it("merges Form 16 ids across employers and records the year on the return through one command", () => {
    const base: ReturnState = { version: 2, lang: "en", personaId: "sunita", baselinePersona: sunita, persona: sunita, corrections: [], confirmedFactIds: [] };
    const one = applyReturnCommand(base, { type: "record_year_intake", assessmentYear: "2026-27", patch: { sources: { chosen: "upload", documents: { form16: ["a"] } } } }, defaultCommandContext);
    expect(one.ok).toBe(true);
    const two = applyReturnCommand(one.ok ? one.state : base, { type: "record_year_intake", assessmentYear: "2026-27", patch: { sources: { chosen: "upload", documents: { form16: ["b"] } }, answers: yearAnswersFrom({ housing: "rent", extras: "none", pf_amount: 50_000, details_parsed: true }) } }, defaultCommandContext);
    expect(two.ok && two.state.yearIntake).toMatchObject({ sources: { documents: { form16: ["a", "b"] } }, answers: { housing: "rent", extras: ["none"], deductions: [{ section: "80C", amount: 50_000 }] } });
  });
});
