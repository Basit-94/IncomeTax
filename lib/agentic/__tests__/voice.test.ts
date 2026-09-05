import { describe, expect, it } from "vitest";
import { agenticStrings } from "../../i18n/agenticStrings";
import { MemoryReturnStore } from "../../return/snapshot-store";
import type { Owner } from "../../server/session";
import type { ModelAdapter } from "../model";
import { nullModel } from "../model";
import { recommendationText } from "../response";
import { advance, createRun, type RuntimeDeps } from "../runtime";
import { MemoryRunStore } from "../store";
import { runBudget } from "../types";
import { detectSmallTalk, firstName, questionLead, smallTalkReply, validateWarmth, warmLine } from "../voice";

const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
const en = agenticStrings("en");

function deps(overrides: Partial<RuntimeDeps> = {}): RuntimeDeps {
  let t = 0;
  const clock = () => `2026-09-05T12:00:${String(t++ % 60).padStart(2, "0")}.000Z`;
  return { store: new MemoryRunStore(clock), returns: new MemoryReturnStore({ now: clock, newId: (p) => `${p}-${t++}` }), vault: null, model: nullModel, budget: runBudget({}), clock, today: () => "2026-09-05", ...overrides };
}
const assistant = async (d: RuntimeDeps, runId: string) => (await d.store.eventsAfter(sunita, runId, 0)).map((e) => e.payload).filter((p) => p.type === "message" && p.role === "assistant").map((p) => (p as { text: string }).text);

describe("the voice — small talk is answered like a friend, never like a form (docs/VOICE.md)", () => {
  it("recognises whole-message small talk in several tongues and leaves real requests alone", () => {
    expect(detectSmallTalk("hi")).toBe("hello");
    expect(detectSmallTalk("Hello there!")).toBe("hello");
    expect(detectSmallTalk("namaste ji")).toBe("hello");
    expect(detectSmallTalk("vanakkam")).toBe("hello");
    expect(detectSmallTalk("thanks a lot")).toBe("thanks");
    expect(detectSmallTalk("nandri")).toBe("thanks");
    expect(detectSmallTalk("who are you?")).toBe("who");
    expect(detectSmallTalk("what can you do")).toBe("help");
    expect(detectSmallTalk("how are you")).toBe("howAreYou");
    expect(detectSmallTalk("bye!")).toBe("bye");
    expect(detectSmallTalk("hi, I got a job with a 12 LPA package and need to file")).toBeNull();
    expect(detectSmallTalk("what is the standard deduction")).toBeNull();
    expect(detectSmallTalk("help me file my return")).toBeNull();
  });

  it("uses the first name once, and never greets a masked or synthetic name", () => {
    expect(firstName("Sunita Devi")).toBe("Sunita");
    expect(firstName("Citizen 7710")).toBe("");
    expect(firstName("")).toBe("");
    expect(smallTalkReply("hello", en, "Sunita")).toMatch(/^Hi Sunita!/);
    expect(smallTalkReply("hello", en, "")).toMatch(/^Hi there!/);
    expect(smallTalkReply("who", en, "")).toMatch(/friend who does taxes/);
    expect(smallTalkReply("bye", en, "Sunita")).toContain("Sunita");
  });

  it("question lead-ins rotate so a run does not read like a form; documents get their own lead", () => {
    expect(questionLead(0, en, "question")).toBe(en.leadFirst);
    const seen = new Set([1, 2, 3, 4].map((n) => questionLead(n, en, "question")));
    expect(seen.size).toBe(3);
    expect(questionLead(4, en, "question")).toBe(questionLead(1, en, "question"));
    expect(questionLead(2, en, "file")).toBe(en.leadDoc);
  });

  it("the recommendation ends with a human sentence that repeats — never adds — a figure", () => {
    const refund = recommendationText({ cheaper: "new", saving: 0, taxableIncome: 346240, totalTax: 0, refundOrDue: 8400 }, "en");
    expect(refund).toContain("Good news: you paid ₹8,400 more than you owed");
    expect(refund.match(/₹8,400/g)).toHaveLength(2);
    const due = recommendationText({ cheaper: "new", saving: 5000, taxableIncome: 1500000, totalTax: 120000, refundOrDue: -20000 }, "en");
    expect(due).toContain("There's ₹20,000 still to pay");
    expect(due).toContain("cheaper for your figures — by ₹5,000");
    expect(recommendationText({ cheaper: "new", saving: 0, taxableIncome: 400000, totalTax: 0, refundOrDue: 0 }, "en")).toContain("You're square");
  });
});

describe("the warm line from the model — accepted only when it is pure warmth", () => {
  it("rejects anything with a digit (any script), a rupee sign, a section, or a claim", () => {
    expect(validateWarmth("Lovely news to share with you today, Sunita.")).toBe(true);
    expect(validateWarmth("You get ₹8,400 back!")).toBe(false);
    expect(validateWarmth("About 8 thousand is coming your way")).toBe(false);
    expect(validateWarmth("आपको ८४०० वापस मिलेंगे")).toBe(false);
    expect(validateWarmth("Section 87A saves you here")).toBe(false);
    expect(validateWarmth("Your return has been filed successfully")).toBe(false);
    // Seen live from Gemini: figure-free, but advice — warmth must not recommend or judge eligibility.
    expect(validateWarmth("Sunita, I suggest claiming a refund because you are eligible to get some of your tax back.")).toBe(false);
    expect(validateWarmth("You should opt for the new regime this year.")).toBe(false);
    expect(validateWarmth("Nice work getting this far, Sunita — here is where you stand.")).toBe(true);
    expect(validateWarmth("First line\nsecond line")).toBe(false);
    expect(validateWarmth("x".repeat(241))).toBe(false);
    expect(validateWarmth("")).toBe(false);
  });

  it("uses a valid line, drops an invalid one, and never calls a null model", async () => {
    const good: ModelAdapter = { name: "fake", async classify() { return null; }, async phrase() { return { text: "Nice work getting this far, Sunita — here is where you stand.", usage: { tokens: 12 } }; } };
    const bad: ModelAdapter = { name: "fake", async classify() { return null; }, async phrase() { return { text: "You will get ₹8,400 back and it has been filed!", usage: { tokens: 9 } }; } };
    expect(await warmLine(good, { lang: "en", name: "Sunita", moment: "recommendation_refund" })).toEqual({ text: "Nice work getting this far, Sunita — here is where you stand.", tokens: 12 });
    expect(await warmLine(bad, { lang: "en", name: "Sunita", moment: "recommendation_refund" })).toEqual({ text: "", tokens: 9 });
    expect(await warmLine(nullModel, { lang: "en", name: "Sunita", moment: "recommendation_refund" })).toBeNull();
  });

  it("in the runtime an invalid warm line falls back to the deterministic lead; a valid one leads the figures", async () => {
    const bad: ModelAdapter = { name: "fake", async classify() { return null; }, async phrase() { return { text: "Your refund of ₹99,999 is filed.", usage: { tokens: 5 } }; } };
    const d = deps({ model: bad });
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    for (let i = 0; i < 6 && r.status === "waiting_for_input"; i += 1) {
      const q = r.state.pendingQuestion!;
      r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: q.expects === "yes_no" ? false : 0 } }))!;
    }
    const texts = await assistant(d, r.id);
    const rec = texts.find((t) => /Taxable income/.test(t))!;
    expect(rec.startsWith(en.leadRecommendation)).toBe(true);
    expect(rec).not.toContain("99,999");
    expect(texts).toContain(en.reviewIntro);
  });
});

describe("small talk in the runtime — no return read, no figures, warm reply, done", () => {
  it("'hi' greets Sunita by first name and completes without touching the return", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { message: "hi", lang: "en" });
    const r = (await advance(d, sunita, run.id))!;
    expect(r.status).toBe("completed");
    expect(r.state.smallTalk).toBe("hello");
    const texts = await assistant(d, r.id);
    expect(texts).toHaveLength(1);
    expect(texts[0]).toMatch(/^Hi Sunita!/);
    expect(texts[0]).not.toMatch(/could not find|no evidence/i);
    expect(await d.returns.get(sunita, "2026-27")).toBeNull(); // nothing was created or read into a snapshot
  });

  it("'thanks' and 'what can you do' get their own replies; Hindi small talk answers in Hindi", async () => {
    const d = deps();
    const t = (await advance(d, sunita, (await createRun(d, sunita, { message: "thank you!", lang: "en" })).id))!;
    expect((await assistant(d, t.id))[0]).toBe(en.chatThanks);
    const h = (await advance(d, sunita, (await createRun(d, sunita, { message: "what can you do?", lang: "en" })).id))!;
    expect((await assistant(d, h.id))[0]).toBe(en.chatHelp);
    const hi = (await advance(d, sunita, (await createRun(d, sunita, { message: "namaste", lang: "hi" })).id))!;
    expect((await assistant(d, hi.id))[0]).toMatch(/^नमस्ते Sunita!/);
  });

  it("questions in a run carry a lead-in above the question text", async () => {
    const d = deps();
    const r = (await advance(d, sunita, (await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" })).id))!;
    expect(r.state.pendingQuestion?.lead).toBe(en.leadFirst);
  });
});
