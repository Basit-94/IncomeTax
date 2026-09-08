/**
 * Two versions of one return, compared by the engine (2026-09-08, CA redesign §4: "our backend API/AI will
 * analyze both tax returns and cross-verify everything… the one that makes the most logical sense will be
 * highlighted").
 *
 * Pure. Every rupee is `computeForPersona`; the flags are the checks a careful reviewer runs before adopting a
 * CA's version: a reported figure lowered below what the employer or bank filed (a s.143(1) mismatch waiting to
 * happen), a claim without proof, a claim above its statutory cap, a regime the person may not be able to elect.
 * The recommendation is deterministic; Munshi ji's sentence about it is written by the model from these facts
 * and checked (see app/api/ca/reviews/[code]/compare).
 */

import { NEW_REGIME_ALLOWED_SECTIONS, OLD_REGIME_CLAIM_CAPS } from "../engine/constants";
import type { TaxBreakdown } from "../engine/types";
import { computeForPersona } from "../return/compute";
import type { Persona } from "../types";

export type Regime = "new" | "old";

export interface ComparisonFigures {
  regime: Regime;
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  totalTax: number;
  tdsCredits: number;
  refundOrDue: number;
}

export interface ComparisonChange {
  /** Which sheet the row belongs to; `anchor` matches the comment anchors the CA workspace uses. */
  kind: "income" | "deduction" | "taxPaid" | "regime";
  anchor: string;
  label: string;
  from: number | string;
  to: number | string;
}

export interface ComparisonFlag {
  severity: "info" | "warn" | "risk";
  anchor?: string;
  text: string;
}

export interface ReviewComparison {
  original: ComparisonFigures;
  ca: ComparisonFigures;
  /** CA minus original: positive means more refund / less due for the person. */
  delta: { refundOrDue: number; totalTax: number; deductions: number };
  changes: ComparisonChange[];
  flags: ComparisonFlag[];
  recommendation: { pick: "ca" | "original" | "either"; reasons: string[] };
}

const figures = (b: TaxBreakdown, regime: Regime): ComparisonFigures => ({
  regime, grossIncome: b.grossIncome, deductions: b.totalDeductions, taxableIncome: b.taxableIncome, totalTax: b.totalTax, tdsCredits: b.tdsCredits, refundOrDue: b.refundOrDue,
});

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const sectionOf = (s: string) => s.replace(/_/g, "(").replace(/\(([A-Z]+)$/, "($1)").replace(/\((SELF|PARENTS)\)/, " $1").replace("(1B", "(1B)").replace("(1B))", "(1B)");

export function compareReturns(originalPersona: Persona, originalRegime: Regime, caPersona: Persona, caRegime: Regime): ReviewComparison {
  const o = computeForPersona(originalPersona, originalRegime);
  const c = computeForPersona(caPersona, caRegime);
  const changes: ComparisonChange[] = [];
  const flags: ComparisonFlag[] = [];

  // Income rows, matched by kind (the CA sheet edits one figure per kind).
  const kinds = new Set([...originalPersona.facts.map((f) => f.kind), ...caPersona.facts.map((f) => f.kind)]);
  for (const kind of kinds) {
    const before = originalPersona.facts.filter((f) => f.kind === kind);
    const from = before.reduce((n, f) => n + f.amount, 0);
    const to = caPersona.facts.filter((f) => f.kind === kind).reduce((n, f) => n + f.amount, 0);
    if (from === to) continue;
    changes.push({ kind: "income", anchor: `income:${kind}`, label: before[0]?.label ?? kind, from, to });
    const thirdParty = before.find((f) => f.provenance.reporterKind !== "self");
    if (to < from && thirdParty) {
      flags.push({ severity: "risk", anchor: `income:${kind}`, text: `${thirdParty.label} was reported by ${thirdParty.provenance.reporter} (${thirdParty.provenance.statement}) at ${rupees(from)}; the CA version carries ${rupees(to)}. A figure below what the reporter filed is what a s.143(1) mismatch notice is made of — only the reporter can correct their statement.` });
    }
  }

  // Deductions, matched by section.
  const sections = new Set([...originalPersona.claims.map((k) => k.section), ...caPersona.claims.map((k) => k.section)]);
  for (const section of sections) {
    const from = originalPersona.claims.filter((k) => k.section === section).reduce((n, k) => n + k.amount, 0);
    const caClaims = caPersona.claims.filter((k) => k.section === section);
    const to = caClaims.reduce((n, k) => n + k.amount, 0);
    if (from === to) continue;
    const label = caClaims[0]?.label ?? originalPersona.claims.find((k) => k.section === section)?.label ?? section;
    changes.push({ kind: "deduction", anchor: `deduction:${section}`, label, from, to });
    if (to > from && caClaims.some((k) => !k.evidenceAttached)) {
      flags.push({ severity: "warn", anchor: `deduction:${section}`, text: `${sectionOf(section)} was raised to ${rupees(to)} without proof attached. A deduction is only as good as its receipt if the department asks.` });
    }
    const cap = OLD_REGIME_CLAIM_CAPS[section];
    if (cap !== undefined && to > cap) {
      flags.push({ severity: "warn", anchor: `deduction:${section}`, text: `${sectionOf(section)} is entered at ${rupees(to)}; the law allows ${rupees(cap)} and the engine counts only that much.` });
    }
    if (caRegime === "new" && to > from && !NEW_REGIME_ALLOWED_SECTIONS.has(section)) {
      flags.push({ severity: "info", anchor: `deduction:${section}`, text: `${sectionOf(section)} has no effect under the new regime; it changes nothing unless the return moves to the old regime.` });
    }
  }

  // Tax already paid.
  const tdsFrom = originalPersona.taxPaid.reduce((n, t) => n + t.amount, 0);
  const tdsTo = caPersona.taxPaid.reduce((n, t) => n + t.amount, 0);
  if (tdsFrom !== tdsTo) {
    changes.push({ kind: "taxPaid", anchor: "taxPaid:tds", label: "TDS / advance tax", from: tdsFrom, to: tdsTo });
    if (tdsTo > tdsFrom) flags.push({ severity: "risk", anchor: "taxPaid:tds", text: `Tax credit was raised from ${rupees(tdsFrom)} to ${rupees(tdsTo)}. Credit that Form 26AS does not show is denied at processing and the refund is recomputed downwards.` });
  }

  // Regime.
  if (originalRegime !== caRegime) {
    changes.push({ kind: "regime", anchor: "regime", label: "Regime", from: originalRegime, to: caRegime });
    const business = caPersona.facts.some((f) => f.kind === "other" && f.amount > 0);
    if (caRegime === "old" && business) flags.push({ severity: "warn", anchor: "regime", text: "The old regime with business or professional income needs Form 10-IEA before the due date, and the choice then carries forward." });
    if (caRegime === "old") flags.push({ severity: "info", anchor: "regime", text: "The old regime can only be chosen in a return filed by the 31 July due date." });
  }

  const delta = { refundOrDue: c.refundOrDue - o.refundOrDue, totalTax: c.totalTax - o.totalTax, deductions: c.totalDeductions - o.totalDeductions };
  const risks = flags.filter((f) => f.severity === "risk");
  const warns = flags.filter((f) => f.severity === "warn");
  const reasons: string[] = [];
  let pick: ReviewComparison["recommendation"]["pick"];
  if (risks.length) {
    pick = "original";
    reasons.push(`The CA version carries ${risks.length} change${risks.length > 1 ? "s" : ""} that contradict what a reporter filed; a notice would follow, whatever the refund says.`);
    if (delta.refundOrDue > 0) reasons.push(`Its extra ${rupees(delta.refundOrDue)} rests on those changes.`);
  } else if (delta.refundOrDue > 0) {
    pick = "ca";
    reasons.push(`${rupees(delta.refundOrDue)} more comes back${delta.deductions > 0 ? `, from ${rupees(delta.deductions)} of deductions the original did not claim` : ""}${originalRegime !== caRegime ? ` and the ${caRegime} regime` : ""}.`);
    if (warns.length) reasons.push(`${warns.length} thing${warns.length > 1 ? "s" : ""} to have ready before filing: ${warns.map((w) => w.text.split(".")[0]).join("; ")}.`);
  } else if (delta.refundOrDue < 0) {
    pick = "original";
    reasons.push(`The CA version leaves ${rupees(-delta.refundOrDue)} less with the person and nothing in it fixes a reporting problem.`);
  } else {
    pick = changes.length ? "either" : "either";
    reasons.push(changes.length ? "Both versions land on the same figure; the CA's changes cancel out or do not count under the chosen regime." : "The CA changed nothing — the original stands, verified.");
  }
  return { original: figures(o, originalRegime), ca: figures(c, caRegime), delta, changes, flags, recommendation: { pick, reasons } };
}
