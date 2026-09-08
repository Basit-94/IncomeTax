/**
 * The run harness (rebuilt 2026-09-07). The SERVER still owns every transition: inputs are recorded first,
 * the conversation then advances one turn (`brain.ts think`), and a checkpoint is persisted after each; a client
 * that disconnects loses nothing. What changed: there is no fixed step machine and no intent classifier any
 * more — Munshi ji decides what to do with tools, and this file only handles what must be exact:
 *
 *  - recording a message, an answer or a confirmation as events;
 *  - the consequences of an answer that carries an action (a consent → the pull or the read; the year's form →
 *    staged commands; a payment method → the simulated challan; an upload → the read);
 *  - applying staged commands ONLY on an accepted confirmation bound to the exact snapshot the card was built
 *    from — a stale card is dropped, a replayed confirmation does nothing (§5.4);
 *  - outputs after a filing.
 */

import { formatMoney } from "../money";
import type { Owner } from "../server/session";
import type { Lang } from "../types";
import { agenticStrings } from "../i18n/agenticStrings";
import { assessAdvice } from "../knowledge/advice";
import type { ProfileSeed } from "../onboarding";
import {
  AY, adviceContext, applyYearForm, ensureSnapshot, executePayment, freshSteps, hardIssues, markStep, produceOutputs, projected, type ActionCtx, type RuntimeDeps,
} from "./actions";
import { afterDigiLockerConsent, afterDocumentConsent, afterUpload, think } from "./brain";
import { recordAgentTelemetry } from "./telemetry";
import { KNOWLEDGE_RELEASE } from "./flags";
import { redactText } from "./redact";
import { detectRegister, detectReplyLanguage } from "./say";
import { newId, snapshotHash } from "./store";
import { personaForOwner } from "./tools";
import type { PlanStep, Question, Run, RunEventPayload, RunStatus, RunTask } from "./types";

export type { RuntimeDeps } from "./actions";

export interface RunInput {
  message?: string;
  answer?: { questionId: string; value: string | number | boolean };
  confirm?: { cardId: string; accepted: boolean };
}

/** The empty-state chips are opening sentences, not modes: the brain hears them like anything else typed. */
function taskOpening(task: RunTask, lang: Lang): string {
  const s = agenticStrings(lang);
  switch (task) {
    case "prepare_salaried_return": return s.taskPrepareReturn;
    case "compare_regimes": return s.taskCompareRegimes;
    case "reconcile_facts": return s.taskReconcile;
    case "load_demo": return s.taskLoadDemo;
    default: return s.taskExplain;
  }
}

/* ----------------------------------------------------------------- create -- */

export async function createRun(deps: RuntimeDeps, owner: Owner, opts: { message?: string; task?: RunTask; lang: Lang; profile?: ProfileSeed }): Promise<Run> {
  const s = agenticStrings(opts.lang);
  const task: RunTask = opts.task ?? "explain";
  const message = opts.message ?? (opts.task ? taskOpening(opts.task, opts.lang) : undefined);
  const clean = message ? redactText(message).text : undefined;
  const run: Run = {
    id: newId("run"),
    ownerPan: owner.pan,
    ownerKind: owner.kind,
    assessmentYear: AY,
    task,
    title: clean ? clean.slice(0, 80) : s.newChat,
    status: "running",
    lang: opts.lang,
    knowledgeRelease: KNOWLEDGE_RELEASE,
    state: {
      steps: freshSteps(s),
      answers: {},
      sources: [],
      usage: { toolCalls: 0, modelCalls: 0, tokens: 0 },
      lastUserMessage: clean,
      register: clean ? detectRegister(clean, opts.lang) : undefined,
      replyLanguage: clean ? detectReplyLanguage(clean) : opts.lang === "hi" ? "hi" : "en",
      transcript: clean ? [{ role: "user", text: clean }] : [],
      profile: opts.profile,
    },
    createdAt: deps.clock(),
    updatedAt: deps.clock(),
  };
  await deps.store.createRun(run, { type: "run_created", task, title: run.title });
  if (clean) await deps.store.appendEvent(owner, run.id, { type: "message", role: "user", text: clean });
  await deps.store.appendEvent(owner, run.id, { type: "plan_updated", steps: run.state.steps });
  return run;
}

/* ---------------------------------------------------------------- advance -- */

/**
 * `mode` lets a route answer the browser quickly: "input_only" records the message / answer / confirmation
 * and returns; the route then runs "steps_only" after the response has been sent, while the client streams
 * events. "full" (tests, in-process callers) does both in one call.
 */
export type AdvanceMode = "full" | "input_only" | "steps_only";

export async function advance(deps: RuntimeDeps, owner: Owner, runId: string, input: RunInput = {}, mode: AdvanceMode = "full"): Promise<Run | null> {
  const run = await deps.store.getRun(owner, runId);
  if (!run) return null;
  if (run.status === "cancelled" || run.status === "failed" || (run.status === "completed" && !input.message && mode !== "steps_only")) return run;
  const s = agenticStrings(run.lang);
  const emit = (payload: RunEventPayload) => deps.store.appendEvent(owner, run.id, payload);
  const ctx: ActionCtx = { deps, owner, run, s, emit };
  const persist = () => {
    recordAgentTelemetry(run);
    return deps.store.saveRun(run);
  };
  const planBefore = JSON.stringify(run.state.steps);
  const notes: string[] = [];

  try {
    // --- inputs first -------------------------------------------------------
    if (input.message) {
      const clean = redactText(input.message).text;
      await emit({ type: "message", role: "user", text: clean });
      run.state.lastUserMessage = clean;
      run.state.register = detectRegister(clean, run.lang);
      run.state.replyLanguage = detectReplyLanguage(clean);
      run.state.transcript = [...(run.state.transcript ?? []), { role: "user" as const, text: clean }].slice(-40);
      if (run.state.pendingQuestion) {
        // A typed reply to a card: yes/no, a number or a choice is taken as the answer; anything else means the person moved on.
        const parsed = parseAnswer(run.state.pendingQuestion, clean, s);
        if (parsed !== null) input.answer = { questionId: run.state.pendingQuestion.id, value: parsed };
        else { notes.push(`The person typed instead of answering the card "${run.state.pendingQuestion.text}"; the card was set aside.`); run.state.pendingQuestion = undefined; }
      }
      if (run.state.pendingCard) {
        const affirm = /\b(confirm|yes|proceed|file|file it|apply|ok|okay|sure|go ahead|yep|yeah|accept|agree|haan|theek hai|kardo|kar do)\b/i.test(clean);
        const decline = /\b(cancel|no|stop|don't file|reject|nah|nahi|mat karo)\b/i.test(clean);
        if (affirm !== decline) input.confirm = { cardId: run.state.pendingCard.id, accepted: affirm };
        else { notes.push(`The person wrote instead of deciding the review card "${run.state.pendingCard.title}"; the card was set aside and its staged changes kept.`); run.state.pendingCard = undefined; }
      }
      run.status = "running";
    }

    if (input.answer && run.state.pendingQuestion && input.answer.questionId === run.state.pendingQuestion.id) {
      const q = run.state.pendingQuestion;
      run.state.answers[q.resolves] = input.answer.value;
      await emit({ type: "answer", questionId: input.answer.questionId, value: input.answer.value });
      run.state.sources.push({ kind: "answer", id: input.answer.questionId, label: q.text, detail: q.expects === "form" ? "form" : String(input.answer.value).slice(0, 120), verified: false });
      run.state.pendingQuestion = undefined;
      run.status = "running";
      markStep(run, "resolve", "done");
      notes.push(await consequence(ctx, q, input.answer.value));
    }

    if (input.confirm && run.state.pendingCard && run.state.pendingCard.id === input.confirm.cardId) {
      notes.push(await handleConfirmation(ctx, input.confirm));
    }

    if (mode === "input_only") {
      await persist();
      return run;
    }
    if (run.status !== "running") {
      await persist();
      return run;
    }

    // --- one turn of Munshi ji ---------------------------------------------
    await think(ctx, { note: notes.filter(Boolean).join(" ") || undefined });
    if (JSON.stringify(run.state.steps) !== planBefore) await emit({ type: "plan_updated", steps: run.state.steps });
    await persist();
    return run;
  } catch (err) {
    await emit({ type: "message", role: "assistant", text: s.errorGeneric });
    await emit({ type: "tool_outcome", tool: "runtime", ok: false, summary: err instanceof Error ? err.message : String(err) });
    run.status = "failed";
    await emit({ type: "status", status: "failed", reason: "error" });
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

/* ------------------------------------------------------------- consequences -- */

/** What an answer sets in motion, and how it is told back to the model. */
async function consequence(ctx: ActionCtx, q: Question, value: string | number | boolean): Promise<string> {
  const { run, s } = ctx;
  const label = (v: string | number | boolean) => (typeof v === "boolean" ? (v ? s.yes : s.no) : q.choices?.find((c) => c.value === String(v))?.label ?? String(v));
  if (q.resolves === "consent:digilocker") return afterDigiLockerConsent(ctx, value === true);
  if (q.resolves === "consent:documents") return afterDocumentConsent(ctx, value === true);
  if (q.resolves === "year_form") {
    const snapshot = await ensureSnapshot(ctx, personaForOwner);
    if (!snapshot) return "No return exists; the form could not be recorded.";
    return `The person filled the year's form. ${applyYearForm(ctx, snapshot, String(value)).join(" ")}`;
  }
  if (q.resolves === "challan_payment_mode") {
    const snapshot = await ctx.deps.returns.get(ctx.owner, AY);
    if (!snapshot) return "No return exists; nothing was paid.";
    return (await executePayment(ctx, snapshot, String(value))).join(" ");
  }
  if (q.expects === "file") {
    if (value === "none" || value === false) return `The person does not have the document you asked for ("${q.text}").`;
    return afterUpload(ctx, String(value).replace(/^upload:/, ""));
  }
  return `The person answered "${label(value)}" to your question "${q.text}".`;
}

/* ------------------------------------------------------------ confirmation -- */

async function handleConfirmation(ctx: ActionCtx, confirm: NonNullable<RunInput["confirm"]>): Promise<string> {
  const { deps, owner, run, s, emit } = ctx;
  const card = run.state.pendingCard!;
  await emit({ type: "confirmation", cardId: card.id, accepted: confirm.accepted });
  run.status = "running";
  if (!confirm.accepted) {
    run.state.pendingCard = undefined;
    if (card.kind === "regime") run.state.pendingCommands = (run.state.pendingCommands ?? []).filter((c) => c.type !== "choose_regime");
    await emit({ type: "message", role: "assistant", text: s.cancelledAction });
    markStep(run, "review", "done");
    markStep(run, "confirm", "skipped", s.noteNoAction);
    return `The person declined the ${card.kind} card. Nothing was applied${card.kind === "regime" ? "; the regime stays as recorded" : "; the staged changes are kept until they say otherwise"}.`;
  }
  if (run.state.actionTaken?.kind === "filing" && card.kind === "filing") {
    // A replayed confirmation: the action already happened once (§5.4).
    run.state.pendingCard = undefined;
    return "This confirmation was a replay; the filing had already happened and nothing ran twice.";
  }
  const current = await deps.returns.get(owner, AY);
  if (!current || (snapshotHash(current.state) !== card.boundTo.snapshotHash && current.revision !== card.boundTo.revision)) {
    await emit({ type: "message", role: "assistant", text: s.staleReview });
    run.state.pendingCard = undefined;
    return "The return changed underneath the card, so it was dropped without applying anything. Prepare the review again (show_review) once the person is ready.";
  }
  // The guard is re-checked at the action boundary, even on replay.
  const rechecked = assessAdvice(projected(current, run.state.pendingCommands).persona, adviceContext(ctx));
  const hard = hardIssues(rechecked);
  if (hard.length || run.knowledgeRelease !== rechecked.release) {
    run.state.pendingCard = undefined;
    run.state.advice = rechecked;
    markStep(run, "confirm", "skipped", s.noteAdviceUnavailable);
    return `The card could not be applied: ${hard.map((i) => i.reason).join(" ")}`;
  }
  let revision = current.revision;
  const cmds = [...(run.state.pendingCommands ?? [])];
  if (card.kind === "filing") cmds.push({ type: "finalize_filing", filedAt: deps.clock(), today: deps.today() });
  for (let i = 0; i < cmds.length; i += 1) {
    const result = await deps.returns.apply(owner, AY, { command: cmds[i], expectedRevision: revision, idempotencyKey: `${run.id}:${card.id}:${i}`, actor: "agent" });
    if (!result.ok) {
      await emit({ type: "tool_outcome", tool: "apply_return_command", ok: false, summary: result.error });
      await emit({ type: "message", role: "assistant", text: s.staleReview });
      run.state.pendingCard = undefined;
      return `Applying ${cmds[i].type} failed (${result.error}); the review was dropped. Prepare it again when ready.`;
    }
    revision = result.snapshot.revision;
    await emit({ type: "tool_outcome", tool: "apply_return_command", ok: true, summary: cmds[i].type });
  }
  run.state.returnRevision = revision;
  run.state.pendingCommands = undefined;
  run.state.pendingCard = undefined;
  markStep(run, "review", "done");
  markStep(run, "confirm", "done");
  markStep(run, "act", "done");
  await emit({ type: "step_changed", step: "act", state: "done" });
  if (card.kind === "filing") {
    const receipt = `SIM-${card.boundTo.snapshotHash.slice(0, 10).toUpperCase()}`;
    run.state.actionTaken = { kind: "filing", id: receipt, at: deps.clock() };
    // The receipt line and the badge stay templates: their wording is a contract.
    await emit({ type: "message", role: "assistant", text: `${s.filedSimulated.replace("{id}", receipt)}\n${s.simulatedBadge}` });
    run.title = `ITR-1 filed (simulated) · ${AY}`;
    const outputs = await produceOutputs(ctx);
    const after = await deps.returns.get(owner, AY);
    const refund = card.boundTo.amount ?? 0;
    return `The person confirmed and the SIMULATED filing was applied: receipt ${receipt}, return revision ${after?.revision ?? revision}, ${refund >= 0 ? `refund ${formatMoney(refund, run.lang)}` : `due ${formatMoney(-refund, run.lang)}`}. Outputs generated: ${outputs.join("; ")}. Close the task in a sentence or two — what happened, what comes next (e-verification is a real-portal step; here it is done), and that the ITR-V is in the vault.`;
  }
  if (card.kind === "regime") {
    await emit({ type: "message", role: "assistant", text: s.regimeApplied.replace("{regime}", card.rows[0]?.value ?? "") });
    await produceOutputs(ctx);
    return `The person confirmed; the ${card.rows[0]?.value ?? ""} regime is now on the return (revision ${revision}).`;
  }
  await emit({ type: "message", role: "assistant", text: s.correctionsApplied });
  return `The person confirmed; the staged changes were applied to the return (revision ${revision}).`;
}

/* ---------------------------------------------------------------- helpers -- */

function parseAnswer(q: Question, text: string, s: ReturnType<typeof agenticStrings>): string | number | boolean | null {
  const t = text.trim().toLowerCase();
  if (q.expects === "yes_no") {
    if (/^(y|yes|yeah|yep|haan|haa|ha|ஆம்|हाँ|हां|true|go ahead|ok|okay|sure)\b/.test(t) || t === s.yes.toLowerCase()) return true;
    if (/^(n|no|nope|nahi|nahin|இல்லை|नहीं|false|not now)\b/.test(t) || t === s.no.toLowerCase()) return false;
    return null;
  }
  if (q.expects === "form" || q.expects === "source" || q.expects === "file") return null; // answered on the card, not by typing
  if (q.expects === "choice" && q.choices) {
    const clean = (str: string) => str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim().toLowerCase();
    const n = Number(t);
    if (Number.isInteger(n) && n >= 1 && n <= q.choices.length) return q.choices[n - 1].value;
    const hit = q.choices.find((c) => clean(c.value) === t || clean(c.label) === t || t.includes(clean(c.label)) || (clean(c.label).length > 3 && clean(c.label).includes(t)));
    return hit ? hit.value : null;
  }
  if (q.expects === "number") {
    const m = t.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!m) return null;
    let n = Number(m[0]);
    if (/lakh|lac|\bl\b/.test(t)) n *= 100000;
    if (/crore|\bcr\b/.test(t)) n *= 10_000_000;
    return Math.round(n);
  }
  return text.trim() || null;
}

export function publicRun(run: Run) {
  // What the client may see: everything except the private working details a replay of events already carries.
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
export type { PlanStep, RunStatus };
