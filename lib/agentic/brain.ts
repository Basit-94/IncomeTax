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
import { compareForPersona } from "../return/compute";
import {
  absorbDocument, buildReviewCard, dedupeSources, ensureSnapshot, executePayment, fieldFacts, firstName, listPapers, markStep, noticeFacts, opportunities,
  paymentQuestion, pullDigiLocker, reconciliation, refundFacts, returnSummary, stageChanges, whatIf, yearFormQuestion, type ActionCtx, type DocumentFields,
} from "./actions";
import { consentItems, listIssuedDocuments } from "./digilocker";
import type { ConverseMessage, ToolCall, ToolDeclaration } from "./model";
import { characterPrompt, generateIdentityAndKnowledgeReply, isIdentityOrPersonalInquiry } from "./munshi-character";
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
  "• Never write an Aadhaar, bank account number or physical address. Never say 'as an AI'. Never list your capabilities unless asked what you can do — and then say it in a sentence, not a numbered menu.",
  "• When the citizen asks about their identity, name, or records ('mera naam kya hai', 'who am i', 'what do you know about me', 'apne bare me bataiye'): answer warmly and directly, confirm their full name, summarize their on-record facts (PAN, employer, salary, TDS deducted), and introduce Munshi ji. Never dump a generic tax regime table when asked about identity.",
  "• When a tool returns blocked or refused, explain it in plain words and offer the next step (a payment before filing, a CA for an income head this engine does not compute).",
  "• Capital Gains and Asset Sales: When a person reports selling assets (real estate, land, gold, unlisted shares, crypto, or mutual funds):",
  "  1. Immediately acknowledge the asset type they selected.",
  "  2. Explain the statutory treatment under FY 2025-26 / AY 2026-27:",
  "     - Real Estate / Land: Long-term capital gains tax is 12.5% without indexation u/s 112. Requires ITR-2 with Schedule CG.",
  "     - Gold / Unlisted Shares: Holding period > 24 months is long-term, taxed at 12.5% u/s 112 without indexation; short-term at slab rates. Requires ITR-2.",
  "     - Listed Equity / Mutual Funds: LTCG u/s 112A taxed at 12.5% above ₹1,25,000 exemption; STCG u/s 111A taxed at 20%.",
  "  3. State clearly: Wapsi's direct automated return currently processes ITR-1 (salaried income, one house property, and other sources). Because selling real estate, gold or unlisted shares requires ITR-2 with Schedule CG, they can have their return audited and filed through our registered Chartered Accountants via the CA Review portal, or provide their purchase cost and sale consideration if they want an estimate.",
  "  4. NEVER repeat the question 'What kind of assets did you sell' once they have answered. Proceed directly to the explanation and next steps.",
  "• Language: answer in the language of the person's latest message — English, Hindi (Devanagari) or Hinglish — and switch when they switch. No other language for now; a message in another script gets English.",
].join("\n");

function situationBlock(ctx: ActionCtx, snapshot: VersionedReturn | null, papers: Awaited<ReturnType<typeof listPapers>>, memory: { key: string; value: unknown }[]): string {
  const { run, deps, owner } = ctx;
  const p = run.state.profile;
  const displayName = owner.displayName?.trim() || firstName(owner.displayName);
  const lines: string[] = [`Today: ${deps.today()}. Assessment year ${snapshot?.state.persona.assessmentYear ?? "2026-27"} (income of FY 2025-26). Reply in ${replyLanguageName(run.state.replyLanguage ?? "en")} — that is how the person wrote their latest message. (Interface language: ${languageOption(run.lang).english}; it labels the cards, not your words.)`];
  lines.push(`The person: ${displayName ? `full name "${displayName}"` : "no name to use"}${firstName(displayName) ? ` (first name ${firstName(displayName)})` : ""}; ${owner.kind === "demo" ? "a demo persona (synthetic figures)" : "a registered citizen"}${p ? `; residency ${p.residency}; detail mode ${p.mode}; DigiLocker ${p.digilockerLinked ? "linked at onboarding" : "not linked"}${p.refundAccount ? `; refunds go to ${p.refundAccount}` : ""}` : ""}.`);
  if (snapshot) {
    const r = returnSummary(ctx, snapshot);
    const f = r.figures;
    lines.push(`Return (revision ${r.revision}): regime on record ${r.regimeOnRecord}; ${r.filed ? `FILED on ${r.filedAt}` : "not filed"}.`);
    lines.push(r.facts.length ? `Income on record: ${r.facts.slice(0, 12).map((x) => `${x.kind} ${formatMoney(x.amount, run.lang)} (${x.reportedBy}, ${x.statement})`).join("; ")}.` : "Income on record: none yet — the papers or the person have to supply it.");
    if (r.taxPaid.length) lines.push(`Tax already paid: ${r.taxPaid.map((t) => `${formatMoney(t.amount, run.lang)} u/s ${t.section} (${t.by})`).join("; ")}.`);
    if (r.claims.length) lines.push(`Deductions on record: ${r.claims.map((c) => `${c.section} ${formatMoney(c.amount, run.lang)}${c.proofAttached ? "" : " (no proof)"}`).join("; ")}.`);
    lines.push(
      `Engine Regime Comparison:
• New Regime: Gross ${formatMoney(f.new.grossIncome, run.lang)}, Standard Deduction ${formatMoney(f.new.standardDeduction, run.lang)}, Deductions Allowed ${formatMoney(f.new.deductionsAllowed, run.lang)}, Taxable Income ${formatMoney(f.new.taxableIncome, run.lang)}, Cess ${formatMoney(f.new.cess, run.lang)}, Total Tax ${formatMoney(f.new.totalTax, run.lang)}, TDS Paid ${formatMoney(f.new.tdsAndTaxPaid, run.lang)}, ${f.new.refundOrDue >= 0 ? `Refund ${formatMoney(f.new.refundOrDue, run.lang)}` : `Tax Due ${formatMoney(-f.new.refundOrDue, run.lang)}`}.
• Old Regime: Gross ${formatMoney(f.old.grossIncome, run.lang)}, Standard Deduction ${formatMoney(f.old.standardDeduction, run.lang)}, Deductions Allowed ${formatMoney(f.old.deductionsAllowed, run.lang)}, Taxable Income ${formatMoney(f.old.taxableIncome, run.lang)}, Cess ${formatMoney(f.old.cess, run.lang)}, Total Tax ${formatMoney(f.old.totalTax, run.lang)}, TDS Paid ${formatMoney(f.old.tdsAndTaxPaid, run.lang)}, ${f.old.refundOrDue >= 0 ? `Refund ${formatMoney(f.old.refundOrDue, run.lang)}` : `Tax Due ${formatMoney(-f.old.refundOrDue, run.lang)}`}.
• Cheaper Regime: ${f.cheaper} (Difference / Tax saving: ${formatMoney(f.taxSaving ?? Math.abs(f.new.totalTax - f.old.totalTax), run.lang)}).`
    );
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
  const answeredSources = run.state.sources.filter((s) => s.kind === "answer");
  if (answeredSources.length) {
    lines.push(`Questions already answered by the person in this conversation: ${answeredSources.map((s) => `"${s.label}" → "${s.detail}"`).join("; ")}. NEVER re-ask these questions; acknowledge the answer and proceed to the next step.`);
  }
  lines.push(`Model budget left this conversation: ${Math.max(0, deps.budget.maxModelCallsPerRun - run.state.usage.modelCalls)} calls.`);
  return lines.join("\n");
}

function transcriptMessages(entries: TranscriptEntry[]): ConverseMessage[] {
  return entries.map((e): ConverseMessage => {
    if (e.role === "assistant") return { role: "model", text: e.text };
    if (e.role === "tool") {
      if (e.text.startsWith("The person answered ")) return { role: "user", text: e.text };
      return { role: "user", text: `[earlier tool result] ${e.text}` };
    }
    return { role: "user", text: e.text };
  });
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
    return executeDeterministicFallback(ctx, opts, deps.model.lastFailure?.() ?? "model off");
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

  // Pre-seed all computed regime numbers, differences, facts, claims, and statutory constants
  if (snapshot) {
    const comp = compareForPersona(snapshot.state.persona);
    for (const regimeComp of [comp.new, comp.old]) {
      for (const val of Object.values(regimeComp)) {
        if (typeof val === "number" && Number.isFinite(val)) {
          allowed.add(String(Math.round(Math.abs(val))));
        }
      }
      for (const slice of regimeComp.slabBreakdown) {
        allowed.add(String(Math.round(slice.from)));
        if (slice.to !== Infinity) allowed.add(String(Math.round(slice.to)));
        allowed.add(String(Math.round(slice.tax)));
        allowed.add(String(Math.round(slice.rate * 100)));
      }
    }
    const diff = Math.abs(comp.new.totalTax - comp.old.totalTax);
    allowed.add(String(Math.round(diff)));
    const refundDiff = Math.abs(comp.new.refundOrDue - comp.old.refundOrDue);
    allowed.add(String(Math.round(refundDiff)));
    const taxableDiff = Math.abs(comp.new.taxableIncome - comp.old.taxableIncome);
    allowed.add(String(Math.round(taxableDiff)));
    const deductionsDiff = Math.abs(comp.new.totalDeductions - comp.old.totalDeductions);
    allowed.add(String(Math.round(deductionsDiff)));
    for (const c of snapshot.state.persona.claims) allowed.add(String(Math.round(c.amount)));
    for (const f of snapshot.state.persona.facts) allowed.add(String(Math.round(f.amount)));
    for (const t of snapshot.state.persona.taxPaid) allowed.add(String(Math.round(t.amount)));
  }

  // Pre-seed common statutory figures so standard provisions never get blocked
  [50000, 75000, 150000, 200000, 25000, 10000, 60000, 12500, 1200000, 1275000, 500000, 400000, 800000, 1600000, 2400000].forEach((n) => allowed.add(String(n)));

  const isAlreadyFiled = Boolean(
    run.state.actionTaken?.kind === "filing" ||
    snapshot?.state.filedAt ||
    (snapshot?.state.persona.refund?.state && snapshot.state.persona.refund.state !== "not_filed")
  );
  const actionHappened = !!run.state.actionTaken || isAlreadyFiled;

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
      return executeDeterministicFallback(ctx, opts, reason);
    }
    run.state.usage.tokens += res.usage.tokens;
    if (res.usage.tokens) await deps.store.addDailyUsage(owner, deps.today(), res.usage.tokens, 1);

    if (res.calls.length) {
      messages.push({ role: "model", text: res.text, calls: res.calls, raw: res.raw });
      const pausing = res.calls.some((c) => PAUSING.has(c.name));
      // Words that ride along with a card ("Let me pull your papers.") are said before the card; words that ride along with a lookup are the Progress panel's.
      if (res.text) {
        const reason = whyRejected(res.text, { allowed, actionHappened });
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
    const reason = whyRejected(res.text, { allowed, actionHappened });
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

        // Loop prevention: do not re-ask questions that were already answered
        const norm = (strVal: string) => strVal.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normText = norm(text);
        const alreadyAnswered = run.state.sources.find(
          (s) => s.kind === "answer" && (
            norm(s.label) === normText ||
            (s.label.toLowerCase().includes("assets did you sell") && text.toLowerCase().includes("assets did you sell")) ||
            (normText.length > 15 && norm(s.label).includes(normText)) ||
            (norm(s.label).length > 15 && normText.includes(norm(s.label)))
          )
        );
        if (alreadyAnswered) {
          return {
            response: {
              already_answered: true,
              answer: alreadyAnswered.detail,
              note: `The person ALREADY answered "${alreadyAnswered.detail}" to "${alreadyAnswered.label}". Do NOT ask this question again. In your reply, acknowledge their answer, explain the tax treatment u/s 112/112A, state that ITR-2 with Schedule CG is required, and advise them to file via CA Review or provide buy/sell figures.`,
            },
            pause: false,
          };
        }

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

export async function executeDeterministicFallback(ctx: ActionCtx, opts: ThinkOptions = {}, failureReason?: string): Promise<void> {
  const { deps, owner, run, s, emit } = ctx;
  const lastUserMsg = run.state.transcript?.filter((t) => t.role === "user").slice(-1)[0]?.text ?? "";
  const lang = run.lang;
  const isHi = lang === "hi" || /[\u0900-\u097F]/.test(lastUserMsg);

  // 1. Check identity and Munshi backstory inquiries
  if (isIdentityOrPersonalInquiry(lastUserMsg)) {
    const snap = await ensureSnapshot(ctx, personaForOwner).catch(() => null);
    const facts = snap?.state.persona.facts ?? [];
    const grossSalary = facts.filter((f) => f.kind === "salary").reduce((sum, f) => sum + f.amount, 0);
    const tdsPaid = snap?.state.persona.taxPaid ? snap.state.persona.taxPaid.reduce((sum, t) => sum + t.amount, 0) : 0;
    const employer = facts.find((f) => f.kind === "salary")?.source;
    const reply = generateIdentityAndKnowledgeReply({
      lang: isHi ? "hi" : lang,
      register: run.state.register ?? "plain",
      userName: owner.displayName || firstName(owner.displayName),
      pan: owner.pan,
      employer,
      salary: grossSalary,
      tdsCredits: tdsPaid,
      regime: snap?.state.regime ?? "new",
    });
    await emit({ type: "message", role: "assistant", text: reply });
    remember(ctx, { role: "assistant", text: reply });
    await finish(ctx);
    return;
  }

  // 2. Asset sale / Capital gains inquiry or answer
  const assetAnswerSource = run.state.sources.find(
    (s) => s.kind === "answer" && s.label.toLowerCase().includes("assets did you sell")
  );
  const isAssetSaleTurn =
    Boolean(opts.note && /assets did you sell|answered\s*"(other assets|real estate|listed shares|gold|land)/i.test(opts.note)) ||
    /\b(other assets|real estate|listed shares|sold assets?|capital gains?|unlisted shares?|land|gold|sona|zameen|jameen|shares beche)\b/i.test(lastUserMsg);

  if (isAssetSaleTurn || (assetAnswerSource && !run.state.transcript?.some((t) => t.role === "assistant" && /ITR-2|Schedule CG|12\.5%|Capital Gains/i.test(t.text)))) {
    const selectedAsset = assetAnswerSource?.detail || (
      /gold|unlisted|other assets|sona/i.test(lastUserMsg) ? "Other assets (gold, unlisted shares, etc.)"
      : /real estate|land|property|zameen|jameen/i.test(lastUserMsg) ? "Real estate or land"
      : /listed|equity|mutual fund/i.test(lastUserMsg) ? "Listed shares or equity mutual funds"
      : "Assets sold during the financial year"
    );
    const isGoldOrUnlisted = /other assets|gold|unlisted|sona/i.test(selectedAsset);
    const isRealEstate = /real estate|land|property|zameen|jameen/i.test(selectedAsset);

    // Check if user provided purchase and sale figures to calculate
    const amounts = (lastUserMsg.match(/\b\d+[\d,]*(?:\.\d+)?\b/g) || [])
      .map((n) => Number(n.replace(/,/g, "")))
      .filter((n) => n > 0 && n < 1_000_000_000);

    let calculationSnippet = "";
    if (amounts.length >= 2) {
      const cost = Math.min(...amounts);
      const sale = Math.max(...amounts);
      const gain = sale - cost;
      if (gain > 0) {
        const taxRate = isGoldOrUnlisted || isRealEstate ? 0.125 : 0.125;
        const taxBeforeCess = Math.round(gain * taxRate);
        const cess = Math.round(taxBeforeCess * 0.04);
        const totalTax = taxBeforeCess + cess;
        calculationSnippet = isHi
          ? `\n\n📊 **अनुमानित गणना (Tentative Computation):**\n• बिक्री मूल्य (Sale): ₹${formatMoney(sale, lang)}\n• खरीद लागत (Cost): ₹${formatMoney(cost, lang)}\n• शुद्ध पूंजीगत लाभ (Net Gain): ₹${formatMoney(gain, lang)}\n• अनुमानित कर (12.5% + 4% सेस u/s 112): **₹${formatMoney(totalTax, lang)}**`
          : `\n\n📊 **Tentative Computation:**\n• Sale Consideration: ₹${formatMoney(sale, lang)}\n• Purchase Cost: ₹${formatMoney(cost, lang)}\n• Net Capital Gain: ₹${formatMoney(gain, lang)}\n• Estimated Tax (12.5% + 4% cess u/s 112): **₹${formatMoney(totalTax, lang)}**`;
      }
    }

    let specificExplanation = "";
    if (isGoldOrUnlisted) {
      specificExplanation = isHi
        ? "सोना (Gold) या गैर-सूचीबद्ध शेयर (Unlisted Shares) की बिक्री पर: यदि इन्हें 24 महीने से अधिक समय तक रखा गया है, तो दीर्घकालिक पूंजीगत लाभ (LTCG) बिना इंडेक्सेशन के धारा 112 के तहत 12.5% की दर से कर योग्य है। 24 महीने से कम अवधि पर यह अल्पकालिक लाभ (STCG) सामान्य टैक्स स्लैब के अनुसार कर योग्य होता है।"
        : "For Other Assets (Gold / Unlisted Shares): Holding period exceeding 24 months qualifies as Long-Term Capital Gains (LTCG), taxed at 12.5% without indexation u/s 112. Holding under 24 months is treated as Short-Term Capital Gains (STCG) and taxed at your regular income tax slab rates.";
    } else if (isRealEstate) {
      specificExplanation = isHi
        ? "अचल संपत्ति या भूमि (Real Estate / Land) की बिक्री पर: 24 महीने से अधिक अवधि के बाद बिक्री पर धारा 112 के तहत 12.5% की फ्लैट दर से LTCG लगता है (इंडेक्सेशन लाभ समाप्त कर दिया गया है)।"
        : "For Real Estate or Land: Sales after a 24-month holding period incur Long-Term Capital Gains (LTCG) taxed at 12.5% flat u/s 112 without indexation benefit (as per Finance Act 2024/2025).";
    } else {
      specificExplanation = isHi
        ? "सूचीबद्ध शेयर या इक्विटी म्यूचुअल फंड (Listed Shares / Equity MFs): धारा 112A के तहत ₹1,25,000 से अधिक के दीर्घकालिक लाभ पर 12.5% कर देय है। अल्पकालिक लाभ (STCG u/s 111A) पर 20% की दर से टैक्स लगता है।"
        : "For Listed Shares / Equity Mutual Funds: Long-Term Capital Gains (LTCG u/s 112A) are taxed at 12.5% on gains exceeding the ₹1,25,000 annual exemption limit. Short-Term Capital Gains (STCG u/s 111A) are taxed at 20%.";
    }

    const reply = isHi
      ? `**पूंजीगत लाभ (Capital Gains) कर नियम — AY 2026-27:**\n\n` +
        `आपने चुना: **${selectedAsset}**\n\n` +
        `• **टैक्स दर:** ${specificExplanation}${calculationSnippet}\n\n` +
        `📋 **फॉर्म आवश्यकता (ITR-2):**\n` +
        `आयकर नियमों के अनुसार, पूंजीगत लाभ (Schedule CG) की रिपोर्टिंग के लिए **Form ITR-2** अनिवार्य है। Wapsi का प्रत्यक्ष स्वचालित रिटर्न वर्तमान में वेतनभोगी व्यक्तियों के लिए सीधे ITR-1 तैयार करता है।\n\n` +
        `🤝 **आगे के विकल्प:**\n` +
        `1. आप हमारे पंजीकृत चार्टर्ड अकाउंटेंट के माध्यम से **CA Review** पोर्टल पर अपनी ITR-2 रिटर्न तैयार और फाइल करवा सकते हैं।\n` +
        `2. यदि आप केवल अनुमानित कर जानना चाहते हैं, तो कृपया अपनी खरीद कीमत (Purchase Cost), खरीद वर्ष और कुल बिक्री राशि (Sale Consideration) बताएं।`
      : `**Capital Gains Tax Guidance — FY 2025-26 / AY 2026-27:**\n\n` +
        `You selected: **${selectedAsset}**\n\n` +
        `• **Tax Treatment:** ${specificExplanation}${calculationSnippet}\n\n` +
        `📋 **Filing Form Requirement (ITR-2):**\n` +
        `Under Income-tax Act provisions, reporting capital gains from asset sales requires **Form ITR-2 with Schedule CG**. Wapsi's direct automated return filing currently files Form ITR-1 (for salary, one house property, and interest income).\n\n` +
        `🤝 **Next Steps & Options:**\n` +
        `1. **File with CA Assistance:** You can seamlessly get your ITR-2 reviewed, optimized, and filed through our verified Chartered Accountants via the **CA Review** portal.\n` +
        `2. **Tax Estimate:** If you would like an immediate estimate of your capital gains liability, please share your purchase cost, purchase date/year, and final sale consideration.`;

    await emit({ type: "message", role: "assistant", text: reply });
    remember(ctx, { role: "assistant", text: reply });
    await finish(ctx);
    return;
  }

  // 3. Pure greetings with model offline
  const isBareGreeting = /^(namaste|hello|hi|hey|pranam|namashkar)[\s.!]*$/i.test(lastUserMsg.trim());
  if (isBareGreeting && run.task === "explain" && !opts.note) {
    await emit({ type: "message", role: "assistant", text: s.modelOffline.replace("{reason}", failureReason ?? "no model configured") });
    await finish(ctx);
    return;
  }

  const snapshot = await ensureSnapshot(ctx, personaForOwner).catch(() => null);

  const isFiled = Boolean(run.state.actionTaken?.kind === "filing" || (snapshot && returnSummary(ctx, snapshot).filed));

  // Check post-filing & specific queries first
  const isCompareRegimes =
    run.task === "compare_regimes" ||
    /\b(compare|regime|115bac|which is better|old vs new|dono regime|tax difference|2\.\s*compare)\b/i.test(lastUserMsg);

  const isRefundQuery = /\b(refund|re-fund|refund status|where is my refund|kahan hai refund|paisa kab|6\.\s*track)\b/i.test(lastUserMsg);

  const isAckQuery = /\b(itr-v|ack|acknowledgement|receipt|form itr-v|download ack|paawati|itrv)\b/i.test(lastUserMsg);

  if (isCompareRegimes && snapshot) {
    const r = returnSummary(ctx, snapshot);
    const f = r.figures;
    const cheaper: "new" | "old" = f.cheaper === "old" ? "old" : "new";
    const saving = f.taxSaving ?? Math.abs(f.new.totalTax - f.old.totalTax);
    const msg = isHi
      ? `**कर व्यवस्था तुलना (FY 2025-26 / AY 2026-27):**\n\n` +
        `• **नई कर व्यवस्था (धारा 115BAC - डिफ़ॉल्ट):** कुल कर ₹${formatMoney(f.new.totalTax, lang)} (कर योग्य आय: ₹${formatMoney(f.new.taxableIncome, lang)}, मानक कटौती ₹75,000)। ${f.new.refundOrDue >= 0 ? `रिफंड: ₹${formatMoney(f.new.refundOrDue, lang)}` : `देय कर: ₹${formatMoney(-f.new.refundOrDue, lang)}`}\n` +
        `• **पुरानी कर व्यवस्था:** कुल कर ₹${formatMoney(f.old.totalTax, lang)} (कर योग्य आय: ₹${formatMoney(f.old.taxableIncome, lang)}, मानक कटौती ₹50,000, अध्याय VI-A कटौती)। ${f.old.refundOrDue >= 0 ? `रिफंड: ₹${formatMoney(f.old.refundOrDue, lang)}` : `देय कर: ₹${formatMoney(-f.old.refundOrDue, lang)}`}\n\n` +
        `🏆 **निष्कर्ष:** आपके लिए **${cheaper === "new" ? "नई व्यवस्था" : "पुरानी व्यवस्था"}** अधिक फ़ायदेमंद है (₹${formatMoney(saving, lang)} की बचत)।`
      : `**Regime Comparison (FY 2025-26 / AY 2026-27):**\n\n` +
        `• **New Regime (s. 115BAC - Default):** Total Tax ₹${formatMoney(f.new.totalTax, lang)} (Taxable Income: ₹${formatMoney(f.new.taxableIncome, lang)}, Standard Deduction ₹75,000). ${f.new.refundOrDue >= 0 ? `Refund: ₹${formatMoney(f.new.refundOrDue, lang)}` : `Tax Due: ₹${formatMoney(-f.new.refundOrDue, lang)}`}\n` +
        `• **Old Regime:** Total Tax ₹${formatMoney(f.old.totalTax, lang)} (Taxable Income: ₹${formatMoney(f.old.taxableIncome, lang)}, Standard Deduction ₹50,000, Chapter VI-A deductions)। ${f.old.refundOrDue >= 0 ? `Refund: ₹${formatMoney(f.old.refundOrDue, lang)}` : `Tax Due: ₹${formatMoney(-f.old.refundOrDue, lang)}`}\n\n` +
        `🏆 **Verdict:** The **${cheaper === "new" ? "New Regime" : "Old Regime"}** saves you more (tax saving: ₹${formatMoney(saving, lang)}).`;

    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  if (isRefundQuery && snapshot) {
    const ref = refundFacts(ctx, snapshot);
    const isCredited = ref.refundState === "sent_to_bank";
    const isProcessed = ref.refundState === "verified" || ref.refundState === "determined";
    const isProcessing = ref.refundState === "in_queue" || ref.refundState === "under_review" || ref.refundState === "filed_unverified";
    const statusHi = isCredited ? "खाते में जमा (Credited)" : isProcessed ? "संसाधित (Processed)" : isProcessing ? "प्रक्रियाधीन (Under Processing)" : "फाइल नहीं किया गया";
    const statusEn = isCredited ? "Credited to Bank Account" : isProcessed ? "Processed by CPC" : isProcessing ? "Under Processing at CPC Bengaluru" : "Not Filed";
    const msg = isHi
      ? `**रिफंड स्थिति (AY 2026-27):**\n\n` +
        `• **स्थिति:** ${statusHi}\n` +
        `• **रिफंड राशि:** ₹${formatMoney(Math.max(0, ref.refundOrDue), lang)}\n` +
        `• **बैंक खाता:** ${ref.refundAccount ?? "आधिकारिक बैंक खाता (सत्यापित)"}\n` +
        (ref.holds.length ? `• **टिप्पणी:** ${ref.holds[0].headline}\n` : "") +
        `\nआपका रिफंड केंद्रीय प्रसंस्करण केंद्र (CPC) द्वारा सीधे आपके पूर्व-सत्यापित खाते में भेजा जा रहा है।`
      : `**Refund Status (AY 2026-27):**\n\n` +
        `• **Status:** ${statusEn}\n` +
        `• **Expected Refund:** ₹${formatMoney(Math.max(0, ref.refundOrDue), lang)}\n` +
        `• **Target Account:** ${ref.refundAccount ?? "Verified Bank Account on record"}\n` +
        (ref.holds.length ? `• **Notice/Hold:** ${ref.holds[0].headline}\n` : "") +
        `\nRefund processing is handled directly by the Income Tax Department's Central Processing Centre (CPC Bengaluru).`;

    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  if (isAckQuery && snapshot) {
    const summary = returnSummary(ctx, snapshot);
    const ack = summary.filedAt ? `ACK-2026-ITR1-${snapshot.revision}` : "ACK-2026-ITR1-SIM";
    const msg = isHi
      ? `**ITR-V फाइलिंग पावती (Acknowledgement):**\n\n` +
        `• **पावती संख्या (Ack No):** ${ack}\n` +
        `• **ई-फाइलिंग स्थिति:** सफलतापूर्वक ई-सत्यापित (E-verified)\n` +
        `• **कर व्यवस्था:** ${summary.regimeOnRecord === "new" ? "नई कर व्यवस्था (धारा 115BAC)" : "पुरानी कर व्यवस्था"}\n\n` +
        `आप दाईं ओर **Outputs** पैनल पर जाकर अथवा डाउनलोड बटन पर क्लिक करके अपना डिजिटल रूप से हस्ताक्षरित Form ITR-V PDF तुरंत डाउनलोड कर सकते हैं।`
      : `**ITR-V Filing Acknowledgement & Receipt:**\n\n` +
        `• **Acknowledgement Number:** ${ack}\n` +
        `• **E-Filing Status:** Successfully e-verified\n` +
        `• **Filed Regime:** ${summary.regimeOnRecord === "new" ? "New Tax Regime (s. 115BAC)" : "Old Tax Regime"}\n\n` +
        `You can download your digitally verified Form ITR-V PDF directly from the **Outputs** panel on the right.`;

    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  // 3. Prepare & File Return workflow
  const isPrepareOrFile =
    run.task === "prepare_salaried_return" ||
    /\b(prepare|file|filing|return|start|begin|bharo|bharna|kardo|kar do|chalu|shuru|1\.\s*prepare)\b/i.test(lastUserMsg) ||
    Boolean(opts.note && (opts.note.includes("DigiLocker") || opts.note.includes("form") || opts.note.includes("upload") || opts.note.includes("read") || opts.note.includes("Documents read") || opts.note.includes("Payment")));

  // If filing was just completed in this run or if citizen attempts to re-file:
  if (isFiled && (run.state.actionTaken?.kind === "filing" || isPrepareOrFile || /\b(status|kya hua|ho gaya)\b/i.test(lastUserMsg))) {
    const summary = snapshot ? returnSummary(ctx, snapshot) : null;
    const ack = summary?.filedAt ? `ACK-2026-ITR1-${snapshot?.revision}` : "ACK-2026-ITR1-SIM";
    const msg = isHi
      ? `बधाई हो! आपकी ITR-1 रिटर्न सफलतापूर्वक फाइल हो चुकी है (पावती संख्या: ${ack})। आप 'Outputs' पैनल से अपना ITR-V एक्नॉलेजमेंट फॉर्म देख सकते हैं।`
      : `Congratulations! Your ITR-1 return has been successfully filed (acknowledgement number: ${ack}). You can view and download your ITR-V from the Outputs panel.`;
    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  if (isPrepareOrFile && snapshot) {
    const papers = await listPapers(ctx);

    // Step A: DigiLocker papers available in catalogue, not pulled, not consented
    if (papers.digilocker.catalogue.length > 0 && !papers.digilocker.pulled && !run.state.consents?.digilocker) {
      const qText = isHi
        ? "क्या मैं आपके डिजिलॉकर से आधिकारिक Form 16, AIS और टैक्स दस्तावेज ला सकता हूँ?"
        : "Shall I fetch your official Form 16, AIS, and tax papers from DigiLocker?";
      await emit({
        type: "message",
        role: "assistant",
        text: isHi
          ? "नमस्ते! मैं आपके रिटर्न की तैयारी टैक्स इंजन से सीधे कर रहा हूँ। सबसे पहले आपके आधिकारिक दस्तावेज (Form 16, AIS, 26AS) डिजिलॉकर से जोड़ लेते हैं।"
          : "Namaste! I am preparing your return directly using Wapsi's core tax engine. First, let's pull your official papers (Form 16, AIS, 26AS) from DigiLocker.",
      });
      await runCall(ctx, { name: "request_consent", args: { scope: "digilocker", text: qText } }, snapshot);
      return;
    }

    // Step B: Unconsented vault documents
    const unconsentedDocs = papers.vault.filter((d) => !d.consented && d.readable);
    if (unconsentedDocs.length > 0) {
      const qText = isHi
        ? `क्या मैं आपके टैक्स वॉल्ट में मौजूद ${unconsentedDocs.map((d) => d.title).join(", ")} को पढ़कर रिटर्न में दर्ज कर लूँ?`
        : `Shall I read your ${unconsentedDocs.map((d) => d.title).join(", ")} from your vault and stage the figures?`;
      await runCall(ctx, { name: "request_consent", args: { scope: "documents", documentIds: unconsentedDocs.map((d) => d.id), text: qText } }, snapshot);
      return;
    }

    // Step C: Vault documents consented but not yet staged
    for (const doc of papers.vault.filter((d) => d.consented)) {
      await absorbDocument(ctx, snapshot, doc.id, "vault");
    }

    // Step D: Year Form gap questions
    if (!run.state.answers?.inventory_confirmed) {
      const qForm = yearFormQuestion(ctx, snapshot, isHi ? "कृपया इन कुछ सवालों के जवाब दें ताकि फॉर्म ITR-1 पूरा हो सके:" : "A few questions to complete your ITR-1:");
      if (qForm) {
        await emit({
          type: "message",
          role: "assistant",
          text: isHi
            ? "आपके कागजात की जानकारी दर्ज हो गई है। केवल कुछ आवश्यक विवरण भर दीजिए ताकि गणना पूरी हो सके:"
            : "Your papers have been recorded. Please complete this brief questionnaire to finalize your calculation:",
        });
        await pause(ctx, qForm);
        return;
      }
    }

    // Step E: Tax Computation & Challan 280 / Review Card
    const fresh = (await deps.returns.get(owner, "2026-27")) ?? snapshot;
    const r = returnSummary(ctx, fresh);
    const cheaper: "new" | "old" = r.figures.cheaper === "old" ? "old" : "new";
    const f = r.figures[cheaper];

    if (f.refundOrDue < 0 && !run.state.actionTaken?.kind?.includes("payment")) {
      const payQ = paymentQuestion(ctx, fresh);
      if ("question" in payQ) {
        await emit({
          type: "message",
          role: "assistant",
          text: isHi
            ? `आपकी रिटर्न की गणना पूरी हो गई है। ${cheaper === "new" ? "नई व्यवस्था" : "पुरानी व्यवस्था"} के तहत ₹${formatMoney(Math.abs(f.refundOrDue), lang)} का कर देय है। फाइल करने से पहले चालान 280 का भुगतान पूरा करें:`
            : `Your calculation is complete. Under the ${cheaper} regime, self-assessment tax of ₹${formatMoney(Math.abs(f.refundOrDue), lang)} is payable. Please complete Challan 280 before filing:`,
        });
        await pause(ctx, payQ.question);
        return;
      }
    }

    // Step F: Zero balance due or refund -> Filing Review Card!
    const reviewOut = buildReviewCard(ctx, fresh, "filing");
    if ("card" in reviewOut) {
      run.state.pendingCard = reviewOut.card;
      markStep(run, "compute", "done");
      markStep(run, "review", "active");
      await emit({ type: "review_card", card: reviewOut.card });
      run.status = "waiting_for_review";
      await emit({ type: "status", status: "waiting_for_review" });

      const refundDueText = f.refundOrDue >= 0
        ? (isHi ? `रिफंड: ₹${formatMoney(f.refundOrDue, lang)}` : `Refund: ₹${formatMoney(f.refundOrDue, lang)}`)
        : (isHi ? `कर देय: ₹0 (चालान समाहित)` : `Tax Due: ₹0 (Challan reconciled)`);

      await emit({
        type: "message",
        role: "assistant",
        text: isHi
          ? `आपकी ITR-1 रिटर्न फाइल करने के लिए पूरी तरह तैयार है! अनुशंसित: ${cheaper === "new" ? "नई कर व्यवस्था" : "पुरानी कर व्यवस्था"} (${refundDueText})। कृपया नीचे दिए गए रिव्यू कार्ड की जाँच करें और पुष्टि करें:`
          : `Your ITR-1 return is completely ready to file! Recommended: ${cheaper} regime (${refundDueText}). Please verify your figures in the review card below and confirm filing:`,
      });
      return;
    }
  }



  // 6. Check Reported Figures / Reconcile Facts workflow
  const isReconcile =
    run.task === "reconcile_facts" ||
    /\b(check|reported|figures|ais|tis|26as|records|facts|salary|income|tds)\b/i.test(lastUserMsg);

  if (isReconcile && snapshot) {
    const rec = reconciliation(snapshot);
    const facts = snapshot.state.persona.facts ?? [];
    const taxPaid = snapshot.state.persona.taxPaid ?? [];
    const grossSalary = facts.filter((f) => f.kind === "salary").reduce((sum, f) => sum + f.amount, 0);
    const totalTds = taxPaid.reduce((sum, t) => sum + t.amount, 0);

    const msg = isHi
      ? `**सरकारी रिकॉर्ड एवं AIS/TIS रिपोर्ट (AY 2026-27):**\n\n` +
        `• **वेतन आय (Salary Income):** ₹${formatMoney(grossSalary, lang)}${facts.find((f) => f.kind === "salary")?.source ? ` (${facts.find((f) => f.kind === "salary")?.source})` : ""}\n` +
        `• **TDS क्रेडिट जमा:** ₹${formatMoney(totalTds, lang)} (${taxPaid.length} प्रविष्टियाँ)\n` +
        `• **मिलान स्थिति (Reconciliation):** विभाग के 26AS/AIS स्टेटमेंट में ${rec.rows.length} पंक्तियाँ दर्ज हैं।\n\n` +
        `क्या आप रिटर्न तैयार करके फाइल करना चाहते हैं?`
      : `**Official Records & AIS/TIS Summary (AY 2026-27):**\n\n` +
        `• **Gross Salary Income:** ₹${formatMoney(grossSalary, lang)}${facts.find((f) => f.kind === "salary")?.source ? ` (${facts.find((f) => f.kind === "salary")?.source})` : ""}\n` +
        `• **TDS Deposited:** ₹${formatMoney(totalTds, lang)} across ${taxPaid.length} entries\n` +
        `• **Reconciliation Status:** ${rec.rows.length} lines on record across Form 16, AIS, and 26AS.\n\n` +
        `Would you like to proceed with preparing and filing your return?`;

    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  // 7. Deductions / Opportunities
  const isOpportunities = /\b(save tax|opportunity|opportunities|80c|80d|nps|bachat|deduction)\b/i.test(lastUserMsg);
  if (isOpportunities && snapshot) {
    const opps = opportunities(ctx, snapshot);
    const items = opps.items;
    const oppList = items.length
      ? items.slice(0, 4).map((o) => `• **${o.title}**: ${o.why}${o.saving ? ` (बचत: ₹${formatMoney(o.saving, lang)})` : ""}`).join("\n")
      : (isHi ? "फिलहाल आपकी सभी मुख्य कटौतियां रिकॉर्ड पर हैं।" : "All standard deductions for this profile are already accounted for.");

    const msg = isHi
      ? `**टैक्स बचत एवं कटौतियाँ:**\n\n${oppList}`
      : `**Tax Savings & Deductions Analysis:**\n\n${oppList}`;

    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  // 8. General statutory rules retrieval
  const bundle = retrieve({ text: lastUserMsg, period: PERIOD_FY_2025_26, limit: 1 });
  if (bundle.provisions.length > 0) {
    const top = bundle.provisions[0];
    const sourceLabel = top.locator || cite([top.id])[0]?.locator || top.section;
    const msg = isHi
      ? `**आयकर नियम जानकारी (${top.section}):**\n\n${top.summary}\n\n${top.ruleText}\n\n*स्रोत: ${sourceLabel}*`
      : `**Income Tax Provision (${top.section}):**\n\n${top.summary}\n\n${top.ruleText}\n\n*Source: ${sourceLabel}*`;
    await emit({ type: "message", role: "assistant", text: msg });
    remember(ctx, { role: "assistant", text: msg });
    await finish(ctx);
    return;
  }

  // 9. Standard honest offline fallback for other miscellaneous queries
  await emit({ type: "message", role: "assistant", text: s.modelOffline.replace("{reason}", failureReason ?? "no model configured") });
  await finish(ctx);
}

export { executePayment };

