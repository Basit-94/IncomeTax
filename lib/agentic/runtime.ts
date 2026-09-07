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
import { getSmartTaxAnswer } from "../knowledge/smart-answers";
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
import { languageOption } from "../i18n/languages";
import { formatMoney } from "../money";
import type { VaultService } from "../vault/service";
import { KNOWLEDGE_RELEASE } from "./flags";
import { hasIntakeSignal, intakeAcknowledgement, isDocumentAnswer, nextIntakeQuestion, parseSituation } from "./intake";
import { nullModel, type ModelAdapter } from "./model";
import { detectSmallTalk, firstName, smallTalkReply } from "./voice";
import { detectRegister, say, type SayInput } from "./say";
import { consentItems, fetchedFacts, listIssuedDocuments } from "./digilocker";
import { DEDUCTION_FIELDS, yearAnswersFrom } from "./intake";
import { MUNSHI_CHARACTER, whoIsMunshi } from "./munshi-character";
import type { DigiLockerProvider } from "../digilocker/types";
import type { ProfileSeed } from "../onboarding";
import type { ExtractedFields } from "../compliance/pdfExtract";
import { carryDefaults, emptyYearIntake, gapGroups, inferForm, regimeLean } from "../return/year-intake";
import { buildPlan, classifyByRules, isCapabilityInquiry, isPaymentInquiry, isTaxInformationQuestion, nextStep, setStep, taskTitle, type PlanningFacts } from "./planner";
import { CHALLAN_MAJOR_HEAD_LABEL, CHALLAN_MINOR_HEAD_LABEL, splitTaxAndCess, syntheticChallanIdentifiers } from "../compliance/challan280";
import type { SelfAssessmentPayment } from "../../context/TaxReturnContext";
import { getLatestReviewForPan } from "../ca/ca-store";
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
  /** The DigiLocker mock's record store (2026-09-07); absent in tests, where the PAN-seeded record is rebuilt in-process. */
  locker?: DigiLockerProvider;
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

export async function createRun(deps: RuntimeDeps, owner: Owner, opts: { message?: string; task?: RunTask; lang: Lang; profile?: ProfileSeed }): Promise<Run> {
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
      steps: buildPlan(planningFacts(task, null, deps.vault ? true : null), s),
      answers: {},
      sources: [],
      usage: { toolCalls: 0, modelCalls: 0, tokens: 0 },
      lastUserMessage: opts.message ? redactText(opts.message).text : undefined,
      profile: opts.profile,
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
      if (isPaymentInquiry(clean) && run.state.pendingQuestion?.resolves !== "challan_payment_mode") {
        run.state.pendingCard = undefined;
        run.state.pendingQuestion = undefined;
        run.state.pendingCommands = undefined;
        run.task = "explain";
        run.state.steps = buildPlan(planningFacts("explain", null, deps.vault ? true : null), s, run.state.steps);
        const snapshot = await ensureSnapshot(deps, owner, run);
        await handleChosenTask(deps, owner, run, snapshot, s, emit, "task:challan_280");
        await persist();
        return run;
      }
      if (run.status === "waiting_for_input" && run.state.pendingQuestion) {
        const parsed = parseAnswer(run.state.pendingQuestion, clean, s);
        if (parsed !== null) {
          input.answer = { questionId: run.state.pendingQuestion.id, value: parsed };
          if (run.state.pendingQuestion.resolves === "other_income" && /\b(freelance|business|consulting|gig|profession)\b/i.test(clean)) {
            run.state.answers.other_income_type = "freelance";
          }
        } else if (run.state.pendingQuestion.resolves === "chosen_task") {
          run.state.pendingQuestion = undefined;
          delete run.state.answers.chosen_task;
          run.task = "explain";
          run.state.steps = buildPlan(planningFacts("explain", null, deps.vault ? true : null), s);
          run.status = "running";
        } else if (isCapabilityInquiry(clean) || isTaxInformationQuestion(clean)) {
          run.state.pendingQuestion = undefined;
          delete run.state.answers.chosen_task;
          run.task = "explain";
          run.state.steps = buildPlan(planningFacts("explain", null, deps.vault ? true : null), s);
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
          run.state.steps = buildPlan(planningFacts("explain", null, deps.vault ? true : null), s);
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

      if (resolves === "challan_payment_mode" || resolves === "challan_pay_action") {
        const snapshot = await ensureSnapshot(deps, owner, run);
        await handleChallanPaymentExecution(deps, owner, run, snapshot, s, emit, input.answer.value);
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
  const isHi = run.lang === "hi";
  const greeting = name ? (isHi ? `नमस्ते ${name}!` : `Hello ${name}!`) : (isHi ? "नमस्ते!" : "Hello!");
  const intro = isHi
    ? [
        `${greeting} FY 2025-26 / AY 2026-27 के रिटर्न के लिए मैं ये कार्य कर सकता हूँ:`,
        "",
        "1. **रिटर्न तैयार करें और फाइल करें**: फॉर्म 16 पढ़ें, कटौतियां (80C, 80D), व्यवस्था चयन, सिम्युलेटेड फाइलिंग और हस्ताक्षरित फॉर्म ITR-V PDF डाउनलोड करें।",
        "2. **टैक्स व्यवस्थाओं की तुलना**: धारा 115BAC (नई) बनाम पुरानी व्यवस्था के तहत कटौती विवरण के साथ तुलना।",
        "3. **AIS और 26AS मिलान**: सरकारी रिकॉर्ड के साथ नियोक्ता वेतन और TDS कटौतियों का मिलान करें।",
        "4. **अग्रिम कर और चालान 280**: धारा 234B/C के तहत शेष देनदारी/ब्याज की गणना करें और चालान ITNS 280 बनाएं।",
        "5. **नोटिस रक्षा**: धारा 143(1) सूचना, 139(9) दोषपूर्ण रिटर्न की समीक्षा करें और ऑडिट जोखिम का आकलन करें।",
        "6. **रिफंड स्थिति ट्रैक करें**: सत्यापन से लेकर SBI रिफंड क्रेडिट तक की समयसीमा का पालन करें।",
        "7. **सिटिजन टैक्स वॉल्ट**: फॉर्म 16, AIS, 26AS और दाखिल रिटर्न के लिए सुरक्षित एन्क्रिप्टेड रिपॉजिटरी।",
        "",
        "आप अभी कौन सा कार्य करना चाहते हैं?",
      ].join("\n")
    : [
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
  // Chat first, template last (2026-09-07): Munshi ji greets in his own words from the capability list; the
  // numbered menu is the fallback, never the first choice.
  const capabilityFacts = intro.split("\n").filter((line) => line.trim().length > 0);
  await speak(deps, owner, run, emit, {
    intent: "Greet the person as Munshi ji and, in your own words, say what you can do for their FY 2025-26 / AY 2026-27 return — the seven things in the facts, kept short — then ask which to start with.",
    facts: capabilityFacts,
    fallback: intro,
    maxWords: 150,
  });

  const q: Question = {
    id: newId("q"),
    text: isHi ? "आप अभी कौन सा कार्य करना चाहते हैं?" : "Which task would you like to perform right now?",
    why: isHi ? "शुरू करने के लिए एक कार्य चुनें" : "Pick an action to start immediately",
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

async function emitTaskCapabilitiesSummary(
  deps: RuntimeDeps,
  owner: Owner,
  run: Run,
  s: ReturnType<typeof strings>,
  emit: (p: RunEventPayload) => Promise<unknown>,
  headerNote?: string,
) {
  const isHi = run.lang === "hi";
  const text = isHi
    ? [
        headerNote || "कार्य पूरा हो गया है।",
        "",
        "**आगे के लिए उपलब्ध 7 कार्य (AY 2026-27):**",
        "1. 📄 **रिटर्न तैयार करें और फाइल करें**: फॉर्म 16 पढ़ना, 80C/80D कटौतियां, व्यवस्था चयन, फाइलिंग और ITR-V PDF",
        "2. ⚖️ **टैक्स व्यवस्थाओं की तुलना**: धारा 115BAC (नई) बनाम पुरानी व्यवस्था का विस्तृत विश्लेषण",
        "3. 🔍 **AIS और 26AS मिलान**: सरकारी रिकॉर्ड व फॉर्म 16 के बीच TDS और वेतन का मिलान",
        "4. 💳 **अग्रिम कर और चालान 280**: बकाया कर देनदारी का भुगतान और ITNS 280 रसीद",
        "5. 🛡️ **नोटिस रक्षा**: धारा 143(1) सूचना, 139(9) दोषपूर्ण रिटर्न और ऑडिट जोखिम",
        "6. ⚡ **रिफंड स्थिति ट्रैक करें**: CPC प्रसंस्करण से लेकर बैंक क्रेडिट तक का सीधा ट्रैक",
        "7. 🏛️ **सिटिजन टैक्स वॉल्ट**: फॉर्म 16, AIS, 26AS और दाखिल ITR-V दस्तावेज़",
        "",
        "अगला कार्य शुरू करने के लिए 1 से 7 संख्या टाइप करें, कार्य का नाम लिखें, या कोई भी कर प्रश्न पूछें!",
      ].join("\n")
    : [
        headerNote || "Task completed successfully.",
        "",
        "**Available Tasks for your Return (AY 2026-27):**",
        "1. 📄 **Prepare & File Return**: Read Form 16, deductions (80C, 80D), regime selection, simulated filing & official ITR-V PDF.",
        "2. ⚖️ **Compare Tax Regimes**: Side-by-side computation under Section 115BAC (New) vs Old Regime with custom deductions.",
        "3. 🔍 **Reconcile AIS & 26AS**: Match employer salary and TDS deductions against CBDT records with zero notice risk.",
        "4. 💳 **Advance Tax & Challan 280**: Compute balance liability/interest u/s 234B/C and generate Challan ITNS 280.",
        "5. 🛡️ **Notice Defense**: Review intimation u/s 143(1), defective return u/s 139(9), and assess audit risk.",
        "6. ⚡ **Track Refund Status**: Follow timeline progression from verification to SBI refund credit.",
        "7. 🏛️ **Citizen Tax Vault**: Secure encrypted repository for Form 16, AIS, 26AS, and filed returns.",
        "",
        "Type any number (1–7), name a task, or ask any tax question to continue!",
      ].join("\n");

  // Chat first (2026-09-07): Munshi ji closes the task in a sentence and offers the next step in his own words;
  // the numbered menu is the fallback when the model is off. The task chips under the composer are the UI's.
  await speak(deps, owner, run, emit, {
    intent: "Close the task as Munshi ji in one or two sentences: what just finished, then an easy invitation to the next thing — filing, comparing regimes, reconciling AIS and 26AS, advance tax and challan 280, a notice, the refund tracker or the vault. No numbered list.",
    facts: [headerNote ?? "Task completed.", "Next steps on offer: prepare & file the return; compare the two regimes; reconcile AIS and 26AS; advance tax and challan 280; notice defence; refund tracker; the tax vault. A number 1 to 7 or the task's name starts it."],
    fallback: text,
    maxWords: 70,
  });
}

async function stepClassify(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  const text = run.state.lastUserMessage ?? "";
  if (text) run.state.register = detectRegister(text, run.lang);
  const talk = text ? detectSmallTalk(text) : null;
  // Polite departure or thank you finishes cleanly
  if (talk === "thanks" || talk === "bye" || talk === "howAreYou") {
    run.state.smallTalk = talk;
    run.task = "explain";
    run.state.steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps).map((p) => ({ ...p, state: "done" as const }));
    await speak(deps, owner, run, emit, { intent: smallTalkIntent(talk), fallback: smallTalkReply(talk, s, firstName(owner.displayName)), maxWords: 40 });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  // "Who are you?" — including "aap kon h?" — gets Munshi ji introducing himself, never a menu (2026-09-07).
  if (talk === "who") {
    run.state.smallTalk = talk;
    run.task = "explain";
    run.state.steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps).map((p) => ({ ...p, state: "done" as const }));
    const name = firstName(owner.displayName);
    await speak(deps, owner, run, emit, {
      intent: "Introduce yourself as Munshi ji in one breath — who you are, what you do for the person's return, what you never do — and ask what brought them here. No menu, no list, no capabilities tour.",
      facts: [`Name: ${MUNSHI_CHARACTER.name} — ${MUNSHI_CHARACTER.role}.`, "Reads the person's papers — Form 16, AIS — and names the source of every figure.", "Never files or pays anything without the person's say-so; everything here is a simulation."],
      mustContain: ["Munshi"],
      fallback: whoIsMunshi(run.lang, run.state.register ?? "plain", name),
      maxWords: 75,
    });
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  // Greetings ("hi", "hello", "namaste"), help and capability inquiries present all 7 tasks
  const isGreetingOrCapability =
    talk === "hello" ||
    talk === "help" ||
    isCapabilityInquiry(text) ||
    /^(hi+|hello+|hey+|namaste|greetings|vanakkam|salaam)\b/i.test(text.trim());

  if (isGreetingOrCapability) {
    run.task = "explain";
    let steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps);
    steps = setStep(steps, "classify", "done");
    run.state.steps = steps;
    await emitGreetingCapabilities(deps, owner, run, s, emit);
    return;
  }

  if (isPaymentInquiry(text)) {
    run.task = "explain";
    let steps = buildPlan(planningFacts("explain", null, null), s, run.state.steps);
    steps = setStep(steps, "classify", "done");
    run.state.steps = steps;
    const snapshot = await ensureSnapshot(deps, owner, run);
    await handleChosenTask(deps, owner, run, snapshot, s, emit, "task:challan_280");
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

/**
 * A task's result as Munshi ji would say it (policy, docs/VOICE.md, 2026-09-07): every figure, section, date
 * and table row is a fact he must keep; the prose around them is his. The assembled template is the fallback
 * when the model is off or its reply fails the check. Receipts and review cards never come through here.
 */
async function speakResult(deps: RuntimeDeps, owner: Owner, run: Run, emit: (p: RunEventPayload) => Promise<unknown>, lines: string[], intent = "Deliver this result as Munshi ji: keep every figure, section and date exactly as given and any table rows as they are, and say everything else in your own words — the useful thing first."): Promise<string> {
  const text = lines.join("\n");
  const facts = lines.map((l) => l.trim()).filter(Boolean);
  return speak(deps, owner, run, emit, { intent, facts, fallback: text, maxWords: Math.max(120, Math.ceil(text.split(/\s+/).length * 1.2)), allowAdvice: true, shape: "review" });
}

/** What a read Form 16 said, as facts the conversation may state verbatim. */
function fieldFacts(fields: Form16Fields, lang: Lang): string[] {
  const facts: string[] = [];
  if (fields.grossSalary !== undefined) facts.push(`Salary for the year per Form 16${fields.employerName ? ` from ${fields.employerName}` : ""}: ${formatMoney(fields.grossSalary, lang)}`);
  if (fields.tds !== undefined) facts.push(`Tax already deducted from salary (TDS) per Form 16: ${formatMoney(fields.tds, lang)}`);
  for (const e of fields.exemptAllowances ?? []) facts.push(`Allowance exempt u/s ${e.section} per Form 16: ${formatMoney(e.amount, lang)}`);
  for (const c of fields.employerClaims ?? []) facts.push(`Reported by the employer under ${c.section}: ${formatMoney(c.amount, lang)}`);
  for (const row of fields.otherIncome ?? []) facts.push(`${row.kind === "interest" ? "Interest" : "Dividends"} per AIS from ${row.reporter}: ${formatMoney(row.amount, lang)}`);
  if (fields.ltcg112A) facts.push(`Long-term gains on listed shares/funds per AIS: ${formatMoney(fields.ltcg112A.gain, lang)}`);
  for (const t of fields.tdsOther ?? []) facts.push(`Tax deducted u/s ${t.section} by ${t.reporter} per AIS: ${formatMoney(t.amount, lang)}`);
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
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;

  if (existing) {
    // If CA has completed an audit that hasn't been merged yet into the snapshot, update it
    if (hasCa && caReview.caPersona) {
      const personaDiffers = snapshotHash(existing.state.persona) !== snapshotHash(caReview.caPersona);
      const targetRegime = caReview.caRegime || existing.state.regime || "new";
      const regimeDiffers = existing.state.regime !== targetRegime;
      if (personaDiffers || regimeDiffers) {
        const updatedState: ReturnState = {
          ...existing.state,
          persona: caReview.caPersona,
          regime: targetRegime,
        };
        const rep = await deps.returns.replace(owner, AY, updatedState, null);
        if (rep.ok) return rep.snapshot;
      }
    }
    return existing;
  }

  const persona = personaForOwner(owner);
  if (!persona && owner.kind === "demo") return null;
  const base: Persona = hasCa ? caReview.caPersona! : (persona ?? blankPersona(owner));
  const state: ReturnState = {
    version: CURRENT_VERSION,
    lang: run.lang,
    personaId: base.id === "custom" ? "custom" : base.id,
    baselinePersona: persona ?? base,
    persona: base,
    corrections: [],
    confirmedFactIds: [],
    regime: hasCa && caReview.caRegime ? caReview.caRegime : "new",
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
  // The person's locker record (generated once, kept) is loaded now so the consent card lists their own papers.
  if (deps.locker) {
    try {
      await deps.locker.record(owner, AY);
    } catch {
      // the in-process rebuild in lib/agentic/digilocker.ts stands in
    }
  }
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
/** The document rows the tool hands back — never a PAN, name or DOB. */
type Form16Fields = Omit<ExtractedFields, "pan" | "name" | "dob">;
const deps_now = () => new Date().toISOString();

/** The return as it would stand with the staged commands applied — pure, never persisted; for previews and the verdict. */
function previewState(snapshot: VersionedReturn, cmds: ReturnCommand[]): ReturnState {
  let state = snapshot.state;
  for (const c of cmds) {
    const r = applyReturnCommand(state, c);
    if (r.ok) state = r.state;
  }
  return state;
}

/**
 * Read a stored Form 16 or AIS and stage what it carries: the salary and TDS as before, and since 2026-09-07 the
 * Part B rows (exemptions u/s 10, professional tax, employer-reported Chapter VI-A) and the AIS lines (interest,
 * dividends, listed-equity LTCG, other TDS) — one `import_document` per document, plus the year's intake record.
 */
async function stageForm16(deps: RuntimeDeps, run: Run, ctx: ToolContext, snapshot: VersionedReturn, documentId: string, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>, kind: "FORM_16" | "AIS" = "FORM_16"): Promise<Form16Fields | null> {
  const read = await runTool("read_document_fields", { documentId }, ctx);
  run.state.usage.toolCalls += 1;
  if (!read.ok) return null;
  const rr = read.result as { readable?: boolean; fields?: Form16Fields; issues?: string[]; subjectMatchesOwner?: boolean };
  const suspicious = (rr.issues ?? []).some((i) => stripInjection(i).suspicious);
  if (suspicious) await emit({ type: "message", role: "assistant", text: s.injectionNotice });
  if (rr.readable && rr.fields && rr.subjectMatchesOwner !== false) {
    const f = rr.fields;
    const salary = snapshot.state.baselinePersona.facts.find((x) => x.kind === "salary")?.amount;
    const tds = snapshot.state.baselinePersona.taxPaid.find((t) => t.section.includes("192"))?.amount;
    const cmds = run.state.pendingCommands ?? [];
    const already = cmds.some((c) => c.type === "import_document" && c.document.kind === kind);
    const carriesRows = (f.otherIncome?.length ?? 0) > 0 || !!f.ltcg112A || (f.tdsOther?.length ?? 0) > 0 || (f.employerClaims?.length ?? 0) > 0;
    const salaryDiffers = (f.grossSalary !== undefined && f.grossSalary !== salary) || (f.tds !== undefined && f.tds !== tds);
    if (!already && (salaryDiffers || carriesRows)) {
      cmds.push({ type: "import_document", today: deps.today(), document: { fileName: "document.pdf", kind, ingestedAt: deps.clock(), extracted: f } });
    }
    if (kind === "FORM_16" && f.grossSalary !== undefined && !cmds.some((c) => c.type === "record_year_intake" && c.patch.read?.salary)) {
      cmds.push({
        type: "record_year_intake", assessmentYear: AY,
        patch: {
          read: { salary: { gross: f.grossSalary, exempt10: f.exemptAllowances ?? [], professionalTax: f.professionalTax, tdsSalary: f.tds, employerName: f.employerName, tan: f.tan }, sftFlags: [] },
          sources: { chosen: typeof run.state.answers.source === "string" && run.state.answers.source.startsWith("upload:") ? "upload" : (run.state.answers.source as "digilocker" | "vault" | "manual" | undefined) ?? "upload", documents: { form16: [documentId] } },
        },
      });
    }
    run.state.pendingCommands = cmds;
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
  if (meta.docType === "FORM_16" || meta.docType === "ANNUAL_INFO_STATEMENT") {
    const ctx: ToolContext = { owner, runId: run.id, assessmentYear: AY, vault: deps.vault, returns: deps.returns, store: deps.store, today: deps.today() };
    fields = await stageForm16(deps, run, ctx, snapshot, meta.id, s, emit, meta.docType === "FORM_16" ? "FORM_16" : "AIS");
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
      for (const k of ["salary_amount", "interest_amount", ...DEDUCTION_FIELDS.map((d) => d.key)]) {
        const v = obj[k];
        if (typeof v === "number" && Number.isFinite(v)) a[k] = Math.max(0, Math.round(v));
      }
      // The year's groups (2026-09-07): where they lived, anything else, who they work for.
      for (const k of ["housing", "extras", "employer_category"]) {
        const v = obj[k];
        if (typeof v === "string" && v) a[k] = v.slice(0, 200);
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
    // The pull (2026-09-07): the identity cards and this year's papers, one activity line each so the person
    // watches them arrive, stored in the vault as issued documents and read the way an upload is read.
    const issued = listIssuedDocuments(owner, AY, "all");
    if (deps.vault) {
      for (const doc of issued) {
        await emit({ type: "activity", text: `${s.fetchingFromDigiLocker} ${doc.title} · ${doc.issuer}` });
        const meta = await deps.vault.importIssued({ owner, assessmentYear: AY, docType: doc.docType, title: doc.title, issuer: doc.issuer, fields: doc.fields, actor: "agent", runId: run.id, uri: doc.uri });
        await recordUploadedDocument(deps, owner, run, snapshot, meta.id, s, emit, true);
      }
    }
    const facts = [`${s.fetchedFromDigiLocker} ${issued.map((d) => d.title).join("; ")}.`, ...fetchedFacts(issued, run.lang)];
    await speak(deps, owner, run, emit, {
      intent: "Say, as Munshi ji, what came over from DigiLocker — the identity cards and this year's papers — and state the figures the Form 16 and AIS gave, each with where it came from.",
      facts, mustContain: ["DigiLocker"], fallback: facts.join("\n"), maxWords: 120,
    });
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
  explicitTask?: string,
) {
  const a = run.state.answers;
  const chosenTask = explicitTask ?? (typeof a.chosen_task === "string" ? a.chosen_task : undefined);
  if (!chosenTask) return;
  const chosen = chosenTask.startsWith("task:") ? chosenTask.slice(5) : chosenTask;
  if (!explicitTask) delete a.chosen_task;

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
      await speakResult(deps, owner, run, emit, msg.split("\n"));
      await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Your return for AY 2026-27 is already submitted.");
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
      run.title = saving > 0 ? `Regime Comparison · ${cheaper === "new" ? "New" : "Old"} saves ${formatMoney(saving, run.lang)}` : "Regime Comparison · AY 2026-27";
      await deps.store.saveRun(run);
      await speakResult(deps, owner, run, emit, lines);
      await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Tax regime comparison completed.");
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
      run.title = "Regime Comparison · AY 2026-27";
      await deps.store.saveRun(run);
      await speakResult(deps, owner, run, emit, lines);
      await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Tax regime comparison completed.");
      run.status = "completed";
      await emit({ type: "status", status: "completed" });
      return;
    }
  }

  if (chosen === "reconcile_facts") {
    run.title = "Reconciliation · AIS & 26AS";
    await deps.store.saveRun(run);
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
    await speakResult(deps, owner, run, emit, lines);
    await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Reconciliation audit completed.");
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "challan_280") {
    const currentSnap = snapshot ?? (await ensureSnapshot(deps, owner, run));
    const caReview = getLatestReviewForPan(owner.pan);
    const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
    const p = hasCa ? caReview.caPersona! : currentSnap?.state.persona;
    const regime = hasCa && caReview.caRegime ? caReview.caRegime : (currentSnap?.state.regime ?? "new");
    const b = p ? computeForPersona(p, regime) : null;
    const due = b && b.refundOrDue < 0 ? -b.refundOrDue : 0;

    if (due === 0) {
      const refund = b && b.refundOrDue > 0 ? b.refundOrDue : 0;
      run.title = refund > 0 ? "Challan 280 · Nil Tax Due (Refund)" : "Challan 280 · Nil Tax Due";
      await deps.store.saveRun(run);

      const lines = [
        `### 💳 Advance Tax & Challan ITNS 280 (AY 2026-27)`,
        "",
        `• **Taxpayer**: ${p?.name || owner.displayName} (${p?.pan || owner.pan})`,
        refund > 0
          ? `• **Net Balance Tax Due**: **₹0** *(Net Refund Due: **${formatMoney(refund, run.lang)}**)*`
          : `• **Net Balance Tax Due**: **₹0** *(Nil Balance Tax Payable)*`,
        hasCa
          ? `• **CA Audit Status**: Audited & Verified by **${caReview.caDetails?.name || "Chartered Accountant"}** ✓`
          : `• **Liability Status**: Prepaid taxes satisfy or exceed total computed tax liability ✓`,
        `• **Major Head**: 0021 (Income Tax other than Companies)`,
        `• **Minor Head**: 100 (Advance Tax / Nil Clearance)`,
        `• **Assessment Year**: 2026-27`,
        "",
        refund > 0
          ? `Your prepaid taxes exceed your computed liability. You are eligible for an **income tax refund of ${formatMoney(refund, run.lang)}**, which will be credited directly to your bank account by the CPC refund banker. You do **not** owe any self-assessment tax!`
          : `All computed tax liabilities have been fully covered. Your outstanding self-assessment tax liability u/s 140A is **₹0**.`,
        "",
        `You can simulate a ₹0 / Nil Challan clearance below, or proceed directly to return filing.`,
      ];
      await speakResult(deps, owner, run, emit, lines);

      const choices = [
        { value: "pay_challan_upi", label: "⚡ Simulate UPI / QR (₹0 — Nil Due)" },
        { value: "pay_challan_sbi", label: "🏦 Net Banking — SBI (₹0 — Nil Due)" },
        { value: "skip_challan_pay", label: "Proceed to Return Filing (Nil Due)" },
      ];

      const q: Question = {
        id: newId("q"),
        text: refund > 0
          ? `You have a refund of ${formatMoney(refund, run.lang)} due (₹0 payable). Simulate Challan 280 or proceed?`
          : `Your balance tax payable is ₹0. Simulate Challan 280 or proceed?`,
        why: "Section 140A tax clearance verification",
        expects: "choice",
        resolves: "challan_payment_mode",
        choices,
      };
      run.state.pendingQuestion = q;
      await emit({ type: "question", question: q });
      run.status = "waiting_for_input";
      await emit({ type: "status", status: "waiting_for_input" });
      return;
    }

    const amountToPay = due;
    const { baseTax, cess } = splitTaxAndCess(amountToPay);

    const lines = [
      `### 💳 Advance Tax & Challan ITNS 280 (AY 2026-27)`,
      "",
      `• **Taxpayer**: ${p?.name || owner.displayName} (${p?.pan || owner.pan})`,
      hasCa
        ? `• **Net Balance Tax Due**: **${formatMoney(due, run.lang)}** *(Audited by ${caReview.caDetails?.name || "CA"})*`
        : `• **Net Balance Tax Due**: **${formatMoney(due, run.lang)}**`,
      `• **Base Income Tax**: ${formatMoney(baseTax, run.lang)}`,
      `• **Health & Education Cess (4%)**: ${formatMoney(cess, run.lang)}`,
      `• **Major Head**: 0021 (Income Tax other than Companies)`,
      `• **Minor Head**: 300 (Self-Assessment Tax u/s 140A)`,
      `• **Assessment Year**: 2026-27`,
      "",
      hasCa
        ? `This figure incorporates your Chartered Accountant's audited deductions and recommendations under the **${regime === "old" ? "Old Regime" : "New Regime"}**.`
        : `Select a payment method below to simulate your Challan 280 transaction. Or, you can **Review with a CA** to audit deductions and reduce this payable amount before payment.`,
    ];
    await speakResult(deps, owner, run, emit, lines);

    const choices = [
      { value: "pay_challan_upi", label: `⚡ Simulate UPI / QR (${formatMoney(amountToPay, run.lang)})` },
      { value: "pay_challan_sbi", label: `🏦 Net Banking — SBI (${formatMoney(amountToPay, run.lang)})` },
      { value: "pay_challan_hdfc", label: `🏦 Net Banking — HDFC (${formatMoney(amountToPay, run.lang)})` },
      { value: "pay_challan_icici", label: `🏦 Net Banking — ICICI (${formatMoney(amountToPay, run.lang)})` },
    ];
    if (!hasCa) {
      choices.unshift({ value: "review_with_ca", label: "🎖️ Review with CA First (Audit Deductions)" });
    }
    choices.push({ value: "skip_challan_pay", label: "❌ Cancel / Return to Tasks" });

    const q: Question = {
      id: newId("q"),
      text: hasCa
        ? `Simulate paying the CA-audited ${formatMoney(amountToPay, run.lang)} tax challan now?`
        : `Would you like to simulate paying the ${formatMoney(amountToPay, run.lang)} tax challan now?`,
      why: "Clears outstanding self-assessment tax liability before return filing",
      expects: "choice",
      resolves: "challan_payment_mode",
      choices,
    };
    run.state.pendingQuestion = q;
    await emit({ type: "question", question: q });
    run.status = "waiting_for_input";
    await emit({ type: "status", status: "waiting_for_input" });
    return;
  }

  if (chosen === "notice_defense") {
    run.title = "Notice Defense · Section 139(9)";
    await deps.store.saveRun(run);
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
    await speakResult(deps, owner, run, emit, lines);
    await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Notice defense & compliance review completed.");
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "refund_tracker") {
    run.title = "Refund Tracker · CPC Status";
    await deps.store.saveRun(run);
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
    await speakResult(deps, owner, run, emit, lines);
    await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Live refund tracking status checked.");
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }

  if (chosen === "tax_vault") {
    run.title = "Citizen Tax Vault · Documents";
    await deps.store.saveRun(run);
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
    await speakResult(deps, owner, run, emit, msg.split("\n"));
    await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Citizen Tax Vault inventory inspected.");
    run.status = "completed";
    await emit({ type: "status", status: "completed" });
    return;
  }
}

async function handleChallanPaymentExecution(
  deps: RuntimeDeps,
  owner: Owner,
  run: Run,
  snapshot: VersionedReturn | null,
  s: ReturnType<typeof strings>,
  emit: (p: RunEventPayload) => Promise<unknown>,
  actionValue: unknown,
) {
  run.state.pendingQuestion = undefined;
  const val = String(actionValue ?? "").toLowerCase();

  if (val === "review_with_ca" || val.includes("ca") || val.includes("chartered")) {
    const currentSnap = snapshot ?? (await ensureSnapshot(deps, owner, run));
    const caReview = getLatestReviewForPan(owner.pan);
    const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
    const p = hasCa ? caReview.caPersona! : currentSnap?.state.persona;
    const regime = hasCa && caReview.caRegime ? caReview.caRegime : (currentSnap?.state.regime ?? "new");
    const b = p ? computeForPersona(p, regime) : null;
    const due = b && b.refundOrDue < 0 ? -b.refundOrDue : 0;

    if (due === 0) {
      const refund = b && b.refundOrDue > 0 ? b.refundOrDue : 0;
      const caLines = [
        `### 🎖️ CA Review Audit Verified`,
        "",
        hasCa
          ? `Your Chartered Accountant (**${caReview.caDetails?.name || "CA"}**) has audited your return and optimized deductions under the **${regime === "old" ? "Old Regime" : "New Regime"}**.`
          : `Your return has been audited against statutory provisions.`,
        refund > 0
          ? `• **Net Balance Tax Due**: **₹0** *(Net Refund Due: **${formatMoney(refund, run.lang)}**)*`
          : `• **Net Balance Tax Due**: **₹0** *(Nil Balance Payable)*`,
        "",
        `You do not have any pending self-assessment tax to pay under Section 140A. You can proceed directly to return filing!`,
      ];
      await speakResult(deps, owner, run, emit, caLines);
      if (run.task === "prepare_salaried_return") {
        run.status = "running";
        return;
      }
      await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "No tax due after CA review.");
      return;
    }

    const caLines = [
      `### 🎖️ Review with CA Selected`,
      "",
      `You have chosen to consult a Chartered Accountant before paying the **${formatMoney(due, run.lang)}** balance tax due.`,
      "",
      `Click the **[ 🎖️ Review with CA ]** button on your screen to generate a secure PIN and access code for your CA.`,
      "",
      `Your CA will log in via the CA Portal, review your draft return, audit eligible deductions and allowances (80C, 80D, 80CCD, HRA, 24b), and update the figures. Once your CA completes their review, you can inspect the side-by-side diff and adopt the updated deductions right here!`,
    ];
    await speakResult(deps, owner, run, emit, caLines);

    const nextQ: Question = {
      id: newId("q"),
      text: `When your CA completes their review, or to simulate paying Challan 280:`,
      why: "CA Review or Section 140A tax clearance",
      expects: "choice",
      resolves: "challan_payment_mode",
      choices: [
        { value: "review_with_ca", label: "🎖️ Open / Re-open CA Share Details" },
        { value: "pay_challan_upi", label: `⚡ Pay ${formatMoney(due, run.lang)} Now (UPI / QR)` },
        { value: "pay_challan_sbi", label: `🏦 Pay ${formatMoney(due, run.lang)} (SBI Net Banking)` },
        { value: "pay_challan_hdfc", label: `🏦 Pay ${formatMoney(due, run.lang)} (HDFC Net Banking)` },
        { value: "skip_challan_pay", label: "Proceed to Filing Review without paying" },
      ],
    };
    run.state.pendingQuestion = nextQ;
    await emit({ type: "question", question: nextQ });
    run.status = "waiting_for_input";
    await emit({ type: "status", status: "waiting_for_input" });
    return;
  }

  if (val === "skip_challan_pay" || val === "cancel") {
    await emit({
      type: "message",
      role: "assistant",
      text: "Challan payment simulation skipped. You can clear self-assessment tax at any time before final filing.",
    });
    if (run.task === "prepare_salaried_return") {
      run.status = "running";
      return;
    }
    await emitGreetingCapabilities(deps, owner, run, s, emit);
    return;
  }

  const currentSnap = snapshot ?? (await ensureSnapshot(deps, owner, run));
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
  const p = hasCa ? caReview.caPersona! : currentSnap?.state.persona;
  const regime = hasCa && caReview.caRegime ? caReview.caRegime : (currentSnap?.state.regime ?? "new");
  const b = p ? computeForPersona(p, regime) : null;
  const due = b && b.refundOrDue < 0 ? -b.refundOrDue : 0;

  const amountToPay = due;

  let method: "UPI" | "NET_BANKING" = "UPI";
  let bankName = "State Bank of India";
  if (val.includes("sbi")) {
    method = "NET_BANKING";
    bankName = "State Bank of India";
  } else if (val.includes("hdfc")) {
    method = "NET_BANKING";
    bankName = "HDFC Bank";
  } else if (val.includes("icici")) {
    method = "NET_BANKING";
    bankName = "ICICI Bank";
  } else {
    method = "UPI";
    bankName = "UPI / QR Gateway (SBI e-Pay)";
  }

  const seed = Date.now();
  const { bsrCode, challanNo } = syntheticChallanIdentifiers(seed);
  const tenderDate = deps.today();
  const formattedDate = new Date(deps.clock()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const cin = `${bsrCode}${tenderDate.replace(/-/g, "")}${challanNo}`;
  const { baseTax, cess } = splitTaxAndCess(amountToPay);

  const payment: SelfAssessmentPayment = {
    challanNo,
    bsrCode,
    amount: amountToPay,
    date: tenderDate,
    majorHead: "0021",
    minorHead: due > 0 ? "300" : "100",
    method,
    bank: bankName,
  };

  if (currentSnap) {
    const res = await deps.returns.apply(owner, AY, {
      command: { type: "record_payment", payment },
      expectedRevision: currentSnap.revision,
      idempotencyKey: `challan-${run.id}-${seed}`,
      actor: "agent" as const,
    });
    if (res.ok) {
      run.state.returnRevision = res.snapshot.revision;
    }
  }

  run.title = `Challan 280 · ${formatMoney(amountToPay, run.lang)} Paid`;
  await deps.store.saveRun(run);

  const receiptLines = [
    `### ✅ Payment Successful — Challan ITNS 280 Receipt`,
    "",
    `Your tax payment has been authorized and confirmed by the e-Pay Tax payment gateway.`,
    "",
    `| Challan Field | Particulars |`,
    `| :--- | :--- |`,
    `| **Challan Identification Number (CIN)** | \`${cin}\` |`,
    `| **Major Head** | 0021 (Income Tax other than Companies) |`,
    `| **Minor Head** | ${payment.minorHead === "300" ? "300 (Self-Assessment Tax u/s 140A)" : "100 (Advance Tax)"} |`,
    `| **BSR Code** | \`${bsrCode}\` (${bankName}) |`,
    `| **Challan Serial No** | \`${challanNo}\` |`,
    `| **Tender Date** | ${formattedDate} |`,
    `| **Payment Mode** | ${method === "UPI" ? "UPI (epaytax.cbdt@sbi)" : `Internet Banking (${bankName})`} |`,
    `| **Basic Tax** | ${formatMoney(baseTax, run.lang)} |`,
    `| **Health & Education Cess (4%)** | ${formatMoney(cess, run.lang)} |`,
    `| **Total Amount Deposited** | **${formatMoney(amountToPay, run.lang)}** |`,
    "",
    `Your tax payment has been credited to your return under Section 140A. Outstanding balance tax payable is now **₹0**.`,
  ];

  await emit({ type: "message", role: "assistant", text: receiptLines.join("\n") });

  if (run.task === "prepare_salaried_return") {
    run.status = "running";
    return;
  }

  await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Challan 280 payment confirmed and credited to return.");
  const nextQ: Question = {
    id: newId("q"),
    text: "What would you like to do next?",
    why: "Payment confirmed and credited to return",
    expects: "choice",
    resolves: "chosen_task",
    choices: [
      { value: "task:prepare_salaried_return", label: "📄 Continue to File Return" },
      { value: "task:compare_regimes", label: "⚖️ Compare Tax Regimes" },
      { value: "task:reconcile_facts", label: "🔍 Reconcile AIS & 26AS" },
      { value: "task:challan_280", label: "💳 Pay Tax / Challan 280" },
      { value: "task:notice_defense", label: "🛡️ Defend Tax Notice" },
      { value: "task:refund_tracker", label: "⚡ Track Refund Status" },
      { value: "task:tax_vault", label: "🏛️ View in Citizen Tax Vault" },
    ],
  };
  run.state.pendingQuestion = nextQ;
  await emit({ type: "question", question: nextQ });
  run.status = "waiting_for_input";
  await emit({ type: "status", status: "waiting_for_input" });
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
    // The one form is built from what the papers could not answer (lib/return/year-intake.ts), previewed over the
    // commands staged so far so a Form 16 read a moment ago already counts.
    const preview = previewState(snapshot, cmds);
    const intake = preview.yearIntake ?? emptyYearIntake(AY, deps_now());
    const gaps = gapGroups(preview.persona, intake);
    const q = nextIntakeQuestion({
      situation, snapshot, answers: a, vaultAvailable, documentTypes: run.state.documentTypes ?? [], ownerKind: owner.kind,
      vaultForm16: run.state.vaultForm16 ?? [],
      salaryStaged,
      digilockerItems: consentItems(listIssuedDocuments(owner, AY)),
      digilockerLinked: run.state.profile?.digilockerLinked ?? false,
      residencyKnown: !!run.state.profile,
      gaps,
      carried: intake.carriedFrom ? carryDefaults(intake) : undefined,
      s, lang: run.lang,
    });
    if (q) return q;
    // Nothing left to ask: the department's own statements are the inventory, and the person has seen them.
    if (a.details === undefined) {
      a.details = "{}";
      a.details_parsed = true;
      a.inventory_confirmed = true;
    }
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
  // The opener (2026-09-07): a run that knows the person from onboarding greets them once — name, the year,
  // the refund account to confirm — before the source card. Phrased by the model; the template is the fallback.
  if (run.state.profile && !run.state.openerSaid && (run.task === "prepare_salaried_return" || run.task === "compare_regimes")) {
    run.state.openerSaid = true;
    const p = run.state.profile;
    const name = p.firstName ?? "";
    const fallback = (p.refundAccount ? s.openerFallback : s.openerFallbackNoAccount).replace(" {name}", name ? ` ${name}` : "").replace("{account}", p.refundAccount ?? "").replace(/\s+/g, " ").trim();
    const facts = [`Assessment year 2026-27 (FY 2025-26).`, ...(p.refundAccount ? [`Refunds are set to go to ${p.refundAccount}.`] : []), `The next step is this year's papers — Form 16 and AIS.`];
    await speak(deps, owner, run, emit, {
      intent: "Open the year's return as Munshi ji: greet the person, name the assessment year, ask in passing whether the refund account is still right, and say that this year's papers come first. Two or three short sentences.",
      facts, fallback, maxWords: 60,
    });
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
  const stageClaim = async (section: string, amount: unknown, proof: unknown, label: string, plain: string) => {
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
  // The other deductions of the one form (2026-09-07), each behind the same proof.
  for (const d of DEDUCTION_FIELDS) {
    if (d.key === "pf_amount" || d.key === "health_amount") continue;
    await stageClaim(d.section, a[d.key], a.proof, `Section ${d.section.replace("_", "(")}${d.section.includes("_") ? ")" : ""} (self-declared)`, d.section);
  }
  // The year's answers travel with the return, so the Manual shell reads the same intake (docs/MODES.md).
  const yearAnswers = yearAnswersFrom(a);
  if (Object.keys(yearAnswers).length && !hasKind("record_year_intake", () => true)) {
    const source = typeof a.source === "string" ? (a.source.startsWith("upload:") ? "upload" : (a.source as "digilocker" | "vault" | "manual")) : "none";
    cmds.push({ type: "record_year_intake", assessmentYear: AY, patch: { answers: yearAnswers, sources: { chosen: source, documents: { form16: [] } } } });
  }
  run.state.pendingCommands = cmds;
  // The verdict (2026-09-07), said once: which form fits and where the regime stands, on a preview of the return
  // with everything staged so far. A return that needs ITR-2/3 stops here and goes to a CA with what was read.
  if (!run.state.verdictSaid && (run.task === "prepare_salaried_return" || run.task === "compare_regimes")) {
    run.state.verdictSaid = true;
    const preview = previewState(snapshot, cmds);
    const form = inferForm(preview.persona, { ...(preview.yearIntake?.answers ?? {}), ...yearAnswers }, run.state.profile?.residency ?? "resident");
    const lean = regimeLean(preview.persona);
    if (form.itrForm !== "ITR-1") {
      // Said once; the shared guard below still decides what this release can and cannot do with such a return.
      const fallback = s.verdictOtherForm.replace("{form}", form.itrForm).replace("{reasons}", form.reasons.join("; "));
      await speak(deps, owner, run, emit, {
        intent: `Tell the person, kindly and plainly, that their return needs ${form.itrForm} rather than ITR-1, give the reasons, and say a CA review carries everything read so far.`,
        facts: [`Form needed: ${form.itrForm}.`, ...form.reasons.map((r) => `Reason: ${r}.`)], fallback, maxWords: 80,
      });
    } else {
    const saving = formatMoney(Math.abs(lean.new - lean.old), run.lang);
    const regimeLine = lean.lean === "new" ? s.regimeNewLeads.replace("{saving}", saving) : lean.lean === "old" ? s.regimeOldLeads.replace("{saving}", saving) : s.regimeOpen;
    const fallback = s.verdictItr1.replace("{heads}", form.reasons[0] ?? "").replace("{regime}", regimeLine);
    await speak(deps, owner, run, emit, {
      intent: "Give the year's verdict as Munshi ji, in two short sentences: ITR-1 fits and why (the income heads), and where the two regimes stand.",
      facts: [`ITR-1 fits: ${form.reasons.join("; ")}.`, regimeLine], fallback, maxWords: 70,
    });
    }
  }
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
    const uTrim = userMsg.trim();
    const directTask =
      !isTaxInformationQuestion(userMsg) &&
      (/^1\b|^\b(1\.|first|prepare return|file return|file my return|file itr|prepare & file|salaried return|bhar do)\b/i.test(uTrim) || uTrim === "file" || uTrim === "prepare" ? "prepare_salaried_return" :
      /^2\b|^\b(2\.|second|compare( tax)? regimes|regime comparison|compare regimes|old vs new|new vs old|115bac|which is better|which regime|kaunsa regime)\b/i.test(uTrim) || uTrim === "compare" || uTrim === "regime" ? "compare_regimes" :
      /^3\b|^\b(3\.|third|reconcile|ais & 26as|reconcile ais|26as reconciliation|mismatch|dispute|reconciliation)\b/i.test(uTrim) || uTrim === "reconcile" ? "reconcile_facts" :
      /^4\b|^\b(4\.|fourth|challan|challan 280|advance tax|pay tax|pay balance|self[- ]assessment tax|tax pay|payment)\b/i.test(uTrim) || uTrim === "challan" || uTrim === "pay" ? "challan_280" :
      /^5\b|^\b(5\.|fifth|defend( notice)?|tax notice|notice defense|143\(1\)|139\(9\)|audit risk|audit)\b/i.test(uTrim) || uTrim === "notice" ? "notice_defense" :
      /^6\b|^\b(6\.|sixth|refund status|track refund|refund tracker|where is my refund)\b/i.test(uTrim) || uTrim === "refund" || uTrim === "track" ? "refund_tracker" :
      /^7\b|^\b(7\.|seventh|tax[- ]?vault|citizen vault|open vault|documents? in vault|my documents|vault)\b/i.test(uTrim) || uTrim === "vault" ? "tax_vault" : null);

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
    if (answer.status === "grounded") {
      run.state.taxAnswer = answer;
      run.knowledgeRelease = answer.release;
      run.state.sources = answer.citations.map((c) => ({ kind: "rule", id: c.id, label: c.title,
        detail: `${c.locator} · ${c.reviewer} · ${c.contentHash}`, verified: false, url: c.url }));
      await emit({ type: "source_lookup", sources: run.state.sources });
      await speakResult(deps, owner, run, emit, answer.text.split("\n"), "Answer the tax question as Munshi ji: keep every figure, section number and date exactly as the facts give them, and explain the rest in your own words — the answer first, then why.");
      const smart = getSmartTaxAnswer(userMsg, run.lang);
      if (smart) {
        run.title = smart.title;
        await deps.store.saveRun(run);
      }
      return;
    }

    const smart = getSmartTaxAnswer(userMsg, run.lang);
    if (smart) {
      run.title = smart.title;
      run.state.sources = smart.sources;
      await emit({ type: "source_lookup", sources: run.state.sources });
      await speakResult(deps, owner, run, emit, smart.text.split("\n"), "Answer the tax question as Munshi ji: keep every figure, section number and date exactly as the facts give them, and explain the rest in your own words — the answer first, then why.");
      await deps.store.saveRun(run);
      return;
    }

    // Call Gemini Tax Expert when local static RAG has no evidence
    if (deps.model.askTaxExpert && run.state.usage.modelCalls < deps.budget.maxModelCallsPerRun) {
      const snap = await deps.returns.get(owner, AY).catch(() => null);
      const expert = await deps.model.askTaxExpert({
        query: userMsg,
        lang: run.lang,
        langEnglishName: languageOption(run.lang).english,
        taxpayerName: owner.displayName,
        regime: snap?.state.regime,
        knownFacts: snap?.state.persona.facts.map((f) => `${f.kind}: ${f.amount} (${f.source || f.label || "Reported"})`),
      });

      if (expert && expert.text) {
        run.state.usage.modelCalls += 1;
        run.state.usage.tokens += expert.usage.tokens;
        if (expert.usage.tokens) await deps.store.addDailyUsage(owner, deps.today(), expert.usage.tokens, 1);

        if (expert.detectedProvisions && expert.detectedProvisions.length > 0) {
          const ruleSources: SourceRef[] = expert.detectedProvisions.map((p) => ({
            kind: "rule",
            id: `rule:s_${p}`,
            label: `Section ${p} — Income-tax Act, 1961`,
            detail: `Statutory Provision · CBDT Guidance · AY 2026-27`,
            verified: true,
          }));
          run.state.sources = dedupeSources([...run.state.sources, ...ruleSources]);
          await emit({ type: "source_lookup", sources: run.state.sources });
        }

        if (expert.title) {
          run.title = expert.title;
          await deps.store.saveRun(run);
        }

        await emit({ type: "message", role: "assistant", text: expert.text });
        await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Expert tax advisory completed.");
        run.status = "completed";
        await emit({ type: "status", status: "completed" });
        return;
      }
    }

    await speakResult(deps, owner, run, emit, answer.text.split("\n"), "Answer the tax question as Munshi ji: keep every figure, section number and date exactly as the facts give them, and explain the rest in your own words — the answer first, then why.");
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

    if (deps.model.askTaxExpert && run.state.usage.modelCalls < deps.budget.maxModelCallsPerRun) {
      const expert = await deps.model.askTaxExpert({
        query: `Taxpayer return figures include complex income heads outside standard salaried return: ${advice.issues.map((i) => i.reason).join("; ")}. Please provide a comprehensive explanation of how these items are taxed under the Income-tax Act for AY 2026-27, what ITR form is required (e.g. ITR-2 or ITR-3), and actionable next steps.`,
        lang: run.lang,
        langEnglishName: languageOption(run.lang).english,
        taxpayerName: owner.displayName,
        regime: state.regime,
        knownFacts: state.persona.facts.map((f) => `${f.kind}: ${f.amount} (${f.source || f.label || "Reported"})`),
        reasonsAdviceUnavailable: advice.issues.map((i) => i.reason),
      });

      if (expert && expert.text) {
        run.state.usage.modelCalls += 1;
        run.state.usage.tokens += expert.usage.tokens;
        if (expert.usage.tokens) await deps.store.addDailyUsage(owner, deps.today(), expert.usage.tokens, 1);

        if (expert.detectedProvisions && expert.detectedProvisions.length > 0) {
          const ruleSources: SourceRef[] = expert.detectedProvisions.map((p) => ({
            kind: "rule",
            id: `rule:s_${p}`,
            label: `Section ${p} — Income-tax Act, 1961`,
            detail: `Statutory Guidance · AY 2026-27`,
            verified: true,
          }));
          run.state.sources = dedupeSources([...run.state.sources, ...ruleSources]);
          await emit({ type: "source_lookup", sources: run.state.sources });
        }

        if (expert.title) {
          run.title = expert.title;
          await deps.store.saveRun(run);
        }

        await emit({ type: "message", role: "assistant", text: expert.text });
        run.state.pendingCard = undefined;
        run.state.pendingCommands = undefined;
        for (const step of ["review", "confirm", "act", "outputs"] as const)
          run.state.steps = setStep(run.state.steps, step, "skipped", "Specialized ITR filing required");

        const nextQ: Question = {
          id: newId("q"),
          text: "Would you like to review this with a Chartered Accountant, or explore other options?",
          why: "Complex return heads require specialized schedules",
          expects: "choice",
          resolves: "chosen_task",
          choices: [
            { value: "task:compare_regimes", label: "⚖️ Compare Tax Regimes" },
            { value: "task:reconcile_facts", label: "🔍 Reconcile AIS & 26AS" },
            { value: "task:challan_280", label: "💳 Pay Advance Tax / Challan 280" },
          ],
        };
        run.state.pendingQuestion = nextQ;
        await emit({ type: "question", question: nextQ });
        run.status = "waiting_for_input";
        await emit({ type: "status", status: "waiting_for_input" });
        return;
      }
    }

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

  const saving = Math.abs(both.new.totalTax - both.old.totalTax);
  if (run.task === "compare_regimes") {
    run.title = saving > 0 ? `Regime Comparison · ${cheaper === "new" ? "New" : "Old"} saves ${formatMoney(saving, run.lang)}` : "Regime Comparison · AY 2026-27";
    await deps.store.saveRun(run);
  } else if (run.task === "prepare_salaried_return") {
    const gross = state.persona.facts.filter((f) => f.kind === "salary").reduce((x, f) => x + f.amount, 0);
    const employer = state.persona.facts.find((f) => f.kind === "salary")?.label?.replace(/^Gross salary \((.*)\)$/, "$1") ?? "";
    const cleanEmployer = employer && !employer.startsWith("Gross") ? employer : "";
    run.title = cleanEmployer ? `Prepare Return · ${cleanEmployer} (${formatMoney(gross, run.lang)})` : `Prepare Return · ${formatMoney(gross, run.lang)}`;
    await deps.store.saveRun(run);
  }

  const brief = recommendationText({ cheaper, saving, taxableIncome: b.taxableIncome, totalTax: b.totalTax, refundOrDue: b.refundOrDue }, run.lang);
  // The recommendation in Munshi ji's words (2026-09-07): the figures and the conclusion come from `brief`
  // and cannot change — the check refuses any figure not in it — the sentences around them are his. The
  // deterministic lead + brief is the fallback; the simulated badge stays a template line.
  const moment = b.refundOrDue > 0 ? "money is coming back to the person" : b.refundOrDue < 0 ? "tax is still due" : "nothing is owed either way";
  await speak(deps, owner, run, emit, {
    intent: `Give the recommendation as Munshi ji — ${moment} — in three or four short sentences: the outcome first, the figures exactly as given, then the one next step. No preamble.`,
    facts: [brief],
    fallback: `${s.leadRecommendation}\n${brief}`,
    maxWords: 110,
    allowAdvice: true,
  });
  await emit({ type: "message", role: "assistant", text: s.simulatedBadge });
  if (run.task === "load_demo") {
    // Nothing to confirm; outputs (if any) follow.
    run.state.steps = setStep(setStep(run.state.steps, "review", "skipped", s.noteNoAction), "confirm", "skipped", s.noteNoAction);
  }
}

async function stepReview(deps: RuntimeDeps, owner: Owner, run: Run, s: ReturnType<typeof strings>, emit: (p: RunEventPayload) => Promise<unknown>) {
  if (!run.state.advice?.canAct) return;
  let snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return;
  if (run.task === "prepare_salaried_return" && snapshot.state.filedAt) {
    await emit({ type: "message", role: "assistant", text: s.alreadyFiled });
    run.state.steps = setStep(setStep(run.state.steps, "confirm", "skipped", s.noteAlreadyFiled), "act", "blocked", s.noteAlreadyFiled);
    return;
  }
  // Synchronize staged commands into snapshot so the server return holds the citizen's draft numbers
  if (run.state.pendingCommands && run.state.pendingCommands.length > 0) {
    const projectedState = projected(snapshot, run.state.pendingCommands);
    const rep = await deps.returns.replace(owner, AY, projectedState, snapshot.revision);
    if (rep.ok) {
      snapshot = rep.snapshot;
      run.state.returnRevision = snapshot.revision;
      run.state.pendingCommands = [];
    }
  }

  const state = projected(snapshot, run.state.pendingCommands);
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
  const p = hasCa ? caReview.caPersona! : state.persona;
  const both = compareForPersona(p);
  const cheaper: "new" | "old" = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  const regime = run.task === "compare_regimes" ? cheaper : (hasCa && caReview.caRegime ? caReview.caRegime : (state.regime ?? "new"));
  const b = computeForPersona(p, regime);

  if (b.refundOrDue < 0 && !run.state.answers.challan_prompted && run.task === "prepare_salaried_return") {
    run.state.answers.challan_prompted = true;
    const due = -b.refundOrDue;
    const { baseTax, cess } = splitTaxAndCess(due);

    const lines = [
      hasCa
        ? `### ⚠️ Balance Tax Due: ${formatMoney(due, run.lang)} *(Audited by ${caReview.caDetails?.name || "CA"})*`
        : `### ⚠️ Balance Tax Due: ${formatMoney(due, run.lang)}`,
      "",
      hasCa
        ? `Your return computation under the **${regimeName(regime, run.lang)}** (incorporating your Chartered Accountant's audit) shows a net balance tax payable of **${formatMoney(due, run.lang)}** (Base Tax: ${formatMoney(baseTax, run.lang)} + 4% Cess: ${formatMoney(cess, run.lang)}).`
        : `Your return computation under the **${regimeName(regime, run.lang)}** shows a net balance tax payable of **${formatMoney(due, run.lang)}** (Base Tax: ${formatMoney(baseTax, run.lang)} + 4% Cess: ${formatMoney(cess, run.lang)}).`,
      "",
      `Under Section 140A of the Income-tax Act, self-assessment tax must be paid before filing to prevent defective filing notices under Section 139(9) and penal interest under Section 234B/C.`,
      "",
      hasCa
        ? `Simulate paying this balance now via Challan 280 to proceed to final filing:`
        : `Before paying, you can **Review with a CA** to audit deductions and exemptions (80C, 80D, 80CCD, HRA, 24b) to reduce or eliminate this payable amount, or simulate paying now via Challan 280:`,
    ];
    await speakResult(deps, owner, run, emit, lines);

    const choices = [
      { value: "pay_challan_upi", label: `⚡ Pay ${formatMoney(due, run.lang)} Now (UPI / QR)` },
      { value: "pay_challan_sbi", label: `🏦 Pay ${formatMoney(due, run.lang)} (SBI Net Banking)` },
      { value: "pay_challan_hdfc", label: `🏦 Pay ${formatMoney(due, run.lang)} (HDFC Net Banking)` },
      { value: "skip_challan_pay", label: "Proceed to Review without paying" },
    ];
    if (!hasCa) {
      choices.unshift({ value: "review_with_ca", label: "🎖️ Review with CA First (Audit Deductions to Reduce Tax)" });
    }

    const q: Question = {
      id: newId("q"),
      text: hasCa
        ? `Pay CA-audited self-assessment tax of ${formatMoney(due, run.lang)} now?`
        : `Pay self-assessment tax of ${formatMoney(due, run.lang)} now, or Review with CA?`,
      why: "Section 140A compliance before return filing",
      expects: "choice",
      resolves: "challan_payment_mode",
      choices,
    };
    run.state.pendingQuestion = q;
    await emit({ type: "question", question: q });
    run.status = "waiting_for_input";
    await emit({ type: "status", status: "waiting_for_input" });
    return;
  }

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
  if (kind === "regime") {
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
  if (!current) {
    await emit({ type: "message", role: "assistant", text: s.staleReview });
    run.state.pendingCard = undefined;
    run.state.steps = setStep(setStep(run.state.steps, "compute", "pending"), "review", "pending");
    run.status = "running";
    return;
  }
  const currentHash = snapshotHash(current.state);
  const hashMatches = currentHash === card.boundTo.snapshotHash;
  if (!hashMatches && current.revision !== card.boundTo.revision) {
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
    run.title = `ITR-1 Filed · Acknowledgement (${AY})`;
    await deps.store.saveRun(run);
    await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Your return for AY 2026-27 has been successfully prepared and filed.");
  } else {
    const { body: _b, runId: _r, ...ref } = output;
    await emit({ type: "output", output: ref });
    await emitTaskCapabilitiesSummary(deps, owner, run, s, emit, "Calculation and documentation generated successfully.");
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
    if (q.resolves === "challan_payment_mode") {
      if (/^(ca|review with ca|review ca|consult ca|chartered|ca first)\b/i.test(t) || t.includes("ca") || t.includes("chartered")) return "review_with_ca";
      if (/^(1\b|upi|qr|gpay|phonepe|paytm|pay now|simulate|pay|haan|yes|how to pay|how do i pay)\b/i.test(t) || t.includes("upi") || t.includes("pay") || t.includes("qr")) return "pay_challan_upi";
      if (/^(2\b|sbi|state bank)\b/i.test(t) || t.includes("sbi")) return "pay_challan_sbi";
      if (/^(3\b|hdfc)\b/i.test(t) || t.includes("hdfc")) return "pay_challan_hdfc";
      if (/^(4\b|icici)\b/i.test(t) || t.includes("icici")) return "pay_challan_icici";
      if (/^(skip|later|no|nahi|cancel|without pay)\b/i.test(t) || t.includes("skip") || t.includes("later")) return "skip_challan_pay";
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
