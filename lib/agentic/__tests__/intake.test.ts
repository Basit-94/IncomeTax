import { describe, expect, it } from "vitest";
import { MemoryReturnStore } from "../../return/snapshot-store";
import type { Owner } from "../../server/session";
import { loadVaultKey } from "../../vault/crypto";
import { MemoryVaultRepository } from "../../vault/memory-repository";
import { VaultService } from "../../vault/service";
import { hasIntakeSignal, parseAmountInRupees, parseSituation } from "../intake";
import { nullModel } from "../model";
import { advance, createRun, type RuntimeDeps } from "../runtime";
import { MemoryRunStore } from "../store";
import { runBudget } from "../types";
import type { Run } from "../types";

const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };

function deps(overrides: Partial<RuntimeDeps> = {}): RuntimeDeps {
  let t = 0;
  const clock = () => `2026-09-05T12:00:${String(t++ % 60).padStart(2, "0")}.000Z`;
  return { store: new MemoryRunStore(clock), returns: new MemoryReturnStore({ now: clock, newId: (p) => `${p}-${t++}` }), vault: null, model: nullModel, budget: runBudget({}), clock, today: () => "2026-09-05", ...overrides };
}
const vault = () => new VaultService(new MemoryVaultRepository(), loadVaultKey({ WAPSI_VAULT_KEY: Buffer.alloc(32, 9).toString("base64") }));
const msgs = async (d: RuntimeDeps, run: Run) => (await d.store.eventsAfter(sunita, run.id, 0)).map((e) => e.payload).filter((p) => p.type === "message" && p.role === "assistant").map((p) => (p as { text: string }).text);

describe("plain-English intake — the sentence becomes a situation (user request 2026-09-05)", () => {
  it("reads amounts the way people write them", () => {
    expect(parseAmountInRupees("i got a 12 lpa package")).toBe(1_200_000);
    expect(parseAmountInRupees("around 8.5 lakhs a year")).toBe(850_000);
    expect(parseAmountInRupees("₹6,50,000 salary")).toBe(650_000);
    expect(parseAmountInRupees("1.2 crore turnover")).toBe(12_000_000);
    expect(parseAmountInRupees("I paid 500 in cash")).toBeUndefined();
  });

  it("recognises the two headline situations and their side signals", () => {
    const job = parseSituation("I got a job with a 12 LPA package, and I need to file my taxes. What's the best play here?");
    expect(job).toMatchObject({ employment: true, salaryAmount: 1_200_000, business: false, wantsFiling: true, wantsBest: true });
    const biz = parseSituation("I have a small business with 30 lakh revenue. What are the best tax benefits I could get?");
    expect(biz).toMatchObject({ business: true, employment: false, wantsBest: true, salaryAmount: 3_000_000 });
    const mixed = parseSituation("Salaried, paying rent in Bengaluru, have a home loan EMI and some mutual funds; also PF and mediclaim");
    expect(mixed).toMatchObject({ employment: true, rentPaid: true, homeLoan: true, capitalGains: true, investments: true, healthInsurance: true });
    expect(hasIntakeSignal(parseSituation("which regime is better for me?"))).toBe(false);
    expect(parseSituation("I have rental income from a flat").rentPaid).toBe(false);
  });
});

describe("intake in the runtime — acknowledge, then one plain question at a time", () => {
  const opening = "I got a job with a 12 LPA package, and I need to file my taxes. What's the best play here?";

  it("a salaried sentence: acknowledgement first, the salary-figure conflict next, then Form 16 explained with an upload, then PF, then proof", async () => {
    const d = deps({ vault: vault() });
    const run = await createRun(d, sunita, { message: opening, lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(r.task).toBe("prepare_salaried_return");
    expect(r.state.situation?.salaryAmount).toBe(1_200_000);
    const first = (await msgs(d, r))[0];
    expect(first).toMatch(/Got it — you're salaried, at about ₹12,00,000 a year/);
    expect(first).toMatch(/Nothing is filed without your say-so/);

    // Sunita's employer reported ₹4,20,000: the stated package conflicts, so that is the first question.
    expect(r.status).toBe("waiting_for_input");
    let q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("salary_figure");
    expect(q.expects).toBe("choice");
    expect(q.text).toContain("₹4,20,000");
    expect(q.text).toContain("₹12,00,000");
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: "reported" } }))!;

    // Then the document, described as a thing you would recognise, with an upload and an honest way out.
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("form16");
    expect(q.expects).toBe("file");
    expect(q.docType).toBe("FORM_16");
    expect(q.text).toMatch(/document called Form 16/);
    expect(q.docHint).toMatch(/employer gives you/);
    expect(q.skipLabel).toBe("I don't have it");
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: "none" } }))!;

    // PF in words, not "section 80C".
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("pf");
    expect(q.text).toMatch(/Provident Fund \(PF\)/);
    expect(q.text).not.toMatch(/80C/);
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: true } }))!;
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("pf_amount");
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: 60000 } }))!;
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("pf_proof");
    expect(q.expects).toBe("file");
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: "none" } }))!;

    // Health insurance, then the generic other-income question; no duplicate 80C/80D questions.
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("health");
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: false } }))!;
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("other_income");
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: false } }))!;

    // Review: the unproven PF amount was left out and said so; the reported salary stands; a card is offered.
    expect(r.status).toBe("waiting_for_review");
    expect(r.state.pendingCommands?.some((c) => c.type === "declare_claim")).toBeFalsy();
    expect(r.state.pendingCommands?.some((c) => c.type === "correct_fact")).toBeFalsy();
    expect((await msgs(d, r)).some((m) => /left the PF amount out/.test(m))).toBe(true);
    expect(r.state.pendingCard?.rows.find((x) => x.label === "Refund due to you")?.value).toBe("₹8,400");
  });

  it("an uploaded Form 16 is stored, read, and its figures staged as an import — the citizen only had to say 'that form'", async () => {
    const v = vault();
    const d = deps({ vault: v });
    const run = await createRun(d, sunita, { message: "New job, 4.5 lakh salary, need to file", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    let q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("salary_figure"); // 4.5 L vs reported 4.2 L
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: "stated" } }))!;
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("form16");
    // The UI uploads to /api/vault/documents and answers with the document id; the same store is used here.
    const pdf = new TextEncoder().encode("%PDF-1.4\nFORM NO. 16 PAN of the Employee: DEMPS4417K Gross Salary: 4,50,000 Total Tax Deducted: 9,000\n%%EOF");
    const up = await v.upload({ owner: sunita, bytes: pdf, filename: "Form16.pdf", assessmentYear: "2026-27", docType: "FORM_16" });
    expect(up.ok).toBe(true);
    r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value: (up as { document: { id: string } }).document.id } }))!;
    expect((await msgs(d, r)).some((m) => /stored that document in your vault/.test(m))).toBe(true);
    expect(r.state.sources.some((s) => s.kind === "document" && s.verified)).toBe(true);
    expect(r.state.documentTypes).toContain("FORM_16");
    expect(r.state.pendingQuestion?.resolves).toBe("pf"); // it moved on
    // Finish quickly and check what is staged: the stated salary correction and the Form 16 import.
    for (const [key, value] of [["pf", false], ["health", false], ["other_income", false]] as const) {
      expect(r.state.pendingQuestion?.resolves).toBe(key);
      r = (await advance(d, sunita, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value } }))!;
    }
    expect(r.status).toBe("waiting_for_review");
    expect(r.state.pendingCommands?.map((c) => c.type)).toEqual(expect.arrayContaining(["correct_fact", "import_document"]));
    const log = JSON.stringify(await d.store.eventsAfter(sunita, r.id, 0));
    expect(log).not.toContain("Form16.pdf");
  });

  it("without a document store the intake never asks for uploads, and an unproven deduction is left out", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { message: "Got my first job, 3.5 lakh package, how do I file?", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    const seen: string[] = [];
    for (let i = 0; i < 8 && r.status === "waiting_for_input"; i += 1) {
      const q = r.state.pendingQuestion!;
      seen.push(q.resolves);
      expect(q.expects).not.toBe("file");
      const value = q.resolves === "pf" ? true : q.resolves === "pf_amount" ? 50000 : q.resolves === "salary_figure" ? "unsure" : false;
      r = (await advance(d, sunita, r.id, { answer: { questionId: q.id, value } }))!;
    }
    expect(seen).toEqual(["salary_figure", "pf", "pf_amount", "health", "other_income"]);
    expect(r.status).toBe("waiting_for_review");
    expect(r.state.pendingCommands?.some((c) => c.type === "declare_claim")).toBeFalsy();
  });

  it("a business sentence is told plainly what this release will not do, and nothing is computed or staged", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { message: "I run a small business with 30 lakh revenue and want to file. Best tax benefits?", lang: "en" });
    const r = (await advance(d, sunita, run.id))!;
    expect(r.state.situation?.business).toBe(true);
    expect(r.status).toBe("completed");
    expect(r.state.pendingQuestion).toBeUndefined();
    expect(r.state.pendingCard).toBeUndefined();
    expect(r.state.pendingCommands).toBeUndefined();
    expect((await msgs(d, r))[0]).toMatch(/business or freelance income/);
    expect((await d.returns.get(sunita, "2026-27"))!.revision).toBe(1);
  });

  it("Hindi: the acknowledgement and the Form 16 question come from the same deterministic templates", async () => {
    const d = deps({ vault: vault() });
    const run = await createRun(d, sunita, { message: "mujhe 12 lpa package ki job mili hai, salary aati hai, tax file karna hai", lang: "hi" });
    let r = (await advance(d, sunita, run.id))!;
    expect((await msgs(d, r))[0]).toMatch(/समझ गया/);
    r = (await advance(d, sunita, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value: "reported" } }))!;
    expect(r.state.pendingQuestion?.text).toMatch(/फॉर्म 16/);
  });
});
