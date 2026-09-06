import { describe, expect, it } from "vitest";
import type { ModelAdapter } from "../model";
import { detectRegister, say, validateSaid, type SayInput } from "../say";

const base: SayInput = { intent: "acknowledge", facts: ["Salaried, about ₹12,00,000 a year."], fallback: "You're salaried, about ₹12,00,000 a year." };

describe("the conversational check — what the model may and may not say (user direction 2026-09-06)", () => {
  it("accepts a fresh sentence that only uses the brief's figures", () => {
    expect(validateSaid("Salaried at roughly ₹12,00,000 for the year — let me see what's on record first.", base)).toBe(true);
  });
  it("rejects any figure the brief did not contain", () => {
    expect(validateSaid("Salaried at ₹12,00,000; you'll probably get ₹8,400 back.", base)).toBe(false);
    expect(validateSaid("You were in India 200 days.", { ...base, facts: [] })).toBe(false);
  });
  it("rejects self-description and meta-fluff — 'no jargon' is jargon", () => {
    for (const t of ["Honestly, no jargon here: you're salaried.", "Think of me as the friend who happens to be a CA.", "In plain words, I'm here to help.", "No worries, you're salaried."]) {
      expect(validateSaid(t, base), t).toBe(false);
    }
  });
  it("rejects claims of filing or payment unless the brief states them", () => {
    expect(validateSaid("Your return is filed.", base)).toBe(false);
    expect(validateSaid("Your return is filed — receipt SIM-1.", { ...base, facts: ["Filed: simulated receipt SIM-1."] })).toBe(true);
  });
  it("rejects advice words unless the turn is the recommendation", () => {
    expect(validateSaid("I recommend the old regime.", base)).toBe(false);
    expect(validateSaid("I recommend the old regime.", { ...base, allowAdvice: true })).toBe(true);
  });
  it("keeps the terms a question must carry", () => {
    const q: SayInput = { intent: "ask", fallback: "Do you have a Form 16?", mustContain: ["Form 16"] };
    expect(validateSaid("Got your employer's yearly certificate handy?", q)).toBe(false);
    expect(validateSaid("Got your Form 16 handy?", q)).toBe(true);
  });
  it("rejects a repeat of something already said", () => {
    expect(validateSaid("Let me check what's on record.", { ...base, facts: [] }, ["let me check what's on record"])).toBe(false);
  });
  it("rejects over-long output", () => {
    expect(validateSaid("word ".repeat(200), { ...base, maxWords: 40 })).toBe(false);
  });
});

describe("say() — the model's sentence when it passes, the fallback otherwise, never both", () => {
  const model = (reply: string | null): ModelAdapter => ({
    name: "test",
    async classify() { return null; },
    async phrase() { return reply === null ? null : { text: reply, usage: { tokens: 7 } }; },
  });
  const ctx = (m: ModelAdapter, charged: number[]) => ({ model: m, lang: "en" as const, register: "plain" as const, name: "Sunita", recent: [], charge: async (t: number) => { charged.push(t); } });

  it("uses a valid model sentence and charges the tokens", async () => {
    const charged: number[] = [];
    expect(await say(ctx(model("Salaried, around ₹12,00,000 — checking what's on record now, Sunita."), charged), base)).toMatch(/checking what's on record/);
    expect(charged).toEqual([7]);
  });
  it("falls back when the model invents a figure, and still charges", async () => {
    const charged: number[] = [];
    expect(await say(ctx(model("You'll get ₹9,999 back."), charged), base)).toBe(base.fallback);
    expect(charged).toEqual([7]);
  });
  it("falls back silently when the model is off or fails", async () => {
    const charged: number[] = [];
    expect(await say(ctx(model(null), charged), base)).toBe(base.fallback);
    expect(await say(ctx({ ...model("anything"), name: "none" }, charged), base)).toBe(base.fallback);
    expect(charged).toEqual([]);
  });
});

describe("register — romanised Hindi is answered in Hinglish", () => {
  it("detects Hinglish from two or more Hindi function words in Latin script", () => {
    expect(detectRegister("mujhe 12 lpa ki naukri mili hai, tax file karna hai", "en")).toBe("hinglish");
    expect(detectRegister("bhai kya mera refund aayega", "en")).toBe("hinglish");
  });
  it("stays plain for English, for Devanagari, and for other UI languages", () => {
    expect(detectRegister("I got a job with a 12 LPA package and need to file", "en")).toBe("plain");
    expect(detectRegister("मुझे नौकरी मिली है", "hi")).toBe("plain");
    expect(detectRegister("mujhe naukri mili hai", "ta")).toBe("plain");
  });
});
