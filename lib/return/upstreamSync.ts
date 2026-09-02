/**
 * The bridge from the main journey's ledger to the reconciliation context.
 *
 * `app/page.tsx` owns a `ReturnState`: the department's prefill as
 * `baselinePersona`, the citizen's corrections as an append-only ledger, and
 * the effective `persona` that results. The reconciliation surface
 * (`context/TaxReturnContext.tsx`) models the same return as flat rows with a
 * reported and a declared side. This module is the one place that translates
 * between the two, so the translation can be tested without React.
 *
 * WHY BOTH SIDES TRAVEL. The previous bridge sent only the effective figure and
 * called it "reported". A correction made on the facts board therefore arrived
 * at the context as a new department figure rather than as a dispute — so the
 * CASS radar saw no divergence, the s.139(9) card had nothing to reconcile, and
 * a row that had been confirmed before the correction kept its old declared
 * figure on the ITR-V. The ledger already knows both sides; sending both is the
 * whole fix.
 *
 * Pure. No React, no I/O.
 */

import type { FactId, FilingStatus, Regime, UpstreamFact } from "../../context/TaxReturnContext";
import type { AdditionalClaim } from "../taxEngineAY2026";
import type { CapitalGainsMeta, IncomeKind, Persona } from "../types";
import type { Correction, ReturnState } from "./state";

export interface SyncPayload {
  name: string;
  pan: string;
  isSalaried: boolean;
  age: number;
  filingStatus: FilingStatus;
  regime: Regime;
  facts: Partial<Record<FactId, UpstreamFact>>;
  capitalGainsMeta?: CapitalGainsMeta;
  /** ISO timestamp of acceptance, once the ledger records one. */
  filedAt?: string;
  /**
   * Claims with no row of their own (80GG, 80E, 80TTA, 24(b), parents' 80D).
   * Forwarded by section so the context's engine run matches the ledger's —
   * without them the ITR-V printed under the old regime disagreed with the
   * summary above it by exactly these deductions.
   */
  additionalClaims: AdditionalClaim[];
}

/** Income facts pool by kind: a persona may hold several of one kind. */
const INCOME_ROW: Record<IncomeKind, FactId> = {
  salary: "salary",
  interest: "savings_interest",
  dividend: "dividend",
  capital_gains: "capital_gains",
  rent: "rental",
  other: "consulting",
};

/**
 * Which context row a TDS/tax-paid entry belongs to. Self-assessment tax
 * (s.140A, Challan 280) returns null: the context records those payments
 * itself under `selfAssessmentPayments`, and mapping the ledger's copy into
 * `tds_other` as well would credit the same challan twice.
 */
export function taxPaidRow(section: string): FactId | null {
  if (section.includes("140A")) return null;
  if (section.includes("192")) return "tds_salary";
  if (section.includes("194A")) return "tds_bank";
  return "tds_other";
}

/**
 * Which context row a Chapter VI-A claim belongs to, or null for sections the
 * reconciliation surface does not model (80GG, 80E, 80TTA, 24B, HRA ...).
 * Those claims still count in the main journey's own computation; the two
 * surfaces are documented as agreeing on the new regime, where only 80CCD(2)
 * survives, and may differ under the old regime by exactly these claims.
 */
export function claimRow(section: string): FactId | null {
  if (section === "80C") return "sec_80c";
  // Parents' premium has its own ₹50,000 cap; pooling it into the self row
  // would cap it at ₹25,000. It travels as an additional claim instead.
  if (section === "80D" || section === "80D_SELF") return "sec_80d";
  if (section === "80CCD_2" || section === "80CCD(2)") return "sec_80ccd2";
  return null;
}

interface RowItem {
  id: string;
  baseline: number;
  effective: number;
  reportedBy?: string;
  statement?: UpstreamFact["statement"];
}

/** Every ledger item behind each context row, both sides. */
function collectRows(baseline: Persona, effective: Persona): Map<FactId, RowItem[]> {
  const rows = new Map<FactId, RowItem[]>();
  const push = (row: FactId | null, item: RowItem): void => {
    if (!row) return;
    const list = rows.get(row) ?? [];
    list.push(item);
    rows.set(row, list);
  };

  const effectiveFactAmount = new Map(effective.facts.map((f) => [f.id, f.amount]));
  for (const f of baseline.facts) {
    push(INCOME_ROW[f.kind], {
      id: f.id,
      baseline: f.amount,
      // Absent from the effective persona = the citizen denied it exists.
      effective: effectiveFactAmount.get(f.id) ?? 0,
      reportedBy: f.provenance.reporter,
      statement: f.provenance.statement,
    });
  }
  // A fact added after prefill (a custom income row) lives in both personas
  // already; anything only in the effective persona has no baseline and is
  // its own reported figure.
  const baselineIds = new Set(baseline.facts.map((f) => f.id));
  for (const f of effective.facts) {
    if (baselineIds.has(f.id)) continue;
    push(INCOME_ROW[f.kind], { id: f.id, baseline: f.amount, effective: f.amount });
  }

  const effectiveTax = new Map(effective.taxPaid.map((t) => [t.id, t.amount]));
  for (const t of baseline.taxPaid) {
    push(taxPaidRow(t.section), {
      id: t.id,
      baseline: t.amount,
      effective: effectiveTax.get(t.id) ?? 0,
      reportedBy: t.provenance.reporter,
      statement: t.provenance.statement,
    });
  }

  const effectiveClaims = new Map(effective.claims.map((c) => [c.id, c.amount]));
  for (const c of baseline.claims) {
    push(claimRow(c.section), {
      id: c.id,
      baseline: c.amount,
      effective: effectiveClaims.get(c.id) ?? 0,
    });
  }

  return rows;
}

/** The newest active correction touching any item in the row, if there is one. */
function latestCorrection(items: RowItem[], corrections: Correction[]): Correction | undefined {
  const ids = new Set(items.map((i) => i.id));
  let latest: Correction | undefined;
  for (const c of corrections) {
    if (c.reverted) continue;
    if (ids.has(c.factId)) latest = c;
  }
  return latest;
}

/** Rows the ledger models. `advance_tax` has no ledger counterpart and is left to the context. */
const LEDGER_ROWS: readonly FactId[] = [
  "salary",
  "consulting",
  "savings_interest",
  "dividend",
  "capital_gains",
  "rental",
  "tds_salary",
  "tds_bank",
  "tds_other",
  "sec_80c",
  "sec_80d",
  "sec_80ccd2",
];

/**
 * Build the SYNC_STATE payload for a return.
 *
 * For every row the ledger models:
 *   reported  = Σ baseline amounts of the items behind it
 *   declared  = Σ effective amounts (0 for an item the citizen denied)
 *   disputed  = an active correction touches any item behind it
 *   confirmed = the row has items and every one is in confirmedFactIds
 * A row with no items at all is sent as 0/0, so the context zeroes a row the
 * persona simply does not have (a first-time filer with no dividend).
 */
export function buildSyncPayload(state: ReturnState): SyncPayload {
  const baseline = state.baselinePersona;
  const effective = state.persona;
  const rows = collectRows(baseline, effective);
  const confirmed = new Set(state.confirmedFactIds);

  const facts: Partial<Record<FactId, UpstreamFact>> = {};
  for (const row of LEDGER_ROWS) {
    const items = rows.get(row) ?? [];
    const correction = latestCorrection(items, state.corrections);
    facts[row] = {
      reported: items.reduce((sum, i) => sum + i.baseline, 0),
      declared: items.reduce((sum, i) => sum + i.effective, 0),
      disputed: correction !== undefined,
      feedbackCode: correction?.feedbackCode,
      disputeReason: correction?.reason || undefined,
      confirmed: items.length > 0 && items.every((i) => confirmed.has(i.id)),
      // Several reporters behind one row (two banks' interest) are named together.
      reportedBy: items.length
        ? [...new Set(items.map((i) => i.reportedBy).filter(Boolean))].join(", ") || undefined
        : undefined,
      statement: items[0]?.statement,
    };
  }

  return {
    name: effective.name || "Taxpayer Name",
    pan: effective.pan || "ABCDE1234F",
    isSalaried: effective.facts.some((f) => f.kind === "salary"),
    age: effective.age,
    filingStatus: "INDIVIDUAL",
    regime: state.regime === "old" ? "OLD" : "NEW",
    facts,
    // Classification travels with the amount, or the reconciliation surface
    // would tax a s.112A gain at slab and quietly overstate the liability.
    capitalGainsMeta: baseline.facts.find((f) => f.kind === "capital_gains")?.capitalGains,
    filedAt: state.filedAt,
    additionalClaims: effective.claims
      .filter((c) => claimRow(c.section) === null && c.amount > 0)
      .map((c) => ({ id: c.id, section: c.section, label: c.label, amount: c.amount })),
  };
}
