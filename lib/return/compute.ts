/**
 * Bridge between the citizen's return (Persona) and the pure tax engine.
 *
 * NOTHING arithmetic lives here: every rate, threshold, slab slice and
 * deduction cap comes from lib/engine. This module only reshapes persona
 * data into the engine's TaxInput shape and reads the breakdown back out,
 * so the UI never re-derives a number the engine already owns.
 */

import type { Persona } from "../types";
import { compareRegimes, computeTax } from "../engine/tax";
import type { Regime, TaxBreakdown, TaxInput } from "../engine/types";
import { OLD_REGIME_CLAIM_CAPS } from "../engine/constants";

/** The portal's default regime; the regime step may override it. */
export const DEFAULT_REGIME: Regime = "new";

function ageBandFor(persona: Persona): TaxInput["ageBand"] {
  if (persona.age >= 80) return "above_80";
  if (persona.age >= 60) return "60_to_80";
  return "below_60";
}

/** Persona facts/claims/TDS reshaped for the engine. Pure. */
export function taxInputFor(persona: Persona, regime: Regime): TaxInput {
  return {
    facts: persona.facts.map((f) => ({
      kind: f.kind,
      amount: f.amount,
      capitalGains: f.capitalGains,
    })),
    claims: persona.claims.map((c) => ({
      id: c.id,
      section: c.section,
      label: c.label,
      amount: c.amount,
      evidenceAttached: c.evidenceAttached,
    })),
    ageBand: ageBandFor(persona),
    regime,
    tdsCredits: persona.taxPaid.reduce((sum, t) => sum + t.amount, 0),
  };
}

/** The one arithmetic authority for a persona under a chosen regime. */
export function computeForPersona(persona: Persona, regime: Regime): TaxBreakdown {
  return computeTax(taxInputFor(persona, regime));
}

/** Both regimes side by side, for the regime-choice screen. */
export function compareForPersona(persona: Persona): { new: TaxBreakdown; old: TaxBreakdown } {
  return compareRegimes(taxInputFor(persona, DEFAULT_REGIME));
}

/**
 * How much a single claim is worth right now, in tax saved, computed BY the
 * engine: liability with the claim minus liability without it. Returns 0
 * when the claim does nothing under the current regime (the new-regime
 * honesty case the UI must say out loud).
 */
export function claimWorth(persona: Persona, regime: Regime, claimId: string): number {
  const withClaim = computeForPersona(persona, regime);
  const rest = persona.claims
    .filter((c) => c.id !== claimId)
    .map((c) => ({
      id: c.id,
      section: c.section,
      label: c.label,
      amount: c.amount,
      evidenceAttached: c.evidenceAttached,
    }));
  const withoutClaim = computeTax({ ...taxInputFor(persona, regime), claims: rest });
  return Math.max(0, withoutClaim.totalTax - withClaim.totalTax);
}

/** Statutory cap for a claim section, from engine constants only. */
export function capFor(section: string): number | undefined {
  return OLD_REGIME_CLAIM_CAPS[section];
}
