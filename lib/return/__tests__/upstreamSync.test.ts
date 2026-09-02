import { describe, expect, it } from "vitest";
import { applyCorrection, confirmFact, type Correction, type ReturnState } from "../state";
import { buildSyncPayload, claimRow, taxPaidRow } from "../upstreamSync";
import { makePersona } from "./fixtures";

function makeState(): ReturnState {
  const persona = makePersona();
  persona.taxPaid = [
    {
      id: "tax-192",
      label: "TDS on salary",
      amount: 40_000,
      section: "192",
      provenance: persona.facts[0].provenance,
    },
    {
      id: "tax-194a",
      label: "TDS on interest",
      amount: 1_200,
      section: "194A",
      provenance: persona.facts[1].provenance,
    },
    {
      id: "sat-140a",
      label: "Self-assessment tax (Challan 280)",
      amount: 5_000,
      section: "140A",
      provenance: { ...persona.facts[0].provenance, reporterKind: "self", statement: "self" },
    },
  ];
  persona.claims = [
    { id: "claim-80c", section: "80C", label: "PF", amount: 100_000, evidenceAttached: true },
    { id: "claim-80d-self", section: "80D_SELF", label: "Health", amount: 20_000, evidenceAttached: true },
    { id: "claim-80d-parents", section: "80D_PARENTS", label: "Parents", amount: 30_000, evidenceAttached: true },
    { id: "claim-80gg", section: "80GG", label: "Rent", amount: 60_000, evidenceAttached: false },
  ];
  return {
    version: 2,
    lang: "en",
    personaId: persona.id,
    baselinePersona: persona,
    persona,
    corrections: [],
    confirmedFactIds: [],
    regime: "new",
  };
}

function correction(
  id: string,
  factId: string,
  previous: number,
  next: number,
  extra: Partial<Correction> = {},
): Correction {
  return {
    id,
    factId,
    field: "amount",
    previous,
    next,
    reason: "wrong figure",
    at: "2026-08-25T10:00:00Z",
    ...extra,
  };
}

describe("buildSyncPayload", () => {
  it("sends every ledger row with reported = declared and nothing answered when untouched", () => {
    const p = buildSyncPayload(makeState());

    expect(p.pan).toBe("DEMPX1234S");
    expect(p.isSalaried).toBe(true);
    expect(p.age).toBe(34);
    expect(p.regime).toBe("NEW");

    expect(p.facts.salary).toEqual({
      reported: 900_000,
      declared: 900_000,
      disputed: false,
      feedbackCode: undefined,
      disputeReason: undefined,
      confirmed: false,
      reportedBy: "Employer",
      statement: "AIS",
    });
    expect(p.facts.savings_interest?.reported).toBe(12_000);
    // Rows the persona does not have arrive as zero, so the context zeroes them.
    expect(p.facts.dividend).toMatchObject({ reported: 0, declared: 0, confirmed: false });
    expect(p.facts.rental).toMatchObject({ reported: 0, declared: 0 });
    // advance_tax has no ledger counterpart and is not sent.
    expect(p.facts.advance_tax).toBeUndefined();
  });

  it("carries a correction as a dispute with both sides and the chosen code", () => {
    const state = applyCorrection(
      makeState(),
      correction("c1", "fact-salary", 900_000, 700_000, {
        feedbackCode: "CODE_3",
        reason: "Two months were never paid.",
      }),
    );
    const row = buildSyncPayload(state).facts.salary;

    expect(row).toEqual({
      reported: 900_000,
      declared: 700_000,
      disputed: true,
      feedbackCode: "CODE_3",
      disputeReason: "Two months were never paid.",
      confirmed: false,
      reportedBy: "Employer",
      statement: "AIS",
    });
  });

  it("treats a denied fact as declared zero", () => {
    const state = applyCorrection(makeState(), {
      id: "c1",
      factId: "fact-interest",
      field: "existence",
      previous: true,
      next: false,
      reason: "account closed years ago",
      at: "2026-08-25T10:00:00Z",
    });
    const row = buildSyncPayload(state).facts.savings_interest;
    expect(row).toMatchObject({ reported: 12_000, declared: 0, disputed: true });
  });

  it("stops carrying the dispute once the correction is reverted", () => {
    const disputed = applyCorrection(makeState(), correction("c1", "fact-salary", 900_000, 700_000));
    const reverted = {
      ...disputed,
      corrections: disputed.corrections.map((c) => ({ ...c, reverted: true })),
      persona: disputed.baselinePersona,
    };
    const row = buildSyncPayload(reverted).facts.salary;
    expect(row).toMatchObject({ reported: 900_000, declared: 900_000, disputed: false });
  });

  it("marks a row confirmed only when every item behind it is confirmed", () => {
    const state = makeState();
    state.baselinePersona.claims.push({
      id: "claim-80c-2",
      section: "80C",
      label: "ELSS",
      amount: 20_000,
      evidenceAttached: true,
    });
    state.persona = state.baselinePersona;

    const one = confirmFact(state, "claim-80c");
    expect(buildSyncPayload(one).facts.sec_80c?.confirmed).toBe(false);

    const both = confirmFact(one, "claim-80c-2");
    expect(buildSyncPayload(both).facts.sec_80c?.confirmed).toBe(true);
    expect(buildSyncPayload(both).facts.sec_80c?.reported).toBe(120_000);
  });

  it("keeps parents' 80D and unmodelled sections as additional claims with their own sections", () => {
    const p = buildSyncPayload(makeState());
    // Only the self premium sits on the sec_80d row (₹25,000 cap).
    expect(p.facts.sec_80d?.reported).toBe(20_000);
    expect(p.additionalClaims).toEqual([
      { id: "claim-80d-parents", section: "80D_PARENTS", label: "Parents", amount: 30_000 },
      { id: "claim-80gg", section: "80GG", label: "Rent", amount: 60_000 },
    ]);
  });

  it("a correction withdraws an earlier confirmation of the same item", () => {
    const confirmed = confirmFact(makeState(), "fact-salary");
    const corrected = applyCorrection(confirmed, correction("c1", "fact-salary", 900_000, 700_000));
    expect(corrected.confirmedFactIds).not.toContain("fact-salary");
    expect(buildSyncPayload(corrected).facts.salary).toMatchObject({ disputed: true, confirmed: false });
  });

  it("pools TDS by section and leaves self-assessment tax to the context", () => {
    const p = buildSyncPayload(makeState());
    expect(p.facts.tds_salary?.reported).toBe(40_000);
    expect(p.facts.tds_bank?.reported).toBe(1_200);
    // The 140A challan is NOT in tds_other: the context holds its own copy.
    expect(p.facts.tds_other?.reported).toBe(0);
  });

  it("carries a corrected TDS figure as a dispute on the tax row", () => {
    const state = applyCorrection(
      makeState(),
      correction("c1", "tax-192", 40_000, 0, { target: "tax", reason: "Deducted on wrong PAN" }),
    );
    expect(buildSyncPayload(state).facts.tds_salary).toMatchObject({
      reported: 40_000,
      declared: 0,
      disputed: true,
      disputeReason: "Deducted on wrong PAN",
    });
  });

  it("does not model claims outside 80C / 80D / 80CCD(2)", () => {
    expect(claimRow("80GG")).toBeNull();
    expect(claimRow("80C")).toBe("sec_80c");
    expect(claimRow("80CCD(2)")).toBe("sec_80ccd2");
    expect(claimRow("80CCD_2")).toBe("sec_80ccd2");
    expect(taxPaidRow("140A")).toBeNull();
    expect(taxPaidRow("194K")).toBe("tds_other");
  });

  it("carries the capital-gains classification from the baseline", () => {
    const state = makeState();
    state.baselinePersona.facts.push({
      id: "fact-cg",
      label: "Shares",
      amount: 110_000,
      kind: "capital_gains",
      capitalGains: { assetClass: "equity_stt", holding: "short" },
      provenance: state.baselinePersona.facts[0].provenance,
    });
    state.persona = state.baselinePersona;
    const p = buildSyncPayload(state);
    expect(p.capitalGainsMeta).toEqual({ assetClass: "equity_stt", holding: "short" });
    expect(p.facts.capital_gains?.reported).toBe(110_000);
  });
});
