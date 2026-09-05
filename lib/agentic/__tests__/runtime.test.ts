import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import { computeForPersona } from "../../return/compute";
import { MemoryReturnStore } from "../../return/snapshot-store";
import type { Owner } from "../../server/session";
import { MemoryVaultRepository } from "../../vault/memory-repository";
import { VaultService } from "../../vault/service";
import { loadVaultKey } from "../../vault/crypto";
import { nullModel } from "../model";
import { advance, cancelRun, createRun, type RuntimeDeps } from "../runtime";
import { MemoryRunStore } from "../store";
import { runBudget } from "../types";
import type { Run } from "../types";

const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
const rakesh: Owner = { pan: "DEMPK8823R", kind: "demo", displayName: "Rakesh Kumar" };

function deps(overrides: Partial<RuntimeDeps> = {}): RuntimeDeps {
  let t = 0;
  const clock = () => `2026-09-05T12:00:${String(t++ % 60).padStart(2, "0")}.000Z`;
  return {
    store: new MemoryRunStore(clock),
    returns: new MemoryReturnStore({ now: clock, newId: (p) => `${p}-${t++}` }),
    vault: null,
    model: nullModel,
    budget: runBudget({}),
    clock,
    today: () => "2026-09-05",
    ...overrides,
  };
}

async function events(d: RuntimeDeps, owner: Owner, run: Run) {
  return (await d.store.eventsAfter(owner, run.id, 0)).map((e) => e.payload);
}

async function answerUntilReview(d: RuntimeDeps, owner: Owner, run: Run, answers: Record<string, string | number | boolean>) {
  let r: Run | null = run;
  for (let i = 0; i < 10 && r && r.status === "waiting_for_input"; i += 1) {
    const q = r.state.pendingQuestion!;
    const value = answers[q.resolves];
    expect(value, `no scripted answer for ${q.resolves}`).toBeDefined();
    r = await advance(d, owner, r.id, { answer: { questionId: q.id, value } });
  }
  return r!;
}

describe("runtime — the first end-to-end milestone (plan §7)", () => {
  it("Sunita: prepare return → questions → recommendation → review → confirm → simulated filing → outputs → identical manual figures", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { message: "Please file my return", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(r.task).toBe("prepare_salaried_return");
    expect(r.status).toBe("waiting_for_input");
    expect(r.state.pendingQuestion?.resolves).toBe("other_income");

    r = await answerUntilReview(d, sunita, r, { other_income: false, claim_80C: 0, claim_80D: 0 });
    expect(r.status).toBe("waiting_for_review");
    const card = r.state.pendingCard!;
    expect(card.kind).toBe("filing");
    expect(card.boundTo.revision).toBe(1);

    // The figures on the card are the engine's, exactly as the manual page would compute them.
    const snap = (await d.returns.get(sunita, "2026-27"))!;
    const manual = computeForPersona(snap.state.persona, snap.state.regime ?? "new");
    expect(card.rows.find((x) => x.label === "Refund due to you")?.value).toBe("₹8,400");
    expect(manual.refundOrDue).toBe(8400);
    expect(card.basis.provisions).toContain("1961:87A@FY2025-26");

    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    expect(r.status).toBe("completed");
    expect(r.state.actionTaken?.kind).toBe("filing");
    expect(r.state.actionTaken?.id).toMatch(/^SIM-/);

    const after = (await d.returns.get(sunita, "2026-27"))!;
    expect(after.state.filedAt).toBeTruthy();
    expect(after.state.persona.refund.state).toBe("filed_unverified");
    expect(after.revision).toBe(2);

    const outs = await d.store.listOutputs(sunita, r.id);
    expect(outs).toHaveLength(1);
    expect(outs[0].synthetic).toBe(true);
    expect(outs[0].snapshotRevision).toBe(2);
    const body = JSON.parse(new TextDecoder().decode((await d.store.getOutput(sunita, outs[0].id))!.body));
    expect(body.synthetic).toBe(true);
    expect(body.figures.refundOrDue).toBe(8400);

    const log = await events(d, sunita, r);
    const types = log.map((e) => e.type);
    expect(types[0]).toBe("run_created");
    expect(types).toContain("question");
    expect(types).toContain("review_card");
    expect(types).toContain("confirmation");
    expect(types).toContain("output");
    expect(log.some((e) => e.type === "message" && e.role === "assistant" && /simulated filing/.test(e.text))).toBe(true);
    // No identifier leaks into the persisted log.
    expect(JSON.stringify(log)).not.toContain("DEMPS4417K");
  });

  it("a repeated confirmation does not file twice (§5.4 replay rule)", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = await answerUntilReview(d, sunita, (await advance(d, sunita, run.id))!, { other_income: false, claim_80C: 0, claim_80D: 0 });
    const card = r.state.pendingCard!;
    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    const rev = (await d.returns.get(sunita, "2026-27"))!.revision;
    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    expect((await d.returns.get(sunita, "2026-27"))!.revision).toBe(rev);
    expect((await events(d, sunita, r)).filter((e) => e.type === "tool_outcome" && e.tool === "apply_return_command").length).toBe(1);
  });

  it("a stale card — the return changed underneath — is not applied; the review is prepared again", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = await answerUntilReview(d, sunita, (await advance(d, sunita, run.id))!, { other_income: false, claim_80C: 0, claim_80D: 0 });
    const card = r.state.pendingCard!;
    // Manual edit in between (a correction through the shared command path).
    const manual = await d.returns.apply(sunita, "2026-27", { command: { type: "correct_fact", factId: "sunita-interest", amount: 5000, reason: "passbook" }, expectedRevision: 1, idempotencyKey: "manual-1", actor: "citizen" });
    expect(manual.ok).toBe(true);
    r = (await advance(d, sunita, r.id, { confirm: { cardId: card.id, accepted: true } }))!;
    expect((await d.returns.get(sunita, "2026-27"))!.state.filedAt).toBeUndefined();
    expect(r.status).toBe("waiting_for_review");
    expect(r.state.pendingCard!.id).not.toBe(card.id);
    expect(r.state.pendingCard!.boundTo.revision).toBe(2);
    expect((await events(d, sunita, r)).some((e) => e.type === "message" && /changed while I was preparing/.test(e.text))).toBe(true);
  });

  it("declining leaves the return untouched and completes the run", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = await answerUntilReview(d, sunita, (await advance(d, sunita, run.id))!, { other_income: false, claim_80C: 0, claim_80D: 0 });
    r = (await advance(d, sunita, r.id, { confirm: { cardId: r.state.pendingCard!.id, accepted: false } }))!;
    expect(r.status).toBe("completed");
    expect((await d.returns.get(sunita, "2026-27"))!.revision).toBe(1);
    expect(r.state.actionTaken).toBeUndefined();
  });

  it("compare_regimes: Rakesh's capital gains and 80D claim are outside this release — the run explains why, stages nothing, changes nothing", async () => {
    const d = deps();
    const run = await createRun(d, rakesh, { message: "which regime is better for me?", lang: "en" });
    const r = (await advance(d, rakesh, run.id))!;
    expect(r.task).toBe("compare_regimes");
    expect(r.status).toBe("completed");
    expect(r.state.pendingCard).toBeUndefined();
    expect(r.state.pendingCommands).toBeUndefined();
    expect(r.state.advice?.canRecommend).toBe(false);
    expect(r.state.advice?.comparison).toBeUndefined(); // no "cheaper" figure leaks when the guard says no
    const codes = r.state.advice!.issues.map((i) => i.code);
    expect(codes).toContain("capital_gains_unsupported");
    expect(codes).toContain("deduction_unsupported");
    expect((await d.returns.get(rakesh, "2026-27"))!.state.regime).toBe("new");
    expect(await d.store.listOutputs(rakesh, r.id)).toHaveLength(0);
    const log = await events(d, rakesh, r);
    expect(log.some((e) => e.type === "review_card")).toBe(false);
    expect(log.some((e) => e.type === "message" && e.role === "assistant" && /cannot make a recommendation/.test(e.text))).toBe(true);
    expect(r.state.steps.find((p) => p.id === "review")?.state).toBe("skipped");
  });

  it("an answer typed as a message is parsed against the pending question, in words or figures — and an unsupported income head then abstains", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    let r = (await advance(d, sunita, run.id))!;
    expect(r.state.pendingQuestion?.expects).toBe("yes_no");
    r = (await advance(d, sunita, r.id, { message: "yes, some freelance work" }))!;
    expect(r.state.answers.other_income).toBe(true);
    expect(r.state.pendingQuestion?.resolves).toBe("other_income_amount");
    r = (await advance(d, sunita, r.id, { message: "about 1.5 lakh" }))!;
    expect(r.state.answers.other_income_amount).toBe(150000);
    r = await answerUntilReview(d, sunita, r, { claim_80C: 0, claim_80D: 0 });
    // Self-declared "other" income is an income head this release does not compute: the guard abstains,
    // nothing is staged for confirmation and nothing is applied to the return.
    expect(r.status).toBe("completed");
    expect(r.state.pendingCard).toBeUndefined();
    expect(r.state.pendingCommands).toBeUndefined();
    expect(r.state.advice?.issues.map((i) => i.code)).toContain("income_head_unsupported");
    expect((await d.returns.get(sunita, "2026-27"))!.state.persona.facts).toHaveLength(2);
    expect((await d.returns.get(sunita, "2026-27"))!.revision).toBe(1);
  });

  it("with a vault: an uploaded Form 16 that disagrees with the return is found, read and staged as an import", async () => {
    const repo = new MemoryVaultRepository();
    const vault = new VaultService(repo, loadVaultKey({ WAPSI_VAULT_KEY: Buffer.alloc(32, 9).toString("base64") }));
    const pdf = new TextEncoder().encode("%PDF-1.4\nFORM NO. 16 PAN of the Employee: DEMPS4417K Gross Salary: 4,50,000 Total Tax Deducted: 9,000\n%%EOF");
    await vault.upload({ owner: sunita, bytes: pdf, filename: "Form16_DEMPS4417K.pdf", assessmentYear: "2026-27", docType: "FORM_16", issuer: "Infosys Ltd" });
    const d = deps({ vault });
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    const r = (await advance(d, sunita, run.id))!;
    const log = await events(d, sunita, r);
    expect(log.some((e) => e.type === "activity" && /found 1 document/i.test(e.text))).toBe(true);
    expect(r.state.sources.some((s) => s.kind === "document" && s.verified)).toBe(true);
    expect(r.state.pendingCommands?.some((c) => c.type === "import_document")).toBe(true);
    // The filename never reaches the log; the agent's audit trail names the run.
    expect(JSON.stringify(log)).not.toContain("Form16_DEMPS4417K");
    expect(repo.auditLog.some((a) => a.actor === "agent" && a.runId === run.id && a.operation === "list")).toBe(true);
  });

  it("budget exhaustion stops the run without changing the return", async () => {
    const d = deps({ budget: { ...runBudget({}), maxToolCallsPerRun: 2 } });
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    const r = (await advance(d, sunita, run.id))!;
    expect(r.status).toBe("failed");
    expect((await events(d, sunita, r)).some((e) => e.type === "status" && e.reason === "budget_exhausted")).toBe(true);
  });

  it("cancel drops pending items; another owner sees nothing", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "en" });
    await advance(d, sunita, run.id);
    const c = (await cancelRun(d, sunita, run.id))!;
    expect(c.status).toBe("cancelled");
    expect(c.state.pendingQuestion).toBeUndefined();
    expect(await d.store.getRun(rakesh, run.id)).toBeNull();
    expect(await advance(d, rakesh, run.id)).toBeNull();
  });

  it("Hindi: questions and the review card come out in Hindi from the same deterministic templates", async () => {
    const d = deps();
    const run = await createRun(d, sunita, { task: "prepare_salaried_return", lang: "hi" });
    const r = (await advance(d, sunita, run.id))!;
    expect(r.state.pendingQuestion?.text).toMatch(/आय/);
  });
});
