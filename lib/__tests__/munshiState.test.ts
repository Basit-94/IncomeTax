import { describe, expect, it } from "vitest";
import { agentReaction, regimeReaction } from "../munshi-state";

describe("Munshi's presentation reactions", () => {
  it("uses signed engine net amounts for refunds and outstanding tax", () => {
    expect(regimeReaction("new", { new: 8400, old: 2000 })).toBe("happy");
    expect(regimeReaction("old", { new: 8400, old: 2000 })).toBe("concerned");
    expect(regimeReaction("old", { new: -12000, old: -4000 })).toBe("happy");
    expect(regimeReaction("new", { new: -12000, old: -4000 })).toBe("concerned");
  });
  it("does not invent a winner before selection, on ties or missing/invalid data", () => {
    expect(regimeReaction(null, { new: 5, old: 0 })).toBe("idle");
    expect(regimeReaction("new", null)).toBe("idle");
    expect(regimeReaction("old", { new: 0, old: 0 })).toBe("idle");
    expect(regimeReaction("new", { new: NaN, old: 5 })).toBe("idle");
    expect(regimeReaction("new", { new: 5, old: Infinity })).toBe("idle");
  });
  it("keeps reading after HTTP create completes while server work is running", () => {
    expect(agentReaction("running", false, null)).toBe("working");
    expect(agentReaction("waiting_for_input", true, null)).toBe("working");
    expect(agentReaction("waiting_for_input", false, null)).toBe("listening");
    expect(agentReaction("waiting_for_review", false, null)).toBe("reading");
  });
  it("never celebrates failed or cancelled work", () => {
    expect(agentReaction("failed", false, null)).toBe("error");
    expect(agentReaction("completed", false, "network failure")).toBe("error");
    expect(agentReaction("cancelled", true, null)).toBe("idle");
    expect(agentReaction("completed", false, null)).toBe("happy");
  });
});
