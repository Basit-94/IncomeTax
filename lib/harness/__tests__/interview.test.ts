import { describe, expect, it } from "vitest";
import { applyAnswer, isIntakeComplete, newInterview, nextSlot, parseIndianAmount, proposeFromText, reopen, type AnswerRecord } from "../interview";
import { classifyOffline, phraseOffline } from "../offline";
import { TASKS, slotSpec } from "../tasks";

const at = "2026-09-03T00:00:00.000Z";
const filled = (masked: string, choice?: string): AnswerRecord => ({ status: "filled", masked, choice, source: "user", at });

describe("interview state machine", () => {
  it("asks in schema order and only when dependencies hold", () => {
    const schema = TASKS.file_return;
    let state = newInterview("file_return");
    expect(nextSlot(schema, state)?.id).toBe("employment_type");
    state = applyAnswer(state, "employment_type", filled("A salaried job", "salaried"));
    expect(nextSlot(schema, state)?.id).toBe("form16_available");
    state = applyAnswer(state, "form16_available", filled("No", "no"));
    // No Form 16: the upload slot is skipped, the figures are asked directly.
    expect(nextSlot(schema, state)?.id).toBe("gross_salary");
    state = applyAnswer(state, "gross_salary", filled("₹14,00,000"));
    state = applyAnswer(state, "tds_192", filled("₹1,10,000"));
    // Freelance receipts are not asked of a salaried person.
    expect(nextSlot(schema, state)?.id).toBe("has_interest");
  });

  it("a document that fills figures means they are not asked again", () => {
    const schema = TASKS.file_return;
    let state = newInterview("file_return");
    state = applyAnswer(state, "employment_type", filled("A salaried job", "salaried"));
    state = applyAnswer(state, "form16_available", filled("Yes", "yes"));
    expect(nextSlot(schema, state)?.id).toBe("form16");
    state = applyAnswer(state, "form16", { status: "filled", masked: "form16.pdf", source: "document", at });
    state = applyAnswer(state, "gross_salary", { status: "filled", masked: "₹14,00,000", source: "document", at });
    state = applyAnswer(state, "tds_192", { status: "filled", masked: "₹1,10,000", source: "document", at });
    expect(nextSlot(schema, state)?.id).toBe("has_interest");
  });

  it("completes when nothing required is open, and reopening a slot reopens its dependents", () => {
    const schema = TASKS.compare_regimes;
    let state = newInterview("compare_regimes");
    const answers: [string, AnswerRecord][] = [
      ["employment_type", filled("A salaried job", "salaried")],
      ["gross_salary", filled("₹12,00,000")],
      ["has_pf", filled("Yes", "yes")],
      ["pf_contribution", filled("₹60,000")],
      ["pays_rent", filled("No", "no")],
      ["has_insurance", filled("No", "no")],
    ];
    for (const [id, record] of answers) state = applyAnswer(state, id, record);
    expect(isIntakeComplete(schema, state)).toBe(true);
    state = reopen(schema, state, "has_pf");
    expect(state.answers.pf_contribution).toBeUndefined();
    expect(nextSlot(schema, state)?.id).toBe("has_pf");
  });

  it("optional slots never block completion", () => {
    const schema = TASKS.check_refund;
    const state = newInterview("check_refund");
    expect(nextSlot(schema, state)?.id).toBe("ack_number");
    // The engine may skip it; once skipped the intake is complete.
    const skipped = applyAnswer(state, "ack_number", { status: "skipped", masked: "skipped", source: "user", at });
    expect(isIntakeComplete(schema, skipped)).toBe(true);
  });

  it("parses Indian amounts and free-text proposals", () => {
    expect(parseIndianAmount("14 lakh package")).toBe(1_400_000);
    expect(parseIndianAmount("₹12,50,000")).toBe(1_250_000);
    expect(parseIndianAmount("1.2 crore")).toBe(12_000_000);
    expect(parseIndianAmount("50k")).toBe(50_000);
    expect(parseIndianAmount("no numbers")).toBeNull();
    expect(proposeFromText(slotSpec("has_pf")!, "yes I do")).toMatchObject({ choice: "yes" });
    expect(proposeFromText(slotSpec("gross_salary")!, "about 14.5 lakh")).toMatchObject({ value: "1450000", masked: "₹14,50,000" });
    expect(proposeFromText(slotSpec("employment_type")!, "I am a freelance designer")).toMatchObject({ choice: "self_employed" });
    expect(proposeFromText(slotSpec("gross_salary")!, "not sure")).toBeNull();
  });
});

describe("offline planner", () => {
  it("classifies the user's own examples and extracts the amount", () => {
    const job = classifyOffline("I got a job with a 14 lakh package and I need to file my taxes. What is the best play here?");
    expect(job.taskId).toBe("file_return");
    expect(job.extracted).toMatchObject({ employment: "salaried", salary: 1_400_000, newJob: true });
    const biz = classifyOffline("I have a small business with 40 lakh revenue. What are the best tax benefits I could get?");
    expect(biz.taskId).toBe("business_benefits");
    expect(biz.extracted).toMatchObject({ employment: "business", revenue: 4_000_000 });
    expect(classifyOffline("I got a letter from the income tax department").taskId).toBe("respond_notice");
    expect(classifyOffline("which regime is better for me").taskId).toBe("compare_regimes");
    expect(classifyOffline("show me a demo").taskId).toBe("demo_persona");
    expect(classifyOffline("hello").taskId).toBe("unknown");
  });

  it("phrases a template with a proposal without leading with the form name", () => {
    const spec = slotSpec("form16_available")!;
    expect(spec.question.startsWith("Your employer")).toBe(true);
    expect(phraseOffline(spec, "yes")).toContain("Earlier you said yes");
    expect(phraseOffline(slotSpec("gross_salary")!, "₹14,00,000")).toContain("You mentioned about ₹14,00,000");
  });
});
