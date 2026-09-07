/**
 * Munshi ji thinks; the engine counts (2026-09-07, user direction: "completely free of any gates… respond
 * naturally… generate answers tailored to the specific question… guide them through the whole journey").
 *
 * One loop per turn. The model gets his character, the person's situation as it stands (figures from the
 * engine, papers in the vault, what is staged, what already happened), the conversation so far, and a set of
 * tools. It decides what to say and what to do. Tools that need the person — a consent, a form, a document, a
 * review card, a payment method — put a card on screen and STOP the turn; the model never confirms anything
 * on the person's behalf (plan §5.2). Every reply is checked: a figure the model did not get from a tool, the
 * facts or the person is refused, once with a nudge, then held back (`say.ts whyRejected`).
 *
 * No intent regex, no canned answers, no menus. When the model is off, one honest sentence says so.
 */

import { languageOption } from "../i18n/languages";
import { PERIOD_FY_2025_26 } from "../knowledge/provisions";
import { cite, retrieve } from "../knowledge/retrieval";
import { formatMoney } from "../money";
import type { VersionedReturn } from "../return/snapshot-store";
import {
  absorbDocument, buildReviewCard, dedupeSources, ensureSnapshot, executePayment, fieldFacts, firstName, listPapers, markStep, noticeFacts, opportunities,
  paymentQuestion, pullDigiLocker, reconciliation, refundFacts, returnSummary, stageChanges, whatIf, yearFormQuestion, type ActionCtx, type DocumentFields,
} from "./actions";
import { consentItems, listIssuedDocuments } from "./digilocker";
import type { ConverseMessage, ToolCall, ToolDeclaration } from "./model";
import { characterPrompt } from "./munshi-character";
import { redactText } from "./redact";
import { digitsOf, replyLanguageName, whyRejected } from "./say";
import { newId } from "./store";
import { personaForOwner } from "./tools";
import { MEMORY_KEYS, type Question, type TranscriptEntry } from "./types";

export const MAX_HOPS = 8;
const TRANSCRIPT_KEEP = 40;
const TOOL_TEXT_KEEP = 1_600;

/* -------------------------------------------------------------------- tools -- */

const STR = { type: "STRING" } as const;
const NUM = { type: "NUMBER" } as const;
const BOOL = { type: "BOOLEAN" } as const;
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "OBJECT", properties, ...(required.length ? { required } : {}) });
const arr = (items: unknown) => ({ type: "ARRAY", items });

export const TOOLS: ToolDeclaration[] = [
  { name: "get_return", description: "The person's return for AY 2026-27 as recorded: every income fact with who reported it, tax already paid, deductions claimed, regime, filed status, what is staged, and the engine's figures under BOTH regimes. Call this before answering anything about their own money.", parameters: obj({}) },
  { name: "compute_tax", description: "What-if arithmetic from the engine: the return with extra deductions (extraClaims: section + amount, e.g. 80C 150000, 80D_SELF 25000, 80CCD_1B 50000, 24B 200000, 80GG 60000, 80TTA 10000, 80CCD(2) …), extra income, a regime, a smaller salary (reduceSalaryBy, for structuring what-ifs). Use it to price ANY suggestion before making it — never estimate tax yourself. Stages nothing.", parameters: obj({ regime: { type: "STRING", enum: ["new", "old"] }, extraClaims: arr(obj({ section: STR, amount: NUM }, ["section", "amount"])), extraIncome: arr(obj({ kind: { type: "STRING", enum: ["salary", "interest", "dividend", "rent", "other"] }, amount: NUM }, ["kind", "amount"])), removeClaimSections: arr(STR), reduceSalaryBy: NUM }) },
  { name: "scan_opportunities", description: "What this person could still avail, priced by the engine: deductions with headroom this year (claim_now), salary structures for next year through the employer (next_year: employer NPS 80CCD(2), meal vouchers, LTA), and things worth a question (check). Use it whenever someone asks how to pay less, what they are missing, or before recommending a regime.", parameters: obj({}) },
  { name: "lookup_rules", description: "The FY 2025-26 rule book (Income-tax Act, 1961, AY 2026-27): the reviewed paraphrases with section, locator and source URL for a question. Use it for any rule, rate, threshold, due date or form you are not certain of, and to cite.", parameters: obj({ question: STR }, ["question"]) },
  { name: "list_documents", description: "The papers: what the vault holds for this year (Form 16, AIS, 26AS, uploads; with ids and whether consent to read was given) and what the person's DigiLocker can hand over.", parameters: obj({}) },
  { name: "read_document", description: "Read a Form 16 or AIS already in the vault and stage what it carries onto the return. Refused until request_consent for that document was answered yes.", parameters: obj({ documentId: STR }, ["documentId"]) },
  { name: "request_consent", description: "Show a consent card and STOP: scope 'digilocker' pulls the person's PAN card, Aadhaar (masked), Form 16, AIS and 26AS from DigiLocker into their vault and reads them; scope 'documents' reads the vault documents listed in documentIds. `text` is your question in your own words (it must name DigiLocker or the documents). Nothing is fetched or read before the person says yes.", parameters: obj({ scope: { type: "STRING", enum: ["digilocker", "documents"] }, documentIds: arr(STR), text: STR }, ["scope", "text"]) },
  { name: "ask", description: "Show one question card and STOP, when a click or an upload is better than typing: kind yes_no (a decision), choice (2–6 options with value+label), number (one rupee figure), text, or file (a document to upload; give docType FORM_16 | ANNUAL_INFO_STATEMENT | FORM_26AS | BANK_STATEMENT | OTHER). For a conversational question, just ask in your reply instead.", parameters: obj({ text: STR, why: STR, kind: { type: "STRING", enum: ["yes_no", "choice", "number", "text", "file"] }, choices: arr(obj({ value: STR, label: STR }, ["value", "label"])), docType: STR }, ["text", "why", "kind"]) },
  { name: "ask_year_form", description: "Show the year's one form and STOP: only the groups the papers could not answer — where they lived (rent / own / family), anything else this year (business, sold assets, foreign, director, crypto, agri, disability, family pension — the ITR-1 gate), deductions paid outside the employer, and on the no-papers path the salary, employer type and interest. Returns nothingToAsk when the papers answered everything. `text` is your lead-in.", parameters: obj({ text: STR }) },
  { name: "stage_changes", description: "Stage changes to the return for review — never applied here: declare_income {kind, amount}, declare_claim {section, amount, proofAttached}, correct_fact {factId, amount, reason} (a reported figure the person says is wrong), choose_regime {regime}. Returns the preview under both regimes. Follow with show_review when the person is ready.", parameters: obj({ changes: arr(obj({ type: { type: "STRING", enum: ["declare_income", "declare_claim", "correct_fact", "choose_regime"] }, kind: STR, section: STR, amount: NUM, proofAttached: BOOL, label: STR, factId: STR, reason: STR, regime: STR }, ["type"])) }, ["changes"]) },
  { name: "show_review", description: "Put the review card on screen and STOP: kind 'filing' (the whole return, then a SIMULATED filing on confirm), 'regime' (apply the chosen or cheaper regime), 'corrections' (apply the staged changes). Returns blocked with a reason when it cannot: balance_due (offer_payment first), already_filed, unsupported (an income head the engine does not compute), regime_election.", parameters: obj({ kind: { type: "STRING", enum: ["filing", "regime", "corrections"] } }, ["kind"]) },
  { name: "offer_payment", description: "Show the Challan 280 card for the balance due (UPI, net banking, CA review first, not now) and STOP. The payment is simulated and only runs after the person picks a method.", parameters: obj({}) },
  { name: "refund_status", description: "Where the refund stands: filed or not, the state, holds and the timeline, and the account it goes to.", parameters: obj({}) },
  { name: "notices", description: "Any notices or intimations from the department on this return, with what they claim and by when.", parameters: obj({}) },
  { name: "reconcile", description: "The department's statements (AIS / 26AS / Form 16 rows) against what the person declares, row by row, with who can fix a wrong figure.", parameters: obj({}) },
  { name: "remember", description: "Remember one preference for later visits. Keys: preferred_language, employment_category, prefers_regime_explanations, filing_history. Never an amount or an identifier.", parameters: obj({ key: { type: "STRING", enum: [...MEMORY_KEYS] }, value: STR }, ["key", "value"]) },
];

const PAUSING = new Set(["request_consent", "ask", "ask_year_form", "show_review", "offer_payment"]);

const ACTIVITY: Record<string, string> = {
  get_return: "Reading the ledger", compute_tax: "Running the arithmetic", scan_opportunities: "Looking for what you may be missing", lookup_rules: "Checking the rule book",
  list_documents: "Looking at your papers", read_document: "Reading a document", refund_status: "Checking the refund", notices: "Checking for notices", reconcile: "Matching the statements", remember: "Noting a preference",
};

/* ------------------------------------------------------------------- prompt -- */

/** Statutory facts for FY 2025-26 the model may lean on and quote; they also seed the figures it is allowed to say. */
const STATUTORY = [
  "Statutory facts, FY 2025-26 / AY 2026-27 (Income-tax Act, 1961 as amended by Finance Act 2025):",
  "• New regime (s.115BAC, the default): standard deduction ₹75,000 for salaried; rebate u/s 87A up to ₹60,000 when total income is up to ₹12,00,000 (so salaried income up to ₹12,75,000 pays nil), marginal relief just above; slabs 0–4L nil, 4–8L 5%, 8–12L 10%, 12–16L 15%, 16–20L 20%, 20–24L 25%, above 24L 30%; cess 4%. Chapter VI-A is forgone except employer NPS 80CCD(2) (up to 14% of basic+DA) and 80CCH. HRA 10(13A), LTA 10(5), meal-voucher exemption and 24(b) self-occupied interest are NOT available in the new regime.",
  "• Old regime: standard deduction ₹50,000; slabs 0–2.5L nil (3L at 60+, 5L at 80+), 2.5–5L 5%, 5–10L 20%, above 10L 30%; rebate 87A up to ₹12,500 when total income is up to ₹5,00,000. Deductions: 80C ₹1,50,000 (PF, PPF, ELSS, life insurance, tuition, home-loan principal; shared with 80CCC and 80CCD(1) under 80CCE); 80CCD(1B) ₹50,000 own NPS; 80D ₹25,000 self/family (₹50,000 at 60+) and separately ₹25,000/₹50,000 parents, preventive check-up ₹5,000 within it; 24(b) ₹2,00,000 self-occupied home-loan interest; 80E education-loan interest (no cap, 8 years); 80EEB ₹1,50,000 EV-loan interest; 80G donations (50%/100%, some capped at 10% of income); 80GG rent when no HRA: least of ₹5,000/month, 25% of adjusted total income, rent minus 10% of it, Form 10BA; 80TTA ₹10,000 savings interest (80TTB ₹50,000 at 60+); 80U ₹75,000/₹1,25,000 disability. HRA exemption 10(13A): least of HRA received, 50% (metro) or 40% of basic+DA, rent minus 10% of basic+DA. Meal vouchers exempt ₹50 a meal (about ₹26,400 a year) only when paid as vouchers by the employer. LTA 10(5): actual domestic fare, twice in a 4-year block.",
  "• Structuring: nothing already received this year can be relabelled at filing time; the Form 16 governs. A better structure (employer NPS, meal vouchers, LTA) is arranged with the employer for FY 2026-27. Misreporting invites a s.270A penalty (50% of tax under-reported; 200% if misreporting).",
  "• Choosing the old regime: in the return itself for a salaried person, only in a return filed by the s.139(1) due date 31 July 2026; with business income Form 10-IEA. Belated return by 31 December 2026 (fee u/s 234F ₹5,000; ₹1,000 if income ≤ ₹5,00,000); revised by 31 March 2027. Self-assessment tax u/s 140A is paid (Challan 280, minor head 300) before filing; interest 234B/234C for shortfalls in advance tax when liability exceeds ₹10,000.",
  "• ITR-1 (Sahaj): resident individual, total income ≤ ₹50 lakh, salary/pension, one house property, other sources, LTCG u/s 112A ≤ ₹1,25,000, agricultural income ≤ ₹5,000; not a director, no unlisted shares, no foreign assets, no business. Otherwise ITR-2 (capital gains, more than one house, foreign) or ITR-3/4 (business/profession; presumptive 44AD/44ADA → ITR-4).",
  "• Capital gains: 112A LTCG on listed equity 12.5% above ₹1,25,000; 111A STCG 20%; 112 other LTCG 12.5% without indexation. TDS thresholds from 1 April 2025: 194A ₹50,000 on deposits (₹1,00,000 at 60+); 194 dividends ₹10,000 per payer. Crypto (VDA) 30% u/s 115BBH, 1% TDS u/s 194S. Surcharge starts above ₹50 lakh (not modelled by this engine).",
  "• Sections you may name: 10(5) 10(10) 10(10A) 10(10AA) 10(13A) 10(14) 16(ia) 17(1) 17(2) 17(3) 24(b) 44AD 44ADA 80C 80CCC 80CCD(1) 80CCD(1B) 80CCD(2) 80CCE 80CCH 80D 80DD 80DDB 80E 80EEB 80G 80GG 80TTA 80TTB 80U 87A 111A 112 112A 115BAC 115BBH 139(1) 139(4) 139(5) 139(9) 140A 143(1) 194 194A 194S 234A 234B 234C 234F 245 270A; forms ITR-1 ITR-2 ITR-3 ITR-4, Form 16, Form 26AS, Form 10BA, Form 10-IEA, Form 10E, Challan 280 / ITNS 280; years 2024 2025 2026 2027.",
].join("\n");

const RULES = [
  "How you work here:",
  "• You are the whole agent. Decide what the person needs, use the tools for every figure, document and rule, and answer in your own words. There are no scripts.",
  "• Every rupee figure, rate and threshold you say must come from a tool result, the situation below, the statutory facts, or the person's own message. Never estimate tax — call compute_tax. A reply with a number from nowhere is refused and you will be asked to say it again.",
  "• Documents are read only after request_consent was answered yes. DigiLocker is pulled only after request_consent(digilocker) was answered yes. Never claim to have read or fetched anything the tools did not return.",
  "• You never file or pay. show_review and offer_payment put a card in front of the person and stop; they confirm. Everything here is a simulation — say so when it matters, not every turn.",
  "• The journey, when someone wants to file: papers first (DigiLocker if linked, otherwise an upload or the vault), then the year's form for what papers cannot answer, then what they may be missing (scan_opportunities — claim now vs restructure next year), then the regime, then the review card. But follow the person: answer what they asked, in the depth it needs, and carry the journey forward in the same breath rather than in a separate menu.",
  "• Tax questions: answer first, in your own words, complete; cite the section when it matters; lookup_rules for anything you are not certain of. Tailor it to this person's return when you have it. Bullets only for real lists, a table only for figures. No headings for a two-paragraph answer.",
  "• When you need input: a consent → request_consent; several figures → ask_year_form; a click or an upload → ask. A conversational question → ask it in your reply and stop. Do not ask what a tool can tell you.",
  "• Structuring advice: legitimate routes only. This year the Form 16 governs; a better salary structure is arranged with the employer for next year and you say so plainly. Nothing received is relabelled.",
  "• Never write a PAN, Aadhaar, account number or address. Never say 'as an AI'. Never list your capabilities unless asked what you can do — and then say it in a sentence, not a numbered menu.",
  "• When a tool returns blocked or refused, explain it in plain words and offer the next step (a payment before filing, a CA for an income head this engine does not compute).",
  "• Language: answer in the language of the person's latest message — English, Hindi (Devanagari) or Hinglish — and switch when they switch. No other language for now; a message in another script gets English.",
].join("\n");

function situationBlock(ctx: ActionCtx, snapshot: VersionedReturn | null, papers: Awaited<ReturnType<typeof listPapers>>, memory: { key: string; value: unknown }[]): string {
  const { run, deps, owner } = ctx;
  const p = run.state.profile;
  const lines: string[] = [`Today: ${deps.today()}. Assessment year ${snapshot?.state.persona.assessmentYear ?? "2026-27"} (income of FY 2025-26). Reply in ${replyLanguageName(run.state.replyLanguage ?? "en")} — that is how the person wrote their latest message. (Interface language: ${languageOption(run.lang).english}; it labels the cards, not your words.)`];
  lines.push(`The person: ${firstName(owner.displayName) ? `first name ${firstName(owner.displayName)}` : "no name to use"}; ${owner.kind === "demo" ? "a demo persona (synthetic figures)" : "a registered citizen"}${p ? `; residency ${p.residency}; detail mode ${p.mode}; DigiLocker ${p.digilockerLinked ? "linked at onboarding" : "not linked"}${p.refundAccount ? `; refunds go to ${p.refundAccount}` : ""}` : ""}.`);
  if (snapshot) {
    const r = returnSummary(ctx, snapshot);
    const f = r.figures;
    lines.push(`Return (revision ${r.revision}): regime on record ${r.regimeOnRecord}; ${r.filed ? `FILED on ${r.filedAt}` : "not filed"}.`);
    lines.push(r.facts.length ? `Income on record: ${r.facts.slice(0, 12).map((x) => `${x.kind} ${formatMoney(x.amount, run.lang)} (${x.reportedBy}, ${x.statement})`).join("; ")}.` : "Income on record: none yet — the papers or the person have to supply it.");
    if (r.taxPaid.length) lines.push(`Tax already paid: ${r.taxPaid.map((t) => `${formatMoney(t.amount, run.lang)} u/s ${t.section} (${t.by})`).join("; ")}.`);
    if (r.claims.length) lines.push(`Deductions on record: ${r.claims.map((c) => `${c.section} ${formatMoney(c.amount, run.lang)}${c.proofAttached ? "" : " (no proof)"}`).join("; ")}.`);
    lines.push(`Engine: new regime tax ${formatMoney(f.new.totalTax, run.lang)} (taxable ${formatMoney(f.new.taxableIncome, run.lang)}, ${f.new.refundOrDue >= 0 ? `refund ${formatMoney(f.new.refundOrDue, run.lang)}` : `due ${formatMoney(-f.new.refundOrDue, run.lang)}`}); old regime tax ${formatMoney(f.old.totalTax, run.lang)} (taxable ${formatMoney(f.old.taxableIncome, run.lang)}, ${f.old.refundOrDue >= 0 ? `refund ${formatMoney(f.old.refundOrDue, run.lang)}` : `due ${formatMoney(-f.old.refundOrDue, run.lang)}`}); cheaper: ${f.cheaper}.`);
    if (r.stagedChanges.length) lines.push(`Staged, awaiting a review card: ${r.stagedChanges.join(", ")}.`);
    if (r.yearIntake?.formAnswers && Object.keys(r.yearIntake.formAnswers).length) lines.push(`Year's form answered: ${JSON.stringify(r.yearIntake.formAnswers)}.`);
    const hard = r.limits.filter((l) => l.blocksFiling);
    const soft = r.limits.filter((l) => !l.blocksFiling);
    if (hard.length) lines.push(`Engine limits that block a card here: ${hard.map((l) => l.reason).join(" ")}`);
    if (soft.length) lines.push(`Disclosures (say once when relevant, they do not block): ${soft.map((l) => l.reason).join(" ")}`);
  } else {
    lines.push("Return: none exists yet for this owner.");
  }
  lines.push(papers.vault.length ? `Vault this year: ${papers.vault.map((d) => `${d.title} [${d.docType}, id ${d.id}${d.consented ? ", consent given" : d.readable ? ", consent needed to read" : ""}]`).join("; ")}.` : papers.vaultAvailable ? "Vault this year: empty." : "Vault: no document store in this deployment — no uploads, no DigiLocker pull.");
  lines.push(`DigiLocker: ${papers.digilocker.pulled ? "already pulled this run" : papers.digilocker.consented ? "consent given" : "not pulled"}; catalogue: ${papers.digilocker.catalogue.map((d) => d.title).join("; ")}.`);
  if (run.state.pendingQuestion) lines.push(`A card is on screen waiting for the person: "${run.state.pendingQuestion.text}" (${run.state.pendingQuestion.expects}).`);
  if (run.state.pendingCard) lines.push(`A review card is on screen: ${run.state.pendingCard.title} — waiting for confirm or cancel.`);
  if (run.state.actionTaken) lines.push(`Already happened this run: ${run.state.actionTaken.kind} ${run.state.actionTaken.id} at ${run.state.actionTaken.at}.`);
  if (memory.length) lines.push(`Remembered from earlier visits: ${memory.map((m) => `${m.key}=${String(m.value)}`).join("; ")}.`);
  lines.push(`Model budget left this conversation: ${Math.max(0, deps.budget.maxModelCallsPerRun - run.state.usage.modelCalls)} calls.`);
  return lines.join("\n");
}

function transcriptMessages(entries: TranscriptEntry[]): ConverseMessage[] {
  return entries.map((e): ConverseMessage => e.role === "assistant" ? { role: "model", text: e.text } : { role: "user", text: e.role === "tool" ? `[earlier tool result] ${e.text}` : e.text });
}

function remember(ctx: ActionCtx, entry: TranscriptEntry) {
  const t = ctx.run.state.transcript ?? [];
  t.push({ role: entry.role, text: entry.text.slice(0, entry.role === "tool" ? TOOL_TEXT_KEEP : 4_000) });
  ctx.run.state.transcript = t.slice(-TRANSCRIPT_KEEP);
}

/* --------------------------------------------------------------------- loop -- */

export interface ThinkOptions {
  /** What just happened outside the model's sight — an answer, a pull, a confirmation — for it to pick up from. */
  note?: string;
}

/** One turn of Munshi ji. Ends with a reply, or with a card on screen (status waiting_*), or with the honest offline line. */
export async function think(ctx: ActionCtx, opts: ThinkOptions = {}): Promise<void> {
  const { deps, owner, run, s, emit } = ctx;
  markStep(run, "classify", "done");
  markStep(run, "plan", "done");
  if (opts.note) remember(ctx, { role: "tool", text: opts.note });

  if (deps.model.name === "none") {
    await emit({ type: "tool_outcome", tool: "model.converse", ok: false, summary: "model off" });
    await emit({ type: "message", role: "assistant", text: s.modelOffline.replace("{reason}", deps.model.lastFailure?.() ?? "no model configured") });
    await finish(ctx);
    return;
  }

  const snapshot = await ensureSnapshot(ctx, personaForOwner);
  const papers = await listPapers(ctx);
  const memory = await deps.store.getMemory(owner).catch(() => []);
  const system = [
    characterPrompt({ surface: "agentic", langEnglishName: replyLanguageName(run.state.replyLanguage ?? "en"), mode: run.state.profile?.mode, userName: firstName(owner.displayName) || undefined }),
    RULES,
    STATUTORY,
    "This person, right now:",
    situationBlock(ctx, snapshot, papers, memory),
  ].join("\n\n");

  // Everything the model saw this turn — the digits in it are the only digits it may use.
  const allowed = new Set<string>();
  const absorb = (t: string) => { for (const d of digitsOf(t)) allowed.add(d); };
  absorb(system);
  for (const e of run.state.transcript ?? []) absorb(e.text);
  const messages: ConverseMessage[] = transcriptMessages(run.state.transcript ?? []);
  if (messages.length === 0 || messages[messages.length - 1].role === "model") messages.push({ role: "user", text: opts.note ? `[what just happened] ${opts.note}` : "(The person opened the conversation without a message. Greet them as yourself, in one or two sentences, and ask what brought them.)" });
  const plan = () => JSON.stringify(run.state.steps);
  const planBefore = plan();
  let retried = false;
  let paused = false;

  for (let hop = 0; hop < MAX_HOPS && !paused; hop += 1) {
    if (run.state.usage.modelCalls >= deps.budget.maxModelCallsPerRun) {
      await emit({ type: "message", role: "assistant", text: s.budgetExhausted });
      await finish(ctx);
      break;
    }
    const res = await deps.model.converse({ system, messages, tools: TOOLS, lang: run.lang, temperature: 0.7 });
    run.state.usage.modelCalls += 1;
    if (!res) {
      const reason = deps.model.lastFailure?.() ?? "no reply";
      await emit({ type: "tool_outcome", tool: "model.converse", ok: false, summary: reason });
      await emit({ type: "message", role: "assistant", text: s.modelOffline.replace("{reason}", reason) });
      await finish(ctx);
      break;
    }
    run.state.usage.tokens += res.usage.tokens;
    if (res.usage.tokens) await deps.store.addDailyUsage(owner, deps.today(), res.usage.tokens, 1);

    if (res.calls.length) {
      messages.push({ role: "model", text: res.text, calls: res.calls, raw: res.raw });
      const pausing = res.calls.some((c) => PAUSING.has(c.name));
      // Words that ride along with a card ("Let me pull your papers.") are said before the card; words that ride along with a lookup are the Progress panel's.
      if (res.text) {
        const reason = whyRejected(res.text, { allowed, actionHappened: !!run.state.actionTaken });
        if (pausing && !reason) { await emit({ type: "message", role: "assistant", text: res.text }); remember(ctx, { role: "assistant", text: res.text }); }
        else if (!pausing) await emit({ type: "activity", text: redactText(res.text).text.slice(0, 200) });
      }
      const results: { name: string; response: unknown }[] = [];
      for (const call of res.calls) {
        if (run.state.usage.toolCalls >= deps.budget.maxToolCallsPerRun) {
          results.push({ name: call.name, response: { error: "tool_budget_exhausted" } });
          continue;
        }
        run.state.usage.toolCalls += 1;
        if (ACTIVITY[call.name]) await emit({ type: "activity", text: ACTIVITY[call.name] });
        const out = await runCall(ctx, call, snapshot);
        const text = JSON.stringify(out.response);
        absorb(text);
        results.push({ name: call.name, response: out.response });
        remember(ctx, { role: "tool", text: `${call.name}(${JSON.stringify(call.args).slice(0, 300)}) → ${text}` });
        if (out.pause) paused = true;
      }
      messages.push({ role: "tool", results });
      if (!paused) continue;
      break;
    }

    // A reply. Checked; a refused figure gets one nudge, then the reply is held back.
    const reason = whyRejected(res.text, { allowed, actionHappened: !!run.state.actionTaken });
    if (reason && !retried) {
      retried = true;
      await emit({ type: "tool_outcome", tool: "model.converse", ok: false, summary: `reply refused: ${reason}; asked once more` });
      messages.push({ role: "model", text: res.text, raw: res.raw });
      messages.push({ role: "user", text: `[check] Your reply was refused: ${reason}. Use only figures that appear in the tool results, the situation or the statutory facts; if you need a number, call get_return or compute_tax first. Say it again.` });
      continue;
    }
    if (reason) {
      await emit({ type: "tool_outcome", tool: "model.converse", ok: false, summary: `reply refused: ${reason}` });
      await emit({ type: "message", role: "assistant", text: s.replyUnverified });
      remember(ctx, { role: "assistant", text: s.replyUnverified });
      await finish(ctx);
      break;
    }
    await emit({ type: "message", role: "assistant", text: res.text });
    remember(ctx, { role: "assistant", text: res.text });
    await finish(ctx);
    break;
  }
  if (!paused && run.status === "running") await finish(ctx); // the hop cap: the last thing said stands
  if (plan() !== planBefore) await emit({ type: "plan_updated", steps: run.state.steps });
}

async function finish(ctx: ActionCtx) {
  if (ctx.run.status !== "running") return;
  ctx.run.status = "completed";
  await ctx.emit({ type: "status", status: "completed" });
}

async function pause(ctx: ActionCtx, q: Question) {
  ctx.run.state.pendingQuestion = q;
  await ctx.emit({ type: "question", question: q });
  ctx.run.status = "waiting_for_input";
  await ctx.emit({ type: "status", status: "waiting_for_input" });
}

/* ------------------------------------------------------------------- calls -- */

async function runCall(ctx: ActionCtx, call: ToolCall, snapshot: VersionedReturn | null): Promise<{ response: unknown; pause?: boolean }> {
  const { run, s, emit, deps, owner } = ctx;
  const a = call.args ?? {};
  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string).trim() : "");
  const needReturn = () => (snapshot ? null : { error: "no_return", detail: "No return exists for this owner." });
  try {
    switch (call.name) {
      case "get_return": {
        if (!snapshot) return { response: needReturn() };
        markStep(run, "gather", "done");
        return { response: returnSummary(ctx, snapshot) };
      }
      case "compute_tax": {
        if (!snapshot) return { response: needReturn() };
        markStep(run, "compute", "done");
        return { response: whatIf(ctx, snapshot, a) };
      }
      case "scan_opportunities": {
        if (!snapshot) return { response: needReturn() };
        markStep(run, "compute", "done");
        return { response: opportunities(ctx, snapshot) };
      }
      case "lookup_rules": {
        const q = str("question");
        if (!q) return { response: { error: "invalid_args", detail: "question is required" } };
        const bundle = retrieve({ text: redactText(q).text, period: PERIOD_FY_2025_26, limit: 4 });
        const refs = cite(bundle.provisions.map((p) => p.id));
        run.state.sources = dedupeSources([...run.state.sources, ...refs.map((c) => ({ kind: "rule" as const, id: c.id, label: `${c.section} — ${c.title}`, detail: `${c.locator} · ${c.reviewer}`, verified: false, url: c.url }))]);
        await emit({ type: "source_lookup", sources: run.state.sources });
        return { response: { release: bundle.release, provisions: bundle.provisions.map((p) => ({ id: p.id, section: `s.${p.section}${p.subsection ?? ""}`, title: p.title, summary: p.summary, rule: p.ruleText, locator: p.locator, url: p.sourceUrl, primary: bundle.primaryIds?.includes(p.id) ?? false })), note: bundle.provisions.length ? "Reviewed paraphrases (engineering draft). Quote figures from them; cite the section." : "Nothing in the corpus matched; answer from the statutory facts you were given and say the corpus has no entry." } };
      }
      case "list_documents": {
        markStep(run, "gather", "done");
        return { response: await listPapers(ctx) };
      }
      case "read_document": {
        if (!snapshot) return { response: needReturn() };
        const id = str("documentId");
        if (!id) return { response: { error: "invalid_args", detail: "documentId is required" } };
        if (!run.state.consents?.[id]) return { response: { refused: "consent_required", detail: "Call request_consent with scope 'documents' and this documentId first; read only after the person says yes." } };
        const read = await absorbDocument(ctx, snapshot, id, "vault");
        if (!read) return { response: { error: "not_found" } };
        return { response: { title: read.title, docType: read.docType, readable: !!read.fields, fields: read.fields, staged: !!read.fields, facts: read.fields ? fieldFactsFor(ctx, read.fields) : [] } };
      }
      case "request_consent": {
        const scope = str("scope");
        const text = str("text");
        if (scope === "digilocker") {
          if (!deps.vault) return { response: { refused: "no_vault", detail: "No document store in this deployment; the person can type the figures instead." } };
          if (run.state.answers.digilocker_done) return { response: { refused: "already_pulled" } };
          const items = consentItems(listIssuedDocuments(owner, "2026-27", "all"));
          await pause(ctx, { id: newId("q"), text: text || s.askDigiLockerConsent, why: s.askDigiLockerConsentWhy, expects: "yes_no", resolves: "consent:digilocker", items });
          return { response: { shown: true, items }, pause: true };
        }
        if (scope === "documents") {
          const ids = Array.isArray(a.documentIds) ? (a.documentIds as unknown[]).filter((x): x is string => typeof x === "string") : [];
          if (!ids.length) return { response: { error: "invalid_args", detail: "documentIds is required for scope 'documents'" } };
          const papers = await listPapers(ctx);
          const chosen = papers.vault.filter((d) => ids.includes(d.id));
          if (!chosen.length) return { response: { error: "not_found", detail: "none of those ids is in the vault" } };
          run.state.answers.consent_docs = chosen.map((d) => d.id).join(",");
          await pause(ctx, { id: newId("q"), text: text || s.askVaultConsent, why: s.askVaultConsentWhy, expects: "yes_no", resolves: "consent:documents", items: chosen.map((d) => d.title) });
          return { response: { shown: true, items: chosen.map((d) => d.title) }, pause: true };
        }
        return { response: { error: "invalid_args", detail: "scope must be 'digilocker' or 'documents'" } };
      }
      case "ask": {
        const text = str("text");
        const kind = str("kind");
        if (!text || !["yes_no", "choice", "number", "text", "file"].includes(kind)) return { response: { error: "invalid_args", detail: "text and a valid kind are required" } };
        const choices = Array.isArray(a.choices) ? (a.choices as { value?: unknown; label?: unknown }[]).filter((c) => typeof c.value === "string" && typeof c.label === "string").map((c) => ({ value: String(c.value).slice(0, 60), label: String(c.label).slice(0, 80) })).slice(0, 6) : [];
        if (kind === "choice" && choices.length < 2) return { response: { error: "invalid_args", detail: "choice needs 2–6 choices" } };
        const docType = ["FORM_16", "ANNUAL_INFO_STATEMENT", "FORM_26AS", "BANK_STATEMENT", "OTHER"].includes(str("docType")) ? str("docType") : "OTHER";
        if (kind === "file" && !deps.vault) return { response: { refused: "no_vault", detail: "No document store; ask for the figure instead." } };
        const id = newId("q");
        await pause(ctx, { id, text: redactText(text).text, why: redactText(str("why")).text || "—", expects: kind as Question["expects"], resolves: `ask:${id}`, ...(kind === "choice" ? { choices } : {}), ...(kind === "file" ? { docType, skipLabel: s.dontHaveIt } : {}) });
        return { response: { shown: true }, pause: true };
      }
      case "ask_year_form": {
        if (!snapshot) return { response: needReturn() };
        const q = yearFormQuestion(ctx, snapshot, str("text"));
        if (!q) return { response: { nothingToAsk: true, note: "The papers answered every group; the inventory is confirmed." } };
        await pause(ctx, q);
        return { response: { shown: true, fields: q.fields?.map((f) => f.key) }, pause: true };
      }
      case "stage_changes": {
        if (!snapshot) return { response: needReturn() };
        return { response: stageChanges(ctx, snapshot, a) };
      }
      case "show_review": {
        const kind = str("kind");
        if (!["filing", "regime", "corrections"].includes(kind)) return { response: { error: "invalid_args", detail: "kind must be filing, regime or corrections" } };
        const fresh = await deps.returns.get(owner, "2026-27");
        if (!fresh) return { response: needReturn() };
        const out = buildReviewCard(ctx, fresh, kind as "filing" | "regime" | "corrections");
        if (!("card" in out)) return { response: out };
        run.state.pendingCard = out.card;
        markStep(run, "compute", "done");
        markStep(run, "review", "active");
        await emit({ type: "review_card", card: out.card });
        run.status = "waiting_for_review";
        await emit({ type: "status", status: "waiting_for_review" });
        return { response: { shown: true, rows: out.card.rows, boundToRevision: out.card.boundTo.revision }, pause: true };
      }
      case "offer_payment": {
        const fresh = await deps.returns.get(owner, "2026-27");
        if (!fresh) return { response: needReturn() };
        const out = paymentQuestion(ctx, fresh);
        if ("blocked" in out) return { response: out };
        await pause(ctx, out.question);
        return { response: { shown: true, due: out.due }, pause: true };
      }
      case "refund_status": {
        if (!snapshot) return { response: needReturn() };
        return { response: refundFacts(ctx, snapshot) };
      }
      case "notices": {
        if (!snapshot) return { response: needReturn() };
        return { response: { notices: noticeFacts(snapshot) } };
      }
      case "reconcile": {
        if (!snapshot) return { response: needReturn() };
        markStep(run, "gather", "done");
        return { response: reconciliation(snapshot) };
      }
      case "remember": {
        const key = str("key") as (typeof MEMORY_KEYS)[number];
        const value = str("value").slice(0, 64);
        if (!MEMORY_KEYS.includes(key) || !value) return { response: { error: "invalid_args", detail: `key must be one of ${MEMORY_KEYS.join(", ")}` } };
        await deps.store.setMemory(owner, { key, value: redactText(value).text, sourceRun: run.id, updatedAt: deps.clock() });
        return { response: { ok: true } };
      }
      default:
        return { response: { error: "unknown_tool", detail: `No tool named ${call.name}.` } };
    }
  } catch (err) {
    await emit({ type: "tool_outcome", tool: call.name, ok: false, summary: err instanceof Error ? err.message : String(err) });
    return { response: { error: "execution_failed", detail: err instanceof Error ? err.message : String(err) } };
  }
}

function fieldFactsFor(ctx: ActionCtx, fields: DocumentFields | null): string[] {
  return fields ? fieldFacts(fields, ctx.run.lang) : [];
}

/** After DigiLocker consent: the pull, said back to the model as what happened. */
export async function afterDigiLockerConsent(ctx: ActionCtx, accepted: boolean): Promise<string> {
  if (!accepted) return "The person declined the DigiLocker pull. Offer an upload or typing the figures; do not ask again unless they bring it up.";
  const snapshot = await ensureSnapshot(ctx, personaForOwner);
  if (!snapshot) return "No return exists; nothing could be pulled.";
  ctx.run.state.consents = { ...(ctx.run.state.consents ?? {}), digilocker: true };
  const facts = await pullDigiLocker(ctx, snapshot);
  return `DigiLocker pull completed and the documents are in the vault and staged on the return. What they carry: ${facts.join(" | ")}`;
}

/** After consent to read vault documents: each is read and staged. */
export async function afterDocumentConsent(ctx: ActionCtx, accepted: boolean): Promise<string> {
  const ids = String(ctx.run.state.answers.consent_docs ?? "").split(",").filter(Boolean);
  if (!accepted) return `The person declined to have ${ids.length} document(s) read. Work from what they tell you.`;
  const snapshot = await ensureSnapshot(ctx, personaForOwner);
  if (!snapshot) return "No return exists; nothing was read.";
  const lines: string[] = [];
  for (const id of ids) {
    ctx.run.state.consents = { ...(ctx.run.state.consents ?? {}), [id]: true };
    const read = await absorbDocument(ctx, snapshot, id, "vault");
    if (!read) { lines.push(`${id}: not found`); continue; }
    lines.push(`${read.title}: ${read.fields ? fieldFactsFor(ctx, read.fields).join("; ") : "not readable"}`);
  }
  return `Documents read and staged: ${lines.join(" | ")}`;
}

/** An uploaded document answered a question: stored, read if it is a Form 16 / AIS, said back. */
export async function afterUpload(ctx: ActionCtx, documentId: string): Promise<string> {
  const snapshot = await ensureSnapshot(ctx, personaForOwner);
  if (!snapshot) return "No return exists.";
  ctx.run.state.consents = { ...(ctx.run.state.consents ?? {}), [documentId]: true };
  const read = await absorbDocument(ctx, snapshot, documentId, "upload");
  if (!read) return "The upload could not be found in the vault.";
  return `The person uploaded ${read.title} (${read.docType}); it is in their vault${read.fields ? ` and was read: ${fieldFactsFor(ctx, read.fields).join("; ")}` : " (not a document this release reads for figures)"}.`;
}

export { executePayment };
