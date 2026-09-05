import { describe, expect, it } from "vitest";
import { agenticStrings } from "../../i18n/agenticStrings";
import { buildPlan, classifyByRules, nextStep, setStep } from "../planner";

const s = agenticStrings("en");

describe("planner (plan §5.1)", () => {
  it("skips resolve when nothing is unconfirmed, and confirm/act when the task has no action", () => {
    const explain = buildPlan({ task: "explain", hasReturn: true, documentsAvailable: true, unconfirmedFacts: 0, openQuestions: 0, requiresConfirmation: false, alreadyFiled: false }, s);
    expect(explain.map((p) => p.id)).toEqual(["classify", "plan", "gather", "compute"]);
    const prep = buildPlan({ task: "prepare_salaried_return", hasReturn: true, documentsAvailable: true, unconfirmedFacts: 0, openQuestions: 0, requiresConfirmation: true, alreadyFiled: false }, s);
    expect(prep.find((p) => p.id === "resolve")?.state).toBe("skipped");
    expect(prep.find((p) => p.id === "confirm")?.state).toBe("pending");
  });

  it("marks act blocked for an already-filed return and notes an unreachable vault", () => {
    const p = buildPlan({ task: "prepare_salaried_return", hasReturn: true, documentsAvailable: null, unconfirmedFacts: 1, openQuestions: 0, requiresConfirmation: true, alreadyFiled: true }, s);
    expect(p.find((x) => x.id === "act")).toMatchObject({ state: "blocked", note: s.noteAlreadyFiled });
    expect(p.find((x) => x.id === "gather")?.note).toBe(s.noteVaultUnavailable);
  });

  it("preserves completed steps across a replan", () => {
    const first = buildPlan({ task: "prepare_salaried_return", hasReturn: false, documentsAvailable: true, unconfirmedFacts: 1, openQuestions: 0, requiresConfirmation: true, alreadyFiled: false }, s);
    const done = setStep(setStep(first, "classify", "done"), "plan", "done");
    const replanned = buildPlan({ task: "prepare_salaried_return", hasReturn: true, documentsAvailable: true, unconfirmedFacts: 0, openQuestions: 0, requiresConfirmation: true, alreadyFiled: false }, s, done);
    expect(replanned.find((p) => p.id === "classify")?.state).toBe("done");
    expect(replanned.find((p) => p.id === "resolve")?.state).toBe("skipped");
    expect(nextStep(replanned)?.id).toBe("gather");
  });

  it("nextStep respects dependencies", () => {
    const p = buildPlan({ task: "explain", hasReturn: true, documentsAvailable: true, unconfirmedFacts: 0, openQuestions: 0, requiresConfirmation: false, alreadyFiled: false }, s);
    expect(nextStep(p)?.id).toBe("classify");
    expect(nextStep(setStep(p, "classify", "done"))?.id).toBe("plan");
    expect(nextStep(p.map((x) => ({ ...x, state: "done" as const })))).toBeNull();
  });

  it("rule-based classification covers the supported tasks and falls back to explain", () => {
    expect(classifyByRules("please file my ITR")).toBe("prepare_salaried_return");
    expect(classifyByRules("old vs new regime?")).toBe("compare_regimes");
    expect(classifyByRules("my AIS shows interest that is not mine")).toBe("reconcile_facts");
    expect(classifyByRules("show me a demo")).toBe("load_demo");
    expect(classifyByRules("what is cess")).toBe("explain");
  });
});
