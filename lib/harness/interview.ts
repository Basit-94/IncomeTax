/**
 * The slot state machine (plan §3.3 step 4). Deterministic: given a schema and the answers
 * so far, `nextSlot` is the first required, unanswered slot whose dependencies hold. The
 * model never decides what to ask; it may only rephrase.
 *
 * State holds status and masked text, never values. Values live in the vault.
 */
import type { TaskId } from "./events";
import type { SlotSpec, TaskSchema } from "./tasks";

export type AnswerStatus = "filled" | "unavailable" | "skipped";

export interface AnswerRecord {
  status: AnswerStatus;
  masked: string;
  /** Non-secret choice values (yes/no, select) are kept so dependencies can be evaluated. */
  choice?: string;
  source: "user" | "vault" | "digilocker" | "document" | "onboarding" | "persona";
  at: string;
}

export type Phase = "intake" | "compute" | "review" | "confirm" | "acting" | "done";

export interface InterviewState {
  taskId: TaskId;
  answers: Record<string, AnswerRecord>;
  pendingAskId: string | null;
  pendingSlotId: string | null;
  phase: Phase;
  /** Free text the person added that matched no slot; shown to the model as context. */
  notes: string[];
}

export function newInterview(taskId: TaskId): InterviewState {
  return { taskId, answers: {}, pendingAskId: null, pendingSlotId: null, phase: "intake", notes: [] };
}

function dependenciesHold(spec: SlotSpec, state: InterviewState): boolean {
  if (!spec.dependsOn) return true;
  return spec.dependsOn.every((dep) => {
    const answer = state.answers[dep.slot];
    if (!answer || answer.status !== "filled") return false;
    const wanted = Array.isArray(dep.equals) ? dep.equals : [dep.equals];
    return answer.choice !== undefined && wanted.includes(answer.choice);
  });
}

/** True when a document slot was filled and its extraction covered this slot. */
function coveredByDocument(spec: SlotSpec, schema: TaskSchema, state: InterviewState): boolean {
  return schema.slots.some((doc) => doc.fills?.includes(spec.id) && state.answers[doc.id]?.status === "filled" && state.answers[spec.id]?.status === "filled");
}

export function nextSlot(schema: TaskSchema, state: InterviewState): SlotSpec | null {
  for (const spec of schema.slots) {
    const answer = state.answers[spec.id];
    if (answer) continue;
    if (!dependenciesHold(spec, state)) continue;
    if (coveredByDocument(spec, schema, state)) continue;
    return spec;
  }
  return null;
}

/** Required slots that are still open once dependencies are known; optional ones do not block. */
export function isIntakeComplete(schema: TaskSchema, state: InterviewState): boolean {
  return nextSlot(schema, state) === null;
}

export function applyAnswer(state: InterviewState, slotId: string, record: AnswerRecord): InterviewState {
  return {
    ...state,
    answers: { ...state.answers, [slotId]: record },
    pendingAskId: state.pendingSlotId === slotId ? null : state.pendingAskId,
    pendingSlotId: state.pendingSlotId === slotId ? null : state.pendingSlotId,
  };
}

export function markUnavailable(state: InterviewState, slotId: string, at: string): InterviewState {
  return applyAnswer(state, slotId, { status: "unavailable", masked: "not available", source: "user", at });
}

export function skipOptional(state: InterviewState, slotId: string, at: string): InterviewState {
  return applyAnswer(state, slotId, { status: "skipped", masked: "skipped", source: "user", at });
}

export function setPending(state: InterviewState, askId: string, slotId: string): InterviewState {
  return { ...state, pendingAskId: askId, pendingSlotId: slotId };
}

/** Re-open a slot so it is asked again; dependents are reopened too. */
export function reopen(schema: TaskSchema, state: InterviewState, slotId: string): InterviewState {
  const answers = { ...state.answers };
  delete answers[slotId];
  for (const spec of schema.slots) {
    if (spec.dependsOn?.some((dep) => dep.slot === slotId)) delete answers[spec.id];
  }
  return { ...state, answers, pendingAskId: null, pendingSlotId: null, phase: "intake" };
}

/**
 * A free-text message while a question is pending. If it parses as the pending slot's
 * answer (a number for a money slot, yes/no for a yesno slot) it is returned as a proposal;
 * otherwise null and the caller records it as a note.
 */
export function proposeFromText(spec: SlotSpec, text: string): { value: string; masked: string; choice?: string } | null {
  const t = text.trim().toLowerCase();
  if (spec.input.kind === "yesno") {
    if (/^(yes|yeah|yep|haan|ha|y)\b/.test(t)) return { value: "yes", masked: "Yes", choice: "yes" };
    if (/^(no|nope|nahi|nah|n)\b/.test(t)) return { value: "no", masked: "No", choice: "no" };
    return null;
  }
  if (spec.input.kind === "money") {
    const amount = parseIndianAmount(t);
    if (amount !== null) return { value: String(amount), masked: formatRupees(amount) };
    return null;
  }
  if (spec.input.kind === "select") {
    // Match the value, the whole label, or any distinctive word of the label ("freelance").
    const hit = spec.input.options.find((o) => {
      const words = o.label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 5);
      return t.includes(o.value.toLowerCase().replace(/_/g, " ")) || t.includes(o.label.toLowerCase()) || words.some((w) => t.includes(w));
    });
    return hit ? { value: hit.value, masked: hit.label, choice: hit.value } : null;
  }
  return null;
}

/** "14 lakh", "14.5L", "1.2 crore", "₹12,50,000", "50k" → whole rupees. */
export function parseIndianAmount(text: string): number | null {
  const t = text.replace(/,/g, "").toLowerCase();
  const m = t.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|lakh|l\b|crores?|cr\b|k\b|thousand)?/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = m[2] ?? "";
  const factor = /lakh|lac|^l$/.test(unit) ? 100_000 : /crore|cr/.test(unit) ? 10_000_000 : /k|thousand/.test(unit) ? 1_000 : 1;
  return Math.round(n * factor);
}

export function formatRupees(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}
