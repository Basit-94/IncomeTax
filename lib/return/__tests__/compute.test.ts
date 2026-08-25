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
});
