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
import type { ModelAdapter } from "./model";
import { buildPlan, classifyByRules, nextStep, setStep, taskTitle, type PlanningFacts } from "./planner";
import { redactText, stripInjection } from "./redact";
import { recommendationText, regimeName, say, strings } from "./response";
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

export async function advance(deps: RuntimeDeps, owner: Owner, runId: string, input: RunInput = {}): Promise<Run | null> {
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
    if (run.status !== "running") {
      await persist();
      return run;
    }

    // --- the bounded step loop ---------------------------------------------
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
      run.state.steps = setStep(run.state.steps, step.id, "active");
      await emit({ type: "step_changed", step: step.id, state: "active" });
      run.state.usage.toolCalls += 1;

      switch (step.id) {
        case "classify":
          await stepClassify(deps, owner, run, s);
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
      await emit({ type: "plan_updated", steps: run.state.steps });
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

async function stepClassify(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>) {
  const text = run.state.lastUserMessage ?? "";
  let task = classifyByRules(text);
  if (text && deps.model.name !== "none") {
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
  const snapshot = await ensureSnapshot(deps, owner, run);
  if (!snapshot) {
    await emit({ type: "message", role: "assistant", text: s.errorGeneric });
    run.status = "failed";
    return;
  }
  run.state.returnRevision = snapshot.revision;
  const sources: SourceRef[] = [];
  const ctx: ToolContext = { owner, runId: run.id, assessmentYear: AY, vault: deps.vault, returns: deps.returns, store: deps.store };

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
        if (d.docType === "FORM_16" && d.hasOriginal) {
          const read = await runTool("read_document_fields", { documentId: d.id }, ctx);
          run.state.usage.toolCalls += 1;
          if (read.ok) {
            const rr = read.result as { readable?: boolean; fields?: { grossSalary?: number; tds?: number }; issues?: string[]; subjectMatchesOwner?: boolean };
            const suspicious = (rr.issues ?? []).some((i) => stripInjection(i).suspicious);
            if (suspicious) await emit({ type: "message", role: "assistant", text: s.injectionNotice });
            if (rr.readable && rr.fields && rr.subjectMatchesOwner !== false) {
              const salary = snapshot.state.baselinePersona.facts.find((f) => f.kind === "salary")?.amount;
              const tds = snapshot.state.baselinePersona.taxPaid.find((t) => t.section.includes("192"))?.amount;
              if ((rr.fields.grossSalary !== undefined && rr.fields.grossSalary !== salary) || (rr.fields.tds !== undefined && rr.fields.tds !== tds)) {
                run.state.pendingCommands = [
                  ...(run.state.pendingCommands ?? []),
                  { type: "import_document", today: deps.today(), document: { fileName: "document.pdf", kind: "FORM_16", ingestedAt: deps.clock(), extracted: { grossSalary: rr.fields.grossSalary, tds: rr.fields.tds } } },
                ];
              }
            }
            await emit({ type: "tool_outcome", tool: "read_document_fields", ok: true, summary: rr.readable ? "fields read" : "not readable" });
          }
        }
      }
    }
  }
  run.state.sources = dedupeSources([...run.state.sources, ...sources]);
  await emit({ type: "source_lookup", sources: run.state.sources });
  run.state.steps = buildPlan(planningFacts(run.task, snapshot, documentsAvailable), s, run.state.steps);
}

/** The one question at a time that resolves the most consequential unknown (§5.1). */
function nextQuestion(run: Run, snapshot: VersionedReturn, s: ReturnType<typeof strings>): Question | null {
  const p = snapshot.state.persona;
  const a = run.state.answers;
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
    if (!has80C && a.claim_80C === undefined) return { id: newId("q"), text: s.ask80C, why: s.ask80CWhy, expects: "number", resolves: "claim_80C" };
    if (!has80D && a.claim_80D === undefined) return { id: newId("q"), text: s.ask80D, why: s.ask80DWhy, expects: "number", resolves: "claim_80D" };
  }
  return null;
}

async function stepResolve(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  const q = nextQuestion(run, snapshot, s);
  if (q) {
    run.state.pendingQuestion = q;
    await emit({ type: "question", question: q });
    run.status = "waiting_for_input";
    await emit({ type: "status", status: "waiting_for_input" });
    return;
  }
  // Answers become staged commands — reviewable, never applied here (§5.2).
  const cmds: ReturnCommand[] = run.state.pendingCommands ?? [];
  const a = run.state.answers;
  const hasKind = (t: ReturnCommand["type"], pred: (c: ReturnCommand) => boolean) => cmds.some((c) => c.type === t && pred(c));
  if (a.other_income === true && typeof a.other_income_amount === "number" && a.other_income_amount > 0 && !hasKind("declare_income", () => true)) {
    cmds.push({ type: "declare_income", kind: "other", amount: a.other_income_amount, label: "Other income (self-declared)", today: deps.today() });
  }
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
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  const state = projected(snapshot, run.state.pendingCommands);
  const both = compareForPersona(state.persona);
  const cheaper: "new" | "old" = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  const chosen = run.task === "compare_regimes" ? cheaper : (state.regime ?? "new");
  const b = computeForPersona(state.persona, chosen);
  const facts: TaxpayerFacts = {
    period: PERIOD_FY_2025_26,
    category: "individual",
    resident: true,
    hasSalaryIncome: state.persona.facts.some((f) => f.kind === "salary"),
    grossSalary: state.persona.facts.filter((f) => f.kind === "salary").reduce((x, f) => x + f.amount, 0),
    hasBusinessOrProfessionIncome: state.persona.facts.some((f) => f.kind === "other"),
    totalIncome: b.taxableIncome,
    regime: chosen,
    claims: state.persona.claims.map((c) => ({ section: c.section, amount: c.amount, evidence: c.evidenceAttached })),
    ltcg112A: state.persona.facts.filter((f) => f.kind === "capital_gains" && f.capitalGains?.holding === "long" && f.capitalGains.assetClass === "equity_stt").reduce((x, f) => x + f.amount, 0),
  };
  run.state.applicability = evaluateSalariedSlice(facts);
  const ruleIds = [...new Set(run.state.applicability.flatMap((r) => r.provisions))];
  run.state.sources = dedupeSources([
    ...run.state.sources,
    ...cite(ruleIds).map((c) => ({ kind: "rule" as const, id: c.id, label: `${c.section} — ${c.title}`, detail: c.locator, verified: true, url: c.url })),
  ]);
  await emit({ type: "tool_outcome", tool: "compare_regimes", ok: true, summary: `new ${both.new.totalTax} · old ${both.old.totalTax}` });
  await emit({ type: "source_lookup", sources: run.state.sources });

  const brief = recommendationText({ cheaper, saving: Math.abs(both.new.totalTax - both.old.totalTax), taxableIncome: b.taxableIncome, totalTax: b.totalTax, refundOrDue: b.refundOrDue }, run.lang);
  const shape = run.task === "explain" ? "explanation" : "recommendation";
  const spoken = await speak(deps, owner, run, brief, shape);
  await emit({ type: "message", role: "assistant", text: spoken });
  if (run.task === "explain" || run.task === "load_demo") {
    // Nothing to confirm; outputs (if any) follow.
    run.state.steps = setStep(setStep(run.state.steps, "review", "skipped", s.noteNoAction), "confirm", "skipped", s.noteNoAction);
  }
}

async function stepReview(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
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
    run.state.steps = setStep(setStep(run.state.steps, "confirm", "skipped"), "act", "skipped", s.noteNoAction);
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
    run.state.steps = setStep(run.state.steps, "review", "pending");
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
  run.state.steps = setStep(setStep(run.state.steps, "confirm", "done"), "act", "done");
  await emit({ type: "step_changed", step: "act", state: "done" });
  run.status = "running";
}

async function stepOutputs(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  if (run.task === "explain") return;
  const regime = snapshot.state.regime ?? "new";
  const b = computeForPersona(snapshot.state.persona, regime);
  const body = {
    synthetic: true,
    disclosure: s.simulatedBadge,
    knowledgeRelease: run.knowledgeRelease,
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

async function speak(deps: RuntimeDeps, owner: Owner, run: Run, brief: string, shape: "recommendation" | "explanation") {
  if (deps.model.name === "none" || run.state.usage.modelCalls >= deps.budget.maxModelCallsPerRun) return brief;
  run.state.usage.modelCalls += 1;
  const out = await say(deps.model, brief, shape, run.lang);
  run.state.usage.tokens += out.tokens;
  if (out.tokens) await deps.store.addDailyUsage(owner, deps.today(), out.tokens, 1);
  return out.text;
}

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
