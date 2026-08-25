/**
 * Progressive slab computation. Pure, integer-rupee arithmetic.
 *
 * ROUNDING RULE (defined once, used everywhere):
 * Each slab slice's tax is rounded half-up to the nearest rupee
 * (Math.round on that slice's exact fractional tax), and the slices are then
 * summed. This guarantees slabBreakdown rows are integers whose sum equals
 * taxBeforeRebate exactly — internal consistency is a tested invariant.
 * (A production system would keep paise internally; see lib/types.ts note.)
 */

import { OLD_REGIME_BASIC_EXEMPTION_BY_AGE, OLD_REGIME_SLABS, NEW_REGIME_SLABS } from "./constants";
import type { AgeBand, Regime, SlabSlice } from "./types";

export interface SlabTable {
  /** Inclusive lower edge; exclusive upper edge (Infinity for top). */
  from: number;
  to: number;
  rate: number;
}

/** Materialise a slab table with explicit edges from the compact constants form. */
export function slabTable(regime: Regime, ageBand?: AgeBand): SlabTable[] {
  const compact = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  const table: SlabTable[] = [];
  let from = 0;
  for (const { upTo, rate } of compact) {
    let lowerEdge = from;
    // Old regime + senior/super-senior: raise the basic exemption edge.
    if (
      regime === "old" &&
      ageBand &&
      ageBand !== "below_60" &&
      table.length === 0
    ) {
      lowerEdge = Math.max(from, OLD_REGIME_BASIC_EXEMPTION_BY_AGE[ageBand]);
    }
    if (upTo > lowerEdge) {
      table.push({ from: lowerEdge, to: upTo, rate });
    }
    from = upTo;
  }
  return table;
}

/**
 * Tax `income` across the table. Returns integer-rupee slices plus the total.
 */
export function computeSlabs(
  income: number,
  table: SlabTable[],
): { slices: SlabSlice[]; total: number } {
  const slices: SlabSlice[] = [];
  let total = 0;
  for (const { from, to, rate } of table) {
    if (income <= from) break;
    const sliceAmount = Math.min(income, to) - from;
    const sliceTax = Math.round(sliceAmount * rate);
    slices.push({ from, to, rate, tax: sliceTax });
    total += sliceTax;
  }
  return { slices, total };
}
