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
const citizen: Owner = { pan: "ABCPX7788Q", kind: "citizen", displayName: "Citizen 7788" };

function deps(overrides: Partial<RuntimeDeps> = {}): RuntimeDeps {
  let t = 0;
  const clock = () => `2026-09-05T12:00:${String(t++ % 60).padStart(2, "0")}.000Z`;
  return { store: new MemoryRunStore(clock), returns: new MemoryReturnStore({ now: clock, newId: (p) => `${p}-${t++}` }), vault: null, model: nullModel, budget: runBudget({}), clock, today: () => "2026-09-05", ...overrides };
}
const vault = () => new VaultService(new MemoryVaultRepository(), loadVaultKey({ WAPSI_VAULT_KEY: Buffer.alloc(32, 9).toString("base64") }));
const msgs = async (d: RuntimeDeps, owner: Owner, run: Run) => (await d.store.eventsAfter(owner, run.id, 0)).map((e) => e.payload).filter((p) => p.type === "message" && p.role === "assistant").map((p) => (p as { text: string }).text);
const answer = (d: RuntimeDeps, owner: Owner, r: Run, value: string | number | boolean) => advance(d, owner, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value } }) as Promise<Run>;
const form = (fields: Record<string, number | boolean | string>) => JSON.stringify(fields);

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

  it("reads Hinglish the way people actually type it", () => {
    const h = parseSituation("mujhe 12 lpa ki naukri mili hai, tax bharna hai, sabse accha kya hai");
    expect(h).toMatchObject({ employment: true, salaryAmount: 1_200_000, wantsFiling: true, wantsBest: true, business: false });
    expect(parseSituation("mera chhota dhandha hai, 30 lakh ka turnover").business).toBe(true);
    expect(parseSituation("kiraye pe rehta hoon aur ghar ka loan bhi hai")).toMatchObject({ rentPaid: true, homeLoan: true });
  });
});

describe("intake in the runtime — document-first, one form, few steps (user direction 2026-09-06)", () => {
  const opening = "I got a job with a 12 LPA package, and I need to file my taxes. What's the best play here?";

  it("a salaried sentence on a return with an employer figure: acknowledgement, the salary conflict, then ONE form, then one proof, then review", async () => {
    const d = deps({ vault: vault() });
    const run = await createRun(d, sunita, { message: opening, lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(r.task).toBe("prepare_salaried_return");
    expect(r.state.situation?.salaryAmount).toBe(1_200_000);
    const first = (await msgs(d, sunita, r))[0];
    expect(first).toMatch(/salaried, at about ₹12,00,000 a year/);
    expect(first).not.toMatch(/say-so|jargon|honest/i); // no self-description (docs/VOICE.md)

    // Sunita's employer reported ₹4,20,000: the stated package conflicts, so that is the first question.
    expect(r.status).toBe("waiting_for_input");
    let q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("salary_figure");
    expect(q.expects).toBe("choice");
    expect(q.lead).toBeUndefined(); // no lead-ins: the question is the question
    r = await answer(d, sunita, r, "reported");

    // Everything else in one card — not one question at a time. Since 2026-09-07 the card holds only what the
    // papers cannot answer: Sunita's salary and interest are on record, the new regime wins even at the deduction
    // ceiling, so no deduction is asked; what remains is where she lived and the ITR-1 gate.
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("details");
    expect(q.expects).toBe("form");
    expect(q.fields?.map((f) => f.key)).toEqual(["housing", "extras"]);
    // A PF figure typed anyway (the card accepts it) is still handled: proof asked, left out without one.
    r = await answer(d, sunita, r, form({ housing: "family", extras: "none", pf_amount: 60000 }));
    expect(r.state.answers).toMatchObject({ pf_amount: 60000, housing: "family", extras: "none", inventory_confirmed: true });

    // A deduction was entered, so one proof upload is offered — with an honest way out.
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("proof");
    expect(q.expects).toBe("file");
    r = await answer(d, sunita, r, "none");

    // Review: the unproven PF amount was left out and said so; the reported salary stands; a card is offered.
    expect(r.status).toBe("waiting_for_review");
    expect(r.state.pendingCommands?.some((c) => c.type === "declare_claim")).toBeFalsy();
    expect(r.state.pendingCommands?.some((c) => c.type === "correct_fact")).toBeFalsy();
    expect((await msgs(d, sunita, r)).some((m) => /left the PF amount out/.test(m))).toBe(true);
    expect(r.state.pendingCard?.rows.find((x) => x.label === "Refund due to you")?.value).toBe("₹8,400");
  });

  it("a blank return: where the money came from, then the source card, then an uploaded Form 16 is read and staged — the citizen never typed a salary", async () => {
    const v = vault();
    const d = deps({ vault: v });
    const run = await createRun(d, citizen, { message: "file my tax", lang: "en" });
    let r = (await advance(d, citizen, run.id))!;
    // The reviewer gate is said up front, once, without self-description.
    expect((await msgs(d, citizen, r))[0]).toMatch(/hasn't been signed off by a tax reviewer/);
    let q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("income_source");
    r = await answer(d, citizen, r, "salary");

    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("source");
    expect(q.expects).toBe("source");
    expect(q.sourceOptions?.map((o) => o.value)).toEqual(["upload", "digilocker", "manual"]); // nothing in the vault yet
    expect(q.sourceOptions?.[0].kind).toBe("upload");
    // The UI uploads to /api/vault/documents and answers `upload:<id>`; the same store is used here.
    const pdf = new TextEncoder().encode("%PDF-1.4\nFORM NO. 16 PAN of the Employee: ABCPX7788Q Gross Salary: 9,00,000 Total Tax Deducted: 42,000\n%%EOF");
    const up = await v.upload({ owner: citizen, bytes: pdf, filename: "Form16.pdf", assessmentYear: "2026-27", docType: "FORM_16" });
    expect(up.ok).toBe(true);
    r = await answer(d, citizen, r, `upload:${(up as { document: { id: string } }).document.id}`);
    expect(r.state.pendingCommands?.some((c) => c.type === "import_document")).toBe(true);
    expect((await msgs(d, citizen, r)).at(-1)).toMatch(/₹9,00,000/); // what was read is said, not "lovely, thanks"
    expect(r.state.sources.some((s) => s.kind === "document" && s.verified)).toBe(true);

    // The form no longer asks for the salary (read from the Form 16) nor for deductions (the new regime wins at any
    // ceiling on ₹9,00,000); a citizen without a profile is asked about residency in the same card.
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("details");
    expect(q.fields?.map((f) => f.key)).toEqual(["resident", "housing", "extras"]);
    r = await answer(d, citizen, r, form({ resident: true, housing: "rent", extras: "none", interest_amount: 1240 }));

    // Interest is a head the engine computes, so a real figure here is declared, not refused.
    // Nothing else to ask. The only thing standing between this return and a recommendation is the reviewer.
    expect(r.status).toBe("completed");
    expect(r.state.advice?.issues.map((i) => i.code)).toEqual(["tax_review_required"]);
    const log = JSON.stringify(await d.store.eventsAfter(citizen, r.id, 0));
    expect(log).not.toContain("Form16.pdf");
  });

  it("DigiLocker (mock): offered on the source card, fetched only after a consent card that lists the documents, and labelled as sample data", async () => {
    const d = deps({ vault: vault() });
    let r = (await advance(d, citizen, (await createRun(d, citizen, { message: "file my tax", lang: "en" })).id))!;
    r = await answer(d, citizen, r, "salary");
    r = await answer(d, citizen, r, "digilocker");
    let q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("digilocker_consent");
    expect(q.expects).toBe("yes_no");
    expect(q.items).toHaveLength(3); // Form 16, AIS, Form 26AS (2026-09-07)
    expect(q.items?.[0]).toMatch(/Form 16 .*SAMPLE/);
    expect(r.state.pendingCommands ?? []).toHaveLength(0); // nothing fetched before yes
    r = await answer(d, citizen, r, true);
    const said = (await msgs(d, citizen, r)).at(-1)!;
    expect(said).toMatch(/DigiLocker/);
    expect(said).toMatch(/SAMPLE/);
    expect(r.state.pendingCommands?.some((c) => c.type === "import_document")).toBe(true);
    expect(r.state.documentTypes).toEqual(expect.arrayContaining(["FORM_16", "ANNUAL_INFO_STATEMENT"]));
    q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("details");
    expect(q.fields?.some((f) => f.key === "salary_amount")).toBe(false);
  });

  it("the 'Prepare my return' shortcut on a blank return with a Form 16 in the vault: consent, read, then straight to the form — never 'where did your money come from'", async () => {
    const v = vault();
    const d = deps({ vault: v });
    const pdf = new TextEncoder().encode("%PDF-1.4\nFORM NO. 16 PAN of the Employee: ABCPX7788Q Gross Salary: 7,30,000 Total Tax Deducted: 16,500\n%%EOF");
    expect((await v.upload({ owner: citizen, bytes: pdf, filename: "f16.pdf", assessmentYear: "2026-27", docType: "FORM_16" })).ok).toBe(true);
    let r = (await advance(d, citizen, (await createRun(d, citizen, { task: "prepare_salaried_return", lang: "en" })).id))!;
    expect(r.state.pendingQuestion?.resolves).toBe("vault_consent");
    r = await answer(d, citizen, r, true);
    expect(r.state.pendingCommands?.some((c) => c.type === "import_document")).toBe(true);
    const q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("details"); // the staged Form 16 makes this a salaried return; no income-source question
    expect(q.fields?.map((f) => f.key)).toEqual(["resident", "housing", "extras"]);
  });

  it("DigiLocker declined falls back to typing: the form then carries the salary, and the typed figure is declared as the citizen's own", async () => {
    const d = deps({ vault: vault() });
    let r = (await advance(d, citizen, (await createRun(d, citizen, { message: "file my tax", lang: "en" })).id))!;
    r = await answer(d, citizen, r, "salary");
    r = await answer(d, citizen, r, "digilocker");
    r = await answer(d, citizen, r, false);
    const q = r.state.pendingQuestion!;
    expect(q.resolves).toBe("details");
    // No papers: the salary, who they work for and the interest are typed; residency once; the year's two groups; and
    // only the two deductions the first intake asked — the regime cannot be judged before the salary is known.
    expect(q.fields?.map((f) => f.key)).toEqual(["salary_amount", "employer_category", "interest_amount", "resident", "housing", "extras", "pf_amount", "health_amount"]);
    expect(r.state.documentTypes ?? []).not.toContain("FORM_16"); // nothing was fetched
    r = await answer(d, citizen, r, form({ salary_amount: 900000, pf_amount: 0, health_amount: 0, interest_amount: 0, resident: true }));
    expect(r.status).toBe("completed");
    expect(r.state.advice?.issues.map((i) => i.code)).toEqual(["tax_review_required"]); // income known, residency known, inventory confirmed
  });

  it("without a document store there is no upload, no DigiLocker and no proof step; an unproven deduction is left out", async () => {
    const d = deps();
    let r = (await advance(d, sunita, (await createRun(d, sunita, { message: "Got my first job, 3.5 lakh package, how do I file?", lang: "en" })).id))!;
    const seen: string[] = [];
    for (let i = 0; i < 6 && r.status === "waiting_for_input"; i += 1) {
      const q = r.state.pendingQuestion!;
      seen.push(q.resolves);
      expect(q.expects).not.toBe("file");
      expect(q.expects).not.toBe("source");
      r = await answer(d, sunita, r, q.resolves === "details" ? form({ pf_amount: 50000, health_amount: 0, interest_amount: 0 }) : "unsure");
    }
    expect(seen).toEqual(["salary_figure", "details"]);
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
    expect((await msgs(d, sunita, r))[0]).toMatch(/business or freelance income/);
    expect((await d.returns.get(sunita, "2026-27"))!.revision).toBe(1);
  });

  it("a blank return whose money comes from a pension is told plainly, in one message, and nothing is computed", async () => {
    const d = deps();
    let r = (await advance(d, citizen, (await createRun(d, citizen, { message: "file my tax", lang: "en" })).id))!;
    r = await answer(d, citizen, r, "other");
    expect(r.status).toBe("completed");
    expect(r.state.pendingQuestion).toBeUndefined();
    expect(r.state.pendingCommands).toBeUndefined();
    expect((await msgs(d, citizen, r)).filter((t) => /salaried returns only/.test(t))).toHaveLength(1);
  });

  it("Hinglish: recognised as a register, parsed like English, answered from the Hindi templates when the model is off", async () => {
    const d = deps({ vault: vault() });
    const run = await createRun(d, sunita, { message: "mujhe 12 lpa package ki job mili hai, salary aati hai, tax file karna hai", lang: "hi" });
    let r = (await advance(d, sunita, run.id))!;
    expect(r.state.register).toBe("hinglish");
    expect((await msgs(d, sunita, r))[0]).toMatch(/वेतनभोगी/);
    r = await answer(d, sunita, r, "reported");
    expect(r.state.pendingQuestion?.expects).toBe("form");
    expect(r.state.pendingQuestion?.text).toMatch(/आंकड़े/);
  });
});
