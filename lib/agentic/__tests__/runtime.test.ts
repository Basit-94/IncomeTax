import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import type { Persona } from "../../types";
import { computeForPersona } from "../../return/compute";
import { MemoryReturnStore } from "../../return/snapshot-store";
import type { Owner } from "../../server/session";
import { MemoryVaultRepository } from "../../vault/memory-repository";
import { VaultService } from "../../vault/service";
import { loadVaultKey } from "../../vault/crypto";
import { agenticStrings } from "../../i18n/agenticStrings";
import { nullModel, type ConverseInput, type ConverseResult, type ModelAdapter } from "../model";
import { advance, cancelRun, createRun, type RuntimeDeps } from "../runtime";
import { MemoryRunStore } from "../store";
import { runBudget } from "../types";
import type { Run } from "../types";

const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
const rakesh: Owner = { pan: "DEMPK8823R", kind: "demo", displayName: "Rakesh Kumar" };
const en = agenticStrings("en");

/** A scripted Munshi ji: each call returns the next step — a text reply or a set of tool calls. */
type Step = { text: string } | { calls: { name: string; args?: Record<string, unknown> }[]; text?: string } | ((input: ConverseInput) => ConverseResult);
function scripted(steps: Step[]): ModelAdapter & { inputs: ConverseInput[] } {
  const inputs: ConverseInput[] = [];
  return {
    name: "scripted",
    inputs,
    lastFailure: () => null,
    async converse(input) {
      inputs.push(input);
      const step = steps.shift();
      if (!step) return { text: "Anything else?", calls: [], raw: [], usage: { tokens: 1 } };
      if (typeof step === "function") return step(input);
      if ("calls" in step) return { text: step.text ?? "", calls: step.calls.map((c) => ({ name: c.name, args: c.args ?? {} })), raw: [], usage: { tokens: 3 } };
      return { text: step.text, calls: [], raw: [], usage: { tokens: 2 } };
    },
  };
}

function vault() {
  const repo = new MemoryVaultRepository();
  return { repo, service: new VaultService(repo, loadVaultKey({ WAPSI_VAULT_KEY: Buffer.alloc(32, 9).toString("base64") })) };
}

function deps(overrides: Partial<RuntimeDeps> = {}): RuntimeDeps {
  let t = 0;
  const clock = () => `2026-09-05T12:00:${String(t++ % 60).padStart(2, "0")}.000Z`;
  return { store: new MemoryRunStore(clock), returns: new MemoryReturnStore({ now: clock, newId: (p) => `${p}-${t++}` }), vault: null, model: nullModel, budget: runBudget({}), clock, today: () => "2026-09-05", ...overrides };
}

const events = async (d: RuntimeDeps, owner: Owner, run: Run) => (await d.store.eventsAfter(owner, run.id, 0)).map((e) => e.payload);
const said = async (d: RuntimeDeps, owner: Owner, run: Run) => (await events(d, owner, run)).filter((e) => e.type === "message" && e.role === "assistant").map((e) => (e as { text: string }).text);
/** The tool results the model saw, from the run's own transcript. */
const toolLog = (run: Run) => (run.state.transcript ?? []).filter((e) => e.role === "tool").map((e) => e.text);

describe("Munshi ji thinks, the engine counts — the conversation loop (2026-09-07)", () => {
  it("Sunita, end to end: papers behind consent → the year's form → the review card → confirm → simulated filing → outputs, with the engine's figures and no identifier in the log", async () => {
    const { service, repo } = vault();
    const model = scripted([
      { calls: [{ name: "get_return" }] },
      { text: "Let me pull your papers from DigiLocker first.", calls: [{ name: "request_consent", args: { scope: "digilocker", text: "Shall I pull your Form 16, AIS and 26AS from DigiLocker?" } }] },
      // after the pull
      { calls: [{ name: "ask_year_form", args: { text: "A few things the papers can't tell me." } }] },
      // after the form
      { calls: [{ name: "scan_opportunities" }, { name: "compute_tax", args: { regime: "new" } }] },
      { text: "Everything is on the ledger. Here is the return to check.", calls: [{ name: "show_review", args: { kind: "filing" } }] },
      // after confirm
      { text: "Done. The simulated filing went through and the ITR-V is in your vault." },
    ]);
    const d = deps({ model, vault: service });
    const run = await createRun(d, sunita, { message: "Please file my return", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;

    // Consent first: nothing fetched before yes; the card lists the person's own papers.
    expect(r.status).toBe("waiting_for_input");
    expect(r.state.pendingQuestion?.resolves).toBe("consent:digilocker");
    expect(r.state.pendingQuestion?.items?.some((i) => /Form 16/.test(i))).toBe(true);
    expect(await service.list(sunita, { assessmentYear: "2026-27" })).toHaveLength(0);
    expect((await said(d, sunita, r))[0]).toMatch(/pull your papers/);

    r = (await advance(d, sunita, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value: true } }))!;
    // The pull: one activity per document, all stored, the figures said back to the model, then the form.
    const log = await events(d, sunita, r);
    expect(log.filter((e) => e.type === "activity" && /Fetching from DigiLocker/.test((e as { text: string }).text)).length).toBeGreaterThanOrEqual(3);
    expect((await service.list(sunita, { assessmentYear: "2026-27" })).length).toBeGreaterThanOrEqual(3);
    expect(toolLog(r).some((t) => /DigiLocker pull completed/.test(t) && /₹4,20,000/.test(t))).toBe(true);
    expect(r.status).toBe("waiting_for_input");
    expect(r.state.pendingQuestion?.expects).toBe("form");

    r = (await advance(d, sunita, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value: JSON.stringify({ housing: "family", extras: "none" }) } }))!;
    expect(r.status).toBe("waiting_for_review");
    const card = r.state.pendingCard!;
    expect(card.kind).toBe("filing");
    const snap = (await d.returns.get(sunita, "2026-27"))!;
    const manual = computeForPersona(snap.state.persona, snap.state.regime ?? "new");
    expect(manual.refundOrDue).toBeGreaterThan(0);
    expect(card.rows.find((x) => x.label === en.rowRefund)?.value).toBe(`₹${manual.refundOrDue.toLocaleString("en-IN")}`);
    expect(card.boundTo.revision).toBe(snap.revision);
    // The model saw the opportunities scan and the what-if, both engine arithmetic.
    expect(toolLog(r).some((t) => t.startsWith("scan_opportunities") && /"lane"/.test(t))).toBe(true);
    expect(toolLog(r).some((t) => t.startsWith("compute_tax") && /withScenario/.test(t))).toBe(true);

    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    expect(r.status).toBe("completed");
    expect(r.state.actionTaken?.kind).toBe("filing");
    expect(r.state.actionTaken?.id).toMatch(/^SIM-/);
    const after = (await d.returns.get(sunita, "2026-27"))!;
    expect(after.state.filedAt).toBeTruthy();
    expect(after.state.persona.refund.state).toBe("filed_unverified");
    const outs = await d.store.listOutputs(sunita, r.id);
    expect(outs.some((o) => o.kind === "return_summary_json")).toBe(true);
    expect(outs.some((o) => o.kind === "itrv_acknowledgement_pdf")).toBe(true);
    const texts = await said(d, sunita, r);
    expect(texts.some((t) => /simulated filing/i.test(t))).toBe(true); // the receipt line stays a template
    expect(texts[texts.length - 1]).toMatch(/ITR-V is in your vault/); // and Munshi ji closes in his own words
    expect(JSON.stringify(await events(d, sunita, r))).not.toContain("DEMPS4417K");
    expect(repo.auditLog.some((a) => a.actor === "agent" && a.runId === run.id)).toBe(true);
  });

  it("a repeated confirmation does not file twice (§5.4 replay rule)", async () => {
    const model = scripted([{ calls: [{ name: "show_review", args: { kind: "filing" } }] }, { text: "Filed, simulated." }, { text: "That was already done." }]);
    const d = deps({ model });
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    const card = r.state.pendingCard!;
    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    const rev = (await d.returns.get(sunita, "2026-27"))!.revision;
    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    expect((await d.returns.get(sunita, "2026-27"))!.revision).toBe(rev);
    expect((await events(d, sunita, r)).filter((e) => e.type === "tool_outcome" && e.tool === "apply_return_command").length).toBe(1);
  });

  it("a stale card — the return changed underneath — is dropped, nothing applied; declining leaves the return untouched", async () => {
    const model = scripted([{ calls: [{ name: "show_review", args: { kind: "filing" } }] }, { text: "The return moved; I'll prepare it again when you're ready." }]);
    const d = deps({ model });
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    const card = r.state.pendingCard!;
    const manual = await d.returns.apply(sunita, "2026-27", { command: { type: "correct_fact", factId: "sunita-interest", amount: 5000, reason: "passbook" }, expectedRevision: 1, idempotencyKey: "manual-1", actor: "citizen" });
    expect(manual.ok).toBe(true);
    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    expect((await d.returns.get(sunita, "2026-27"))!.state.filedAt).toBeUndefined();
    expect(r.state.pendingCard).toBeUndefined();
    expect((await said(d, sunita, r))).toContain(en.staleReview);

    const d2 = deps({ model: scripted([{ calls: [{ name: "show_review", args: { kind: "filing" } }] }, { text: "No problem, nothing changed." }]) });
    const run2 = await createRun(d2, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r2 = (await advance(d2, sunita, run2.id))!;
    r2 = (await advance(d2, sunita, r2.id, { confirm: { cardId: r2.state.pendingCard!.id, accepted: false } }))!;
    expect(r2.status).toBe("completed");
    expect((await d2.returns.get(sunita, "2026-27"))!.revision).toBe(1);
    expect(r2.state.actionTaken).toBeUndefined();
  });

  it("a figure the tools never produced is refused: one nudge, then the reply is held back — and a figure from the ledger passes", async () => {
    const model = scripted([{ text: "You'll get ₹9,999 back." }, { text: "Around ₹9,999, give or take." }]);
    const d = deps({ model });
    const run = await createRun(d, sunita, { message: "how much refund will I get?", lang: "en" });
    const r = (await advance(d, sunita, run.id))!;
    const texts = await said(d, sunita, r);
    expect(texts).toEqual([en.replyUnverified]);
    expect(model.inputs[1].messages[model.inputs[1].messages.length - 1]).toMatchObject({ role: "user", text: expect.stringMatching(/refused: figure not in the facts \(9999\)/) });
    const notes = (await events(d, sunita, r)).filter((e) => e.type === "tool_outcome" && e.tool === "model.converse").map((e) => (e as { summary: string }).summary);
    expect(notes[0]).toMatch(/asked once more/);
    expect(notes[1]).toMatch(/reply refused/);

    const good = scripted([{ calls: [{ name: "get_return" }] }, { text: "₹8,400 was deducted from your salary of ₹4,20,000 and the engine puts your tax at nil, so all ₹8,400 comes back." }]);
    const d2 = deps({ model: good });
    const r2 = (await advance(d2, sunita, (await createRun(d2, sunita, { message: "how much refund will I get?", lang: "en" })).id))!;
    expect((await said(d2, sunita, r2))[0]).toMatch(/all ₹8,400 comes back/);
    expect(r2.status).toBe("completed");
  });

  it("documents are read only after consent; the model calling read_document first is refused", async () => {
    const { service } = vault();
    const pdf = new TextEncoder().encode("%PDF-1.4\nFORM NO. 16 PAN of the Employee: DEMPS4417K Gross Salary: 4,50,000 Total Tax Deducted: 9,000\n%%EOF");
    const up = await service.upload({ owner: sunita, bytes: pdf, filename: "Form16_DEMPS4417K.pdf", assessmentYear: "2026-27", docType: "FORM_16", issuer: "Infosys Ltd" });
    const docId = (up as { document: { id: string } }).document.id;
    const model = scripted([
      { calls: [{ name: "read_document", args: { documentId: docId } }] },
      { text: "There's a Form 16 in your vault.", calls: [{ name: "request_consent", args: { scope: "documents", documentIds: [docId], text: "May I read the Form 16 in your vault?" } }] },
      { text: "Read it: the salary and the tax deducted are now on the ledger." },
    ]);
    const d = deps({ model, vault: service });
    const run = await createRun(d, sunita, { message: "use the form 16 I uploaded", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(toolLog(r).some((t) => /consent_required/.test(t))).toBe(true);
    expect(r.state.pendingQuestion?.resolves).toBe("consent:documents");
    expect(r.state.pendingCommands ?? []).toHaveLength(0);
    r = (await advance(d, sunita, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value: true } }))!;
    expect(toolLog(r).some((t) => /Documents read and staged/.test(t) && /₹4,50,000/.test(t))).toBe(true);
    expect(r.state.pendingCommands?.some((c) => c.type === "import_document")).toBe(true);
    expect(r.state.sources.some((s) => s.kind === "document" && s.verified)).toBe(true);
    // The filename never reaches the log.
    expect(JSON.stringify(await events(d, sunita, r))).not.toContain("Form16_DEMPS4417K");
  });

  it("a balance due blocks the filing card until the simulated challan is paid; the receipt stays a template and the ledger gets the s.140A credit", async () => {
    const priyaOwner: Owner = { kind: "demo", pan: "ABCDE1234F", displayName: "Priya Patel" };
    const priya: Persona = {
      ...PERSONAS.sunita, id: "custom", name: "PRIYA PATEL", age: 29, pan: "ABCDE1234F",
      facts: [{ id: "sal", kind: "salary", label: "Salary from Infosys", amount: 1450000, provenance: { reporter: "Infosys", reporterKind: "employer", filedOn: "2026-05-15", statement: "26AS", onlyReporterCanFix: true } }],
      taxPaid: [{ id: "tds", label: "TDS by Infosys", amount: 85000, section: "192", provenance: { reporter: "Infosys", reporterKind: "employer", filedOn: "2026-05-15", statement: "26AS", onlyReporterCanFix: true } }],
      claims: [], banks: [], refund: { state: "not_filed", amount: 0, holds: [], timeline: [] }, notices: [],
    };
    const model = scripted([
      { calls: [{ name: "show_review", args: { kind: "filing" } }] },
      { text: "There's tax still to pay before filing.", calls: [{ name: "offer_payment" }] },
      { calls: [{ name: "show_review", args: { kind: "filing" } }] },
      { text: "Filed, simulated." },
    ]);
    const d = deps({ model });
    await d.returns.replace(priyaOwner, "2026-27", { version: 1, lang: "en", personaId: "custom", baselinePersona: priya, persona: priya, corrections: [], confirmedFactIds: [], regime: "new" }, null);
    const run = await createRun(d, priyaOwner, { task: "prepare_salaried_return", lang: "en" });
    let r = (await advance(d, priyaOwner, run.id))!;
    expect(toolLog(r).some((t) => /"blocked":"balance_due"/.test(t) && /"due":4700/.test(t))).toBe(true);
    expect(r.state.pendingQuestion?.resolves).toBe("challan_payment_mode");
    expect(r.state.pendingQuestion?.choices?.some((c) => c.value === "pay_challan_upi")).toBe(true);
    r = (await advance(d, priyaOwner, r.id, { answer: { questionId: r.state.pendingQuestion!.id, value: "pay_challan_upi" } }))!;
    const texts = await said(d, priyaOwner, r);
    expect(texts.some((t) => /Challan ITNS 280/.test(t) && /CIN/.test(t))).toBe(true);
    const snap = (await d.returns.get(priyaOwner, "2026-27"))!;
    expect(snap.state.baselinePersona.taxPaid.some((t) => t.section === "140A")).toBe(true);
    expect(r.state.actionTaken?.kind).toBe("payment");
    expect(r.status).toBe("waiting_for_review");
    expect(r.state.pendingCard?.boundTo.amount).toBe(0);
  });

  it("Rakesh's capital gains are outside the engine: the card is blocked with the reason, nothing staged, nothing applied", async () => {
    const model = scripted([{ calls: [{ name: "show_review", args: { kind: "regime" } }] }, { text: "Your share sales need ITR-2 and a CA's figure; I can still compare the regimes on the salary." }]);
    const d = deps({ model });
    const run = await createRun(d, rakesh, { message: "which regime is better for me?", lang: "en" });
    const r = (await advance(d, rakesh, run.id))!;
    expect(r.status).toBe("completed");
    expect(r.state.pendingCard).toBeUndefined();
    expect(toolLog(r).some((t) => /"blocked":"unsupported"/.test(t) && /Capital gains/.test(t))).toBe(true);
    expect((await d.returns.get(rakesh, "2026-27"))!.state.regime).toBe("new");
    expect(await d.store.listOutputs(rakesh, r.id)).toHaveLength(0);
  });

  it("a typed message can answer a card (yes / a number / a choice), and a new message on a finished run continues the same conversation", async () => {
    const model = scripted([
      { text: "Quick one.", calls: [{ name: "ask", args: { text: "Did you pay rent this year?", why: "Rent without HRA points at 80GG.", kind: "yes_no" } }] },
      { text: "Noted, you rent. What's the monthly rent?" },
      { text: "Got it." },
    ]);
    const d = deps({ model });
    const run = await createRun(d, sunita, { message: "can I save more tax?", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(r.state.pendingQuestion?.expects).toBe("yes_no");
    r = (await advance(d, sunita, r.id, { message: "haan" }))!;
    expect(r.state.answers[Object.keys(r.state.answers).find((k) => k.startsWith("ask:"))!]).toBe(true);
    expect(toolLog(r).some((t) => /answered "Yes"/.test(t))).toBe(true);
    expect(r.status).toBe("completed");
    r = (await advance(d, sunita, r.id, { message: "about 12,000 a month" }))!;
    expect(r.status).toBe("completed");
    expect(r.state.transcript?.filter((e) => e.role === "user")).toHaveLength(3);
    expect((await said(d, sunita, r)).at(-1)).toBe("Got it.");
  });

  it("budget exhaustion stops the run; cancel drops pending items; another owner sees nothing; an identifier typed by the person is redacted", async () => {
    const d = deps({ model: scripted([{ calls: [{ name: "get_return" }] }, { text: "x" }]), budget: { ...runBudget({}), maxModelCallsPerRun: 1 } });
    const run = await createRun(d, sunita, { message: "my PAN is DEMPS4417K, file it", lang: "en" });
    const r = (await advance(d, sunita, run.id))!;
    expect((await said(d, sunita, r))).toContain(en.budgetExhausted);
    expect(r.state.transcript?.[0].text).toContain("[PAN]");
    expect(JSON.stringify(await events(d, sunita, r))).not.toContain("DEMPS4417K");

    const d2 = deps({ model: scripted([{ calls: [{ name: "ask", args: { text: "Rent?", why: "w", kind: "yes_no" } }] }]) });
    const run2 = await createRun(d2, sunita, { task: "prepare_salaried_return", lang: "en" });
    await advance(d2, sunita, run2.id);
    const c = (await cancelRun(d2, sunita, run2.id))!;
    expect(c.status).toBe("cancelled");
    expect(c.state.pendingQuestion).toBeUndefined();
    expect(await d2.store.getRun(rakesh, run2.id)).toBeNull();
    expect(await advance(d2, rakesh, run2.id)).toBeNull();
  });

  it("with the model off there is one honest line, in the interface language, and no menu", async () => {
    const d = deps();
    const r = (await advance(d, sunita, (await createRun(d, sunita, { message: "namaste", lang: "hi" })).id))!;
    const texts = await said(d, sunita, r);
    expect(texts).toHaveLength(1);
    expect(texts[0]).toBe(agenticStrings("hi").modelOffline.replace("{reason}", "model off"));
    expect(texts[0]).not.toMatch(/\d\./);
    expect(r.status).toBe("completed");
    expect((await events(d, sunita, r)).some((e) => e.type === "tool_outcome" && e.tool === "model.converse" && !e.ok)).toBe(true);
  });

  it("the model is told who it is talking to — situation, papers, statutory facts, character — and never a PAN", async () => {
    const model = scripted([{ text: "Namaste. What brought you here today?" }]);
    const d = deps({ model });
    await advance(d, sunita, (await createRun(d, sunita, { message: "hi", lang: "en", profile: { firstName: "Sunita", refundAccount: "SBI •••• 1234", residency: "resident", digilockerLinked: true, mode: "simple" } })).id);
    const sys = model.inputs[0].system;
    expect(sys).toContain("You are Munshi ji");
    expect(sys).toContain("first name Sunita");
    expect(sys).toContain("DigiLocker linked at onboarding");
    expect(sys).toContain("Income on record: salary ₹4,20,000");
    expect(sys).toContain("Statutory facts, FY 2025-26");
    expect(sys).not.toContain("DEMPS4417K");
    expect(sys).toContain("Reply in English");
    expect(model.inputs[0].tools.map((t) => t.name)).toContain("scan_opportunities");
  });

  it("the reply language follows the latest message: Hindi for Devanagari, Hinglish for romanised Hindi, and it switches turn by turn", async () => {
    const model = scripted([{ text: "नमस्ते।" }, { text: "Haan, bataata hoon." }, { text: "Sure." }]);
    const d = deps({ model });
    const run = await createRun(d, sunita, { message: "80C क्या है?", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(model.inputs[0].system).toContain("Reply in Hindi (Devanagari script)");
    expect(model.inputs[0].system).toContain("You answer in Hindi");
    r = (await advance(d, sunita, r.id, { message: "aur 80D kya hai bhai" }))!;
    expect(model.inputs[1].system).toContain("Reply in Hinglish");
    r = (await advance(d, sunita, r.id, { message: "and 80E?" }))!;
    expect(model.inputs[2].system).toContain("Reply in English");
    expect(r.state.replyLanguage).toBe("en");
  });
});
