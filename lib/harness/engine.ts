/**
 * The orchestrator (plan §3.3). One turn in, a stream of events out. Deterministic
 * everywhere it matters: the schema decides what is asked, the vault holds every value,
 * the engine computes every number, the model rephrases and classifies with an offline
 * fallback (D7). A run persists between turns as `InterviewState` in the runs table.
 *
 * Server-only. The route (app/api/agent/stream) persists each yielded event and streams it.
 */
import { randomUUID } from "node:crypto";
import { stamp, type Card, type ContextItem, type RunEvent, type RunEventInput, type TaskId } from "./events";
import { applyAnswer, formatRupees, isIntakeComplete, newInterview, nextSlot, proposeFromText, setPending, skipOptional, type AnswerRecord, type InterviewState } from "./interview";
import { memoriesAsSentences, recall, remember } from "./memory";
import { checkModelId, generate, modelConfigured, parseJson } from "./model";
import { classifyOffline, phraseOffline, thinkingOffline, type Classification } from "./offline";
import { activeRun, appendEvent, createRun, getRun, putOutput, updateRun, type RunRecord } from "./runs";
import { TASKS, planFor, taskById, type SlotSpec, type TaskSchema } from "./tasks";
import { callTool, summariseBreakdown, type Figures } from "./tools";
import { getDocumentMeta, putSlot, readSlotValues, slotStatuses, type SlotStatus } from "../server/vault";
import { DIGILOCKER_SCOPE, digilockerMode, getLink, pullIssued, type DigiLockerSlot } from "../server/digilocker";
import type { OnboardingProfile } from "../onboarding";
import type { Lang } from "../types";
import type { TaxBreakdown } from "../engine/types";
import { acknowledgementNumber, buildItrJson, buildItrvHtml, type FiledReturn } from "../itr";
import { getFiledReturn, saveFiledReturn } from "./returns";
import { PERSONAS } from "../personas";
import type { PersonaId } from "../types";

export interface TurnInput {
  userId: string;
  username: string;
  profile: OnboardingProfile | null;
  lang: Lang;
  runId?: string;
  text?: string;
  answer?: { askId: string; slotId: string; masked: string; documentId?: string; unavailable?: boolean; skipped?: boolean; choice?: string };
  confirm?: { cardId: string; action: string };
  cancel?: { cardId: string };
}

interface Ctx {
  userId: string;
  username: string;
  profile: OnboardingProfile | null;
  lang: Lang;
  run: RunRecord;
  schema: TaskSchema | null;
  state: InterviewState;
  offline: boolean;
  offlineReason: string | null;
  proposals: Record<string, string>;
  vault: Record<string, SlotStatus>;
}

const REQUIRE_CONFIRMATION = () => (process.env.AGENT_REQUIRE_CONFIRMATION ?? "true") !== "false";

function ev(input: RunEventInput): RunEvent {
  return { ...input, at: stamp() } as RunEvent;
}

function persist(ctx: Ctx): void {
  updateRun(ctx.userId, ctx.run.id, { state: ctx.state, taskId: ctx.state.taskId === "unknown" ? null : ctx.state.taskId });
}

/* ----------------------------------------------------------------- model -- */

async function decideOffline(): Promise<{ offline: boolean; reason: string | null }> {
  if (!modelConfigured()) return { offline: true, reason: "GEMINI_API_KEY is not configured" };
  const problem = await checkModelId();
  return problem ? { offline: true, reason: problem } : { offline: false, reason: null };
}

function pseudonymisedContext(ctx: Ctx): string {
  const lines: string[] = [];
  const p = ctx.profile;
  if (p) {
    lines.push(`Citizen (no name): ${p.profession}, age band ${p.ageBand}, ${p.residency}, income sources ${p.incomeSources.join("/") || "unknown"}, income band ${p.incomeBand}, holdings ${p.holdings.join("/") || "none"}, filed before: ${p.filingHistory}, wants help level: ${p.helpLevel}.`);
    if (p.note) lines.push(`Their note: ${p.note.replace(/\d{6,}/g, "[number]")}`);
  }
  const memories = recall(ctx.userId);
  if (memories.length) lines.push(`Known from earlier chats: ${memoriesAsSentences(memories).join("; ")}.`);
  const filled = Object.keys(ctx.vault);
  if (filled.length) lines.push(`Already in the vault (values hidden): ${filled.join(", ")}.`);
  if (ctx.state.notes.length) lines.push(`Things they added: ${ctx.state.notes.join(" | ")}`);
  lines.push(`Interface language: ${ctx.lang}.`);
  return lines.join("\n");
}

async function classify(ctx: Ctx, text: string): Promise<{ result: Classification; thoughts: string[] }> {
  const offline = classifyOffline(text, ctx.profile);
  if (ctx.offline) return { result: offline, thoughts: [thinkingOffline(offline)] };
  const outcome = await generate({
    system: [
      "You classify an Indian citizen's opening message into one tax task and extract facts. Reply in JSON only.",
      `Tasks: ${Object.values(TASKS).map((t) => `${t.id} (${t.title})`).join("; ")}; or unknown.`,
      "Extract: employment (salaried|self_employed|business|null), salary (whole rupees or null; 'lakh'=100000, 'crore'=10000000), revenue (rupees or null), newJob (bool), firstTime (bool), summary (one short line, no numbers longer than 6 digits, no names).",
      "Never invent facts that are not in the message.",
    ].join("\n"),
    user: `${pseudonymisedContext(ctx)}\n\nMessage: ${text}`,
    jsonSchema: {
      type: "object",
      properties: {
        taskId: { type: "string", enum: [...Object.keys(TASKS), "unknown"] },
        employment: { type: "string", nullable: true },
        salary: { type: "number", nullable: true },
        revenue: { type: "number", nullable: true },
        newJob: { type: "boolean" },
        firstTime: { type: "boolean" },
        summary: { type: "string" },
      },
      required: ["taskId", "summary"],
    },
    maxTokens: 512,
  });
  if (!outcome.ok) {
    ctx.offline = true;
    ctx.offlineReason = outcome.error;
    return { result: offline, thoughts: [thinkingOffline(offline)] };
  }
  const parsed = parseJson<{ taskId?: string; employment?: string | null; salary?: number | null; revenue?: number | null; newJob?: boolean; firstTime?: boolean; summary?: string }>(outcome.result.text);
  if (!parsed || !parsed.taskId) return { result: offline, thoughts: outcome.result.thoughts.length ? outcome.result.thoughts : [thinkingOffline(offline)] };
  const taskId = (Object.keys(TASKS).includes(parsed.taskId) ? parsed.taskId : "unknown") as TaskId;
  const employment = parsed.employment === "salaried" || parsed.employment === "self_employed" || parsed.employment === "business" ? parsed.employment : offline.extracted.employment;
  const result: Classification = {
    taskId: taskId === "unknown" ? offline.taskId : taskId,
    confidence: 0.9,
    extracted: {
      employment,
      salary: typeof parsed.salary === "number" && parsed.salary > 0 ? Math.round(parsed.salary) : offline.extracted.salary,
      revenue: typeof parsed.revenue === "number" && parsed.revenue > 0 ? Math.round(parsed.revenue) : offline.extracted.revenue,
      newJob: parsed.newJob ?? offline.extracted.newJob,
      firstTime: parsed.firstTime ?? offline.extracted.firstTime,
    },
    summary: parsed.summary ?? offline.summary,
  };
  return { result, thoughts: outcome.result.thoughts.length ? outcome.result.thoughts : [`Reading the first line: ${result.summary}.`] };
}

async function phrase(ctx: Ctx, spec: SlotSpec, proposal?: string): Promise<{ prompt: string; thoughts: string[] }> {
  const fallback = phraseOffline(spec, proposal);
  if (ctx.offline) return { prompt: fallback, thoughts: [] };
  const outcome = await generate({
    system: [
      "You are Wapsi's assistant asking one question in an Indian income-tax interview. Rewrite the given question in warm, plain words for this citizen, at most two sentences.",
      "Rules: never lead with a form or section name (you may add it in brackets at the end); never ask for anything other than this one item; never invent facts; keep any bracketed hint; reply with the question text only.",
      `Reply in language code "${ctx.lang}" (Latin digits).`,
    ].join("\n"),
    user: `${pseudonymisedContext(ctx)}\n\nTemplate question: ${fallback}\nWhy it is needed: ${spec.why ?? "part of the return"}`,
    maxTokens: 200,
    temperature: 0.4,
  });
  if (!outcome.ok) {
    ctx.offline = true;
    ctx.offlineReason = outcome.error;
    return { prompt: fallback, thoughts: [`Model unavailable (${outcome.error.slice(0, 120)}); using the plain question.`] };
  }
  const text = outcome.result.text.replace(/\s+/g, " ").trim();
  // A rephrase must still be a whole question; anything cut short or padded falls back to the template.
  if (text.length < 20 || text.length > 400 || !/[?.!]$/.test(text)) return { prompt: fallback, thoughts: [] };
  return { prompt: text, thoughts: [] };
}

async function explain(ctx: Ctx, topic: string, facts: string): Promise<string | null> {
  if (ctx.offline) return null;
  const outcome = await generate({
    system: `You are Wapsi's assistant. Explain ${topic} to a citizen in at most three plain sentences. Use only the figures given; never compute or invent. Indian rupee formatting. Reply in language code "${ctx.lang}".`,
    user: facts,
    maxTokens: 400,
    temperature: 0.3,
    thoughts: false,
    timeoutMs: 8_000,
  });
  return outcome.ok && outcome.result.text.length >= 20 ? outcome.result.text.trim() : null;
}

/* ------------------------------------------------------------- helpers -- */

function contextItems(ctx: Ctx): ContextItem[] {
  const items: ContextItem[] = [];
  for (const m of recall(ctx.userId)) items.push({ kind: "memory", label: `${m.key.replace(/_/g, " ")}: ${m.value}`, status: "remembered" });
  for (const [slotId, status] of Object.entries(ctx.vault)) {
    const spec = findSpec(slotId);
    items.push({ kind: spec?.input.kind === "upload" ? "document" : "slot", label: spec?.label ?? slotId, status: `${status.masked} · ${status.source}` });
  }
  const link = getLink(ctx.userId);
  items.push({ kind: "source", label: `DigiLocker (${digilockerMode()})`, status: link ? `connected ${new Date(link.linkedAt).toLocaleDateString("en-IN")}` : "not connected" });
  return items;
}

function findSpec(slotId: string): SlotSpec | null {
  for (const task of Object.values(TASKS)) {
    const spec = task.slots.find((s) => s.id === slotId);
    if (spec) return spec;
  }
  return null;
}

function rememberSafely(ctx: Ctx, key: string, value: string): RunEvent[] {
  try {
    remember(ctx.userId, key, value, ctx.run.id);
    return [ev({ type: "memory", op: "remember", key, value })];
  } catch (error) {
    return [ev({ type: "error", message: `Not remembered (${error instanceof Error ? error.message : "refused"})`, recoverable: true })];
  }
}

function ageBandFromProfile(ctx: Ctx, dob?: string): Figures["ageBand"] {
  if (dob) {
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86_400_000));
    return age >= 80 ? "above_80" : age >= 60 ? "60_to_80" : "below_60";
  }
  return ctx.profile?.ageBand === "60_plus" ? "60_to_80" : "below_60";
}

function figuresFromVault(ctx: Ctx): { figures: Figures; regimeChoice: "cheaper" | "new" | "old" } {
  const ids = ["gross_salary", "tds_192", "freelance_income", "tds_other", "savings_interest", "pf_contribution", "rent_paid", "insurance_premium", "dob", "regime_choice"];
  const values = readSlotValues(ctx.userId, ids, { actor: "agent", runId: ctx.run.id, reason: "compute" });
  const n = (id: string) => (values[id] ? Number(values[id]) || 0 : 0);
  const answered = (id: string) => ctx.state.answers[id]?.status === "filled";
  const figures: Figures = {
    salary: answered("gross_salary") ? n("gross_salary") : 0,
    business: answered("freelance_income") ? n("freelance_income") : 0,
    interest: answered("savings_interest") ? n("savings_interest") : 0,
    tds: (answered("tds_192") ? n("tds_192") : 0) + (answered("tds_other") ? n("tds_other") : 0),
    pf: answered("pf_contribution") ? n("pf_contribution") : 0,
    rent: answered("rent_paid") ? n("rent_paid") : 0,
    insurance: answered("insurance_premium") ? n("insurance_premium") : 0,
    ageBand: ageBandFromProfile(ctx, values.dob),
  };
  const choice = values.regime_choice === "new" || values.regime_choice === "old" ? values.regime_choice : "cheaper";
  return { figures, regimeChoice: choice };
}

function reviewCard(b: TaxBreakdown, regime: "new" | "old", figures: Figures): Card {
  const rows: { label: string; value: string; note?: string }[] = [];
  if (figures.salary) rows.push({ label: "Salary", value: formatRupees(figures.salary) });
  if (figures.business) rows.push({ label: "Freelance or business income", value: formatRupees(figures.business) });
  if (figures.interest) rows.push({ label: "Bank interest", value: formatRupees(figures.interest) });
  if (b.standardDeduction) rows.push({ label: "Standard deduction", value: `− ${formatRupees(b.standardDeduction)}`, note: "everyone with a salary gets this" });
  if (b.totalDeductions) rows.push({ label: "Deductions allowed", value: `− ${formatRupees(b.totalDeductions)}`, note: regime === "old" ? "PF, rent, insurance as claimed" : "the new regime allows almost none" });
  rows.push({ label: "Income that is taxed", value: formatRupees(b.taxableIncome) });
  if (b.rebate87A) rows.push({ label: "Rebate", value: `− ${formatRupees(b.rebate87A)}`, note: "the government waives tax at this income" });
  rows.push({ label: "Tax for the year", value: formatRupees(b.totalTax), note: `${regime} regime, including 4% cess` });
  rows.push({ label: "Already paid", value: formatRupees(b.tdsCredits) });
  rows.push({ label: b.refundOrDue >= 0 ? "Coming back to you" : "Still to pay", value: formatRupees(Math.abs(b.refundOrDue)) });
  return { type: "review", title: "Your return, in plain words", rows, footer: "Every figure comes from the tax engine, not from the assistant." };
}

/* ------------------------------------------------------------ the turn -- */

export async function* runTurn(input: TurnInput): AsyncGenerator<RunEvent> {
  const { offline, reason } = await decideOffline();
  let run: RunRecord | null = input.runId ? getRun(input.userId, input.runId) : null;
  const fresh = !run;
  if (!run) {
    const title = (input.text ?? "New chat").trim().slice(0, 60);
    run = createRun(input.userId, title);
  }
  const ctx: Ctx = {
    userId: input.userId,
    username: input.username,
    profile: input.profile,
    lang: input.lang,
    run,
    schema: run.taskId ? taskById(run.taskId as TaskId) : null,
    state: run.state && run.state.taskId ? run.state : newInterview("unknown"),
    offline,
    offlineReason: reason,
    proposals: {},
    vault: slotStatuses(input.userId),
  };

  const out: RunEvent[] = [];
  const emit = (e: RunEventInput) => out.push(ev(e));
  const flush = function* () {
    while (out.length) yield out.shift()!;
  };

  if (fresh) {
    emit({ type: "run.start", runId: run.id, title: run.title, offline: ctx.offline });
    if (ctx.offline && ctx.offlineReason) emit({ type: "error", message: `Offline planner: ${ctx.offlineReason}`, recoverable: true });
  }
  yield* flush();

  try {
    if (input.text !== undefined) {
      yield* handleText(ctx, input.text, fresh, emit, flush);
    } else if (input.answer) {
      yield* handleAnswer(ctx, input.answer, emit, flush);
    } else if (input.confirm) {
      yield* handleConfirm(ctx, input.confirm, emit, flush);
    } else if (input.cancel) {
      emit({ type: "message", role: "assistant", text: "Not done. Change anything you like and tell me when you are ready." });
      ctx.state.phase = "review";
      persist(ctx);
      updateRun(ctx.userId, ctx.run.id, { status: "waiting" });
      emit({ type: "run.done", status: "waiting" });
      yield* flush();
    }
  } catch (error) {
    emit({ type: "error", message: error instanceof Error ? error.message : String(error), recoverable: false });
    updateRun(ctx.userId, ctx.run.id, { status: "failed" });
    emit({ type: "run.done", status: "failed" });
    yield* flush();
  }
}

type Emit = (e: RunEventInput) => void;
type Flush = () => Generator<RunEvent>;

async function* handleText(ctx: Ctx, text: string, fresh: boolean, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  emit({ type: "message", role: "user", text });
  yield* flush();

  if (!ctx.schema) {
    // A brand-new run, or one still waiting for a clear task.
    if (fresh) emit({ type: "context", items: contextItems(ctx) });
    emit({ type: "tool.call", name: "classify_situation", argsMasked: { text: text.length > 40 ? `${text.slice(0, 40)}…` : text } });
    yield* flush();
    const wasOffline = ctx.offline;
    const { result, thoughts } = await classify(ctx, text);
    if (!wasOffline && ctx.offline) emit({ type: "error", message: `Model unavailable, continuing with the offline planner (${ctx.offlineReason ?? "unknown"})`, recoverable: true });
    for (const thought of thoughts) emit({ type: "thinking", text: thought });
    emit({ type: "tool.result", name: "classify_situation", summary: `${result.taskId} · ${result.summary}` });
    if (result.taskId === "unknown") {
      emit({ type: "message", role: "assistant", text: "I can file a return, compare the two regimes, work out benefits for a small business, respond to a notice, or walk you through with a sample citizen. Which of those is closest to what you need?" });
      updateRun(ctx.userId, ctx.run.id, { status: "waiting" });
      emit({ type: "run.done", status: "waiting" });
      yield* flush();
      return;
    }
    const schema = taskById(result.taskId)!;
    ctx.schema = schema;
    ctx.state = newInterview(schema.id);
    updateRun(ctx.userId, ctx.run.id, { taskId: schema.id, title: `${schema.title}: ${text.slice(0, 50)}`, plan: planFor(schema) });
    emit({ type: "plan", steps: planFor(schema) });
    emit({ type: "step.start", stepId: schema.steps[0].id });
    // Proposals from the first line and from onboarding; each is confirmed by the person.
    if (result.extracted.employment) ctx.proposals.employment_type = result.extracted.employment;
    if (result.extracted.salary) ctx.proposals.gross_salary = formatRupees(result.extracted.salary);
    if (result.extracted.revenue) ctx.proposals.revenue = formatRupees(result.extracted.revenue);
    if (result.extracted.employment) for (const e of rememberSafely(ctx, "employment", result.extracted.employment.replace("_", " "))) emit(e);
    if (result.extracted.newJob) for (const e of rememberSafely(ctx, "new_job_this_year", "yes")) emit(e);
    emit({ type: "step.done", stepId: schema.steps[0].id, note: result.summary });
    if (schema.steps[1]) emit({ type: "step.start", stepId: schema.steps[1].id });
    emit({ type: "message", role: "assistant", text: schema.intro });
    persist(ctx);
    yield* flush();
    yield* advance(ctx, emit, flush);
    return;
  }

  // An existing task: is this the answer to the pending question?
  const pending = ctx.state.pendingSlotId ? ctx.schema.slots.find((s) => s.id === ctx.state.pendingSlotId) : null;
  if (pending) {
    const proposal = proposeFromText(pending, text);
    if (proposal && !pending.secret) {
      putSlot(ctx.userId, pending.id, proposal.value, { masked: proposal.masked, source: "user", actor: "user", runId: ctx.run.id });
      ctx.vault = slotStatuses(ctx.userId);
      const askId = ctx.state.pendingAskId ?? "";
      ctx.state = applyAnswer(ctx.state, pending.id, { status: "filled", masked: proposal.masked, choice: proposal.choice, source: "user", at: stamp() });
      emit({ type: "answered", askId, masked: proposal.masked });
      if (pending.memoryKey && proposal.choice) for (const e of rememberSafely(ctx, pending.memoryKey, proposal.choice)) emit(e);
      persist(ctx);
      yield* flush();
      yield* advance(ctx, emit, flush);
      return;
    }
  }
  ctx.state.notes.push(text.slice(0, 300));
  emit({ type: "thinking", text: "Noted; folding this into the current task." });
  emit({ type: "message", role: "assistant", text: pending ? "Noted. The question above is still open; answer it there and I will carry on." : "Noted." });
  persist(ctx);
  updateRun(ctx.userId, ctx.run.id, { status: pending ? "waiting" : ctx.run.status });
  emit({ type: "run.done", status: pending ? "waiting" : ctx.state.phase === "done" ? "complete" : "waiting" });
  yield* flush();
}

async function* handleAnswer(ctx: Ctx, answer: NonNullable<TurnInput["answer"]>, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  if (!ctx.schema) throw new Error("no task in this run");
  const spec = ctx.schema.slots.find((s) => s.id === answer.slotId);
  if (!spec) throw new Error(`unknown slot ${answer.slotId}`);
  const at = stamp();
  if (answer.skipped) {
    ctx.state = skipOptional(ctx.state, spec.id, at);
    emit({ type: "answered", askId: answer.askId, masked: "skipped" });
  } else if (answer.unavailable) {
    ctx.state = applyAnswer(ctx.state, spec.id, { status: "unavailable", masked: "not available", choice: "no", source: "user", at });
    emit({ type: "answered", askId: answer.askId, masked: "Not available" });
  } else {
    const record: AnswerRecord = { status: "filled", masked: answer.masked, choice: answer.choice, source: answer.documentId ? "document" : "user", at };
    ctx.state = applyAnswer(ctx.state, spec.id, record);
    emit({ type: "answered", askId: answer.askId, masked: answer.masked });
    if (spec.memoryKey && answer.choice) for (const e of rememberSafely(ctx, spec.memoryKey, answer.choice)) emit(e);
    if (answer.documentId) yield* absorbDocument(ctx, spec, answer.documentId, emit, flush);
  }
  ctx.vault = slotStatuses(ctx.userId);
  persist(ctx);
  yield* flush();
  yield* advance(ctx, emit, flush);
}

/** A document answer: read what extraction found and fill the slots it covers. */
async function* absorbDocument(ctx: Ctx, spec: SlotSpec, documentId: string, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  const meta = getDocumentMeta(ctx.userId, documentId);
  if (!meta) return;
  emit({ type: "card", cardId: `doc-${documentId}`, card: { type: "document", title: spec.label, docType: meta.docType, source: "upload", filename: meta.filename } });
  const extracted = (meta.extracted ?? {}) as { grossSalary?: number; tds?: number; pan?: string };
  const found: string[] = [];
  if (spec.fills?.includes("gross_salary") && typeof extracted.grossSalary === "number") {
    putSlot(ctx.userId, "gross_salary", String(extracted.grossSalary), { masked: formatRupees(extracted.grossSalary), source: "document", actor: "agent", runId: ctx.run.id });
    ctx.state = applyAnswer(ctx.state, "gross_salary", { status: "filled", masked: formatRupees(extracted.grossSalary), source: "document", at: stamp() });
    found.push(`salary ${formatRupees(extracted.grossSalary)}`);
  }
  if (spec.fills?.includes("tds_192") && typeof extracted.tds === "number") {
    putSlot(ctx.userId, "tds_192", String(extracted.tds), { masked: formatRupees(extracted.tds), source: "document", actor: "agent", runId: ctx.run.id });
    ctx.state = applyAnswer(ctx.state, "tds_192", { status: "filled", masked: formatRupees(extracted.tds), source: "document", at: stamp() });
    found.push(`tax deducted ${formatRupees(extracted.tds)}`);
  }
  if (typeof extracted.pan === "string" && !ctx.vault.pan) {
    putSlot(ctx.userId, "pan", extracted.pan, { masked: `${extracted.pan.slice(0, 2)}XXXXXX${extracted.pan.slice(8)}`, source: "document", actor: "agent", runId: ctx.run.id });
    found.push("PAN");
  }
  emit({ type: "tool.call", name: "extract_document", argsMasked: { document: meta.filename } });
  emit({ type: "tool.result", name: "extract_document", summary: found.length ? `Read ${found.join(", ")} from the statement` : "Could not read figures from this file (scanned or compressed); I will ask for them instead" });
  yield* flush();
}

/** Ask the next question, filling from the vault first (plan §3.3 step 5). */
async function* advance(ctx: Ctx, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  const schema = ctx.schema!;
  for (;;) {
    const spec = nextSlot(schema, ctx.state);
    if (!spec) break;
    // 1. The vault already has it (from an earlier chat, a document, DigiLocker or a persona).
    const inVault = ctx.vault[spec.id];
    if (inVault && spec.sources.includes("vault") && spec.input.kind !== "upload") {
      emit({ type: "tool.call", name: "check_sources", argsMasked: { slot: spec.id } });
      emit({ type: "tool.result", name: "check_sources", summary: `${spec.label}: found in your vault (${inVault.masked}, ${inVault.source})` });
      const values = spec.secret ? {} : readSlotValues(ctx.userId, [spec.id], { actor: "agent", runId: ctx.run.id, reason: "reuse" });
      ctx.state = applyAnswer(ctx.state, spec.id, { status: "filled", masked: inVault.masked, choice: spec.secret ? undefined : values[spec.id], source: inVault.source === "persona" ? "persona" : inVault.source === "digilocker" ? "digilocker" : inVault.source === "document" ? "document" : "vault", at: stamp() });
      continue;
    }
    // 2. DigiLocker, when linked and the document is one it issues (plan D8).
    if (spec.sources.includes("digilocker") && (DIGILOCKER_SCOPE as readonly string[]).includes(spec.id)) {
      const link = getLink(ctx.userId);
      emit({ type: "tool.call", name: "check_sources", argsMasked: { slot: spec.id, sources: ["vault", "digilocker"] } });
      if (link) {
        const pulled = pullIssued(ctx.userId, ctx.username, [spec.id as DigiLockerSlot], ctx.run.id);
        const got = pulled.filled.find((f) => f.slotId === spec.id);
        if (got) {
          emit({ type: "tool.result", name: "check_sources", summary: `${spec.label}: not in the vault · pulled from DigiLocker (${digilockerMode()}) as ${got.masked}, verified` });
          emit({ type: "card", cardId: `dl-${spec.id}`, card: { type: "document", title: spec.label, docType: spec.id, source: "digilocker", filename: got.masked, note: "Issued document; nothing to type." } });
          ctx.vault = slotStatuses(ctx.userId);
          ctx.state = applyAnswer(ctx.state, spec.id, { status: "filled", masked: got.masked, source: "digilocker", at: stamp() });
          continue;
        }
      }
      emit({ type: "tool.result", name: "check_sources", summary: `${spec.label}: not in the vault · DigiLocker ${link ? "had nothing new" : `(${digilockerMode()}) not connected`} · asking you` });
    }
    // 3. Onboarding already told us (a proposal the person confirms with one tap).
    const proposal = ctx.proposals[spec.id] ?? (spec.fromOnboarding && ctx.profile ? spec.fromOnboarding(ctx.profile) : undefined);
    yield* flush();
    const { prompt, thoughts } = await phrase(ctx, spec, proposal);
    for (const thought of thoughts) emit({ type: "thinking", text: thought });
    const askId = `ask-${randomUUID().slice(0, 8)}`;
    emit({ type: "ask", askId, slotId: spec.id, prompt, why: spec.why, input: spec.input, prefill: proposal, optional: !spec.required });
    ctx.state = setPending(ctx.state, askId, spec.id);
    persist(ctx);
    updateRun(ctx.userId, ctx.run.id, { status: "waiting" });
    emit({ type: "run.done", status: "waiting" });
    yield* flush();
    return;
  }

  if (!isIntakeComplete(schema, ctx.state)) return;
  const gatherStep = schema.steps.find((s) => s.id === "gather");
  if (gatherStep && ctx.state.phase === "intake") emit({ type: "step.done", stepId: gatherStep.id, note: "everything needed is in the vault" });
  ctx.state.phase = "compute";
  emit({ type: "context", items: contextItems(ctx) });
  yield* flush();
  yield* complete(ctx, emit, flush);
}

/** Intake is done: the task-specific finish. */
async function* complete(ctx: Ctx, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  const schema = ctx.schema!;
  const tool = { userId: ctx.userId, runId: ctx.run.id };
  switch (schema.id) {
    case "file_return":
    case "compare_regimes": {
      emit({ type: "step.start", stepId: "compute" });
      const { figures, regimeChoice } = figuresFromVault(ctx);
      emit({ type: "tool.call", name: "compare_regimes", argsMasked: { salary: figures.salary ? formatRupees(figures.salary) : undefined, business: figures.business ? formatRupees(figures.business) : undefined, tds: formatRupees(figures.tds) } });
      const compared = await callTool("compare_regimes", figures, tool);
      emit({ type: "tool.result", name: "compare_regimes", summary: compared.summary });
      const both = compared.data as { new: TaxBreakdown; old: TaxBreakdown; cheaper: "new" | "old" };
      const regime = regimeChoice === "cheaper" ? both.cheaper : regimeChoice;
      const breakdown = regime === "new" ? both.new : both.old;
      emit({ type: "step.done", stepId: "compute", note: summariseBreakdown(breakdown) });
      emit({ type: "step.start", stepId: "review" });
      emit({ type: "card", cardId: `cmp-${randomUUID().slice(0, 6)}`, card: { type: "comparison", newRegime: both.new.totalTax, oldRegime: both.old.totalTax, recommended: both.cheaper, note: regimeChoice === "cheaper" ? `The ${both.cheaper} regime costs you less, so it is used below.` : `You asked for the ${regime} regime; the ${both.cheaper} one would cost ${formatRupees(Math.abs(both.new.totalTax - both.old.totalTax))} less.` } });
      emit({ type: "card", cardId: `rev-${randomUUID().slice(0, 6)}`, card: reviewCard(breakdown, regime, figures) });
      const explanation = await explain(ctx, "what this return means", `Regime ${regime}. ${summariseBreakdown(breakdown)}. Taxable income ${formatRupees(breakdown.taxableIncome)}.`);
      emit({ type: "message", role: "assistant", text: explanation ?? (breakdown.refundOrDue >= 0 ? `You paid more during the year than you owe, so ${formatRupees(breakdown.refundOrDue)} comes back to you once this is filed.` : `You owe ${formatRupees(-breakdown.refundOrDue)} more than was deducted; that is paid first, then the return is filed.`) });
      for (const e of rememberSafely(ctx, "regime_used_ay_2026_27", regime)) emit(e);
      if (schema.id === "compare_regimes") {
        emit({ type: "step.done", stepId: "review" });
        ctx.state.phase = "done";
        persist(ctx);
        updateRun(ctx.userId, ctx.run.id, { status: "complete" });
        emit({ type: "run.done", status: "complete" });
        yield* flush();
        return;
      }
      ctx.state.phase = "confirm";
      if (breakdown.refundOrDue < 0) {
        emit({ type: "card", cardId: "confirm-pay", card: { type: "confirm", title: "Pay the balance first", body: "A return filed with tax still owing is treated as defective, so the payment comes first. This records a mock payment.", rows: [{ label: "To pay", value: formatRupees(-breakdown.refundOrDue) }, { label: "Regime", value: regime }], confirmLabel: "Record the payment and file", cancelLabel: "Not yet", action: "pay_challan" } });
      } else if (REQUIRE_CONFIRMATION()) {
        emit({ type: "card", cardId: "confirm-file", card: { type: "confirm", title: "File this return?", body: "Nothing is sent until you press the button. You can change any answer first.", rows: [{ label: breakdown.refundOrDue >= 0 ? "Refund" : "Payable", value: formatRupees(Math.abs(breakdown.refundOrDue)) }, { label: "Regime", value: regime }], confirmLabel: "File my return", cancelLabel: "Not yet", action: "file_return" } });
      } else {
        persist(ctx);
        yield* flush();
        yield* fileReturn(ctx, emit, flush);
        return;
      }
      persist(ctx);
      updateRun(ctx.userId, ctx.run.id, { status: "waiting" });
      emit({ type: "run.done", status: "waiting" });
      yield* flush();
      return;
    }
    case "business_benefits": {
      emit({ type: "step.start", stepId: "compute" });
      const values = readSlotValues(ctx.userId, ["revenue"], { actor: "agent", runId: ctx.run.id, reason: "presumptive" });
      const kind = ctx.state.answers.business_type?.choice === "profession" ? "profession" : "business";
      const digital = ctx.state.answers.digital_share?.choice === "yes";
      const revenue = Number(values.revenue) || 0;
      emit({ type: "tool.call", name: "presumptive_income", argsMasked: { kind, revenue: formatRupees(revenue), digital } });
      const result = await callTool("presumptive_income", { kind, revenue, digital }, tool);
      emit({ type: "tool.result", name: "presumptive_income", summary: result.summary });
      const data = result.data as { section: string; eligible: boolean; deemed: number; rate: number; limit: number; breakdown: TaxBreakdown };
      emit({ type: "step.done", stepId: "compute" });
      emit({ type: "step.start", stepId: "review" });
      const rows = data.eligible
        ? [
            { label: "Receipts", value: formatRupees(revenue) },
            { label: `Income you declare (${Math.round(data.rate * 100)}%)`, value: formatRupees(data.deemed), note: `the presumptive scheme, section ${data.section}` },
            { label: "Books of account", value: "Not required" },
            { label: "Audit", value: "Not required" },
            { label: "Tax on that (new regime)", value: formatRupees(data.breakdown.totalTax) },
            { label: "Advance tax", value: "One instalment by 15 March" },
          ]
        : [
            { label: "Receipts", value: formatRupees(revenue) },
            { label: "Presumptive scheme", value: "Not available", note: `above ${formatRupees(data.limit)}` },
            { label: "What applies", value: "Regular books, and an audit" },
          ];
      emit({ type: "card", cardId: "benefits", card: { type: "review", title: "What a small business gets", rows, footer: "Figures from the tax engine on the presumptive income; GST is separate from income tax." } });
      const explanation = await explain(ctx, "the presumptive taxation scheme for this business", result.summary);
      emit({ type: "message", role: "assistant", text: explanation ?? (data.eligible ? `You can declare ${Math.round(data.rate * 100)}% of receipts as income and skip books and audit. On ${formatRupees(revenue)} that is ${formatRupees(data.deemed)}, taxed at ${formatRupees(data.breakdown.totalTax)} under the new regime. Expenses above that are your gain.` : `Above ${formatRupees(data.limit)} the simplified scheme does not apply; regular accounts and an audit are needed, which a chartered accountant handles.`) });
      for (const e of rememberSafely(ctx, "presumptive_scheme", data.eligible ? data.section : "not eligible")) emit(e);
      emit({ type: "step.done", stepId: "review" });
      break;
    }
    case "respond_notice": {
      emit({ type: "step.start", stepId: "review" });
      const values = readSlotValues(ctx.userId, ["notice_amount", "notice_reason"], { actor: "agent", runId: ctx.run.id, reason: "notice" });
      const kind = (ctx.state.answers.notice_kind?.choice ?? "other") as "143_1" | "139_9" | "245" | "148" | "other";
      const position = (ctx.state.answers.notice_position?.choice ?? "unsure") as "agree" | "disagree" | "unsure";
      emit({ type: "tool.call", name: "draft_notice_response", argsMasked: { kind, position } });
      const result = await callTool("draft_notice_response", { kind, amount: Number(values.notice_amount) || 0, position, reason: values.notice_reason }, tool);
      emit({ type: "tool.result", name: "draft_notice_response", summary: result.summary });
      const text = String(result.data.text);
      const output = putOutput(ctx.userId, ctx.run.id, { kind: "notice-reply", name: "Response to notice.txt", contentType: "text/plain; charset=utf-8", bytes: Buffer.from(text, "utf-8") });
      emit({ type: "output", outputId: output.id, kind: "notice-reply", name: output.name, href: `/api/outputs/${output.id}` });
      emit({ type: "message", role: "assistant", text: `Here is a response you can send:\n\n${text}` });
      emit({ type: "step.done", stepId: "review" });
      break;
    }
    case "pay_tax": {
      emit({ type: "step.start", stepId: "pay" });
      const values = readSlotValues(ctx.userId, ["pay_amount", "pan"], { actor: "agent", runId: ctx.run.id, reason: "challan" });
      const amount = Number(values.pay_amount) || 0;
      emit({ type: "tool.call", name: "pay_challan", argsMasked: { amount: formatRupees(amount) } });
      const result = await callTool("pay_challan", { amount, pan: values.pan ?? "DEMPX0000X", ordinal: 1 }, tool);
      emit({ type: "tool.result", name: "pay_challan", summary: result.summary });
      const data = result.data as { bsr: string; serial: string; amount: number };
      const paidAt = stamp();
      emit({ type: "card", cardId: "challan", card: { type: "challan", amount: data.amount, bsr: data.bsr, serial: data.serial, paidAt } });
      const receipt = `Challan 280 (mock)\nAmount: ${formatRupees(data.amount)}\nBSR: ${data.bsr}\nSerial: ${data.serial}\nPaid: ${paidAt}\nMajor head 0021 · minor head 300 (self-assessment)`;
      const output = putOutput(ctx.userId, ctx.run.id, { kind: "challan", name: "Challan 280 receipt.txt", contentType: "text/plain; charset=utf-8", bytes: Buffer.from(receipt, "utf-8") });
      emit({ type: "output", outputId: output.id, kind: "challan", name: output.name, href: `/api/outputs/${output.id}` });
      emit({ type: "step.done", stepId: "pay" });
      emit({ type: "step.start", stepId: "review" });
      emit({ type: "message", role: "assistant", text: `Recorded. The receipt is in Outputs; the BSR code and serial go into the return so the credit shows against your name.` });
      emit({ type: "step.done", stepId: "review" });
      break;
    }
    case "check_refund": {
      emit({ type: "step.start", stepId: "review" });
      const filed = getFiledReturn(ctx.userId);
      if (!filed) {
        emit({ type: "message", role: "assistant", text: "No return has been filed from this account yet, so there is no refund in motion. Say \"file my return\" and I will start." });
      } else {
        const stages = ["Filed", "Verified", "In the queue", "Under review", "Refund determined", "Sent to bank", "Credited"];
        const daysSince = Math.max(0, Math.floor((Date.now() - new Date(filed.filedAt).getTime()) / 86_400_000));
        const at = Math.min(stages.length - 1, Math.floor(daysSince / 7));
        emit({ type: "card", cardId: "refund", card: { type: "review", title: "Where your refund is", rows: stages.map((stage, i) => ({ label: stage, value: i < at ? "done" : i === at ? "now" : "next", note: i === 0 ? new Date(filed.filedAt).toLocaleDateString("en-IN") : undefined })), footer: `Acknowledgement ${filed.ackNumber} · ${filed.breakdown.refundOrDue >= 0 ? `refund ${formatRupees(filed.breakdown.refundOrDue)}` : "no refund due"}` } });
        emit({ type: "message", role: "assistant", text: `Your return is at "${stages[at]}". Returns filed in the same week usually move one stage a week; nothing is needed from you unless a stage says so.` });
      }
      emit({ type: "step.done", stepId: "review" });
      break;
    }
    case "demo_persona": {
      emit({ type: "step.start", stepId: "load" });
      const which = (ctx.state.answers.persona?.choice ?? "sunita") as PersonaId;
      emit({ type: "tool.call", name: "load_demo_persona", argsMasked: { persona: which } });
      const result = await callTool("load_demo_persona", { persona: which }, tool);
      emit({ type: "tool.result", name: "load_demo_persona", summary: result.summary });
      const persona = PERSONAS[which];
      const salary = persona.facts.filter((f) => f.kind === "salary").reduce((a, f) => a + f.amount, 0);
      const interest = persona.facts.filter((f) => f.kind === "interest").reduce((a, f) => a + f.amount, 0);
      const tds = persona.taxPaid.reduce((a, p) => a + p.amount, 0);
      const seeded: [string, string, string][] = [
        ["full_name", persona.name, persona.name],
        ["pan", persona.pan, `${persona.pan.slice(0, 2)}XXXXXX${persona.pan.slice(8)}`],
        ["mobile", persona.mobile.replace(/\s/g, ""), `XXXXXX${persona.mobile.replace(/\s/g, "").slice(-4)}`],
        ["gross_salary", String(salary), formatRupees(salary)],
        ["savings_interest", String(interest), formatRupees(interest)],
        ["tds_192", String(tds), formatRupees(tds)],
      ];
      for (const [slotId, value, masked] of seeded) putSlot(ctx.userId, slotId, value, { masked, source: "persona", actor: "system", runId: ctx.run.id });
      ctx.vault = slotStatuses(ctx.userId);
      emit({ type: "card", cardId: "vault-persona", card: { type: "vaultStatus", items: seeded.map(([slotId, , masked]) => ({ slotId, label: findSpec(slotId)?.label ?? slotId, status: "filled", source: "persona", masked })) } });
      emit({ type: "step.done", stepId: "load" });
      emit({ type: "step.start", stepId: "review" });
      const breakdown = result.data.breakdown as TaxBreakdown;
      emit({ type: "card", cardId: "persona-review", card: reviewCard(breakdown, "new", { salary, business: 0, interest, tds, pf: 0, rent: 0, insurance: 0, ageBand: "below_60" }) });
      emit({ type: "message", role: "assistant", text: `${persona.name}: ${persona.situation}. Their figures now sit in your vault marked "persona", so you can say "file my return" and watch the whole flow without typing anything.` });
      for (const e of rememberSafely(ctx, "demo_persona_loaded", which)) emit(e);
      emit({ type: "step.done", stepId: "review" });
      break;
    }
    default:
      break;
  }
  ctx.state.phase = "done";
  emit({ type: "context", items: contextItems(ctx) });
  persist(ctx);
  updateRun(ctx.userId, ctx.run.id, { status: "complete" });
  emit({ type: "run.done", status: "complete" });
  yield* flush();
}

async function* handleConfirm(ctx: Ctx, confirm: NonNullable<TurnInput["confirm"]>, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  if (!ctx.schema) throw new Error("no task in this run");
  if (confirm.action === "pay_challan") {
    const { figures, regimeChoice } = figuresFromVault(ctx);
    const compared = await callTool("compare_regimes", figures, { userId: ctx.userId, runId: ctx.run.id });
    const both = compared.data as { new: TaxBreakdown; old: TaxBreakdown; cheaper: "new" | "old" };
    const regime = regimeChoice === "cheaper" ? both.cheaper : regimeChoice;
    const due = -(regime === "new" ? both.new : both.old).refundOrDue;
    const values = readSlotValues(ctx.userId, ["pan"], { actor: "agent", runId: ctx.run.id, reason: "challan" });
    emit({ type: "tool.call", name: "pay_challan", argsMasked: { amount: formatRupees(due) } });
    const result = await callTool("pay_challan", { amount: due, pan: values.pan ?? "DEMPX0000X", ordinal: 1 }, { userId: ctx.userId, runId: ctx.run.id });
    emit({ type: "tool.result", name: "pay_challan", summary: result.summary });
    const data = result.data as { bsr: string; serial: string; amount: number };
    emit({ type: "card", cardId: "challan", card: { type: "challan", amount: data.amount, bsr: data.bsr, serial: data.serial, paidAt: stamp() } });
    putSlot(ctx.userId, "self_assessment_paid", String(due), { masked: formatRupees(due), source: "user", actor: "agent", runId: ctx.run.id });
    yield* flush();
    yield* fileReturn(ctx, emit, flush);
    return;
  }
  if (confirm.action === "file_return") {
    yield* fileReturn(ctx, emit, flush);
    return;
  }
  emit({ type: "message", role: "assistant", text: `Confirmed: ${confirm.action}.` });
  emit({ type: "run.done", status: "waiting" });
  yield* flush();
}

async function* fileReturn(ctx: Ctx, emit: Emit, flush: Flush): AsyncGenerator<RunEvent> {
  emit({ type: "step.done", stepId: "review" });
  emit({ type: "step.start", stepId: "file" });
  ctx.state.phase = "acting";
  const { figures, regimeChoice } = figuresFromVault(ctx);
  const tool = { userId: ctx.userId, runId: ctx.run.id };
  const compared = await callTool("compare_regimes", figures, tool);
  const both = compared.data as { new: TaxBreakdown; old: TaxBreakdown; cheaper: "new" | "old" };
  const regime = regimeChoice === "cheaper" ? both.cheaper : regimeChoice;
  const breakdown = regime === "new" ? both.new : both.old;
  const values = readSlotValues(ctx.userId, ["full_name", "pan", "dob", "aadhaar", "mobile", "email", "bank_account", "ifsc", "self_assessment_paid"], { actor: "agent", runId: ctx.run.id, reason: "file_return" });
  const paid = Number(values.self_assessment_paid) || 0;
  const filedAt = stamp();
  const pan = values.pan ?? "DEMPX0000X";
  const filed: FiledReturn = {
    ackNumber: acknowledgementNumber(pan, filedAt),
    filedAt,
    assessmentYear: "2026-27",
    form: figures.business > 0 ? "ITR-4" : "ITR-1",
    regime,
    breakdown: { ...breakdown, tdsCredits: breakdown.tdsCredits + paid, refundOrDue: breakdown.refundOrDue + paid },
    income: { salary: figures.salary, business: figures.business, interest: figures.interest },
    deductions: [
      ...(figures.pf ? [{ section: "80C", amount: figures.pf }] : []),
      ...(figures.rent ? [{ section: "80GG", amount: figures.rent }] : []),
      ...(figures.insurance ? [{ section: "80D", amount: figures.insurance }] : []),
    ],
    person: {
      name: values.full_name ?? "Citizen",
      pan,
      dob: values.dob,
      aadhaarLast4: values.aadhaar?.slice(-4),
      mobile: values.mobile,
      email: values.email,
      bankAccountLast4: values.bank_account?.slice(-4),
      ifsc: values.ifsc,
    },
  };
  emit({ type: "tool.call", name: "file_return", argsMasked: { form: filed.form, regime, refundOrDue: formatRupees(Math.abs(filed.breakdown.refundOrDue)) } });
  saveFiledReturn(ctx.userId, filed);
  emit({ type: "tool.result", name: "file_return", summary: `acknowledged · ${filed.ackNumber} · ${filed.form} · ${regime} regime` });
  const json = putOutput(ctx.userId, ctx.run.id, { kind: "itr-json", name: `${filed.form} ${filed.assessmentYear}.json`, contentType: "application/json", bytes: Buffer.from(JSON.stringify(buildItrJson(filed), null, 2), "utf-8") });
  emit({ type: "output", outputId: json.id, kind: "itr-json", name: json.name, href: `/api/outputs/${json.id}` });
  const itrv = putOutput(ctx.userId, ctx.run.id, { kind: "itr-v", name: `ITR-V ${filed.ackNumber}.html`, contentType: "text/html; charset=utf-8", bytes: Buffer.from(buildItrvHtml(filed), "utf-8") });
  emit({ type: "output", outputId: itrv.id, kind: "itr-v", name: itrv.name, href: `/api/outputs/${itrv.id}` });
  emit({ type: "card", cardId: "itrv", card: { type: "itrv", ackNumber: filed.ackNumber, filedAt, name: filed.person.name, refundOrDue: filed.breakdown.refundOrDue, regime } });
  emit({ type: "step.done", stepId: "file", note: filed.ackNumber });
  for (const e of rememberSafely(ctx, "filed_ay_2026_27", "yes")) emit(e);
  emit({ type: "message", role: "assistant", text: `Filed. Your acknowledgement and the return itself are in Outputs. ${filed.breakdown.refundOrDue >= 0 ? `The ${formatRupees(filed.breakdown.refundOrDue)} refund will move through the tracker; ask "where is my refund" any time.` : "Nothing more is owed."} In the real world the next step is e-verifying within 30 days; here that is one click on the Manual side.` });
  ctx.state.phase = "done";
  emit({ type: "context", items: contextItems(ctx) });
  persist(ctx);
  updateRun(ctx.userId, ctx.run.id, { status: "complete" });
  emit({ type: "run.done", status: "complete" });
  yield* flush();
}

/** The route decides whether to start a new run or continue the active one (plan §7). */
export function resolveRunId(userId: string, requested?: string): string | undefined {
  if (requested) return requested;
  return activeRun(userId)?.id;
}

export { appendEvent };
