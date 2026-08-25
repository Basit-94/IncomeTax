import { describe, expect, it } from "vitest";
import {
  applyCorrection,
  confirmFact,
  effectivePersona,
  revertCorrection,
  type Correction,
  type ReturnState,
} from "../state";
import { makePersona } from "./fixtures";

function makeState(): ReturnState {
  const persona = makePersona();
  return {
    version: 1,
    lang: "en",
    personaId: persona.id,
    baselinePersona: persona,
    persona,
    corrections: [],
    confirmedFactIds: [],
  };
}

function amountCorrection(id: string, factId: string, previous: number, next: number): Correction {
  return { id, factId, field: "amount", previous, next, reason: "wrong figure", at: "2026-08-25T10:00:00Z" };
}

describe("applyCorrection", () => {
  it("updates the fact's amount in the effective persona", () => {
    const s = applyCorrection(makeState(), amountCorrection("c1", "fact-salary", 900000, 850000));
    expect(s.persona.facts.find((f) => f.id === "fact-salary")?.amount).toBe(850000);
    // baseline untouched
    expect(s.baselinePersona.facts[0].amount).toBe(900000);
  });

  it("records the correction in history", () => {
    const s = applyCorrection(makeState(), amountCorrection("c1", "fact-salary", 900000, 850000));
    expect(s.corrections).toHaveLength(1);
    expect(s.corrections[0].previous).toBe(900000);
    expect(s.corrections[0].next).toBe(850000);
    expect(s.corrections[0].reverted).toBe(false);
  });

  it("dropping existence removes the fact from the effective persona", () => {
    const c: Correction = {
      id: "c1",
      factId: "fact-interest",
      field: "existence",
      previous: true,
      next: false,
      reason: "account closed years ago",
      at: "2026-08-25T10:00:00Z",
    };
    const s = applyCorrection(makeState(), c);
    expect(s.persona.facts.some((f) => f.id === "fact-interest")).toBe(false);
  });

  it("returns an equivalent state when the fact does not exist", () => {
    const before = makeState();
    const s = applyCorrection(before, amountCorrection("c1", "nope", 1, 2));
    expect(s.persona.facts).toEqual(before.persona.facts);
    expect(s.corrections).toHaveLength(1);
  });

  it("does not mutate the input state", () => {
    const before = makeState();
    applyCorrection(before, amountCorrection("c1", "fact-salary", 900000, 850000));
    expect(before.persona.facts[0].amount).toBe(900000);
    expect(before.corrections).toHaveLength(0);
  });
});

describe("revertCorrection", () => {
  it("restores the previous value and marks the correction reverted (history kept)", () => {
    let s = makeState();
    s = applyCorrection(s, amountCorrection("c1", "fact-salary", 900000, 850000));
    s = revertCorrection(s, "c1");
    expect(s.persona.facts.find((f) => f.id === "fact-salary")?.amount).toBe(900000);
    expect(s.corrections).toHaveLength(1);
    expect(s.corrections[0].reverted).toBe(true);
    expect(effectivePersona(s).facts[0].amount).toBe(900000);
  });

  it("reverting the first of two corrections keeps the second's effect", () => {
    let s = makeState();
    s = applyCorrection(s, amountCorrection("c1", "fact-salary", 900000, 850000));
    s = applyCorrection(s, amountCorrection("c2", "fact-salary", 850000, 800000));
    s = revertCorrection(s, "c1");
    expect(s.persona.facts.find((f) => f.id === "fact-salary")?.amount).toBe(800000);
    expect(s.corrections.map((c) => c.reverted)).toEqual([true, false]);
  });

  it("restoring existence after denial brings the fact back", () => {
    let s = makeState();
    s = applyCorrection(s, {
      id: "c1",
      factId: "fact-interest",
      field: "existence",
      previous: true,
      next: false,
      reason: "never had this account",
      at: "2026-08-25T10:00:00Z",
    });
    s = applyCorrection(s, {
      id: "c2",
      factId: "fact-interest",
      field: "existence",
      previous: false,
      next: true,
      reason: "found the statement — it is real",
      at: "2026-08-25T11:00:00Z",
    });
    const restored = s.persona.facts.find((f) => f.id === "fact-interest");
    expect(restored?.amount).toBe(12000);
  });

  it("is a no-op for unknown correction ids", () => {
    const s = makeState();
    expect(revertCorrection(s, "ghost")).toBe(s);
  });
});

describe("confirmFact", () => {
  it("records confirmation idempotently", () => {
    let s = confirmFact(makeState(), "fact-salary");
    s = confirmFact(s, "fact-salary");
    expect(s.confirmedFactIds).toEqual(["fact-salary"]);
  });
});
