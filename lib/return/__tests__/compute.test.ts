import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import { computeForPersona } from "../compute";

describe("engine-backed seeded refund narratives", () => {
  it("pins Priya's tracker amount to the current new-regime engine output", () => {
    const persona = PERSONAS.priya;
    expect(persona.refund.amount).toBe(computeForPersona(persona, "new").refundOrDue);
    expect(persona.refund.amount).toBe(34_800);
  });

  it("pins Rakesh's tracker amount to the current new-regime engine output", () => {
    const persona = PERSONAS.rakesh;
    expect(persona.refund.amount).toBe(computeForPersona(persona, "new").refundOrDue);
    expect(persona.refund.amount).toBe(94_118);
  });

  it("credits Challan 280 self-assessment tax u/s 140A to reduce or settle tax payable", () => {
    const persona = {
      ...PERSONAS.rakesh,
      taxPaid: [
        ...PERSONAS.rakesh.taxPaid,
        {
          id: "sat-test",
          label: "Challan 280",
          amount: 20_000,
          section: "140A",
          provenance: PERSONAS.rakesh.taxPaid[0].provenance,
        },
      ],
    };
    const breakdownBefore = computeForPersona(PERSONAS.rakesh, "new");
    const breakdownAfter = computeForPersona(persona, "new");
    expect(breakdownAfter.tdsCredits).toBe(breakdownBefore.tdsCredits + 20_000);
    expect(breakdownAfter.refundOrDue).toBe(breakdownBefore.refundOrDue + 20_000);
  });
});
