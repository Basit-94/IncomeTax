/**
 * Persistence for ReturnState: versioned save format under the existing
 * `wapsi_active_data` localStorage key (kept so drafts saved by the previous
 * build — raw Persona JSON — still load via migration). Corrupt data never
 * throws; load() returns null and the caller decides the UI.
 *
 * Undo is a pure stack helper: callers own the stack array, we cap its depth.
 */

import type { CustomPersonaId, Lang, Persona, PersonaId, TimelineKey } from "../types";
import type { ReturnState } from "./state";

export const CURRENT_VERSION = 2;
export const STORAGE_KEY = "wapsi_active_data";
export const UNDO_CAP = 25;

export interface StoredPayload {
  version: number;
  savedAt: string;
  state: ReturnState;
}

export type LoadResult = { state: ReturnState } | { needsMigration: true } | null;

/** Write {version, savedAt, state} under STORAGE_KEY. */
export function save(state: ReturnState): void {
  const payload: StoredPayload = {
    version: CURRENT_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Read and normalise whatever is under STORAGE_KEY.
 * - nothing stored → null
 * - unparseable JSON or unrecognisable shape → null (caller decides UI)
 * - current-version state → { state }
 * - older shape (v0 raw Persona) → migrated via migrate(); if that fails
 *   or the stored version is newer than this build → { needsMigration }
 */
export function load(): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (isStoredPayload(parsed)) {
    if (parsed.version === CURRENT_VERSION && isValidState(parsed.state)) {
      return { state: parsed.state };
    }
    if (parsed.version > CURRENT_VERSION) return { needsMigration: true };
    const migrated = migrate(parsed);
    return migrated ? { state: migrated } : { needsMigration: true };
  }

  if (isPersonaShape(parsed)) {
    const migrated = migrate(parsed);
    return migrated ? { state: migrated } : { needsMigration: true };
  }

  return null;
}

/**
 * Upgrade an older persisted shape to the current ReturnState.
 * v0 = raw Persona JSON exactly as app/page.tsx stored it until now.
 * v1 = wrapped ReturnState whose auto-generated timeline events carried
 *      English literal headlines (the defect this version exists to retire).
 * Returns null when the payload matches no known shape.
 */
export function migrate(payload: unknown): ReturnState | null {
  if (isStoredPayload(payload)) {
    if (payload.version <= CURRENT_VERSION && isValidState(payload.state)) {
      return { ...keyTimelineEvents(payload.state), version: CURRENT_VERSION };
    }
    return null;
  }

  if (isPersonaShape(payload)) {
    const persona = payload as Persona;
    return keyTimelineEvents({
      version: CURRENT_VERSION,
      lang: persona.preferredLang,
      personaId: persona.id as PersonaId | CustomPersonaId,
      baselinePersona: persona,
      persona,
      corrections: [],
      confirmedFactIds: [],
    });
  }

  return null;
}

/**
 * v1→v2: auto-generated timeline events used to store English literal
 * headlines. Rewrite the known machine-written literals as i18n KEYS so a
 * saved history renders in the reader's language. Narrative seeded prose
 * ("Someone is looking at one figure.") is left untouched — it is already
 * localised at render time via the data-layer table.
 */
const TIMELINE_LITERAL_KEYS: ReadonlyArray<[RegExp, TimelineKey]> = [
  [/^return filed successfully$/i, "filed"],
  [/^identity verification completed/i, "verified"],
  [/^you confirmed it was you\. the return counts from here\.?$/i, "verified"],
  [/^in the queue with everything else filed that week\.?$/i, "in_queue"],
  [/^assessment and tax slabs processed$/i, "under_review"],
  [/^return processed & refund determined$/i, "determined"],
  [/^refund cleared & sent to bank gateway$/i, "sent_to_bank"],
  [/^refund credited into nominated account$/i, "credited"],
];

function keyTimelineEvents(state: ReturnState): ReturnState {
  const keyFor = (headline?: string): TimelineKey | undefined => {
    if (!headline) return undefined;
    const hit = TIMELINE_LITERAL_KEYS.find(([re]) => re.test(headline.trim()));
    return hit?.[1];
  };
  const baselinePersona: Persona = {
    ...state.baselinePersona,
    refund: {
      ...state.baselinePersona.refund,
      timeline: state.baselinePersona.refund.timeline.map((e) => ({
        ...e,
        headlineKey: e.headlineKey ?? keyFor(e.headline),
      })),
    },
  };
  const persona: Persona = {
    ...state.persona,
    refund: {
      ...state.persona.refund,
      timeline: state.persona.refund.timeline.map((e) => ({
        ...e,
        headlineKey: e.headlineKey ?? keyFor(e.headline),
      })),
    },
  };
  return { ...state, baselinePersona, persona };
}

function isStoredPayload(value: unknown): value is StoredPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredPayload).version === "number" &&
    typeof (value as StoredPayload).savedAt === "string" &&
    "state" in value
  );
}

function isPersonaShape(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Persona).facts) &&
    typeof (value as Persona).name === "string" &&
    typeof (value as Persona).id === "string"
  );
}

function isValidState(state: unknown): state is ReturnState {
  const s = state as ReturnState | null;
  return (
    typeof s === "object" &&
    s !== null &&
    typeof s.version === "number" &&
    typeof s.lang === "string" &&
    isPersonaShape(s.baselinePersona) &&
    isPersonaShape(s.persona) &&
    Array.isArray(s.corrections) &&
    Array.isArray(s.confirmedFactIds)
  );
}

/* ------------------------------------------------------------------ undo */

/** Push a snapshot onto the undo stack; silently drops the oldest beyond UNDO_CAP. Pure. */
export function pushUndo(stack: ReturnState[], snapshot: ReturnState): ReturnState[] {
  const next = [...stack, snapshot];
  return next.length > UNDO_CAP ? next.slice(next.length - UNDO_CAP) : next;
}

/**
 * Pop the most recent snapshot. Empty stack yields { stack, state: null }.
 * The returned stack is a new array; inputs are untouched. Pure.
 */
export function popUndo(stack: ReturnState[]): { stack: ReturnState[]; state: ReturnState | null } {
  if (stack.length === 0) return { stack, state: null };
  return { stack: stack.slice(0, -1), state: stack[stack.length - 1] };
}
