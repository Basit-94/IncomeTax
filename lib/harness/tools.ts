/**
 * The typed tool registry (plan task 2.3). Every consequential action the harness takes
 * goes through `callTool`, which validates the arguments with zod, executes, and returns a
 * masked summary for the activity log. The model never calls these directly; the engine
 * does, deterministically, so a hallucinated argument cannot reach the engine or the vault.
 */
import { z } from "zod";
import { compareRegimes, computeTax } from "../engine/tax";
import type { AgeBand, TaxBreakdown, TaxInput, TaxInputFact } from "../engine/types";
import type { Claim } from "../types";
import { PERSONAS } from "../personas";
import type { PersonaId } from "../types";
import { taxInputFor } from "../return/compute";
import { syntheticChallanIdentifiers } from "../compliance/challan280";
import { formatRupees } from "./interview";

export interface ToolContext {
  userId: string;
  runId: string;
}

export interface ToolResult {
  summary: string;
  data: Record<string, unknown>;
}

const money = z.coerce.number().int().min(0).max(10_000_000_000);

const figures = z.object({
  salary: money.default(0),
  business: money.default(0),
  interest: money.default(0),
  tds: money.default(0),
  pf: money.default(0),
  rent: money.default(0),
  insurance: money.default(0),
  ageBand: z.enum(["below_60", "60_to_80", "above_80"]).default("below_60"),
});

export type Figures = z.infer<typeof figures>;

export function taxInputFrom(f: Figures, regime: "new" | "old"): TaxInput {
  const facts: TaxInputFact[] = [];
  if (f.salary > 0) facts.push({ kind: "salary", amount: f.salary });
  if (f.business > 0) facts.push({ kind: "other", amount: f.business });
  if (f.interest > 0) facts.push({ kind: "interest", amount: f.interest });
  const claims: Claim[] = [];
  if (f.pf > 0) claims.push({ id: "pf", section: "80C", amount: f.pf, label: "Provident fund", evidenceAttached: false });
  if (f.rent > 0) claims.push({ id: "rent", section: "80GG", amount: f.rent, label: "Rent paid", evidenceAttached: false });
  if (f.insurance > 0) claims.push({ id: "health", section: "80D_SELF", amount: f.insurance, label: "Health insurance", evidenceAttached: false });
  return { facts, claims, regime, tdsCredits: f.tds, ageBand: f.ageBand as AgeBand };
}

const SCHEMAS = {
  compute_tax: figures.extend({ regime: z.enum(["new", "old"]) }),
  compare_regimes: figures,
  presumptive_income: z.object({ kind: z.enum(["business", "profession"]), revenue: money, digital: z.boolean() }),
  load_demo_persona: z.object({ persona: z.enum(["sunita", "rakesh", "priya"]) }),
  pay_challan: z.object({ amount: money.min(1), pan: z.string().min(10).max(10), ordinal: z.number().int().min(1).default(1) }),
  draft_notice_response: z.object({
    kind: z.enum(["143_1", "139_9", "245", "148", "other"]),
    amount: money,
    position: z.enum(["agree", "disagree", "unsure"]),
    reason: z.string().max(400).optional(),
  }),
} as const;

export type ToolName = keyof typeof SCHEMAS;

export const TOOL_NAMES = Object.keys(SCHEMAS) as ToolName[];

export class ToolArgumentError extends Error {
  constructor(public readonly tool: string, public readonly issues: string) {
    super(`${tool}: ${issues}`);
  }
}

export function summariseBreakdown(b: TaxBreakdown): string {
  const net = b.refundOrDue >= 0 ? `refund ${formatRupees(b.refundOrDue)}` : `payable ${formatRupees(-b.refundOrDue)}`;
  return `tax ${formatRupees(b.totalTax)} · paid ${formatRupees(b.tdsCredits)} · ${net}`;
}

export async function callTool(name: ToolName, rawArgs: unknown, ctx: ToolContext): Promise<ToolResult> {
  const schema = SCHEMAS[name];
  const parsed = schema.safeParse(rawArgs);
  if (!parsed.success) throw new ToolArgumentError(name, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  void ctx;
  switch (name) {
    case "compute_tax": {
      const args = parsed.data as z.infer<typeof SCHEMAS.compute_tax>;
      const breakdown = computeTax(taxInputFrom(args, args.regime));
      return { summary: `${args.regime} regime · ${summariseBreakdown(breakdown)}`, data: { breakdown } };
    }
    case "compare_regimes": {
      const args = parsed.data as Figures;
      const both = compareRegimes(taxInputFrom(args, "new"));
      const cheaper = both.new.totalTax <= both.old.totalTax ? "new" : "old";
      return {
        summary: `new ${formatRupees(both.new.totalTax)} · old ${formatRupees(both.old.totalTax)} · ${cheaper} regime cheaper by ${formatRupees(Math.abs(both.new.totalTax - both.old.totalTax))}`,
        data: { new: both.new, old: both.old, cheaper },
      };
    }
    case "presumptive_income": {
      const args = parsed.data as z.infer<typeof SCHEMAS.presumptive_income>;
      // s.44AD: 8% of turnover (6% for digital receipts) up to ₹2 crore (₹3 crore when ≥95% digital).
      // s.44ADA: 50% of gross receipts for specified professions up to ₹50 lakh (₹75 lakh when ≥95% digital).
      const limit = args.kind === "business" ? (args.digital ? 30_000_000 : 20_000_000) : args.digital ? 7_500_000 : 5_000_000;
      const eligible = args.revenue <= limit;
      const rate = args.kind === "business" ? (args.digital ? 0.06 : 0.08) : 0.5;
      const deemed = Math.round(args.revenue * rate);
      const section = args.kind === "business" ? "44AD" : "44ADA";
      const breakdown = computeTax(taxInputFrom({ salary: 0, business: deemed, interest: 0, tds: 0, pf: 0, rent: 0, insurance: 0, ageBand: "below_60" }, "new"));
      return {
        summary: eligible
          ? `${section}: declare ${Math.round(rate * 100)}% of ${formatRupees(args.revenue)} = ${formatRupees(deemed)} as income · no books, no audit · tax ${formatRupees(breakdown.totalTax)}`
          : `${section} not available above ${formatRupees(limit)}; regular books and audit apply`,
        data: { section, eligible, limit, rate, deemed, breakdown },
      };
    }
    case "load_demo_persona": {
      const args = parsed.data as z.infer<typeof SCHEMAS.load_demo_persona>;
      const persona = PERSONAS[args.persona as PersonaId];
      const input = taxInputFor(persona, "new");
      const both = compareRegimes(input);
      return {
        summary: `${persona.name} · ${persona.situation} · ${summariseBreakdown(both.new)}`,
        data: { persona, breakdown: both.new, old: both.old },
      };
    }
    case "pay_challan": {
      const args = parsed.data as z.infer<typeof SCHEMAS.pay_challan>;
      const seed = args.amount + Array.from(args.pan).reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7) + args.ordinal * 1_000_003;
      const ref = syntheticChallanIdentifiers(seed);
      return { summary: `Challan 280 · ${formatRupees(args.amount)} · BSR ${ref.bsrCode} · serial ${ref.challanNo}`, data: { bsr: ref.bsrCode, serial: ref.challanNo, amount: args.amount } };
    }
    case "draft_notice_response": {
      const args = parsed.data as z.infer<typeof SCHEMAS.draft_notice_response>;
      const text = draftNoticeResponse(args);
      return { summary: `${args.kind.replace("_", "(")}${args.kind.includes("_") ? ")" : ""} · ${args.position} · draft ready`, data: { text } };
    }
  }
}

function draftNoticeResponse(args: { kind: string; amount: number; position: string; reason?: string }): string {
  const what: Record<string, string> = {
    "143_1": "an intimation under section 143(1) where the department's computation differs from the return",
    "139_9": "a notice under section 139(9) treating the return as defective",
    "245": "an intimation under section 245 proposing to set off a refund against an earlier demand",
    "148": "a notice under section 148 about income believed to have escaped assessment",
    other: "the notice",
  };
  const amount = args.amount > 0 ? ` The amount mentioned is ${formatRupees(args.amount)}.` : "";
  if (args.position === "agree") {
    return `Response to ${what[args.kind]}.${amount}\n\nI have gone through the notice and agree with the adjustment. I will pay the balance through Challan 280 (major head 0021, minor head 300 or 400 as applicable) and, where required, file a revised return under section 139(5) reflecting the corrected figures. Kindly close the proceeding on receipt of the payment details.`;
  }
  if (args.position === "disagree") {
    return `Response to ${what[args.kind]}.${amount}\n\nI respectfully disagree with the proposed adjustment. Reason: ${args.reason ?? "as explained in the attached statement"}.\n\nSupporting documents are attached. I request that the adjustment be dropped and, if a refund is due, released without set-off. I remain available to furnish any further information.`;
  }
  return `Response to ${what[args.kind]}.${amount}\n\nI have received the notice and am collecting the underlying documents (salary statement, bank interest certificates, proofs of deductions) to check the figures. I request a period of 15 days to submit a complete response, and will pay any balance found due within that time.`;
}
