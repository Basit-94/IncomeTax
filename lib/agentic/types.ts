/**
 * The agentic workflow's vocabulary (plan.md §5.1, §5.4).
 *
 * A Run is one task for one owner: a status the SERVER owns, an ordered event
 * log that is persisted before it is streamed, a plan of steps, and whatever
 * is currently blocking it — a question for the citizen or a review card
 * awaiting explicit confirmation. Replaying the events re-renders the run; it
 * never re-executes an action.
 */

import type { Lang } from "../types";
import type { ReturnCommand } from "../return/commands";
import type { ApplicabilityResult } from "../knowledge/types";
import type { AdviceAssessment } from "../knowledge/advice";
import type { TaxAnswer } from "../knowledge/rag";

export type RunTask =
  | "prepare_salaried_return"
  | "compare_regimes"
  | "reconcile_facts"
  | "load_demo"
  | "explain";

export type RunStatus =
  | "running"
  | "waiting_for_input"
  | "waiting_for_review"
  | "completed"
  | "cancelled"
  | "failed";

export type StepId =
  | "classify"
  | "plan"
  | "gather"
  | "resolve"
  | "compute"
  | "review"
  | "confirm"
  | "act"
  | "outputs";

export type StepState = "pending" | "active" | "done" | "skipped" | "blocked" | "failed";

export interface PlanStep {
  id: StepId;
  label: string;
  state: StepState;
  /** Why a step was skipped or is blocked, in plain words. */
  note?: string;
  dependsOn: StepId[];
}

/** One targeted question. The answer is validated against `expects`. */
export interface Question {
  id: string;
  text: string;
  /** Short reason the fact matters (§5.8: "One focused question and a short reason"). */
  why: string;
  expects: "number" | "yes_no" | "choice" | "text" | "file";
  choices?: { value: string; label: string }[];
  /** The fact this answer resolves, so it lands in the right place. */
  resolves: string;
  /** For `file` questions: what the document is and where it comes from, in plain words. */
  docHint?: string;
  /** For `file` questions: the vault document type the upload is stored as. */
  docType?: string;
  /** For `file` questions: the label of the "I don't have it / skip" choice. */
  skipLabel?: string;
}

export interface ReviewCard {
  id: string;
  kind: "filing" | "payment" | "regime" | "corrections";
  title: string;
  /** Rows the citizen must read; figures pre-formatted by the server. */
  rows: { label: string; value: string; emphasis?: boolean }[];
  /** The exact snapshot the confirmation is bound to (§5.2). */
  boundTo: { revision: number; snapshotHash: string; amount?: number };
  confirmLabel: string;
  cancelLabel: string;
  /** Applicability results and provision ids that support the recommendation. */
  basis: { applicability: ApplicabilityResult[]; provisions: string[] };
}

export interface SourceRef {
  kind: "document" | "answer" | "assumption" | "rule";
  id: string;
  label: string;
  /** For documents: uploaded/metadata_only/synthetic. For rules: the provision locator. */
  detail: string;
  verified: boolean;
  url?: string;
}

export interface OutputRef {
  id: string;
  kind: "return_summary_json" | "regime_comparison_json" | "reconciliation_json";
  title: string;
  mimeType: string;
  snapshotRevision: number;
  snapshotHash: string;
  synthetic: true;
  createdAt: string;
}

/** Events are the durable truth of a run. Payloads are redacted before persistence. */
export type RunEventPayload =
  | { type: "run_created"; task: RunTask; title: string }
  | { type: "plan_updated"; steps: PlanStep[] }
  | { type: "step_changed"; step: StepId; state: StepState; note?: string }
  | { type: "activity"; text: string }
  | { type: "source_lookup"; sources: SourceRef[] }
  | { type: "tool_outcome"; tool: string; ok: boolean; summary: string }
  | { type: "message"; role: "user" | "assistant"; text: string }
  | { type: "question"; question: Question }
  | { type: "answer"; questionId: string; value: string | number | boolean }
  | { type: "review_card"; card: ReviewCard }
  | { type: "confirmation"; cardId: string; accepted: boolean }
  | { type: "output"; output: OutputRef }
  | { type: "status"; status: RunStatus; reason?: string };

export interface RunEvent {
  runId: string;
  seq: number;
  at: string;
  payload: RunEventPayload;
}

/** The server's private working state for a run; checkpointed with it, never sent raw to the client. */
export interface RunWorkingState {
  steps: PlanStep[];
  /** Facts the citizen has answered, keyed by what they resolve. */
  answers: Record<string, string | number | boolean>;
  /** Everything that informed the work, for the Sources panel. */
  sources: SourceRef[];
  pendingQuestion?: Question;
  pendingCard?: ReviewCard;
  /** Revision of the return snapshot the run last read. */
  returnRevision?: number;
  /** Tool and model call counts for the run budget. */
  usage: { toolCalls: number; modelCalls: number; tokens: number };
  /** Set once an irreversible simulated action ran — replays must not run it again. */
  actionTaken?: { kind: "filing" | "payment"; id: string; at: string };
  /** The last user message, for classification and phrasing. */
  lastUserMessage?: string;
  /** What the opening message said about the citizen's situation (deterministic parse, no identifiers). */
  situation?: import("./intake").Situation;
  /** Document types the vault already holds for the year, so the intake never asks for what it has. */
  documentTypes?: string[];
  /** Applicability results computed for this run. */
  applicability?: ApplicabilityResult[];
  /** Exact retrieved evidence and guarded decision persisted for audit/replay. */
  taxAnswer?: TaxAnswer;
  advice?: AdviceAssessment;
  /** Commands the run intends to apply once confirmed. */
  pendingCommands?: ReturnCommand[];
}

export interface Run {
  id: string;
  ownerPan: string;
  ownerKind: "demo" | "citizen";
  assessmentYear: string;
  task: RunTask;
  title: string;
  status: RunStatus;
  lang: Lang;
  knowledgeRelease: string;
  state: RunWorkingState;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface MemoryEntry {
  key: string;
  value: string | number | boolean;
  sourceRun?: string;
  validForYear?: string;
  updatedAt: string;
}

/** Only these keys may be remembered (§5.5: "explicit typed facts ... Financial amounts and identifiers belong to protected facts, not memory"). */
export const MEMORY_KEYS = ["preferred_language", "employment_category", "prefers_regime_explanations", "filing_history"] as const;
export type MemoryKey = (typeof MEMORY_KEYS)[number];

export interface RunBudget {
  maxToolCallsPerRun: number;
  maxModelCallsPerRun: number;
  maxTokensPerDay: number;
}

/** Per-run and per-day limits (§5.3: "per-user/run/day budgets"). Conservative defaults; env may lower them. */
export function runBudget(env: Record<string, string | undefined> = process.env): RunBudget {
  const num = (k: string, d: number) => {
    const v = Number(env[k]);
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : d;
  };
  return {
    maxToolCallsPerRun: num("AGENT_MAX_TOOL_CALLS_PER_RUN", 40),
    maxModelCallsPerRun: num("AGENT_MAX_MODEL_CALLS_PER_RUN", 12),
    maxTokensPerDay: num("AGENT_DAILY_TOKEN_BUDGET", 200_000),
  };
}
