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
import { evaluateSalariedSlice } from "../knowledge/applicability";
import { cite } from "../knowledge/retrieval";
import { answerTaxQuestion } from "../knowledge/rag";
import { assessAdvice } from "../knowledge/advice";
import type { TaxpayerFacts } from "../knowledge/types";
import { CURRENT_VERSION } from "../return/persist";
import { applyReturnCommand, type ReturnCommand } from "../return/commands";
import { compareForPersona, computeForPersona } from "../return/compute";
import type { ReturnSnapshotStore, VersionedReturn } from "../return/snapshot-store";
import type { ReturnState } from "../return/state";
import type { Owner } from "../server/session";
import type { Lang, Persona } from "../types";
import { formatMoney } from "../money";
import type { VaultService } from "../vault/service";
import { KNOWLEDGE_RELEASE } from "./flags";
import { hasIntakeSignal, intakeAcknowledgement, isDocumentAnswer, nextIntakeQuestion, parseSituation } from "./intake";
import type { ModelAdapter } from "./model";
import { detectSmallTalk, firstName, questionLead, smallTalkReply, warmLine } from "./voice";
import { buildPlan, classifyByRules, isTaxInformationQuestion, nextStep, setStep, taskTitle, type PlanningFacts } from "./planner";
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
const MAX_STEPS_PER_CALL = 8;

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
    openQuestions: 0,
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
        if (parsed !== null) input.answer = { questionId: run.state.pendingQuestion.id, value: parsed };
      } else if (run.status === "completed" || run.status === "waiting_for_review") {
        // A fresh request on a finished (or reviewing) run starts the plan over for the new intent.
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
      run.state.answers[run.state.pendingQuestion.resolves] = input.answer.value;
      await emit({ type: "answer", questionId: input.answer.questionId, value: input.answer.value });
      run.state.sources.push({ kind: "answer", id: input.answer.questionId, label: run.state.pendingQuestion.text, detail: String(input.answer.value), verified: false });
      run.state.pendingQuestion = undefined;
      run.status = "running";
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

async function stepClassify(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const text = run.state.lastUserMessage ?? "";
  // Small talk is answered like a friend would, without touching the return or calling the model (docs/VOICE.md).
  const talk = text ? detectSmallTalk(text) : null;
  if (talk) {
    // Reply now and finish: no plan walk, no return read — a greeting should cost one round-trip, not twenty.
    run.state.smallTalk = talk;
    run.task = "explain";
    run.state.steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps).map((p) => ({ ...p, state: "done" as const }));
    await emit({ type: "message", role: "assistant", text: smallTalkReply(talk, s, firstName(owner.displayName)) });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
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
  // Say what was understood before asking anything (§5.8: the citizen should never wonder what the agent is doing).
  if (run.state.situation && hasIntakeSignal(run.state.situation) && task !== "explain") {
    await emit({ type: "message", role: "assistant", text: intakeAcknowledgement(run.state.situation, s, run.lang) });
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
        if (d.docType === "FORM_16" && d.hasOriginal) await stageForm16(deps, run, ctx, snapshot, d.id, s, emit);
      }
    }
    run.state.documentTypes = r.documents.map((d) => d.docType);
  }
  run.state.sources = dedupeSources([...run.state.sources, ...sources]);
  await emit({ type: "source_lookup", sources: run.state.sources });
  run.state.steps = buildPlan(planningFacts(run.task, snapshot, documentsAvailable), s, run.state.steps);
}

/** Read a stored Form 16 and stage an import when its figures differ from the employer's prefill. */
async function stageForm16(deps: RuntimeDeps, run: Run, ctx: ToolContext, snapshot: VersionedReturn, documentId: string, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const read = await runTool("read_document_fields", { documentId }, ctx);
  run.state.usage.toolCalls += 1;
  if (!read.ok) return;
  const rr = read.result as { readable?: boolean; fields?: { grossSalary?: number; tds?: number }; issues?: string[]; subjectMatchesOwner?: boolean };
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
}

/** A document the citizen just uploaded in answer to a question: record it as a source, read it if it is a Form 16. */
async function recordUploadedDocument(deps: RuntimeDeps, owner: Owner, run: Run, snapshot: VersionedReturn, documentId: string, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  if (!deps.vault) return false;
  const meta = await deps.vault.getMeta(owner, documentId, "agent", run.id);
  if (!meta) return false;
  run.state.sources = dedupeSources([
    ...run.state.sources,
    { kind: "document", id: meta.id, label: meta.title, detail: meta.provenance, verified: meta.provenance === "uploaded" && meta.hasBytes, url: meta.hasBytes ? `/api/vault/documents/${meta.id}/bytes` : undefined },
  ]);
  run.state.documentTypes = [...new Set([...(run.state.documentTypes ?? []), meta.docType])];
  if (meta.docType === "FORM_16" && meta.hasBytes) {
    const ctx: ToolContext = { owner, runId: run.id, assessmentYear: AY, vault: deps.vault, returns: deps.returns, store: deps.store, today: deps.today() };
    await stageForm16(deps, run, ctx, snapshot, meta.id, s, emit);
  }
  await emit({ type: "source_lookup", sources: run.state.sources });
  await emit({ type: "message", role: "assistant", text: s.intakeDocumentRecorded });
  return true;
}

/** The one question at a time that resolves the most consequential unknown (§5.1). */
function nextQuestion(run: Run, snapshot: VersionedReturn, s: ReturnType<typeof strings>, vaultAvailable: boolean): Question | null {
  const p = snapshot.state.persona;
  const a = run.state.answers;
  // The situation the citizen described drives the first questions; the generic ones follow.
  if (run.state.situation && (run.task === "prepare_salaried_return" || run.task === "compare_regimes")) {
    const q = nextIntakeQuestion({ situation: run.state.situation, snapshot, answers: a, vaultAvailable, documentTypes: run.state.documentTypes ?? [], s, lang: run.lang });
    if (q) return q;
  }
  if (run.task === "prepare_salaried_return" || run.task === "reconcile_facts") {
    if (a.other_income === undefined) {
      return { id: newId("q"), text: s.askOtherIncome, why: s.askOtherIncomeWhy, expects: "yes_no", resolves: "other_income", choices: [{ value: "yes", label: s.yes }, { value: "no", label: s.no }] };
    }
    if (a.other_income === true && a.other_income_amount === undefined) {
      return { id: newId("q"), text: `${s.askOtherIncome} — ${s.rowTaxableIncome}?`.replace(` — ${s.rowTaxableIncome}?`, ""), why: s.askOtherIncomeWhy, expects: "number", resolves: "other_income_amount" };
    }
  }
  if (run.task === "prepare_salaried_return" || run.task === "compare_regimes") {
    const has80C = p.claims.some((c) => c.section === "80C");
    const has80D = p.claims.some((c) => c.section.startsWith("80D"));
    // The intake's PF / health-insurance questions cover the same ground in plain words; do not ask twice.
    if (!has80C && a.claim_80C === undefined && a.pf === undefined) return { id: newId("q"), text: s.ask80C, why: s.ask80CWhy, expects: "number", resolves: "claim_80C" };
    if (!has80D && a.claim_80D === undefined && a.health === undefined) return { id: newId("q"), text: s.ask80D, why: s.ask80DWhy, expects: "number", resolves: "claim_80D" };
  }
  return null;
}

async function stepResolve(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  // A business situation is outside this release: said once, plainly, and the run ends without figures.
  if (run.state.situation?.business && run.task !== "explain") {
    for (const step of ["compute", "review", "confirm", "act", "outputs"] as const) run.state.steps = setStep(run.state.steps, step, "skipped", s.intakeBusinessUnsupported);
    return;
  }
  // A document uploaded in answer to the previous question is recorded before the next question is chosen.
  const a = run.state.answers;
  for (const key of ["form16", "pf_proof", "health_proof"] as const) {
    const v = a[key];
    if (isDocumentAnswer(v) && !run.state.sources.some((src) => src.kind === "document" && src.id === v)) {
      const ok = await recordUploadedDocument(deps, owner, run, snapshot, v, s, emit);
      if (!ok) a[key] = "none";
    }
  }
  const q = nextQuestion(run, snapshot, s, !!deps.vault);
  if (q) {
    q.lead = questionLead(Object.keys(a).length, s, q.expects === "file" ? "file" : "question");
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
  if (a.other_income === true && typeof a.other_income_amount === "number" && a.other_income_amount > 0 && !hasKind("declare_income", () => true)) {
    cmds.push({ type: "declare_income", kind: "other", amount: a.other_income_amount, label: "Other income (self-declared)", today: deps.today() });
  }
  // Deductions from the intake count only with a record behind them; otherwise they are left out and said so.
  const stageClaim = async (section: "80C" | "80D_SELF", amount: unknown, proof: unknown, label: string, plain: string) => {
    if (typeof amount !== "number" || amount <= 0 || hasKind("declare_claim", (c) => c.type === "declare_claim" && c.section === section)) return;
    if (isDocumentAnswer(proof)) cmds.push({ type: "declare_claim", section, amount, label, evidenceAttached: true });
    else await emit({ type: "message", role: "assistant", text: s.intakeClaimSkipped.replace("{section}", plain) });
  };
  await stageClaim("80C", a.pf_amount, a.pf_proof, "Provident Fund (section 80C)", "PF");
  await stageClaim("80D_SELF", a.health_amount, a.health_proof, "Health insurance (section 80D)", "80D");
  if (typeof a.claim_80C === "number" && a.claim_80C > 0 && !hasKind("declare_claim", (c) => c.type === "declare_claim" && c.section === "80C")) {
    cmds.push({ type: "declare_claim", section: "80C", amount: a.claim_80C, label: "Section 80C (self-declared)", evidenceAttached: false });
  }
  if (typeof a.claim_80D === "number" && a.claim_80D > 0 && !hasKind("declare_claim", (c) => c.type === "declare_claim" && c.section === "80D_SELF")) {
    cmds.push({ type: "declare_claim", section: "80D_SELF", amount: a.claim_80D, label: "Section 80D (self-declared)", evidenceAttached: false });
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
  if (run.task === "explain") {
    if (run.state.smallTalk) {
      await emit({ type: "message", role: "assistant", text: smallTalkReply(run.state.smallTalk, s, firstName(owner.displayName)) });
      return;
    }
    if (run.state.situation?.business) await emit({ type: "message", role: "assistant", text: s.intakeBusinessUnsupported });
    const answer = answerTaxQuestion(run.state.lastUserMessage ?? "", deps.today());
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
  const advice = assessAdvice(state.persona, { ownerKind: owner.kind, today: deps.today(),
    resident: typeof run.state.answers.resident === "boolean" ? run.state.answers.resident : undefined,
    returnByDueDate: typeof run.state.answers.return_by_due_date === "boolean" ? run.state.answers.return_by_due_date : undefined });
  run.state.advice = advice;
  run.knowledgeRelease = advice.release;
  if (!advice.canRecommend) {
    run.state.applicability = advice.applicability;
    const ids = [...new Set(advice.issues.flatMap((i) => i.provisions))];
    run.state.sources = dedupeSources([...run.state.sources, ...cite(ids).map((c) => ({ kind: "rule" as const,
      id: c.id, label: c.title, detail: `${c.locator} · ${c.reviewer}`, verified: false, url: c.url }))]);
    await emit({ type: "source_lookup", sources: run.state.sources });
    await emit({ type: "message", role: "assistant", text: `${s.noteAdviceUnavailable}\n\n${advice.issues.map((i) => `• ${i.reason}`).join("\n")}` });
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
  await emit({ type: "message", role: "assistant", text: s.reviewIntro });
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
  const rechecked = assessAdvice(projected(current, run.state.pendingCommands).persona,
    { ownerKind: owner.kind, today: deps.today(),
      resident: typeof run.state.answers.resident === "boolean" ? run.state.answers.resident : undefined,
      returnByDueDate: typeof run.state.answers.return_by_due_date === "boolean" ? run.state.answers.return_by_due_date : undefined });
  if (!rechecked.canAct || run.knowledgeRelease !== rechecked.release || run.state.advice?.corpusHash !== rechecked.corpusHash) {
    run.state.pendingCard = undefined;
    run.state.pendingCommands = undefined;
    run.state.advice = rechecked;
    await emit({ type: "message", role: "assistant", text: `${s.noteAdviceUnavailable}\n\n${rechecked.issues.map((i) => `• ${i.reason}`).join("\n")}` });
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
  const { body: _b, runId: _r, ...ref } = output;
  await emit({ type: "output", output: ref });
}

/* ---------------------------------------------------------------- helpers -- */

function parseAnswer(q: Question, text: string, s: ReturnType<typeof strings>): string | number | boolean | null {
  const t = text.trim().toLowerCase();
  if (q.expects === "yes_no") {
    if (/^(y|yes|yeah|yep|haan|haa|ha|ஆம்|हाँ|हां|true)\b/.test(t) || t === s.yes.toLowerCase()) return true;
    if (/^(n|no|nope|nahi|nahin|इल்லை|नहीं|false)\b/.test(t) || t === s.no.toLowerCase()) return false;
    return null;
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
