import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import { CURRENT_VERSION } from "../../return/persist";
import { MemoryReturnStore } from "../../return/snapshot-store";
import type { ReturnState } from "../../return/state";
import type { Owner } from "../../server/session";
import type { Persona } from "../../types";
import { MemoryRunStore } from "../store";
import { TOOLS, runTool, type ToolContext } from "../tools";

const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
const rakesh: Owner = { pan: "DEMPK8823R", kind: "demo", displayName: "Rakesh Kumar" };

async function ctxFor(owner: Owner, persona: Persona): Promise<ToolContext> {
  let t = 0;
  const clock = () => `2026-09-05T12:00:${String(t++ % 60).padStart(2, "0")}.000Z`;
  const returns = new MemoryReturnStore({ now: clock, newId: (p) => `${p}-${t++}` });
  const state: ReturnState = { version: CURRENT_VERSION, lang: "en", personaId: persona.id, baselinePersona: persona, persona, corrections: [], confirmedFactIds: [], regime: "new" };
  await returns.replace(owner, "2026-27", state, null);
  return { owner, runId: "run-test", assessmentYear: "2026-27", vault: null, returns, store: new MemoryRunStore(clock), today: "2026-09-05" };
}

type Result = { ok: boolean; result: Record<string, unknown>; error?: string };

describe("tool registry — the shared guard sits inside every arithmetic tool (handoff §7B)", () => {
  it("supported demo: figures flow, with the release id attached", async () => {
    const ctx = await ctxFor(sunita, PERSONAS.sunita);
    const r = (await runTool("compute_current_tax", {}, ctx)) as Result;
    expect(r.ok).toBe(true);
    expect(r.result.blocked).toBeUndefined();
    expect(r.result.refundOrDue).toBe(8400);
    expect(r.result.totalTax).toBe(0);
    expect(r.result.release).toBe("2026-09-05.2");
    const filing = (await runTool("prepare_filing", {}, ctx)) as Result;
    expect(filing.result.refundOrDue).toBe(8400);
  });

  it("unsupported return: every arithmetic tool returns a structured limitation, through the executor AND by direct call", async () => {
    const ctx = await ctxFor(rakesh, PERSONAS.rakesh);
    for (const name of ["compute_current_tax", "compare_regimes", "review_return", "prepare_filing", "prepare_simulated_payment"] as const) {
      const viaExecutor = (await runTool(name, {}, ctx)) as Result;
      expect(viaExecutor.ok, name).toBe(true);
      expect(viaExecutor.result.blocked, name).toBe(true);
      expect(viaExecutor.result.totalTax, name).toBeUndefined();
      expect(viaExecutor.result.cheaper, name).toBeUndefined();
      expect(viaExecutor.result.balancePayable, name).toBeUndefined();
      expect((viaExecutor.result.issues as { code: string }[]).map((i) => i.code), name).toContain("capital_gains_unsupported");
      const direct = await (TOOLS[name] as { run: (a: unknown, c: ToolContext) => Promise<Record<string, unknown>> }).run({}, ctx);
      expect(direct.blocked, `${name} direct`).toBe(true);
    }
  });

  it("raw owner-scoped facts stay readable when derived figures are withheld", async () => {
    const ctx = await ctxFor(rakesh, PERSONAS.rakesh);
    const r = (await runTool("get_current_return", {}, ctx)) as Result;
    expect((r.result.facts as unknown[]).length).toBeGreaterThan(0);
    expect(r.result.figures).toBeNull();
    expect((r.result.limitation as { blocked: boolean }).blocked).toBe(true);
    expect(JSON.stringify(r.result)).not.toContain(rakesh.pan);
  });

  it("a stale knowledge release blocks even the supported demo at the tool boundary", async () => {
    const ctx = { ...(await ctxFor(sunita, PERSONAS.sunita)), today: "2027-01-01" };
    const r = (await runTool("compute_current_tax", {}, ctx)) as Result;
    expect(r.result.blocked).toBe(true);
    expect((r.result.issues as { code: string }[]).map((i) => i.code)).toContain("stale");
  });

  it("retrieve_tax_knowledge answers from the public corpus and abstains honestly", async () => {
    const ctx = await ctxFor(sunita, PERSONAS.sunita);
    const ok = (await runTool("retrieve_tax_knowledge", { question: "what is the standard deduction" }, ctx)) as Result;
    expect(ok.result.status).toBe("grounded");
    expect((ok.result.citations as unknown[]).length).toBeGreaterThan(0);
    const none = (await runTool("retrieve_tax_knowledge", { question: "how do I cook rice" }, ctx)) as Result;
    expect(none.result.status).toBe("no_evidence");
    const bad = (await runTool("retrieve_tax_knowledge", { question: "hi" }, ctx)) as Result;
    expect(bad.ok).toBe(false);
  });

  it("check_applicability validates money and never defaults an unknown category to eligible", async () => {
    const ctx = await ctxFor(sunita, PERSONAS.sunita);
    const neg = (await runTool("check_applicability", { facts: { grossSalary: -1 } }, ctx)) as Result;
    expect(neg.ok).toBe(false);
    expect(neg.error).toBe("invalid_args");
    const nan = (await runTool("check_applicability", { facts: { totalIncome: Number.NaN } }, ctx)) as Result;
    expect(nan.ok).toBe(false);
    const unknownCategory = (await runTool("check_applicability", { facts: { resident: true, totalIncome: 900000, regime: "new" } }, ctx)) as { result: { results: { rule: string; outcome: string; missing?: string[] }[] } };
    const rebate = unknownCategory.result.results.find((r) => r.rule === "rebate_87A")!;
    expect(rebate.outcome).toBe("insufficient_information");
    expect(rebate.missing).toContain("taxpayer category");
    const otherAct = (await runTool("check_applicability", { facts: { financialYear: "2026-27", hasSalaryIncome: true, regime: "new" } }, ctx)) as { result: { results: { rule: string; outcome: string }[] } };
    expect(otherAct.result.results[0]).toMatchObject({ rule: "period_supported", outcome: "ineligible" });
    expect(otherAct.result.results.slice(1).every((r) => r.outcome === "insufficient_information")).toBe(true);
  });
});
