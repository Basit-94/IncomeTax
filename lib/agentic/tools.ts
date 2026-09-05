/**
 * The shared, runtime-validated tool registry (plan.md §5.2: "Adapt
 * lib/agent/tools.ts into a runtime-validated registry shared by legacy chat
 * and Agentic ... Reuse computeForPersona, compareForPersona, engine constants,
 * compliance modules, and existing return adapters").
 *
 * Every tool has a zod schema for its arguments, a side (server or client),
 * and a permission class. The executor validates arguments, checks the run
 * budget, and calls the same services the UI calls — vault documents through
 * VaultService, return changes through the command store, arithmetic through
 * lib/engine via lib/return/compute. There is no privileged path.
 *
 * Financial changes are `reviewable`: they are never applied directly by a
 * tool call. The runtime stages them on a review card and applies them only
 * after the citizen confirms (§5.2: "Do not treat a model tool call as user
 * confirmation").
 */

import { z } from "zod";
import { assessCassRisk } from "../compliance/cass";
import { PERSONAS } from "../personas";
import { compareForPersona, computeForPersona } from "../return/compute";
import type { ReturnCommand } from "../return/commands";
import type { ReturnSnapshotStore } from "../return/snapshot-store";
import type { Owner } from "../server/session";
import type { VaultService } from "../vault/service";
import { evaluateSalariedSlice } from "../knowledge/applicability";
import { assessAdvice, type AdviceAssessment } from "../knowledge/advice";
import { PERIOD_FY_2025_26, periodForFinancialYear } from "../knowledge/provisions";
import { answerTaxQuestion } from "../knowledge/rag";
import type { TaxpayerFacts } from "../knowledge/types";
import { safeFilename } from "./redact";
import type { RunStore } from "./store";
import type { MemoryKey, SourceRef } from "./types";
import { MEMORY_KEYS } from "./types";

export type ToolPermission = "auto" | "reviewable" | "confirm_required";

export interface ToolContext {
  owner: Owner;
  runId: string;
  assessmentYear: string;
  vault: VaultService | null;
  returns: ReturnSnapshotStore;
  store: RunStore;
  /** Today's date (YYYY-MM-DD), injected so the knowledge-release window check is deterministic in tests. */
  today: string;
}

export interface ToolSpec<A extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  args: A;
  permission: ToolPermission;
  run: (args: z.infer<A>, ctx: ToolContext) => Promise<unknown>;
}

const none = z.object({}).strict();
/** Whole rupees, finite, never negative, inside the safe-integer range. */
const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

/** Lets each tool's `run` see its own inferred argument type. */
function tool<A extends z.ZodTypeAny>(spec: ToolSpec<A>): ToolSpec<A> {
  return spec;
}

/* ---------------------------------------------------------------- helpers -- */

async function currentReturn(ctx: ToolContext) {
  const snap = await ctx.returns.get(ctx.owner, ctx.assessmentYear);
  if (!snap) return null;
  return snap;
}

/**
 * The shared guard, applied INSIDE every arithmetic tool so a direct call cannot bypass it
 * (docs/TAX-RAG-AGENT-HANDOFF-2026-09-05.md §7B). When the guard says no, the tool returns
 * this structured limitation instead of figures — never a number the release cannot stand behind.
 */
function limitation(advice: AdviceAssessment, revision: number) {
  return {
    exists: true as const,
    revision,
    blocked: true as const,
    status: advice.status,
    release: advice.release,
    corpusHash: advice.corpusHash,
    issues: advice.issues.map((i) => ({ code: i.code, reason: i.reason, provisions: i.provisions })),
  };
}

function guard(ctx: ToolContext, persona: Parameters<typeof computeForPersona>[0]): AdviceAssessment {
  return assessAdvice(persona, { ownerKind: ctx.owner.kind, today: ctx.today });
}

/** The engine's view of a return without identifiers (§5.3). */
function figures(snapRegime: "new" | "old" | undefined, persona: Parameters<typeof computeForPersona>[0]) {
  const regime = snapRegime ?? "new";
  const b = computeForPersona(persona, regime);
  return {
    regime,
    grossIncome: b.grossIncome,
    standardDeduction: b.standardDeduction,
    totalDeductions: b.totalDeductions,
    taxableIncome: b.taxableIncome,
    rebate87A: b.rebate87A,
    marginalReliefApplied: b.marginalReliefApplied,
    cess: b.cess,
    totalTax: b.totalTax,
    tdsCredits: b.tdsCredits,
    refundOrDue: b.refundOrDue,
  };
}

/* ----------------------------------------------------------------- registry -- */

export const TOOLS = {
  list_vault_documents: tool({
    name: "list_vault_documents",
    description: "List the signed-in citizen's stored documents for the year, with provenance. Never lists another owner's.",
    args: z.object({ docType: z.enum(["FORM_16", "ANNUAL_INFO_STATEMENT", "FORM_26AS", "BANK_STATEMENT", "CHALLAN_280", "ITR_V", "OTHER"]).optional() }).strict(),
    permission: "auto",
    async run(args, ctx) {
      if (!ctx.vault) return { available: false, reason: "storage_unavailable", documents: [] as SourceRef[] };
      const docs = await ctx.vault.list(ctx.owner, { assessmentYear: ctx.assessmentYear, docType: args.docType }, "agent", ctx.runId);
      return {
        available: true,
        documents: docs.map((d) => ({
          id: d.id,
          docType: d.docType,
          title: d.title,
          issuer: d.issuer,
          provenance: d.provenance,
          hasOriginal: d.hasBytes,
          filename: d.filename ? safeFilename(d.filename) : undefined,
          uploadedAt: d.uploadedAt,
        })),
      };
    },
  }),

  read_document_fields: tool({
    name: "read_document_fields",
    description: "Read the structured fields already extracted from a stored document. Values are proposals, not facts.",
    args: z.object({ documentId: z.string().min(1) }).strict(),
    permission: "auto",
    async run(args, ctx) {
      if (!ctx.vault) return { available: false, reason: "storage_unavailable" };
      const meta = await ctx.vault.getMeta(ctx.owner, args.documentId, "agent", ctx.runId);
      if (!meta) return { found: false };
      if (!meta.hasBytes) return { found: true, readable: false, reason: "metadata_only", provenance: meta.provenance };
      const ex = await ctx.vault.getExtraction(ctx.owner, args.documentId);
      if (!ex) return { found: true, readable: false, reason: "not_extracted" };
      // Identity fields stay out of tool summaries (§5.3); the figures are the work.
      return {
        found: true,
        readable: ex.status === "ok",
        status: ex.status,
        fields: { grossSalary: ex.fields.grossSalary, tds: ex.fields.tds, employerName: ex.fields.employerName },
        subjectMatchesOwner: ex.fields.pan ? ex.fields.pan === ctx.owner.pan : undefined,
        issues: ex.issues,
        reviewState: ex.reviewState,
      };
    },
  }),

  open_vault_document: tool({
    name: "open_vault_document",
    description: "Hand the citizen a stored original to view on their screen. The agent never reads raw document text.",
    args: z.object({ documentId: z.string().min(1) }).strict(),
    permission: "auto",
    async run(args, ctx) {
      if (!ctx.vault) return { ok: false, reason: "storage_unavailable" };
      const meta = await ctx.vault.getMeta(ctx.owner, args.documentId, "agent", ctx.runId);
      if (!meta) return { ok: false, reason: "not_found" };
      if (!meta.hasBytes) return { ok: false, reason: "no_original" };
      return { ok: true, clientAction: { kind: "open_document", href: `/api/vault/documents/${meta.id}/bytes`, title: meta.title } };
    },
  }),

  get_current_return: tool({
    name: "get_current_return",
    description: "The owner's return as recorded: facts by kind, claims, credits, regime and revision. No identifiers. Derived figures appear only when the shared guard allows them.",
    args: none,
    permission: "auto",
    async run(_args, ctx) {
      const snap = await currentReturn(ctx);
      if (!snap) return { exists: false };
      const p = snap.state.persona;
      const advice = guard(ctx, p);
      return {
        exists: true,
        revision: snap.revision,
        regime: snap.state.regime ?? "new",
        filed: !!snap.state.filedAt,
        // Raw, owner-scoped facts stay readable: they are the citizen's own records, not advice.
        facts: p.facts.map((f) => ({ id: f.id, kind: f.kind, amount: f.amount, confirmed: snap.state.confirmedFactIds.includes(f.id), reporterKind: f.provenance.reporterKind, statement: f.provenance.statement })),
        taxPaid: p.taxPaid.map((t) => ({ id: t.id, section: t.section, amount: t.amount })),
        claims: p.claims.map((c) => ({ id: c.id, section: c.section, amount: c.amount, evidenceAttached: c.evidenceAttached })),
        activeCorrections: snap.state.corrections.filter((c) => !c.reverted).length,
        figures: advice.canRecommend ? figures(snap.state.regime, p) : null,
        limitation: advice.canRecommend ? null : limitation(advice, snap.revision),
      };
    },
  }),

  compute_current_tax: tool({
    name: "compute_current_tax",
    description: "Every figure of the current return under its chosen regime, from the engine — or a structured limitation when the release cannot support them.",
    args: none,
    permission: "auto",
    async run(_args, ctx) {
      const snap = await currentReturn(ctx);
      if (!snap) return { exists: false };
      const advice = guard(ctx, snap.state.persona);
      if (!advice.canRecommend) return limitation(advice, snap.revision);
      return { exists: true, revision: snap.revision, release: advice.release, ...figures(snap.state.regime, snap.state.persona) };
    },
  }),

  compare_regimes: tool({
    name: "compare_regimes",
    description: "Both regimes side by side for the current return, plus which is cheaper and by how much — or a structured limitation.",
    args: none,
    permission: "auto",
    async run(_args, ctx) {
      const snap = await currentReturn(ctx);
      if (!snap) return { exists: false };
      const advice = guard(ctx, snap.state.persona);
      if (!advice.canRecommend) return limitation(advice, snap.revision);
      const both = compareForPersona(snap.state.persona);
      const cheaper = both.new.totalTax <= both.old.totalTax ? "new" : "old";
      return {
        exists: true,
        revision: snap.revision,
        current: snap.state.regime ?? "new",
        cheaper,
        saving: Math.abs(both.new.totalTax - both.old.totalTax),
        new: { totalTax: both.new.totalTax, taxableIncome: both.new.taxableIncome, refundOrDue: both.new.refundOrDue, totalDeductions: both.new.totalDeductions },
        old: { totalTax: both.old.totalTax, taxableIncome: both.old.taxableIncome, refundOrDue: both.old.refundOrDue, totalDeductions: both.old.totalDeductions },
      };
    },
  }),

  check_applicability: tool({
    name: "check_applicability",
    description: "Run this release's draft eligibility rules (engineering draft, awaiting qualified tax review) for the salaried slice against known facts. Unknown facts come back named; nothing is defaulted to eligible.",
    args: z.object({ facts: z.object({
      financialYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      category: z.enum(["individual", "huf", "senior", "super_senior"]).optional(),
      age: z.number().int().min(0).max(120).optional(),
      hasSalaryIncome: z.boolean().optional(), grossSalary: money.optional(), hasBusinessOrProfessionIncome: z.boolean().optional(),
      totalIncome: money.optional(), regime: z.enum(["new", "old"]).optional(), resident: z.boolean().optional(),
      priorRegimeOptOut: z.boolean().optional(), returnByDueDate: z.boolean().optional(),
      ltcg112A: money.optional(), specialRateIncome: money.optional(),
      claims: z.array(z.object({ section: z.string().min(2).max(16), amount: money, evidence: z.boolean().optional() }).strict()).max(20).optional(),
    }).strict() }).strict(),
    permission: "auto",
    async run(args) {
      const { financialYear, ...rest } = args.facts;
      const period = financialYear ? periodForFinancialYear(financialYear) ?? undefined : PERIOD_FY_2025_26;
      const facts: TaxpayerFacts = { period, ...rest };
      return { results: evaluateSalariedSlice(facts), period: period ?? null };
    },
  }),

  retrieve_tax_knowledge: tool({
    name: "retrieve_tax_knowledge",
    description: "Answer a public tax question from this release's curated FY 2025-26 corpus: exact stored paraphrases with citations, or an explicit abstention. Never reads private documents; never invents a rule.",
    args: z.object({ question: z.string().min(3).max(2000) }).strict(),
    permission: "auto",
    async run(args, ctx) {
      const a = answerTaxQuestion(args.question, ctx.today);
      return {
        status: a.status,
        release: a.release,
        corpusHash: a.corpusHash,
        period: a.period,
        text: a.text,
        citations: a.citations.map((c) => ({ id: c.id, section: c.section, title: c.title, url: c.url, reviewer: c.reviewer })),
      };
    },
  }),

  review_return: tool({
    name: "review_return",
    description: "Computed findings: TDS vs liability, unclassified gains, cheaper regime, missing old-regime claims, CASS risk — or a structured limitation.",
    args: none,
    permission: "auto",
    async run(_args, ctx) {
      const snap = await currentReturn(ctx);
      if (!snap) return { exists: false };
      const p = snap.state.persona;
      const advice = guard(ctx, p);
      if (!advice.canRecommend) return limitation(advice, snap.revision);
      const regime = snap.state.regime ?? "new";
      const both = compareForPersona(p);
      const findings: string[] = [];
      const unclassified = p.facts.filter((f) => f.kind === "capital_gains" && !f.capitalGains);
      if (unclassified.length) findings.push(`capital_gains_unclassified:${unclassified.reduce((s, f) => s + f.amount, 0)}`);
      if (p.taxPaid.length === 0 && p.facts.some((f) => f.kind === "salary")) findings.push("salary_without_tds");
      const cheaper = both.new.totalTax <= both.old.totalTax ? "new" : "old";
      if (cheaper !== regime) findings.push(`cheaper_regime:${cheaper}:${Math.abs(both.new.totalTax - both.old.totalTax)}`);
      if (regime === "old" && !p.claims.some((c) => c.section === "80C")) findings.push("old_regime_no_80C");
      const rows = snap.state.baselinePersona.facts.map((f) => ({
        id: f.id, label: f.label, reportedAmount: f.amount,
        declaredAmount: p.facts.find((x) => x.id === f.id)?.amount ?? 0,
        disputed: snap.state.corrections.some((c) => !c.reverted && c.factId === f.id),
      }));
      const cass = assessCassRisk(rows as never);
      return { exists: true, revision: snap.revision, findings, cassRisk: cass.riskLevel, ...figures(regime, p) };
    },
  }),

  propose_fact_updates: tool({
    name: "propose_fact_updates",
    description: "Stage return commands for the citizen to review. Nothing is applied until they confirm.",
    args: z.object({ commands: z.array(z.custom<ReturnCommand>((v) => typeof v === "object" && v !== null && "type" in (v as object))).min(1).max(10) }).strict(),
    permission: "reviewable",
    async run(args) {
      return { staged: args.commands.length };
    },
  }),

  prepare_filing: tool({
    name: "prepare_filing",
    description: "Compute the final figures and stage a SIMULATED filing for explicit confirmation. Never files by itself; refuses when the shared guard does not allow action.",
    args: none,
    permission: "confirm_required",
    async run(_args, ctx) {
      const snap = await currentReturn(ctx);
      if (!snap) return { exists: false };
      const advice = guard(ctx, snap.state.persona);
      if (!advice.canAct) return limitation(advice, snap.revision);
      return { exists: true, revision: snap.revision, release: advice.release, ...figures(snap.state.regime, snap.state.persona) };
    },
  }),

  prepare_simulated_payment: tool({
    name: "prepare_simulated_payment",
    description: "Stage a SIMULATED Challan 280 for the balance payable, for explicit confirmation. Refuses when the shared guard does not allow action.",
    args: none,
    permission: "confirm_required",
    async run(_args, ctx) {
      const snap = await currentReturn(ctx);
      if (!snap) return { exists: false };
      const advice = guard(ctx, snap.state.persona);
      if (!advice.canAct) return limitation(advice, snap.revision);
      const f = figures(snap.state.regime, snap.state.persona);
      return { exists: true, revision: snap.revision, release: advice.release, balancePayable: Math.max(0, -f.refundOrDue) };
    },
  }),

  memory_get: tool({
    name: "memory_get",
    description: "Read the citizen's explicitly remembered preferences.",
    args: none,
    permission: "auto",
    async run(_args, ctx) {
      return { entries: await ctx.store.getMemory(ctx.owner) };
    },
  }),

  memory_set: tool({
    name: "memory_set",
    description: "Remember one typed preference. Only allow-listed keys; never amounts or identifiers.",
    args: z.object({ key: z.enum(MEMORY_KEYS as unknown as [MemoryKey, ...MemoryKey[]]), value: z.union([z.string().max(64), z.number(), z.boolean()]) }).strict(),
    permission: "auto",
    async run(args, ctx) {
      await ctx.store.setMemory(ctx.owner, { key: args.key, value: args.value, sourceRun: ctx.runId, updatedAt: new Date().toISOString() });
      return { ok: true };
    },
  }),
} as const;

export type ToolName = keyof typeof TOOLS;

export function toolNames(): ToolName[] {
  return Object.keys(TOOLS) as ToolName[];
}

export type ToolCallResult =
  | { ok: true; tool: ToolName; result: unknown }
  | { ok: false; tool: string; error: "unknown_tool" | "invalid_args" | "execution_failed"; detail: string };

/** Validate and execute. The caller (runtime) has already charged the budget. */
export async function runTool(name: string, rawArgs: unknown, ctx: ToolContext): Promise<ToolCallResult> {
  const spec = (TOOLS as Record<string, ToolSpec>)[name];
  if (!spec) return { ok: false, tool: name, error: "unknown_tool", detail: `No tool named ${name}.` };
  const parsed = spec.args.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return { ok: false, tool: name, error: "invalid_args", detail: parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ") };
  }
  try {
    const result = await spec.run(parsed.data, ctx);
    return { ok: true, tool: name as ToolName, result };
  } catch (err) {
    return { ok: false, tool: name, error: "execution_failed", detail: err instanceof Error ? err.message : String(err) };
  }
}

/** Demo owners start from their seeded persona; a real owner with no return starts blank. */
export function personaForOwner(owner: Owner) {
  return Object.values(PERSONAS).find((p) => p.pan === owner.pan) ?? null;
}
