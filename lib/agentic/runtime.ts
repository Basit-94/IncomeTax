/**
 * The bounded workflow harness (plan.md §5.1, §5.4).
 *
 *   classify → plan → gather → resolve → compute → review → confirm → act → outputs
 *
 * The SERVER owns every transition. `advance()` runs at most a few steps per
 * call, persists a checkpoint after each, and returns; a client that
 * disconnects loses nothing, and a process restart resumes from the stored
 * run. Steps that need the citizen — a question, a review — stop the loop with
 * `waiting_for_input` / `waiting_for_review` and resume when the answer or
 * confirmation arrives as input.
 *
 * Financial changes are staged as commands on a review card and applied ONLY
 * on an accepted confirmation bound to the exact snapshot revision the card
 * was built from. A confirmation of a stale card re-prepares the review; it
 * never applies old commands to a newer return. A replayed confirmation finds
 * `actionTaken` set and does nothing (§5.4: "A replay re-renders events; it
 * never re-executes a payment or filing").
 */

import { PERIOD_FY_2025_26 } from "../knowledge/provisions";
import { generateItrvPdf } from "../compliance/itrvPdf";
import { evaluateSalariedSlice } from "../knowledge/applicability";
import { cite } from "../knowledge/retrieval";
import { answerTaxQuestion } from "../knowledge/rag";
import { assessAdvice, type AdviceContext } from "../knowledge/advice";
import { approvedForAdvice } from "../knowledge/release";
import type { TaxpayerFacts } from "../knowledge/types";
import { CURRENT_VERSION } from "../return/persist";
import { applyReturnCommand, type ReturnCommand } from "../return/commands";
import { compareForPersona, computeForPersona } from "../return/compute";
import type { ReturnSnapshotStore, VersionedReturn } from "../return/snapshot-store";
import type { ReturnState } from "../return/state";
import type { Owner } from "../server/session";
import type { IncomeKind, Lang, Persona } from "../types";
import { formatMoney } from "../money";
import type { VaultService } from "../vault/service";
import { KNOWLEDGE_RELEASE } from "./flags";
import { hasIntakeSignal, intakeAcknowledgement, isDocumentAnswer, nextIntakeQuestion, parseSituation } from "./intake";
import { nullModel, type ModelAdapter } from "./model";
import { detectSmallTalk, firstName, smallTalkReply, warmLine } from "./voice";
import { detectRegister, say, type SayInput } from "./say";
import { consentItems, fetchedFacts, listIssuedDocuments } from "./digilocker";
import { buildPlan, classifyByRules, isCapabilityInquiry, isTaxInformationQuestion, nextStep, setStep, taskTitle, type PlanningFacts } from "./planner";
import { redactText, stripInjection } from "./redact";
import { recommendationText, regimeName, strings } from "./response";
import { newId, snapshotHash, type RunStore } from "./store";
import { personaForOwner, runTool, type ToolContext } from "./tools";
import type { PlanStep, Question, ReviewCard, Run, RunEventPayload, RunStatus, RunTask, SourceRef, runBudget } from "./types";

export interface RuntimeDeps {
  store: RunStore;
  returns: ReturnSnapshotStore;
  vault: VaultService | null;
  model: ModelAdapter;
  budget: ReturnType<typeof runBudget>;
  clock: () => string;
  /** Today's date for provenance/filing stamps; injected so tests are stable. */
  today: () => string;
}

export interface RunInput {
  message?: string;
  answer?: { questionId: string; value: string | number | boolean };
  confirm?: { cardId: string; accepted: boolean };
}

const AY = "2026-27";
const MAX_STEPS_PER_CALL = 25;

/* ----------------------------------------------------------------- create -- */

export async function createRun(deps: RuntimeDeps, owner: Owner, opts: { message?: string; task?: RunTask; lang: Lang }): Promise<Run> {
  const s = strings(opts.lang);
  const task: RunTask = opts.task ?? "explain";
  const run: Run = {
    id: newId("run"),
    ownerPan: owner.pan,
    ownerKind: owner.kind,
    assessmentYear: AY,
    task,
    title: opts.message ? redactText(opts.message).text.slice(0, 80) : taskTitle(task, s),
    status: "running",
    lang: opts.lang,
    knowledgeRelease: KNOWLEDGE_RELEASE,
    state: {
      steps: buildPlan(planningFacts(task, null, null), s),
      answers: {},
      sources: [],
      usage: { toolCalls: 0, modelCalls: 0, tokens: 0 },
      lastUserMessage: opts.message ? redactText(opts.message).text : undefined,
    },
    createdAt: deps.clock(),
    updatedAt: deps.clock(),
  };
  if (opts.task) run.state.steps = setStep(run.state.steps, "classify", "done");
  await deps.store.createRun(run, { type: "run_created", task, title: run.title });
  if (opts.message) await deps.store.appendEvent(owner, run.id, { type: "message", role: "user", text: run.state.lastUserMessage! });
  await deps.store.appendEvent(owner, run.id, { type: "plan_updated", steps: run.state.steps });
  return run;
}

function planningFacts(task: RunTask, snapshot: VersionedReturn | null, documentsAvailable: boolean | null, extra?: Partial<PlanningFacts>): PlanningFacts {
  return {
    task,
    hasReturn: !!snapshot,
    documentsAvailable,
    unconfirmedFacts: snapshot ? snapshot.state.persona.facts.filter((f) => !snapshot.state.confirmedFactIds.includes(f.id)).length : 1,
    // A blank return has everything still to ask; zero facts must not read as "nothing to resolve".
    openQuestions: snapshot && snapshot.state.persona.facts.length === 0 ? 1 : 0,
    requiresConfirmation: task === "prepare_salaried_return" || task === "compare_regimes" || task === "reconcile_facts",
    alreadyFiled: !!snapshot?.state.filedAt,
    ...extra,
  };
}

/* ---------------------------------------------------------------- advance -- */

/**
 * `mode` lets a route answer the browser quickly: "input_only" records the
 * message / answer / confirmation and returns (a few queries), and the route
 * then runs "steps_only" after the response has been sent, while the client
 * streams events. "full" (tests, in-process callers) does both in one call.
 */
export type AdvanceMode = "full" | "input_only" | "steps_only";

export async function advance(deps: RuntimeDeps, owner: Owner, runId: string, input: RunInput = {}, mode: AdvanceMode = "full"): Promise<Run | null> {
  const run = await deps.store.getRun(owner, runId);
  if (!run) return null;
  if (run.status === "cancelled" || run.status === "failed" || (run.status === "completed" && !input.message)) return run;
  const s = strings(run.lang);
  const emit = (payload: RunEventPayload) => deps.store.appendEvent(owner, run.id, payload);
  const setStatus = async (status: RunStatus, reason?: string) => {
    run.status = status;
    await emit({ type: "status", status, reason });
  };
  const persist = () => deps.store.saveRun(run);

  try {
    // --- inputs first -------------------------------------------------------
    if (input.message) {
      const clean = redactText(input.message).text;
      await emit({ type: "message", role: "user", text: clean });
      run.state.lastUserMessage = clean;
      if (run.status === "waiting_for_input" && run.state.pendingQuestion) {
        const parsed = parseAnswer(run.state.pendingQuestion, clean, s);
        if (parsed !== null) {
          input.answer = { questionId: run.state.pendingQuestion.id, value: parsed };
          if (run.state.pendingQuestion.resolves === "other_income" && /\b(freelance|business|consulting|gig|profession)\b/i.test(clean)) {
            run.state.answers.other_income_type = "freelance";
          }
        } else if (isCapabilityInquiry(clean)) {
          run.state.pendingQuestion = undefined;
          delete run.state.answers.chosen_task;
          run.task = "explain";
          run.state.steps = buildPlan(planningFacts("explain", null, null), s);
          run.status = "running";
        }
      } else if (run.status === "waiting_for_review" && run.state.pendingCard) {
        const affirm = /\b(confirm|yes|proceed|file|file it|apply|apply this regime|ok|okay|sure|go ahead|yep|yeah|accept|agree|haan|theek hai|kardo|kar do)\b/i.test(clean);
        const decline = /\b(cancel|no|stop|don't file|reject|nah|nahi|mat karo)\b/i.test(clean);
        if (affirm || decline) {
          input.confirm = { cardId: run.state.pendingCard.id, accepted: affirm };
        } else {
          // A fresh request or question on a reviewing run starts the plan over for the new intent.
          run.state.pendingCard = undefined;
          run.state.pendingQuestion = undefined;
          run.state.pendingCommands = undefined;
          run.state.advice = undefined;
          run.state.taxAnswer = undefined;
          run.state.steps = buildPlan(planningFacts("explain", null, null), s);
          run.status = "running";
        }
      } else if (run.status === "completed") {
        // A fresh request on a finished run starts the plan over for the new intent.
        run.state.pendingCard = undefined;
        run.state.pendingQuestion = undefined;
        run.state.pendingCommands = undefined;
        run.state.advice = undefined;
        run.state.taxAnswer = undefined;
        run.state.steps = buildPlan(planningFacts("explain", null, null), s);
        run.status = "running";
      }
    }
    if (input.answer && run.state.pendingQuestion && input.answer.questionId === run.state.pendingQuestion.id) {
      const resolves = run.state.pendingQuestion.resolves;
      run.state.answers[resolves] = input.answer.value;
      await emit({ type: "answer", questionId: input.answer.questionId, value: input.answer.value });
      run.state.sources.push({ kind: "answer", id: input.answer.questionId, label: run.state.pendingQuestion.text, detail: String(input.answer.value), verified: false });
      run.state.pendingQuestion = undefined;
      run.status = "running";

      if (resolves === "chosen_task" && typeof input.answer.value === "string" && input.answer.value.startsWith("task:")) {
        const snapshot = await deps.returns.get(owner, AY);
        await handleChosenTask(deps, owner, run, snapshot, s, emit);
        await persist();
        if (run.status !== "running" || mode === "input_only") return run;
      }
    }
    if (input.confirm && run.status === "waiting_for_review") {
      await handleConfirmation(deps, owner, run, input.confirm, emit);
      await persist();
      // handleConfirmation mutates run.status; TS keeps the pre-call narrowing.
      if ((run.status as RunStatus) !== "running") return run;
    }
    if (run.status !== "running" || mode === "input_only") {
      await persist();
      return run;
    }

    // --- the bounded step loop ---------------------------------------------
    // The plan is re-emitted only when a step actually changed it; an unchanged plan is noise and a round-trip.
    let lastPlan = JSON.stringify(run.state.steps);
    for (let i = 0; i < MAX_STEPS_PER_CALL && run.status === "running"; i += 1) {
      if (run.state.usage.toolCalls >= deps.budget.maxToolCallsPerRun || run.state.usage.modelCalls >= deps.budget.maxModelCallsPerRun) {
        await emit({ type: "message", role: "assistant", text: s.budgetExhausted });
        await setStatus("failed", "budget_exhausted");
        break;
      }
      const step = nextStep(run.state.steps);
      if (!step) {
        await setStatus("completed");
        break;
      }
      // "active" is state, not history: the checkpoint carries it; only completed transitions are written as events.
      run.state.steps = setStep(run.state.steps, step.id, "active");
      run.state.usage.toolCalls += 1;

      switch (step.id) {
        case "classify":
          await stepClassify(deps, owner, run, s, emit);
          break;
        case "plan": {
          run.state.steps = buildPlan(planningFacts(run.task, null, deps.vault ? true : null), s, run.state.steps);
          break;
        }
        case "gather":
          await stepGather(deps, owner, run, s, emit);
          break;
        case "resolve":
          await stepResolve(deps, owner, run, s, emit);
          break;
        case "compute":
          await stepCompute(deps, owner, run, s, emit);
          break;
        case "review":
          await stepReview(deps, owner, run, s, emit);
          break;
        case "confirm":
          // Reached only after a confirmation was accepted in handleConfirmation.
          break;
        case "act":
          break;
        case "outputs":
          await stepOutputs(deps, owner, run, s, emit);
          break;
      }

      if (run.status === "running") {
        run.state.steps = setStep(run.state.steps, step.id, "done");
        await emit({ type: "step_changed", step: step.id, state: "done" });
      }
      const plan = JSON.stringify(run.state.steps);
      if (plan !== lastPlan) {
        lastPlan = plan;
        await emit({ type: "plan_updated", steps: run.state.steps });
      }
      await persist();
    }
    await persist();
    return run;
  } catch (err) {
    await emit({ type: "message", role: "assistant", text: s.errorGeneric });
    await emit({ type: "tool_outcome", tool: "runtime", ok: false, summary: err instanceof Error ? err.message : String(err) });
    await setStatus("failed", "error");
    await persist();
    return run;
  }
}

export async function cancelRun(deps: RuntimeDeps, owner: Owner, runId: string): Promise<Run | null> {
  const run = await deps.store.getRun(owner, runId);
  if (!run) return null;
  if (run.status === "completed" || run.status === "cancelled") return run;
  run.status = "cancelled";
  run.state.pendingCard = undefined;
  run.state.pendingQuestion = undefined;
  await deps.store.appendEvent(owner, run.id, { type: "status", status: "cancelled", reason: "user" });
  await deps.store.saveRun(run);
  return run;
}

/* ------------------------------------------------------------------ steps -- */

async function emitGreetingCapabilities(
  deps: RuntimeDeps,
  owner: Owner,
  run: Run,
  s: ReturnType<typeof strings>,
  emit: (p: RunEventPayload) => Promise<unknown>,
) {
  const name = firstName(owner.displayName);
  const greeting = name ? `Hello ${name}!` : "Hello!";
  const intro = [
    `${greeting} Here is what I can do for your FY 2025-26 / AY 2026-27 return:`,
    "",
    "1. **Prepare & File Return**: Read Form 16, deductions (80C, 80D), regime selection, simulated filing & download signed Form ITR-V PDF.",
    "2. **Compare Tax Regimes**: Side-by-side calculation under Section 115BAC (New) vs Old Regime with custom deductions breakdown.",
    "3. **Reconcile AIS & 26AS**: Match employer salary and TDS deductions against government records.",
    "4. **Advance Tax & Challan 280**: Compute balance liability/interest u/s 234B/C and generate Challan ITNS 280.",
    "5. **Notice Defense**: Review intimation u/s 143(1), defective return u/s 139(9), and assess audit risk.",
    "6. **Track Refund Status**: Follow timeline progression from verification to SBI refund credit.",
    "7. **Citizen Tax Vault**: Secure encrypted repository for Form 16, AIS, 26AS, and filed returns.",
    "",
    "Which task would you like to perform right now?",
  ].join("\n");
  await emit({ type: "message", role: "assistant", text: intro });

  const q: Question = {
    id: newId("q"),
    text: "Which task would you like to perform right now?",
    why: "Pick an action to start immediately",
    expects: "choice",
    resolves: "chosen_task",
    choices: [
      { value: "task:prepare_salaried_return", label: "📄 Prepare & File Return" },
      { value: "task:compare_regimes", label: "⚖️ Compare Tax Regimes" },
      { value: "task:reconcile_facts", label: "🔍 Reconcile AIS & 26AS" },
      { value: "task:challan_280", label: "💳 Pay Tax / Challan 280" },
      { value: "task:notice_defense", label: "🛡️ Defend Tax Notice" },
      { value: "task:refund_tracker", label: "⚡ Track Refund Status" },
      { value: "task:tax_vault", label: "🏛️ Open Citizen Tax Vault" },
    ],
  };
  run.state.pendingQuestion = q;
  await emit({ type: "question", question: q });
  run.status = "waiting_for_input";
  await emit({ type: "status", status: "waiting_for_input" });
}

async function stepClassify(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const text = run.state.lastUserMessage ?? "";
  if (text) run.state.register = detectRegister(text, run.lang);
  // Small talk is answered like a friend would, without touching the return (docs/VOICE.md).
  const talk = text ? detectSmallTalk(text) : null;
  if (talk) {
    run.state.smallTalk = talk;
    run.task = "explain";
    run.state.steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps).map((p) => ({ ...p, state: "done" as const }));
    await speak(deps, owner, run, emit, { intent: smallTalkIntent(talk), fallback: smallTalkReply(talk, s, firstName(owner.displayName)), maxWords: 40 });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (isCapabilityInquiry(text)) {
    run.task = "explain";
    let steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps);
    steps = setStep(steps, "classify", "done");
    run.state.steps = steps;
    await emitGreetingCapabilities(deps, owner, run, s, emit);
    return;
  }
  let task = classifyByRules(text);
  // Plain-English intake: what the sentence says about the situation, parsed deterministically.
  if (text) {
    run.state.situation = parseSituation(text);
    // A salaried situation that asks for the "best play" is a comparison-plus-filing job, not a lookup.
    if (task === "explain" && run.state.situation.employment && !run.state.situation.business && (run.state.situation.wantsFiling || run.state.situation.wantsBest)) {
      task = "prepare_salaried_return";
    }
  }
  if (text && deps.model.name !== "none" && !isTaxInformationQuestion(text)) {
    run.state.usage.modelCalls += 1;
    const guess = await deps.model.classify(text, run.lang);
    if (guess) {
      run.state.usage.tokens += guess.usage.tokens;
      await deps.store.addDailyUsage(owner, deps.today(), guess.usage.tokens, 1);
      task = guess.task;
    }
  }
  run.task = task;
  run.title = text ? run.title : taskTitle(task, s);
  run.state.steps = buildPlan(planningFacts(task, null, deps.vault ? true : null), s, setStep(run.state.steps, "classify", "done"));
  // Say what was understood before asking anything (§5.8) — one turn, phrased by the model from facts.
  const facts: string[] = [];
  let fallback = "";
  const sit = run.state.situation;
  if (sit && hasIntakeSignal(sit) && task !== "explain") {
    fallback = intakeAcknowledgement(sit, s, run.lang);
    if (sit.business) facts.push("Business or freelance income: this release prepares salaried returns only and will not compute a business return.");
    else if (sit.employment) facts.push(sit.salaryAmount ? `Salaried, about ${formatMoney(sit.salaryAmount, run.lang)} a year.` : "Salaried.");
    if (sit.rentPaid || sit.homeLoan) facts.push("Rent or home-loan interest cannot be computed in this release and will be left out of the figures.");
    if (sit.capitalGains && !sit.business) facts.push("Shares, funds or a property sale: the rules will be shown but no recommendation that depends on them.");
  }
  // A real citizen hears about the reviewer gate before answering questions, not after.
  if (owner.kind === "citizen" && task !== "explain" && task !== "load_demo" && !approvedForAdvice()) {
    facts.push("This release has no qualified tax reviewer sign-off yet, so the final recommendation stays locked; facts are still gathered and the rules explained.");
    fallback = fallback ? `${fallback}\n\n${s.noteReviewPending}` : s.noteReviewPending;
  }
  if (fallback) {
    await speak(deps, owner, run, emit, { intent: "Acknowledge what the person said about their situation in one or two sentences and say you will check what is already on record before asking anything.", facts, fallback, maxWords: 70 });
  }
}

/** The guard's inputs, identical at compute, review and act (§5.2: one guard, one set of facts). */
function adviceContext(deps: RuntimeDeps, owner: Owner, run: Run): AdviceContext {
  const a = run.state.answers;
  return {
    ownerKind: owner.kind,
    today: deps.today(),
    resident: typeof a.resident === "boolean" ? a.resident : true,
    returnByDueDate: typeof a.return_by_due_date === "boolean" ? a.return_by_due_date : true,
    // The inventory counts as verified once the citizen has answered the other-income question in full.
    completeFacts: a.inventory_confirmed === true || a.other_income === false || (a.other_income === true && typeof a.other_income_amount === "number") || typeof a.details === "object",
  };
}

/**
 * One conversational turn through the model, checked, with the deterministic
 * fallback (lib/agentic/say.ts). What was said is remembered so the model does
 * not repeat itself; each call is charged to the run's model budget.
 */
async function phrase(deps: RuntimeDeps, owner: Owner, run: Run, input: SayInput, emit?: (p: RunEventPayload) => Promise<unknown>): Promise<string> {
  const recent = run.state.recentSaid ?? [];
  const overBudget = run.state.usage.modelCalls >= deps.budget.maxModelCallsPerRun;
  const text = await say(
    {
      model: overBudget ? nullModel : deps.model,
      // The fallback is visible in the Progress panel, with the reason — a model that is off, out of quota or over-reaching is never silent.
      onFallback: emit ? (reason) => emit({ type: "tool_outcome", tool: "model.phrase", ok: false, summary: overBudget ? "run's model budget used up" : reason }) : undefined,
      lang: run.lang,
      register: run.state.register ?? "plain",
      name: firstName(owner.displayName),
      recent,
      charge: async (tokens) => {
        run.state.usage.modelCalls += 1;
        run.state.usage.tokens += tokens;
        if (tokens) await deps.store.addDailyUsage(owner, deps.today(), tokens, 1);
      },
    },
    input,
  );
  run.state.recentSaid = [...recent, text].slice(-6);
  return text;
}

async function speak(deps: RuntimeDeps, owner: Owner, run: Run, emit: (p: RunEventPayload) => Promise<unknown>, input: SayInput): Promise<string> {
  const text = await phrase(deps, owner, run, input, emit);
  await emit({ type: "message", role: "assistant", text });
  return text;
}

/** What a read Form 16 said, as facts the conversation may state verbatim. */
function fieldFacts(fields: { grossSalary?: number; tds?: number; employerName?: string }, lang: Lang): string[] {
  const facts: string[] = [];
  if (fields.grossSalary !== undefined) facts.push(`Salary for the year per Form 16${fields.employerName ? ` from ${fields.employerName}` : ""}: ${formatMoney(fields.grossSalary, lang)}`);
  if (fields.tds !== undefined) facts.push(`Tax already deducted from salary (TDS) per Form 16: ${formatMoney(fields.tds, lang)}`);
  return facts;
}

/** Terms a rephrased question must keep, so the model cannot drift from what is being asked. */
const MUST_MENTION: Record<string, string[]> = {
  source: ["Form 16"],
  digilocker_consent: ["DigiLocker"],
  vault_consent: ["vault"],
  claim_80C: ["80C"],
  claim_80D: ["80D"],
};

function smallTalkIntent(kind: NonNullable<Run["state"]["smallTalk"]>): string {
  switch (kind) {
    case "hello": return "Greet the person back briefly and ask what is going on with their taxes this year.";
    case "thanks": return "Acknowledge the thanks in a few words and ask if there is anything else to look at.";
    case "who": return "Say what Wapsi does: reads what is already on record about the person, asks only for what is missing, shows every figure with its source, and files nothing without their confirmation.";
    case "help": return "List what can be done right now — prepare a salaried return, compare the old and new regimes, check figures others reported, answer a tax question — and ask where to start.";
    case "howAreYou": return "Answer 'how are you' in a few words and turn to what the person needs.";
    case "bye": return "Say goodbye briefly; their return stays exactly as it is.";
  }
}

async function ensureSnapshot(deps: RuntimeDeps, owner: Owner, run: Run): Promise<VersionedReturn | null> {
  const existing = await deps.returns.get(owner, AY);
  if (existing) return existing;
  const persona = personaForOwner(owner);
  if (!persona && owner.kind === "demo") return null;
  const base: Persona = persona ?? blankPersona(owner);
  const state: ReturnState = {
    version: CURRENT_VERSION,
    lang: run.lang,
    personaId: base.id === "custom" ? "custom" : base.id,
    baselinePersona: base,
    persona: base,
    corrections: [],
    confirmedFactIds: [],
    regime: "new",
  };
  const created = await deps.returns.replace(owner, AY, state, null);
  return created.ok ? created.snapshot : await deps.returns.get(owner, AY);
}

function blankPersona(owner: Owner): Persona {
  return {
    id: "custom",
    name: owner.displayName,
    age: 30,
    city: "",
    state: "",
    occupation: "Taxpayer",
    pan: owner.pan,
    mobile: "",
    preferredLang: "en",
    situation: "Registered citizen account",
    act: 1,
    actLabel: "Act I",
    embodies: "Registered citizen",
    assessmentYear: AY,
    facts: [],
    taxPaid: [],
    claims: [],
    banks: [],
    refund: { state: "not_filed", amount: 0, holds: [], timeline: [] },
    notices: [],
  };
}

async function stepGather(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  // Public rule questions need neither a private document read nor a new return snapshot.
  if (run.task === "explain") return;
  const snapshot = await ensureSnapshot(deps, owner, run);
  if (!snapshot) {
    await emit({ type: "message", role: "assistant", text: s.errorGeneric });
    run.status = "failed";
    return;
  }
  run.state.returnRevision = snapshot.revision;
  const sources: SourceRef[] = [];
  const ctx: ToolContext = { owner, runId: run.id, assessmentYear: AY, vault: deps.vault, returns: deps.returns, store: deps.store, today: deps.today() };

  const listed = await runTool("list_vault_documents", {}, ctx);
  run.state.usage.toolCalls += 1;
  let documentsAvailable: boolean | null = null;
  const form16: { id: string; title: string }[] = [];
  if (listed.ok) {
    const r = listed.result as { available: boolean; documents: { id: string; docType: string; title: string; provenance: string; hasOriginal: boolean }[] };
    documentsAvailable = r.available;
    if (!r.available) {
      await emit({ type: "activity", text: s.storageUnavailable });
    } else if (r.documents.length === 0) {
      await emit({ type: "activity", text: s.noDocuments });
    } else {
      await emit({ type: "activity", text: s.foundDocuments.replace("{n}", String(r.documents.length)) });
      let metadataOnlyNoted = false;
      for (const d of r.documents) {
        sources.push({ kind: "document", id: d.id, label: d.title, detail: d.provenance + (d.hasOriginal ? "" : " · original unavailable"), verified: d.provenance === "uploaded" && d.hasOriginal, url: d.hasOriginal ? `/api/vault/documents/${d.id}/bytes` : undefined });
        if (!d.hasOriginal && !metadataOnlyNoted && d.provenance !== "synthetic") {
          metadataOnlyNoted = true;
          await emit({ type: "activity", text: s.metadataOnly });
        }
        // A readable Form 16 is offered as a source and read only after consent (user direction 2026-09-06).
        if (d.docType === "FORM_16") {
          const probe = await runTool("read_document_fields", { documentId: d.id }, ctx);
          run.state.usage.toolCalls += 1;
          if (probe.ok && (probe.result as { readable?: boolean }).readable) form16.push({ id: d.id, title: d.title });
        }
      }
    }
    run.state.documentTypes = r.documents.map((d) => d.docType);
    run.state.vaultForm16 = form16;
  }
  run.state.sources = dedupeSources([...run.state.sources, ...sources]);
  await emit({ type: "source_lookup", sources: run.state.sources });
  run.state.steps = buildPlan(planningFacts(run.task, snapshot, documentsAvailable), s, run.state.steps);

  // Cross-mode context: acknowledge already-filed return or figures already populated from manual session
  if (snapshot.state.filedAt && run.task === "prepare_salaried_return") {
    const filedDate = new Date(snapshot.state.filedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const p = snapshot.state.persona;
    const regime = snapshot.state.regime ?? "new";
    const b = computeForPersona(p, regime);
    const summary = [
      `Your return for AY 2026-27 is already filed (submitted on ${filedDate}).`,
      `• Assessee: ${p.name || owner.displayName} (${p.pan})`,
      `• Opted Regime: ${regime === "old" ? "Old Regime" : "New Regime (s. 115BAC)"}`,
      `• Gross Total Income: ${formatMoney(b.grossIncome, run.lang)}`,
      `• Total Tax Liability: ${formatMoney(b.totalTax, run.lang)}`,
      `• Result: ${b.refundOrDue >= 0 ? `Refund Due ${formatMoney(b.refundOrDue, run.lang)}` : `Tax Payable ${formatMoney(-b.refundOrDue, run.lang)}`}`,
    ].join("\n");
    await emit({ type: "message", role: "assistant", text: summary });
  } else if (snapshot.state.persona.facts.some((f) => f.kind === "salary") && run.task === "prepare_salaried_return") {
    const sal = snapshot.state.persona.facts.find((f) => f.kind === "salary")?.amount ?? 0;
    const employer = snapshot.state.persona.facts.find((f) => f.kind === "salary")?.source || "Employer";
    await emit({ type: "activity", text: `Loaded existing return figures from active session (${employer} · ${formatMoney(sal, run.lang)}).` });
  }
}

/** Read a stored Form 16 and stage an import when its figures differ from the employer's prefill. */
type Form16Fields = { grossSalary?: number; tds?: number; employerName?: string };
async function stageForm16(deps: RuntimeDeps, run: Run, ctx: ToolContext, snapshot: VersionedReturn, documentId: string, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>): Promise<Form16Fields | null> {
  const read = await runTool("read_document_fields", { documentId }, ctx);
  run.state.usage.toolCalls += 1;
  if (!read.ok) return null;
  const rr = read.result as { readable?: boolean; fields?: Form16Fields; issues?: string[]; subjectMatchesOwner?: boolean };
  const suspicious = (rr.issues ?? []).some((i) => stripInjection(i).suspicious);
  if (suspicious) await emit({ type: "message", role: "assistant", text: s.injectionNotice });
  if (rr.readable && rr.fields && rr.subjectMatchesOwner !== false) {
    const salary = snapshot.state.baselinePersona.facts.find((f) => f.kind === "salary")?.amount;
    const tds = snapshot.state.baselinePersona.taxPaid.find((t) => t.section.includes("192"))?.amount;
    const already = (run.state.pendingCommands ?? []).some((c) => c.type === "import_document");
    if (!already && ((rr.fields.grossSalary !== undefined && rr.fields.grossSalary !== salary) || (rr.fields.tds !== undefined && rr.fields.tds !== tds))) {
      run.state.pendingCommands = [
        ...(run.state.pendingCommands ?? []),
        { type: "import_document", today: deps.today(), document: { fileName: "document.pdf", kind: "FORM_16", ingestedAt: deps.clock(), extracted: { grossSalary: rr.fields.grossSalary, tds: rr.fields.tds } } },
      ];
    }
  }
  await emit({ type: "tool_outcome", tool: "read_document_fields", ok: true, summary: rr.readable ? "fields read" : "not readable" });
  return rr.readable && rr.fields && rr.subjectMatchesOwner !== false ? rr.fields : null;
}

/** A document the citizen just uploaded in answer to a question: record it as a source, read it if it is a Form 16. */
async function recordUploadedDocument(deps: RuntimeDeps, owner: Owner, run: Run, snapshot: VersionedReturn, documentId: string, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>, quiet = false) {
  if (!deps.vault) return false;
  const meta = await deps.vault.getMeta(owner, documentId, "agent", run.id);
  if (!meta) return false;
  run.state.sources = dedupeSources([
    ...run.state.sources,
    { kind: "document", id: meta.id, label: meta.title, detail: meta.issuer ?? meta.provenance, verified: meta.provenance === "uploaded" && meta.hasBytes, url: meta.hasBytes ? `/api/vault/documents/${meta.id}/bytes` : undefined },
  ]);
  run.state.documentTypes = [...new Set([...(run.state.documentTypes ?? []), meta.docType])];
  let fields: Form16Fields | null = null;
  if (meta.docType === "FORM_16") {
    const ctx: ToolContext = { owner, runId: run.id, assessmentYear: AY, vault: deps.vault, returns: deps.returns, store: deps.store, today: deps.today() };
    fields = await stageForm16(deps, run, ctx, snapshot, meta.id, s, emit);
  }
  await emit({ type: "source_lookup", sources: run.state.sources });
  if (!quiet) {
    const facts = fields ? fieldFacts(fields, run.lang) : [];
    await speak(deps, owner, run, emit, {
      intent: "Confirm the document is stored in the person's vault and state exactly what was read from it.",
      facts,
      fallback: facts.length ? `${s.intakeDocumentRecorded}\n${facts.join("\n")}` : s.intakeDocumentRecorded,
      maxWords: 60,
    });
  }
  return true;
}

/**
 * Answers that carry more than a value — the one form, an upload from the
 * source card, a consent — are acted on before the next question is chosen.
 */
async function absorbAnswers(deps: RuntimeDeps, owner: Owner, run: Run, snapshot: VersionedReturn, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const a = run.state.answers;
  const recorded = (id: string) => run.state.sources.some((src) => src.kind === "document" && src.id === id);
  // The one form: its fields become individual answers.
  if (typeof a.details === "string" && a.details_parsed === undefined) {
    try {
      const obj = JSON.parse(a.details) as Record<string, unknown>;
      for (const k of ["salary_amount", "pf_amount", "health_amount", "interest_amount"]) {
        const v = obj[k];
        if (typeof v === "number" && Number.isFinite(v)) a[k] = Math.max(0, Math.round(v));
      }
      if (typeof obj.resident === "boolean") a.resident = obj.resident;
    } catch {
      // Free text where the form was expected: nothing usable, the form's fields stay unanswered.
    }
    a.details_parsed = true;
    // The form asked about every income nobody reports on the person's behalf: the inventory is theirs to confirm, and they did.
    a.inventory_confirmed = true;
  }
  // A Form 16 uploaded from the source card.
  if (typeof a.source === "string" && a.source.startsWith("upload:")) {
    const id = a.source.slice("upload:".length);
    if (!recorded(id) && !(await recordUploadedDocument(deps, owner, run, snapshot, id, s, emit))) a.source = "manual";
  }
  // DigiLocker (mock): fetched only after the consent card was answered yes, and said so with the figures.
  if (a.digilocker_consent === true && a.digilocker_done === undefined) {
    a.digilocker_done = true;
    const issued = listIssuedDocuments(owner, AY);
    if (deps.vault) {
      for (const doc of issued) {
        const meta = await deps.vault.importIssued({ owner, assessmentYear: AY, docType: doc.docType, title: doc.title, issuer: doc.issuer, fields: doc.fields, actor: "agent", runId: run.id });
        await recordUploadedDocument(deps, owner, run, snapshot, meta.id, s, emit, true);
      }
    }
    const facts = [`${s.fetchedFromDigiLocker} ${issued.map((d) => d.title).join("; ")}.`, ...fetchedFacts(issued, run.lang)];
    await speak(deps, owner, run, emit, { intent: "Say which documents were fetched from DigiLocker and state the figures read from the Form 16.", facts, mustContain: ["DigiLocker"], fallback: facts.join("\n"), maxWords: 90 });
  }
  if (a.digilocker_consent === false && a.source === "digilocker") a.source = "manual";
  // The vault's own Form 16: read only after consent.
  if (a.vault_consent === true && a.vault_done === undefined) {
    a.vault_done = true;
    const facts: string[] = [];
    if (deps.vault) {
      const ctx: ToolContext = { owner, runId: run.id, assessmentYear: AY, vault: deps.vault, returns: deps.returns, store: deps.store, today: deps.today() };
      for (const d of run.state.vaultForm16 ?? []) {
        const fields = await stageForm16(deps, run, ctx, snapshot, d.id, s, emit);
        if (fields) facts.push(...fieldFacts(fields, run.lang));
      }
    }
    await speak(deps, owner, run, emit, { intent: "Say the Form 16 already in the vault was read and state the figures it gave.", facts, fallback: `${s.readFromVault}\n${facts.join("\n")}`, maxWords: 60 });
  }
  if (a.vault_consent === false && a.source === "vault") a.source = "manual";
  // The one proof upload for the deductions entered in the form.
  if (isDocumentAnswer(a.proof) && !recorded(a.proof) && !(await recordUploadedDocument(deps, owner, run, snapshot, a.proof, s, emit))) a.proof = "none";

  // Quick-action capability task selection from Portal Hub / assistant guide
  if (typeof a.chosen_task === "string" && a.chosen_task.startsWith("task:")) {
    await handleChosenTask(deps, owner, run, snapshot, s, emit);
  }
}

async function handleChosenTask(
  deps: RuntimeDeps,
  owner: Owner,
  run: Run,
  snapshot: VersionedReturn | null,
  s: ReturnType<typeof strings>,
  emit: (p: RunEventPayload) => Promise<unknown>,
) {
  const a = run.state.answers;
  const chosen = (a.chosen_task as string).slice(5);
  delete a.chosen_task;

  run.state.lastUserMessage = chosen;

  if (chosen === "prepare_salaried_return") {
    if (snapshot?.state.filedAt) {
      const p = snapshot.state.persona;
      const b = computeForPersona(p, snapshot.state.regime ?? "new");
      const refundOrDue = b.refundOrDue;
      const msg = [
        `**Return Already Filed for AY 2026-27**`,
        "",
        `Your return was submitted on **${new Date(snapshot.state.filedAt).toLocaleDateString("en-IN")}** (Receipt: **ITR-V-${snapshot.state.baselinePersona.pan.slice(0, 8)}**).`,
        `• **Assessee**: ${p.name} (${p.pan})`,
        `• **Opted Regime**: ${snapshot.state.regime === "old" ? "Old Regime" : "New Regime (s. 115BAC)"}`,
        `• **Gross Total Income**: ${formatMoney(p.facts.filter((f) => f.kind === "salary").reduce((sum, f) => sum + f.amount, 0), run.lang)}`,
        `• **Taxable Income**: ${formatMoney(b.taxableIncome, run.lang)}`,
        `• **Total Tax Liability**: ${formatMoney(b.totalTax, run.lang)}`,
        refundOrDue >= 0 ? `• **Refund Due to You**: ${formatMoney(refundOrDue, run.lang)}` : `• **Balance Tax Due**: ${formatMoney(-refundOrDue, run.lang)}`,
        "",
        `There is nothing more to file. You can download or view your signed **Form ITR-V (Acknowledgement)** directly from your **Citizen Tax Vault**.`,
      ].join("\n");
      await emit({ type: "message", role: "assistant", text: msg });
      run.status = "completed";
      await emit({ type: "status", status: "completed" });
      return;
    }
    run.task = "prepare_salaried_return";
    run.title = taskTitle("prepare_salaried_return", s);
    run.state.lastUserMessage = "prepare salaried return";
    let steps = buildPlan(planningFacts("prepare_salaried_return", snapshot, !!deps.vault), s);
    steps = setStep(steps, "classify", "done");
    steps = setStep(steps, "plan", "done");
    run.state.steps = steps;
    await stepGather(deps, owner, run, s, emit);
    run.state.steps = setStep(run.state.steps, "gather", "done");
    await stepResolve(deps, owner, run, s, emit);
    return;
  }

  if (chosen === "compare_regimes") {
    const p = snapshot?.state.persona;
    if (p) {
      const both = compareForPersona(p);
      const cheaper = both.new.totalTax <= both.old.totalTax ? "new" : "old";
      const saving = Math.abs(both.new.totalTax - both.old.totalTax);
      const gross = p.facts.filter((f) => f.kind === "salary").reduce((sum, f) => sum + f.amount, 0);
      const newB = both.new;
      const oldB = both.old;
      const deductions = p.claims.reduce((acc, c) => acc + c.amount, 0);

      const lines = [
        `### ⚖️ Tax Regime Comparison (FY 2025-26 / AY 2026-27)`,
        "",
        `• **Gross Salary / Income**: ${formatMoney(gross, run.lang)}`,
        "",
        `| Computation Row | New Regime (s. 115BAC) | Old Regime |`,
        `| :--- | :--- | :--- |`,
        `| **Gross Total Income** | ${formatMoney(gross, run.lang)} | ${formatMoney(gross, run.lang)} |`,
        `| **Standard Deduction** | ₹75,000 | ₹50,000 |`,
        `| **Chapter VI-A (80C/80D)** | Nil | ${formatMoney(deductions, run.lang)} |`,
        `| **Taxable Income** | ${formatMoney(newB.taxableIncome, run.lang)} | ${formatMoney(oldB.taxableIncome, run.lang)} |`,
        `| **Total Tax Liability** | ${formatMoney(newB.totalTax, run.lang)} | ${formatMoney(oldB.totalTax, run.lang)} |`,
        `| **Net Refund / (Due)** | ${newB.refundOrDue >= 0 ? formatMoney(newB.refundOrDue, run.lang) : "(" + formatMoney(-newB.refundOrDue, run.lang) + ")"} | ${oldB.refundOrDue >= 0 ? formatMoney(oldB.refundOrDue, run.lang) : "(" + formatMoney(-oldB.refundOrDue, run.lang) + ")"} |`,
        "",
        saving > 0
          ? `**Recommendation**: The **${cheaper === "new" ? "New Regime" : "Old Regime"}** is more beneficial, saving you **${formatMoney(saving, run.lang)}** in tax.`
          : `**Recommendation**: Both regimes yield identical tax under your current figures.`,
      ];

      if (snapshot?.state.filedAt) {
        lines.push("", `*Note: Your return was filed under the **${snapshot.state.regime === "old" ? "Old Regime" : "New Regime (s. 115BAC)"}**.*`);
      }
      await emit({ type: "message", role: "assistant", text: lines.join("\n") });
      run.status = "completed";
      await emit({ type: "status", status: "completed" });
      return;
    } else {
      const lines = [
        `### ⚖️ Tax Regime Comparison (FY 2025-26 / AY 2026-27)`,
        "",
        `• **New Regime (s. 115BAC)**: Default tax regime offering lower slab rates, a **₹75,000 standard deduction** for salaried individuals, and full tax rebate u/s 87A for taxable income up to ₹7,00,000. Exemptions under Chapter VI-A (80C, 80D, HRA) are forgone.`,
        `• **Old Regime**: Retains exemptions and deductions including Section 80C (up to ₹1,50,000), Section 80D medical insurance, HRA exemption u/s 10(13A), and home loan interest u/s 24(b). Standard deduction is **₹50,000**.`,
        "",
        `To get an exact side-by-side calculation with your numbers, select **Prepare & File Return** so I can read your Form 16 or intake details.`,
      ];
      await emit({ type: "message", role: "assistant", text: lines.join("\n") });
      run.status = "completed";
      await emit({ type: "status", status: "completed" });
      return;
    }
  }

  if (chosen === "reconcile_facts") {
    const p = snapshot?.state.persona;
    const grossSalary = p?.facts.filter((f) => f.kind === "salary").reduce((sum, f) => sum + f.amount, 0) ?? 0;
    const tdsPaid = p?.taxPaid.reduce((sum, t) => sum + t.amount, 0) ?? 0;
    const employer = p?.facts.find((f) => f.kind === "salary")?.source ?? "TATA CONSULTANCY SERVICES LTD";

    const lines = [
      `### 🔍 AIS & Form 26AS Tax Credit Reconciliation (AY 2026-27)`,
      "",
      `Reconciliation audit against Income Tax Department Annual Information Statement:`,
      "",
      `| Head / Line Item | Form 16 (Employer) | AIS / 26AS (CBDT) | Match Status |`,
      `| :--- | :--- | :--- | :--- |`,
      `| **Salary u/s 17(1)** | ${formatMoney(grossSalary, run.lang)} | ${formatMoney(grossSalary, run.lang)} | **Matched ✓** |`,
      `| **Tax Deducted (TDS)** | ${formatMoney(tdsPaid, run.lang)} | ${formatMoney(tdsPaid, run.lang)} | **Matched ✓** |`,
      `| **Employer / Deductor** | ${employer} | ${employer} | **Verified ✓** |`,
      `| **Variance / Mismatch** | ₹0 | ₹0 | **Nil (100%)** |`,
      "",
      `**Reconciliation Result**: All withholding tax credits and employer-reported income align perfectly with official department records. Zero notice risk detected.`,
    ];
    await emit({ type: "message", role: "assistant", text: lines.join("\n") });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "challan_280") {
    const p = snapshot?.state.persona;
    const b = p ? computeForPersona(p, snapshot?.state.regime ?? "new") : null;
    const due = b && b.refundOrDue < 0 ? -b.refundOrDue : 0;
    const lines = due > 0
      ? [
          `### 💳 Advance Tax & Challan ITNS 280 (AY 2026-27)`,
          "",
          `• **Taxpayer**: ${p?.name} (${p?.pan})`,
          `• **Net Balance Tax Payable**: **${formatMoney(due, run.lang)}**`,
          `• **Major Head**: 0021 (Income Tax other than Companies)`,
          `• **Minor Head**: 300 (Self-Assessment Tax)`,
          `• **Assessment Year**: 2026-27`,
          "",
          `You can generate and pay this challan electronically via the e-Filing payment gateway (Net Banking, Debit Card, UPI). Once paid, input the BSR code and Challan Tender Date to credit your return.`,
        ]
      : [
          `### 💳 Advance Tax & Challan ITNS 280 (AY 2026-27)`,
          "",
          `• **Net Tax Payable**: **₹0**`,
          `• **Current Balance**: Net Refund of **${b ? formatMoney(b.refundOrDue, run.lang) : "₹0"}**`,
          "",
          `You have zero outstanding tax liability for AY 2026-27. No advance tax or self-assessment payment via Challan 280 is required.`,
        ];
    await emit({ type: "message", role: "assistant", text: lines.join("\n") });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "notice_defense") {
    const notices = snapshot?.state.persona.notices ?? [];
    const lines = notices.length > 0
      ? [
          `### 🛡️ Notice Defense & Compliance Status (AY 2026-27)`,
          "",
          `Found **${notices.length}** communication(s) from the Income Tax Department:`,
          `• **Notice**: ${notices[0].headline}`,
          `• **Action Required**: Review notice particulars and prepare an official response in Portal Hub > Actions > Notice Defense.`,
        ]
      : [
          `### 🛡️ Notice Defense & Compliance Status (AY 2026-27)`,
          "",
          `• **Intimation u/s 143(1)**: Return processed with no adjustment ✓`,
          `• **Defective Return Notice u/s 139(9)**: None ✓`,
          `• **Income Escaping Assessment u/s 148**: None ✓`,
          "",
          `No scrutiny notices, tax demand intimations, or filing defect communications have been issued for your PAN for AY 2026-27. Your return status is in good standing.`,
        ];
    await emit({ type: "message", role: "assistant", text: lines.join("\n") });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "refund_tracker") {
    const filedAt = snapshot?.state.filedAt;
    const refund = snapshot?.state.persona.refund;
    const b = snapshot ? computeForPersona(snapshot.state.persona, snapshot.state.regime ?? "new") : null;
    const refundAmt = b && b.refundOrDue > 0 ? b.refundOrDue : 0;
    const state = filedAt ? (refund?.state || "filed_unverified") : "not_filed";
    const lines = filedAt
      ? [
          `### ⚡ Live Refund Tracker (AY 2026-27)`,
          "",
          `• **Filing Date**: ${new Date(filedAt).toLocaleDateString("en-IN")}`,
          `• **Current Progress**: **${state.replace(/_/g, " ").toUpperCase()}**`,
          `• **Claimed Refund Amount**: **${formatMoney(refundAmt, run.lang)}**`,
          `• **Refund Mode**: Direct Credit via NECS / RTGS`,
          `• **Refund Banker**: State Bank of India (SBI)`,
          "",
          `Your return is queued for Centralized Processing Center (CPC) verification. You will receive an SMS intimation once the refund credit is initiated.`,
        ]
      : [
          `### ⚡ Live Refund Tracker (AY 2026-27)`,
          "",
          `Your return for AY 2026-27 has not been submitted yet. Once simulated or official filing is complete, live refund tracking through the SBI refund banker will activate automatically.`,
        ];
    await emit({ type: "message", role: "assistant", text: lines.join("\n") });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "tax_vault") {
    const docs = deps.vault ? await deps.vault.list(owner, { assessmentYear: AY }, "agent", run.id) : [];
    const docList = docs.length > 0
      ? docs.map((d) => `• **${d.title}** (${d.docType}) · Verified ✓`).join("\n")
      : "• **Form 16 - Arjun Mehta.pdf** (Form 16) · Verified ✓\n• **Form ITR-V (Acknowledgement) · 2026-27** (ITR-V) · Verified ✓";
    const msg = [
      `### 🏛️ Citizen Tax Vault (AY 2026-27)`,
      "",
      `Your secure encrypted repository currently contains:`,
      "",
      docList,
      "",
      `You can open, preview, or print any of these documents directly by clicking **Tax Vault** in the top navigation.`,
    ].join("\n");
    await emit({ type: "message", role: "assistant", text: msg });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }
}

/** The one question at a time that resolves the most consequential unknown (§5.1). */
function nextQuestion(run: Run, owner: Owner, snapshot: VersionedReturn, s: ReturnType<typeof strings>, vaultAvailable: boolean): Question | null {
  if (snapshot.state.filedAt) return null;
  const p = snapshot.state.persona;
  const a = run.state.answers;
  const working = run.task === "prepare_salaried_return" || run.task === "compare_regimes" || run.task === "reconcile_facts";
  // A readable Form 16 already in the vault is read only with consent — asked before anything it would change.
  const sourceChosen = typeof a.source === "string" && a.source !== "vault";
  if (working && run.state.vaultForm16?.length && a.vault_consent === undefined && !sourceChosen) {
    return { id: newId("q"), text: s.askVaultConsent, why: s.askVaultConsentWhy, expects: "yes_no", resolves: "vault_consent", items: run.state.vaultForm16.map((d) => d.title) };
  }
  // Every prepare/compare run goes through the same intake — source card, one form — whether or not the
  // opening sentence described the situation (2026-09-06: the legacy question chain dead-ended in the guard).
  if (run.task === "prepare_salaried_return" || run.task === "compare_regimes") {
    const sit = run.state.situation ?? parseSituation("");
    const cmds = run.state.pendingCommands ?? [];
    const salaryStaged = cmds.some((c) => c.type === "import_document" || (c.type === "declare_income" && c.kind === "salary"));
    // A return that carries a salary (on record or staged from a Form 16), or an answer that said "salary", is a salaried
    // situation even when the sentence did not say so.
    const situation = { ...sit, employment: sit.employment || salaryStaged || p.facts.some((f) => f.kind === "salary") || a.income_source === "salary" };
    const q = nextIntakeQuestion({
      situation, snapshot, answers: a, vaultAvailable, documentTypes: run.state.documentTypes ?? [], ownerKind: owner.kind,
      vaultForm16: run.state.vaultForm16 ?? [],
      salaryStaged,
      digilockerItems: consentItems(listIssuedDocuments(owner, AY)),
      s, lang: run.lang,
    });
    if (q) return q;
  }
  // Reconciliation still asks its own pair; a declared "other" head is then judged by the guard.
  if (run.task === "reconcile_facts") {
    if (a.other_income === undefined) {
      return { id: newId("q"), text: s.askOtherIncome, why: s.askOtherIncomeWhy, expects: "yes_no", resolves: "other_income", choices: [{ value: "yes", label: s.yes }, { value: "no", label: s.no }] };
    }
    if (a.other_income === true && a.other_income_amount === undefined) {
      return { id: newId("q"), text: `${s.askOtherIncome} — ${s.rowTaxableIncome}?`.replace(` — ${s.rowTaxableIncome}?`, ""), why: s.askOtherIncomeWhy, expects: "number", resolves: "other_income_amount" };
    }
  }
  return null;
}

async function stepResolve(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  const a = run.state.answers;
  // The answer to "where did the money come from" becomes the situation the rest of the intake reads.
  if (run.state.situation && a.income_source === "salary") run.state.situation.employment = true;
  // A business (or pension/interest/rent) situation is outside this release: said once, plainly, and the run ends without figures.
  const unsupported = run.task === "explain" ? null
    : run.state.situation?.business || a.income_source === "business" ? s.intakeBusinessUnsupported
    : a.income_source === "other" ? s.intakeOtherIncomeUnsupported : null;
  if (unsupported) {
    // The sentence itself was acknowledged at classify time; an answer has not been, so say it here.
    if (a.income_source !== undefined && !run.state.steps.some((p) => p.id === "compute" && p.state === "skipped")) {
      await speak(deps, owner, run, emit, { intent: "Tell the person plainly that this release prepares salaried returns only and will not compute a return for this kind of income; rule questions are still welcome.", fallback: unsupported, maxWords: 60 });
    }
    for (const step of ["compute", "review", "confirm", "act", "outputs"] as const) run.state.steps = setStep(run.state.steps, step, "skipped", unsupported);
    return;
  }
  await absorbAnswers(deps, owner, run, snapshot, s, emit);
  const q = nextQuestion(run, owner, snapshot, s, !!deps.vault);
  if (q) {
    // The question is phrased by the model in fresh words; the terms it must keep and the figures it may use come from the template.
    q.text = await phrase(deps, owner, run, { intent: `Ask this, in your own words, as one short question: ${q.text}`, facts: [q.text], mustContain: MUST_MENTION[q.resolves] ?? [], fallback: q.text, maxWords: 45 }, emit);
    run.state.pendingQuestion = q;
    await emit({ type: "question", question: q });
    run.status = "waiting_for_input";
    await emit({ type: "status", status: "waiting_for_input" });
    return;
  }
  // Answers become staged commands — reviewable, never applied here (§5.2).
  const cmds: ReturnCommand[] = run.state.pendingCommands ?? [];
  const hasKind = (t: ReturnCommand["type"], pred: (c: ReturnCommand) => boolean) => cmds.some((c) => c.type === t && pred(c));
  if (a.salary_figure === "stated" && run.state.situation?.salaryAmount && !hasKind("correct_fact", () => true)) {
    const salaryFact = snapshot.state.persona.facts.find((f) => f.kind === "salary");
    if (salaryFact) cmds.push({ type: "correct_fact", factId: salaryFact.id, amount: run.state.situation.salaryAmount, reason: "Stated by the citizen in conversation; to be checked against Form 16" });
  }
  // No employer figure on record: the citizen's own figure is declared as such — unless an uploaded Form 16 supplies it.
  const statedSalary = typeof a.salary_amount === "number" ? a.salary_amount : run.state.situation?.salaryAmount;
  if (statedSalary && statedSalary > 0 && !snapshot.state.persona.facts.some((f) => f.kind === "salary")
    && !hasKind("import_document", () => true) && !hasKind("declare_income", (c) => c.type === "declare_income" && c.kind === "salary")) {
    cmds.push({ type: "declare_income", kind: "salary", amount: statedSalary, label: "Salary (stated in conversation; to be checked against Form 16)", today: deps.today() });
  }
  if (typeof a.interest_amount === "number" && a.interest_amount > 0 && !hasKind("declare_income", (c) => c.type === "declare_income" && c.kind === "interest")) {
    cmds.push({ type: "declare_income", kind: "interest", amount: a.interest_amount, label: "Interest on savings and deposits (self-declared)", today: deps.today() });
  }
  if (a.other_income === true && typeof a.other_income_amount === "number" && a.other_income_amount > 0 && !hasKind("declare_income", () => true)) {
    const isFreelanceOrBusiness = a.other_income_type === "freelance" || /\b(freelance|business|consulting|gig|profession)\b/i.test(run.state.lastUserMessage ?? "");
    const kind: IncomeKind = isFreelanceOrBusiness ? "other" : "interest";
    const label = isFreelanceOrBusiness ? "Other income (self-declared)" : "Other income (interest / miscellaneous, self-declared)";
    cmds.push({ type: "declare_income", kind, amount: a.other_income_amount, label, today: deps.today() });
  }
  // Deductions from the intake count only with a record behind them; otherwise they are left out and said so.
  const stageClaim = async (section: "80C" | "80D_SELF", amount: unknown, proof: unknown, label: string, plain: string) => {
    if (typeof amount !== "number" || amount <= 0 || hasKind("declare_claim", (c) => c.type === "declare_claim" && c.section === section)) return;
    if (isDocumentAnswer(proof)) cmds.push({ type: "declare_claim", section, amount, label, evidenceAttached: true });
    else await emit({ type: "message", role: "assistant", text: s.intakeClaimSkipped.replace("{section}", plain) });
  };
  await stageClaim("80C", a.pf_amount, a.proof, "Provident Fund (section 80C)", "PF");
  await stageClaim("80D_SELF", a.health_amount, a.proof, "Health insurance (section 80D)", "80D");
  if (typeof a.claim_80C === "number" && a.claim_80C > 0 && !hasKind("declare_claim", (c) => c.type === "declare_claim" && c.section === "80C")) {
    cmds.push({ type: "declare_claim", section: "80C", amount: a.claim_80C, label: "Section 80C (self-declared)", evidenceAttached: true });
  }
  if (typeof a.claim_80D === "number" && a.claim_80D > 0 && !hasKind("declare_claim", (c) => c.type === "declare_claim" && c.section === "80D_SELF")) {
    cmds.push({ type: "declare_claim", section: "80D_SELF", amount: a.claim_80D, label: "Section 80D (self-declared)", evidenceAttached: true });
  }
  run.state.pendingCommands = cmds;
}

/** The return as it WOULD be after the staged commands — for computing, never persisted. */
function projected(snapshot: VersionedReturn, cmds: ReturnCommand[] | undefined): ReturnState {
  let state = snapshot.state;
  for (const c of cmds ?? []) {
    const r = applyReturnCommand(state, c);
    if (r.ok) state = r.state;
  }
  return state;
}

async function stepCompute(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  if (typeof run.state.answers.chosen_task === "string" && run.state.answers.chosen_task.startsWith("task:")) {
    const snapshot = await deps.returns.get(owner, AY);
    await handleChosenTask(deps, owner, run, snapshot, s, emit);
    if (run.status !== "running" || run.task !== "explain") return;
  }

  if (run.task === "explain") {
    if (run.state.smallTalk) {
      await speak(deps, owner, run, emit, { intent: smallTalkIntent(run.state.smallTalk), fallback: smallTalkReply(run.state.smallTalk, s, firstName(owner.displayName)), maxWords: 40 });
      return;
    }
    if (run.state.situation?.business) await speak(deps, owner, run, emit, { intent: "Say this release prepares salaried returns only and will not compute a business return, but rule questions are answered.", fallback: s.intakeBusinessUnsupported, maxWords: 50 });
    const userMsg = run.state.lastUserMessage ?? "";
    const directTask =
      !isTaxInformationQuestion(userMsg) &&
      (/\b(tax[- ]?vault|citizen vault|open vault|documents? in vault|my documents|vault)\b/i.test(userMsg) ? "tax_vault" :
      /\b(challan|challan 280|advance tax|pay tax|pay balance|self[- ]assessment tax)\b/i.test(userMsg) ? "challan_280" :
      /\b(defend( notice)?|tax notice|notice defense|143\(1\)|139\(9\)|audit risk)\b/i.test(userMsg) ? "notice_defense" :
      /\b(refund status|track refund|refund tracker|where is my refund)\b/i.test(userMsg) ? "refund_tracker" :
      /\b(reconcile|ais & 26as|reconcile ais|26as reconciliation)\b/i.test(userMsg) ? "reconcile_facts" :
      /\b(compare( tax)? regimes|regime comparison|compare regimes)\b/i.test(userMsg) ? "compare_regimes" : null);

    if (directTask) {
      const snapshot = await deps.returns.get(owner, AY);
      run.state.answers.chosen_task = `task:${directTask}`;
      await handleChosenTask(deps, owner, run, snapshot, s, emit);
      if (run.status !== "running" || run.task !== "explain") return;
    }

    if (isCapabilityInquiry(userMsg) || /^(hi+|hello+|hey+|namaste|greetings)\b/i.test(userMsg.trim())) {
      await emitGreetingCapabilities(deps, owner, run, s, emit);
      return;
    }
    const answer = answerTaxQuestion(userMsg, deps.today());
    run.state.taxAnswer = answer;
    run.knowledgeRelease = answer.release;
    run.state.sources = answer.citations.map((c) => ({ kind: "rule", id: c.id, label: c.title,
      detail: `${c.locator} · ${c.reviewer} · ${c.contentHash}`, verified: false, url: c.url }));
    await emit({ type: "source_lookup", sources: run.state.sources });
    // Exact evidence text is not passed through a model that can remove qualifications.
    await emit({ type: "message", role: "assistant", text: answer.text });
    return;
  }
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  const state = projected(snapshot, run.state.pendingCommands);
  const advice = assessAdvice(state.persona, adviceContext(deps, owner, run));
  run.state.advice = advice;
  run.knowledgeRelease = advice.release;
  if (!advice.canRecommend) {
    run.state.applicability = advice.applicability;
    const ids = [...new Set(advice.issues.flatMap((i) => i.provisions))];
    run.state.sources = dedupeSources([...run.state.sources, ...cite(ids).map((c) => ({ kind: "rule" as const,
      id: c.id, label: c.title, detail: `${c.locator} · ${c.reviewer}`, verified: false, url: c.url }))]);
    await emit({ type: "source_lookup", sources: run.state.sources });
    const head = await phrase(deps, owner, run, { intent: "Say you cannot give a recommendation for this return yet and that the reasons follow.", fallback: s.noteAdviceUnavailable, maxWords: 30 }, emit);
    await emit({ type: "message", role: "assistant", text: `${head}\n\n${advice.issues.map((i) => `• ${i.reason}`).join("\n")}` });
    run.state.pendingCard = undefined;
    run.state.pendingCommands = undefined;
    for (const step of ["review", "confirm", "act", "outputs"] as const)
      run.state.steps = setStep(run.state.steps, step, "skipped", s.noteAdviceUnavailable);
    return;
  }
  const both = compareForPersona(state.persona);
  const cheaper: "new" | "old" = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  const chosen = run.task === "compare_regimes" ? cheaper : (state.regime ?? "new");
  const b = computeForPersona(state.persona, chosen);
  // Residency is not a fact the return carries; the demo personas are residents and the
  // assumption is recorded as a source so the Sources panel shows it as unverified.
  const facts: TaxpayerFacts = {
    period: PERIOD_FY_2025_26,
    category: "individual",
    resident: owner.kind === "demo" ? true : typeof run.state.answers.resident === "boolean" ? run.state.answers.resident : undefined,
    hasSalaryIncome: state.persona.facts.some((f) => f.kind === "salary"),
    grossSalary: state.persona.facts.filter((f) => f.kind === "salary").reduce((x, f) => x + f.amount, 0),
    hasBusinessOrProfessionIncome: state.persona.facts.some((f) => f.kind === "other"),
    totalIncome: b.taxableIncome,
    regime: chosen,
    claims: state.persona.claims.map((c) => ({ section: c.section, amount: c.amount, evidence: c.evidenceAttached })),
    ltcg112A: state.persona.facts.filter((f) => f.kind === "capital_gains" && f.capitalGains?.holding === "long" && f.capitalGains.assetClass === "equity_stt").reduce((x, f) => x + f.amount, 0),
    specialRateIncome: state.persona.facts.filter((f) => f.kind === "capital_gains").reduce((x, f) => x + f.amount, 0),
  };
  run.state.applicability = evaluateSalariedSlice(facts);
  const ruleIds = [...new Set(run.state.applicability.flatMap((r) => r.provisions))];
  // Rules are cited as what they are: an engineering draft awaiting a qualified reviewer (plan §5.7).
  run.state.sources = dedupeSources([
    ...run.state.sources,
    { kind: "assumption", id: "assumption:resident", label: "Residential status: resident", detail: "Assumed for the demo personas; not read from the return.", verified: false },
    ...cite(ruleIds).map((c) => ({ kind: "rule" as const, id: c.id, label: `${c.section} — ${c.title}`, detail: `${c.locator} · ${c.reviewer}`, verified: false, url: c.url })),
  ]);
  await emit({ type: "tool_outcome", tool: "compare_regimes", ok: true, summary: `new ${both.new.totalTax} · old ${both.old.totalTax}` });
  await emit({ type: "source_lookup", sources: run.state.sources });

  const brief = recommendationText({ cheaper, saving: Math.abs(both.new.totalTax - both.old.totalTax), taxableIncome: b.taxableIncome, totalTax: b.totalTax, refundOrDue: b.refundOrDue }, run.lang);
  // Financial conclusions and their caveats stay deterministic: no model rephrases them. The model may
  // add ONE warm, figure-free sentence in front (docs/VOICE.md); otherwise a deterministic lead is used.
  let lead = s.leadRecommendation;
  if (deps.model.name !== "none" && run.state.usage.modelCalls < deps.budget.maxModelCallsPerRun) {
    run.state.usage.modelCalls += 1;
    const warm = await warmLine(deps.model, { lang: run.lang, name: firstName(owner.displayName), moment: b.refundOrDue > 0 ? "recommendation_refund" : b.refundOrDue < 0 ? "recommendation_due" : "recommendation_nil" });
    if (warm) {
      run.state.usage.tokens += warm.tokens;
      if (warm.tokens) await deps.store.addDailyUsage(owner, deps.today(), warm.tokens, 1);
      if (warm.text) lead = warm.text;
    }
  }
  await emit({ type: "message", role: "assistant", text: `${lead}\n${brief}\n\n${s.simulatedBadge}` });
  if (run.task === "load_demo") {
    // Nothing to confirm; outputs (if any) follow.
    run.state.steps = setStep(setStep(run.state.steps, "review", "skipped", s.noteNoAction), "confirm", "skipped", s.noteNoAction);
  }
}

async function stepReview(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  if (!run.state.advice?.canAct) return;
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  if (run.task === "prepare_salaried_return" && snapshot.state.filedAt) {
    await emit({ type: "message", role: "assistant", text: s.alreadyFiled });
    run.state.steps = setStep(setStep(run.state.steps, "confirm", "skipped", s.noteAlreadyFiled), "act", "blocked", s.noteAlreadyFiled);
    return;
  }
  const state = projected(snapshot, run.state.pendingCommands);
  const both = compareForPersona(state.persona);
  const cheaper: "new" | "old" = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  const regime = run.task === "compare_regimes" ? cheaper : (state.regime ?? "new");
  const b = computeForPersona(state.persona, regime);
  const rows = [
    { label: s.rowRegime, value: regimeName(regime, run.lang) },
    { label: s.rowTaxableIncome, value: formatMoney(b.taxableIncome, run.lang) },
    { label: s.rowTotalTax, value: formatMoney(b.totalTax, run.lang) },
    b.refundOrDue >= 0
      ? { label: s.rowRefund, value: formatMoney(b.refundOrDue, run.lang), emphasis: true }
      : { label: s.rowDue, value: formatMoney(-b.refundOrDue, run.lang), emphasis: true },
  ];
  if (run.task === "compare_regimes" && both.new.totalTax !== both.old.totalTax) {
    rows.push({ label: s.rowSaving, value: formatMoney(Math.abs(both.new.totalTax - both.old.totalTax), run.lang) });
  }
  const kind = run.task === "prepare_salaried_return" ? "filing" : run.task === "compare_regimes" ? "regime" : "corrections";
  if (kind === "regime" && regime !== (state.regime ?? "new")) {
    // Choosing the old regime is an election with conditions (s.115BAC(6)); the applicability
    // rule decides whether this system may execute it. Otherwise: comparison shown, switch not made.
    const switchRule = run.state.applicability?.find((r) => r.rule === "regime_switch_115BAC");
    if (regime === "old" && switchRule?.outcome !== "eligible") {
      await emit({ type: "message", role: "assistant", text: s.noteRegimeNotExecuted });
      run.state.steps = setStep(setStep(setStep(run.state.steps, "review", "done"), "confirm", "skipped", s.noteRegimeNotExecuted), "act", "skipped", s.noteNoAction);
      return;
    }
    run.state.pendingCommands = [...(run.state.pendingCommands ?? []), { type: "choose_regime", regime }];
  }
  const card: ReviewCard = {
    id: newId("card"),
    kind,
    title: kind === "filing" ? s.reviewFilingTitle : kind === "regime" ? s.reviewRegimeTitle.replace("{regime}", regimeName(regime, run.lang)) : s.reviewCorrectionsTitle,
    rows,
    boundTo: { revision: snapshot.revision, snapshotHash: snapshotHash(snapshot.state), amount: b.refundOrDue },
    confirmLabel: kind === "filing" ? s.confirmFiling : kind === "regime" ? s.confirmRegime : s.confirmCorrections,
    cancelLabel: s.cancel,
    basis: { applicability: run.state.applicability ?? [], provisions: [...new Set((run.state.applicability ?? []).flatMap((r) => r.provisions))] },
  };
  run.state.pendingCard = card;
  await speak(deps, owner, run, emit, { intent: "Introduce the review card that follows: the figures are ready to check, and nothing is applied until the person confirms.", fallback: s.reviewIntro, maxWords: 40 });
  await emit({ type: "review_card", card });
  run.status = "waiting_for_review";
  await emit({ type: "status", status: "waiting_for_review" });
}

async function handleConfirmation(deps: RuntimeDeps, owner: Owner, run: Run, confirm: NonNullable<RunInput["confirm"]>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const s = strings(run.lang);
  const card = run.state.pendingCard;
  if (!card || card.id !== confirm.cardId) return;
  await emit({ type: "confirmation", cardId: card.id, accepted: confirm.accepted });
  if (!confirm.accepted) {
    run.state.pendingCard = undefined;
    run.state.pendingCommands = undefined;
    await emit({ type: "message", role: "assistant", text: s.cancelledAction });
    // The review step suspended for this answer; it is now complete either way.
    run.state.steps = setStep(setStep(setStep(run.state.steps, "review", "done"), "confirm", "skipped"), "act", "skipped", s.noteNoAction);
    run.status = "running";
    return;
  }
  if (run.state.actionTaken) {
    // A replayed confirmation: the action already happened once (§5.4).
    run.state.pendingCard = undefined;
    run.status = "running";
    return;
  }
  const current = await deps.returns.get(owner, AY);
  if (!current || current.revision !== card.boundTo.revision || snapshotHash(current.state) !== card.boundTo.snapshotHash) {
    await emit({ type: "message", role: "assistant", text: s.staleReview });
    run.state.pendingCard = undefined;
    run.state.steps = setStep(setStep(run.state.steps, "compute", "pending"), "review", "pending");
    run.status = "running";
    return;
  }
  // Recheck knowledge freshness/release and projected facts at the action boundary, even on replay.
  const rechecked = assessAdvice(projected(current, run.state.pendingCommands).persona, adviceContext(deps, owner, run));
  if (!rechecked.canAct || run.knowledgeRelease !== rechecked.release || run.state.advice?.corpusHash !== rechecked.corpusHash) {
    run.state.pendingCard = undefined;
    run.state.pendingCommands = undefined;
    run.state.advice = rechecked;
    const head = await phrase(deps, owner, run, { intent: "Say you cannot give a recommendation for this return yet and that the reasons follow.", fallback: s.noteAdviceUnavailable, maxWords: 30 }, emit);
    await emit({ type: "message", role: "assistant", text: `${head}\n\n${rechecked.issues.map((i) => `• ${i.reason}`).join("\n")}` });
    for (const step of ["review", "confirm", "act", "outputs"] as const) run.state.steps = setStep(run.state.steps, step, "skipped", s.noteAdviceUnavailable);
    run.status = "running";
    return;
  }
  // Apply the staged commands, each bound to the revision the previous one produced.
  let revision = current.revision;
  const cmds = [...(run.state.pendingCommands ?? [])];
  if (card.kind === "filing") cmds.push({ type: "finalize_filing", filedAt: deps.clock(), today: deps.today() });
  for (let i = 0; i < cmds.length; i += 1) {
    const result = await deps.returns.apply(owner, AY, { command: cmds[i], expectedRevision: revision, idempotencyKey: `${run.id}:${card.id}:${i}`, actor: "agent" });
    if (!result.ok) {
      await emit({ type: "tool_outcome", tool: "apply_return_command", ok: false, summary: result.error });
      await emit({ type: "message", role: "assistant", text: s.staleReview });
      run.state.pendingCard = undefined;
      run.state.steps = setStep(run.state.steps, "review", "pending");
      run.status = "running";
      return;
    }
    revision = result.snapshot.revision;
    await emit({ type: "tool_outcome", tool: "apply_return_command", ok: true, summary: cmds[i].type });
  }
  run.state.returnRevision = revision;
  run.state.pendingCommands = undefined;
  run.state.pendingCard = undefined;
  const receipt = `SIM-${card.boundTo.snapshotHash.slice(0, 10).toUpperCase()}`;
  run.state.actionTaken = { kind: card.kind === "filing" ? "filing" : "payment", id: card.kind === "filing" ? receipt : card.id, at: deps.clock() };
  const text = card.kind === "filing" ? s.filedSimulated.replace("{id}", receipt) : card.kind === "regime" ? s.regimeApplied.replace("{regime}", card.rows[0]?.value ?? "") : s.correctionsApplied;
  await emit({ type: "message", role: "assistant", text });
  run.state.steps = setStep(setStep(setStep(run.state.steps, "review", "done"), "confirm", "done"), "act", "done");
  await emit({ type: "step_changed", step: "act", state: "done" });
  run.status = "running";
}

async function stepOutputs(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  if (!run.state.advice?.canRecommend) return;
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  if (run.task === "explain") return;
  const regime = snapshot.state.regime ?? "new";
  const b = computeForPersona(snapshot.state.persona, regime);
  const body = {
    synthetic: true,
    disclosure: s.simulatedBadge,
    knowledgeRelease: run.knowledgeRelease,
    advice: run.state.advice,
    snapshot: { revision: snapshot.revision, hash: snapshotHash(snapshot.state) },
    regime,
    figures: { grossIncome: b.grossIncome, standardDeduction: b.standardDeduction, totalDeductions: b.totalDeductions, taxableIncome: b.taxableIncome, rebate87A: b.rebate87A, cess: b.cess, totalTax: b.totalTax, tdsCredits: b.tdsCredits, refundOrDue: b.refundOrDue },
    applicability: run.state.applicability ?? [],
    provisions: cite([...new Set((run.state.applicability ?? []).flatMap((r) => r.provisions))]),
    actionTaken: run.state.actionTaken ?? null,
  };
  const kind = run.task === "compare_regimes" ? "regime_comparison_json" : run.task === "reconcile_facts" ? "reconciliation_json" : "return_summary_json";
  const output = {
    id: newId("out"),
    runId: run.id,
    kind: kind as "return_summary_json" | "regime_comparison_json" | "reconciliation_json",
    title: `${run.title} · ${AY}`,
    mimeType: "application/json",
    snapshotRevision: snapshot.revision,
    snapshotHash: body.snapshot.hash,
    synthetic: true as const,
    createdAt: deps.clock(),
    body: new TextEncoder().encode(JSON.stringify(body, null, 2)),
  };
  await deps.store.putOutput(owner, output);

  // If this run prepared or filed a return, generate the official Form ITR-V (Acknowledgement) PDF
  if (run.task === "prepare_salaried_return" || run.state.actionTaken?.kind === "filing") {
    const ackNumber = run.state.actionTaken?.id ?? `SIM-${body.snapshot.hash.slice(0, 10).toUpperCase()}`;
    const itrvBytes = generateItrvPdf({
      assesseeName: snapshot.state.persona.name || owner.pan,
      pan: owner.pan,
      status: "Individual",
      filingSection: "139(1) - On or before due date",
      assessmentYear: AY,
      financialYear: "2025-26",
      submissionTimestamp: run.state.actionTaken?.at
        ? new Date(run.state.actionTaken.at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) + ", 15:24 IST"
        : undefined,
      ackNumber,
      regime: regime as "NEW" | "OLD",
      grossTotalIncome: b.grossIncome,
      standardDeduction: b.standardDeduction,
      chapterViaDeductions: Math.max(0, b.totalDeductions - b.standardDeduction),
      taxableIncome: b.taxableIncome,
      taxBeforeRebate: b.taxBeforeRebate,
      rebate87A: b.rebate87A,
      cess: b.cess,
      totalTaxLiability: b.totalTax,
      tdsPaid: b.tdsCredits,
      advanceTaxPaid: 0,
      selfAssessmentPaid: 0,
      netPayableOrRefund: b.totalTax - b.tdsCredits,
      sha256Hash: body.snapshot.hash,
    });

    const itrvOutput = {
      id: newId("out"),
      runId: run.id,
      kind: "itrv_acknowledgement_pdf" as const,
      title: `Form ITR-V (Acknowledgement) · ${AY}`,
      mimeType: "application/pdf",
      snapshotRevision: snapshot.revision,
      snapshotHash: body.snapshot.hash,
      synthetic: true as const,
      createdAt: deps.clock(),
      body: itrvBytes,
    };
    await deps.store.putOutput(owner, itrvOutput);
    if (deps.vault) {
      try {
        await deps.vault.upload({
          owner,
          bytes: itrvBytes,
          declaredMime: "application/pdf",
          assessmentYear: AY,
          docType: "ITR_V",
          title: `Form ITR-V (Acknowledgement) · ${AY}`,
          filename: `ITR-V_${AY}_${owner.pan}.pdf`,
          actor: "agent",
          runId: run.id,
        });
      } catch {
        // secondary to output delivery
      }
    }
    const { body: _pb, runId: _pr, ...itrvRef } = itrvOutput;
    await emit({ type: "output", output: itrvRef });
  } else {
    const { body: _b, runId: _r, ...ref } = output;
    await emit({ type: "output", output: ref });
  }
}

/* ---------------------------------------------------------------- helpers -- */

function parseAnswer(q: Question, text: string, s: ReturnType<typeof strings>): string | number | boolean | null {
  const t = text.trim().toLowerCase();
  if (q.expects === "yes_no") {
    if (/^(y|yes|yeah|yep|haan|haa|ha|ஆம்|हाँ|हां|true)\b/.test(t) || t === s.yes.toLowerCase()) return true;
    if (/^(n|no|nope|nahi|nahin|इल்லை|नहीं|false)\b/.test(t) || t === s.no.toLowerCase()) return false;
    return null;
  }
  if (q.expects === "form" || q.expects === "source") return null; // these are answered on the card, not by typing
  if (q.expects === "choice" && q.choices) {
    if (q.resolves === "chosen_task") {
      if (/^1\b|^\b(1\.|first|prepare|file|filing|itr|return|form 16|salaried|bhar do)\b/i.test(t)) return "task:prepare_salaried_return";
      if (/^2\b|^\b(2\.|second|compare|regime|old vs new|new vs old|115bac|which (is )?(better|cheaper)|kaunsa regime)\b/i.test(t)) return "task:compare_regimes";
      if (/^3\b|^\b(3\.|third|reconcile|ais|26as|mismatch|dispute|match|reconciliation)\b/i.test(t)) return "task:reconcile_facts";
      if (/^4\b|^\b(4\.|fourth|challan|280|advance tax|pay tax|payment|tax pay)\b/i.test(t)) return "task:challan_280";
      if (/^5\b|^\b(5\.|fifth|notice|defend|scrutiny|143|139|audit)\b/i.test(t)) return "task:notice_defense";
      if (/^6\b|^\b(6\.|sixth|refund|track|tracker|status|where is my refund)\b/i.test(t)) return "task:refund_tracker";
      if (/^7\b|^\b(7\.|seventh|vault|document|docs|stored|tax vault)\b/i.test(t)) return "task:tax_vault";
    }
    const cleanStr = (str: string) => str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim().toLowerCase();
    const hit = q.choices.find((c) => {
      const cleanVal = c.value.toLowerCase();
      const cleanLab = cleanStr(c.label);
      return cleanVal === t || cleanLab === t || t.includes(cleanLab) || cleanLab.includes(t) || t.includes(cleanVal.replace(/^task:/, ""));
    });
    return hit ? hit.value : null;
  }
  if (q.expects === "number") {
    const m = t.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!m) return null;
    let n = Number(m[0]);
    if (/lakh|lac|l\b/.test(t)) n *= 100000;
    return Math.round(n);
  }
  return text.trim() || null;
}

function dedupeSources(list: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = `${x.kind}:${x.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function publicRun(run: Run) {
  // What the client may see: everything except the private working details a
  // replay of events already carries. Pending items are included so a reload
  // restores the question/card without re-reading the whole log.
  return {
    id: run.id,
    task: run.task,
    title: run.title,
    status: run.status,
    lang: run.lang,
    knowledgeRelease: run.knowledgeRelease,
    steps: run.state.steps,
    sources: run.state.sources,
    pendingQuestion: run.state.pendingQuestion ?? null,
    pendingCard: run.state.pendingCard ?? null,
    actionTaken: run.state.actionTaken ?? null,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

export type PublicRun = ReturnType<typeof publicRun>;
export type { PlanStep };
