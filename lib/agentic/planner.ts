/**
 * Adaptive planning under deterministic guards (plan.md §5.1: "The planner
 * composes a per-user dependency graph from the goal, applicable rules,
 * verified facts, document availability, deadlines, and tool capabilities. It
 * may omit resolved work, reorder independent steps ... The server validates
 * every proposed action and prerequisite").
 *
 * The graph is small and explicit: nine step ids, a fixed dependency shape,
 * and per-task rules for which steps exist. What varies per user is which
 * steps are SKIPPED because their work is already done — a return whose facts
 * are all confirmed has no `resolve`; a comparison has no `act`. The plan is
 * re-derived whenever facts change, and completed steps stay done.
 */

import type { PlanStep, RunTask, StepId, StepState } from "./types";
import type { AgenticStrings } from "../i18n/agenticStrings";

export interface PlanningFacts {
  task: RunTask;
  hasReturn: boolean;
  documentsAvailable: boolean | null; // null: storage unavailable
  unconfirmedFacts: number;
  openQuestions: number;
  requiresConfirmation: boolean;
  alreadyFiled: boolean;
}

const ORDER: StepId[] = ["classify", "plan", "gather", "resolve", "compute", "review", "confirm", "act", "outputs"];

const DEPENDS: Record<StepId, StepId[]> = {
  classify: [],
  plan: ["classify"],
  gather: ["plan"],
  resolve: ["gather"],
  compute: ["resolve"],
  review: ["compute"],
  confirm: ["review"],
  act: ["confirm"],
  outputs: ["act"],
};

/** Which steps a task can contain at all. */
const STEPS_BY_TASK: Record<RunTask, StepId[]> = {
  prepare_salaried_return: ORDER,
  compare_regimes: ["classify", "plan", "gather", "resolve", "compute", "review", "confirm", "act", "outputs"],
  reconcile_facts: ["classify", "plan", "gather", "resolve", "compute", "review", "confirm", "act", "outputs"],
  load_demo: ["classify", "plan", "gather", "compute", "outputs"],
  explain: ["classify", "plan", "gather", "compute"],
};

export function stepLabel(id: StepId, s: AgenticStrings): string {
  const labels: Record<StepId, string> = {
    classify: s.stepClassify,
    plan: s.stepPlan,
    gather: s.stepGather,
    resolve: s.stepResolve,
    compute: s.stepCompute,
    review: s.stepReview,
    confirm: s.stepConfirm,
    act: s.stepAct,
    outputs: s.stepOutputs,
  };
  return labels[id];
}

/**
 * Build or rebuild the plan. `previous` carries states forward so a replan
 * after a new answer does not forget work already done (§5.1: "Replan when
 * facts change, preserving completed work").
 */
export function buildPlan(facts: PlanningFacts, s: AgenticStrings, previous: PlanStep[] = []): PlanStep[] {
  const prior = new Map(previous.map((p) => [p.id, p]));
  const allowed = STEPS_BY_TASK[facts.task];
  return ORDER.filter((id) => allowed.includes(id)).map((id) => {
    const before = prior.get(id);
    let state: StepState = before?.state ?? "pending";
    let note = before?.note;
    if (state !== "done") {
      if (id === "resolve" && facts.unconfirmedFacts === 0 && facts.openQuestions === 0 && facts.hasReturn) {
        state = "skipped";
        note = s.noteNothingToResolve;
      }
      if (id === "gather" && facts.documentsAvailable === null) {
        // Storage down: the step still runs (it reads the return) but says the vault could not be reached.
        note = s.noteVaultUnavailable;
      }
      if ((id === "confirm" || id === "act") && !facts.requiresConfirmation) {
        state = "skipped";
        note = s.noteNoAction;
      }
      if (id === "act" && facts.alreadyFiled && facts.task === "prepare_salaried_return") {
        state = "blocked";
        note = s.noteAlreadyFiled;
      }
    }
    return { id, label: stepLabel(id, s), state, note, dependsOn: DEPENDS[id].filter((d) => allowed.includes(d)) };
  });
}

/**
 * The next step that can run: pending — or active, which is a step that
 * suspended for the citizen (a question, a review) and resumes where it left
 * off — with every dependency done or skipped.
 */
export function nextStep(steps: PlanStep[]): PlanStep | null {
  const done = new Set(steps.filter((p) => p.state === "done" || p.state === "skipped").map((p) => p.id));
  return steps.find((p) => (p.state === "pending" || p.state === "active") && p.dependsOn.every((d) => done.has(d))) ?? null;
}

export function setStep(steps: PlanStep[], id: StepId, state: StepState, note?: string): PlanStep[] {
  return steps.map((p) => (p.id === id ? { ...p, state, note: note ?? p.note } : p));
}

/**
 * Deterministic intent classification, used as the fallback when the model
 * is unavailable and as the guard on what it proposes (§5.3: "Model failure
 * falls back to explicit deterministic questions for supported tasks, not
 * guessed intent").
 */
export function classifyByRules(text: string): RunTask {
  const t = text.toLowerCase();
  if (/\b(demo|sample|show me an example|try it)\b/.test(t)) return "load_demo";
  if (/\b(regime|old vs new|new vs old|115bac|which is (better|cheaper)|compare)\b/.test(t)) return "compare_regimes";
  if (/\b(wrong|dispute|mismatch|ais|26as|reconcile|not mine|duplicate|correct(ion)?|reported)\b/.test(t)) return "reconcile_facts";
  if (/\b(file|filing|return|itr|prepare|submit|refund|form 16|salary)\b/.test(t)) return "prepare_salaried_return";
  return "explain";
}

export function taskTitle(task: RunTask, s: AgenticStrings): string {
  const titles: Record<RunTask, string> = {
    prepare_salaried_return: s.taskPrepareReturn,
    compare_regimes: s.taskCompareRegimes,
    reconcile_facts: s.taskReconcile,
    load_demo: s.taskLoadDemo,
    explain: s.taskExplain,
  };
  return titles[task];
}
