/**
 * ReturnState — the citizen's return as a versioned, correction-history-carrying
 * document. This is the persistence-shaped counterpart of the raw `Persona`:
 * the persona is the department's prefill; the corrections list is everything
 * the citizen has said about it, kept forever (forgiveness ladder — reverting
 * marks, never deletes).
 *
 * Corrections are event-sourced: reducers never mutate `persona` in place.
 * Instead every reducer recomputes the effective persona by replaying the
 * stored baseline through all non-reverted corrections, in order. This makes
 * revert exact — undoing an early correction cannot stomp a later one — and
 * keeps every function pure.
 */

import type { CustomPersonaId, IncomeFact, Lang, Persona, PersonaId } from "../types";

/** What the citizen is asserting about a fact: its figure, or that it exists at all. */
export type CorrectionField = "amount" | "existence";

/**
 * One citizen act of disagreement with a prefilled fact.
 * - field "amount": previous/next are whole-rupee figures (number).
 * - field "existence": previous/next are booleans (did this income exist).
 */
export interface Correction {
  id: string;
  factId: string;
  field: CorrectionField;
  /** Which reported money collection this correction belongs to. Old saved
   * corrections omit this and remain income facts by default. */
  target?: "fact" | "tax" | "claim";
  previous: number | boolean;
  next: number | boolean;
  /** The citizen's own words for why the prefill is wrong. */
  reason: string;
  /** ISO timestamp of when the correction was made. */
  at: string;
  /** True once the citizen took it back. Kept in history regardless. */
  reverted?: boolean;
}

export interface ReturnState {
  version: number;
  lang: Lang;
  personaId: PersonaId | CustomPersonaId;
  /**
   * The persona as originally loaded — untouched ground truth the corrections
   * replay against. Persisted so migration and undo stay lossless.
   */
  baselinePersona: Persona;
  /** The effective persona: baseline replayed through active corrections. */
  persona: Persona;
  corrections: Correction[];
  regime?: "new" | "old";
  /** ISO timestamp set when the return is filed. */
  filedAt?: string;
  /** Facts the citizen has explicitly confirmed as correct. */
  confirmedFactIds: string[];
}

/** Replay baseline facts through non-reverted corrections, chronologically. */
function replayFacts(baselineFacts: IncomeFact[], corrections: Correction[]): IncomeFact[] {
  let facts = baselineFacts.map((f) => ({ ...f }));
  const baselineById = new Map(baselineFacts.map((f) => [f.id, f]));
  for (const c of corrections) {
    if (c.reverted) continue;
    // Existence reasserted after an earlier denial: restore from baseline.
    if (
      c.field === "existence" &&
      c.next !== false &&
      !facts.some((f) => f.id === c.factId)
    ) {
      const base = baselineById.get(c.factId);
      if (base) {
        facts.push({ ...base });
        continue;
      }
    }
    const idx = facts.findIndex((f) => f.id === c.factId);
    if (idx === -1) continue;
    const fact = facts[idx];
    if (c.field === "amount") {
      facts[idx] = { ...fact, amount: c.next as number };
    } else if (c.next === false) {
      // Citizen denies this income: drop it from the effective facts.
      facts = facts.filter((f) => f.id !== c.factId);
    }
  }
  return facts;
}

function replayAmounts<T extends { id: string; amount: number }>(
  baseline: T[],
  corrections: Correction[],
  target: "tax" | "claim",
): T[] {
  let values = baseline.map((value) => ({ ...value }));
  for (const c of corrections) {
    if (c.reverted || c.target !== target || c.field !== "amount") continue;
    const index = values.findIndex((value) => value.id === c.factId);
    if (index !== -1) values[index] = { ...values[index], amount: c.next as number };
  }
  return values;
}

export function effectivePersona(state: ReturnState): Persona {
  return {
    ...state.baselinePersona,
    facts: replayFacts(state.baselinePersona.facts, state.corrections),
    taxPaid: replayAmounts(state.baselinePersona.taxPaid, state.corrections, "tax"),
    claims: replayAmounts(state.baselinePersona.claims, state.corrections, "claim"),
  };
}

/** Append a correction and recompute the effective persona. Pure. */
export function applyCorrection(state: ReturnState, correction: Correction): ReturnState {
  const entry: Correction = { ...correction, reverted: false };
  const corrections = [...state.corrections, entry];
  return {
    ...state,
    corrections,
    persona: effectivePersona({ ...state, corrections }),
  };
}

/**
 * Mark a correction reverted (history preserved) and restore the value it had
 * changed — computed from scratch so later corrections survive untouched.
 * Unknown ids return the state unchanged. Pure.
 */
export function revertCorrection(state: ReturnState, correctionId: string): ReturnState {
  if (!state.corrections.some((c) => c.id === correctionId)) return state;
  const corrections = state.corrections.map((c) =>
    c.id === correctionId ? { ...c, reverted: true } : c,
  );
  return {
    ...state,
    corrections,
    persona: effectivePersona({ ...state, corrections }),
  };
}

/** Record that the citizen confirmed a fact as correct. Idempotent. Pure. */
export function confirmFact(state: ReturnState, factId: string): ReturnState {
  if (state.confirmedFactIds.includes(factId)) return state;
  return { ...state, confirmedFactIds: [...state.confirmedFactIds, factId] };
}
