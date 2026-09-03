/**
 * Task schemas (plan §3.5). Each task declares its plan steps, the slots it needs, the
 * plain-language question for each slot, and where a value may come from. The interview
 * (interview.ts) walks these deterministically; the model only rephrases.
 *
 * Question rule (user instruction): never lead with the form name. Say what the thing is,
 * then name it in brackets so the person learns the word.
 */
import type { PlanStep, SlotInput, TaskId } from "./events";
import type { OnboardingProfile } from "../onboarding";

export type SlotSource = "vault" | "digilocker" | "document" | "ask";

export interface SlotSpec {
  id: string;
  /** Short label for the vault page and status cards. */
  label: string;
  question: string;
  why?: string;
  input: SlotInput;
  required: boolean;
  /** Identifiers and names: encrypted at rest, never remembered, never sent to the model. */
  secret: boolean;
  /** Non-secret answers are remembered across chats under this key (plan §3.6). */
  memoryKey?: string;
  /** Ask only when every listed earlier answer matches. */
  dependsOn?: { slot: string; equals: string | string[] }[];
  sources: SlotSource[];
  /** Onboarding answer that pre-fills this slot as a proposal. */
  fromOnboarding?: (profile: OnboardingProfile) => string | undefined;
  /** Document slot: which fields extraction fills, so they are not asked again. */
  fills?: string[];
}

export interface TaskSchema {
  id: TaskId;
  title: string;
  /** Keywords the offline classifier matches (lowercase). */
  triggers: string[];
  intro: string;
  steps: PlanStep[];
  slots: SlotSpec[];
}

const yes = (slot: string) => [{ slot, equals: "yes" }];

const IDENTITY: SlotSpec[] = [
  {
    id: "full_name",
    label: "Full name",
    question: "What is your full name, exactly as it appears on your PAN card?",
    input: { kind: "text", placeholder: "As printed on the card", maxLength: 80 },
    required: true,
    secret: true,
    sources: ["vault", "digilocker", "ask"],
  },
  {
    id: "pan",
    label: "PAN",
    question: "What is your ten-character tax ID? It is on the blue-and-white card and in every salary slip (the PAN).",
    why: "The return is filed against this number.",
    input: { kind: "identifier", format: "pan" },
    required: true,
    secret: true,
    sources: ["vault", "digilocker", "ask"],
  },
  {
    id: "dob",
    label: "Date of birth",
    question: "Your date of birth?",
    why: "Age decides a few thresholds in the old regime.",
    input: { kind: "date" },
    required: true,
    secret: true,
    sources: ["vault", "digilocker", "ask"],
  },
  {
    id: "aadhaar",
    label: "Aadhaar",
    question: "Your twelve-digit national ID number (Aadhaar). It is stored encrypted and only its last four digits are ever shown again.",
    input: { kind: "identifier", format: "aadhaar" },
    required: true,
    secret: true,
    sources: ["vault", "digilocker", "ask"],
  },
  {
    id: "mobile",
    label: "Mobile",
    question: "The mobile number the department should reach you on?",
    input: { kind: "identifier", format: "mobile" },
    required: true,
    secret: true,
    sources: ["vault", "digilocker", "ask"],
  },
  {
    id: "email",
    label: "Email",
    question: "And an email address for the acknowledgement?",
    input: { kind: "identifier", format: "email" },
    required: true,
    secret: true,
    sources: ["vault", "ask"],
  },
];

const INCOME: SlotSpec[] = [
  {
    id: "employment_type",
    label: "How you earn",
    question: "How do you mainly earn: a salaried job, freelance or consulting work, your own business, or something else?",
    input: {
      kind: "select",
      options: [
        { value: "salaried", label: "A salaried job" },
        { value: "self_employed", label: "Freelance or consulting" },
        { value: "business", label: "My own business" },
        { value: "other", label: "Something else" },
      ],
    },
    required: true,
    secret: false,
    memoryKey: "employment",
    sources: ["ask"],
    fromOnboarding: (p) => (p.profession === "self_employed" ? "self_employed" : p.profession === "business_owner" ? "business" : p.profession === "salaried" ? "salaried" : undefined),
  },
  {
    id: "form16_available",
    label: "Salary statement in hand",
    question: "Your employer gives you a yearly statement of what they paid you and the tax they already sent on, usually around June (it is called Form 16). Do you have it?",
    why: "It carries the exact figures, so nothing has to be typed.",
    input: { kind: "yesno" },
    required: true,
    secret: false,
    memoryKey: "has_form16",
    dependsOn: [{ slot: "employment_type", equals: "salaried" }],
    sources: ["ask"],
    fromOnboarding: (p) => (p.holdings.includes("form16") ? "yes" : undefined),
  },
  {
    id: "form16",
    label: "Salary statement (Form 16)",
    question: "Upload that statement. The salary and tax figures are read from it; the file stays in your vault.",
    input: { kind: "upload", accept: ["application/pdf"], docType: "form16" },
    required: true,
    secret: true,
    dependsOn: [{ slot: "employment_type", equals: "salaried" }, ...yes("form16_available")],
    sources: ["vault", "document", "ask"],
    fills: ["gross_salary", "tds_192"],
  },
  {
    id: "gross_salary",
    label: "Salary for the year",
    question: "What was your total salary for the year, before any deductions? Your offer letter or the last payslip will have it.",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: [{ slot: "employment_type", equals: "salaried" }],
    sources: ["vault", "document", "ask"],
  },
  {
    id: "tds_192",
    label: "Tax already deducted from salary",
    question: "How much tax did your employer already deduct over the year? It is on the payslips as TDS. Put 0 if none.",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: [{ slot: "employment_type", equals: "salaried" }],
    sources: ["vault", "document", "ask"],
  },
  {
    id: "freelance_income",
    label: "Freelance or business receipts",
    question: "Roughly how much did you receive from clients or customers this year, in total?",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: [{ slot: "employment_type", equals: ["self_employed", "business"] }],
    sources: ["vault", "ask"],
  },
  {
    id: "tds_other",
    label: "Tax deducted by clients",
    question: "Did clients deduct tax before paying you? Put the total, or 0.",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: [{ slot: "employment_type", equals: ["self_employed", "business"] }],
    sources: ["vault", "ask"],
  },
  {
    id: "has_interest",
    label: "Bank interest",
    question: "Did any bank pay you interest this year, on savings or deposits?",
    input: { kind: "yesno" },
    required: true,
    secret: false,
    memoryKey: "has_bank_interest",
    sources: ["ask"],
    fromOnboarding: (p) => (p.incomeSources.includes("interest") ? "yes" : undefined),
  },
  {
    id: "savings_interest",
    label: "Interest received",
    question: "About how much interest, in total? Your bank's yearly interest certificate or passbook shows it.",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: yes("has_interest"),
    sources: ["vault", "ask"],
  },
];

const DEDUCTIONS: SlotSpec[] = [
  {
    id: "has_pf",
    label: "Provident fund",
    question: "Does money go from your salary into a provident fund (PF) each month?",
    why: "That money can lower your tax under the old regime.",
    input: { kind: "yesno" },
    required: true,
    secret: false,
    memoryKey: "has_pf",
    sources: ["ask"],
    fromOnboarding: (p) => (p.holdings.includes("pf") ? "yes" : p.holdings.includes("none") ? "no" : undefined),
  },
  {
    id: "pf_contribution",
    label: "Your PF contribution",
    question: "How much went into PF from your side over the year? The salary statement or the PF passbook shows it.",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: yes("has_pf"),
    sources: ["vault", "document", "ask"],
  },
  {
    id: "pays_rent",
    label: "Rent paid",
    question: "Do you pay rent for the place you live in?",
    input: { kind: "yesno" },
    required: true,
    secret: false,
    memoryKey: "pays_rent",
    sources: ["ask"],
    fromOnboarding: (p) => (p.holdings.includes("rent_paid") ? "yes" : p.holdings.includes("none") ? "no" : undefined),
  },
  {
    id: "rent_paid",
    label: "Rent for the year",
    question: "How much rent did you pay in total this year?",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: yes("pays_rent"),
    sources: ["vault", "ask"],
  },
  {
    id: "has_insurance",
    label: "Health insurance",
    question: "Do you pay for health insurance, for yourself or your family?",
    input: { kind: "yesno" },
    required: true,
    secret: false,
    memoryKey: "has_health_insurance",
    sources: ["ask"],
    fromOnboarding: (p) => (p.holdings.includes("insurance") ? "yes" : p.holdings.includes("none") ? "no" : undefined),
  },
  {
    id: "insurance_premium",
    label: "Health insurance premium",
    question: "What did the health insurance cost for the year?",
    input: { kind: "money", min: 0 },
    required: true,
    secret: false,
    dependsOn: yes("has_insurance"),
    sources: ["vault", "ask"],
  },
];

const BANK: SlotSpec[] = [
  {
    id: "bank_account",
    label: "Bank account",
    question: "Which account should a refund go to? The account number, from your passbook or banking app.",
    input: { kind: "identifier", format: "bank_account" },
    required: true,
    secret: true,
    sources: ["vault", "ask"],
  },
  {
    id: "ifsc",
    label: "IFSC",
    question: "And the branch code printed next to it, eleven characters starting with the bank's letters (the IFSC)?",
    input: { kind: "identifier", format: "ifsc" },
    required: true,
    secret: true,
    sources: ["vault", "ask"],
  },
];

const REGIME: SlotSpec = {
  id: "regime_choice",
  label: "Regime preference",
  question: "There are two ways to be taxed. Shall I pick whichever costs you less, or do you want a specific one?",
  input: {
    kind: "select",
    options: [
      { value: "cheaper", label: "Pick the cheaper one for me" },
      { value: "new", label: "The new regime", detail: "Lower rates, almost no deductions" },
      { value: "old", label: "The old regime", detail: "Higher rates, deductions count" },
    ],
  },
  required: true,
  secret: false,
  memoryKey: "regime_preference",
  sources: ["ask"],
  fromOnboarding: (p) => (p.helpLevel === "do_it" ? "cheaper" : undefined),
};

export const TASKS: Record<Exclude<TaskId, "unknown">, TaskSchema> = {
  file_return: {
    id: "file_return",
    title: "File this year's return",
    triggers: ["file", "return", "itr", "job", "package", "salary", "taxes", "tax filing", "first time"],
    intro: "I will get this return filed. I ask only for what I cannot find in your vault, and every figure comes from the tax engine, never from me.",
    steps: [
      { id: "understand", title: "Understand the situation" },
      { id: "gather", title: "Gather what the return needs", detail: "Vault first, then DigiLocker, then ask" },
      { id: "compute", title: "Work out the tax both ways" },
      { id: "review", title: "Show the return for confirmation" },
      { id: "file", title: "File and hand over the receipt" },
    ],
    slots: [...INCOME, ...DEDUCTIONS, ...IDENTITY, ...BANK, REGIME],
  },
  compare_regimes: {
    id: "compare_regimes",
    title: "Old regime or new?",
    triggers: ["regime", "old vs new", "new vs old", "which is better", "compare"],
    intro: "Two regimes, one answer. A few figures and the engine will show both side by side.",
    steps: [
      { id: "understand", title: "Understand the situation" },
      { id: "gather", title: "Collect the figures that differ between regimes" },
      { id: "compute", title: "Compute both regimes" },
      { id: "review", title: "Show the comparison" },
    ],
    slots: [
      INCOME.find((s) => s.id === "employment_type")!,
      { ...INCOME.find((s) => s.id === "gross_salary")!, dependsOn: [{ slot: "employment_type", equals: "salaried" }] },
      INCOME.find((s) => s.id === "freelance_income")!,
      ...DEDUCTIONS,
    ],
  },
  business_benefits: {
    id: "business_benefits",
    title: "Tax benefits for a small business",
    triggers: ["business", "revenue", "turnover", "shop", "startup", "freelancer benefits", "gst"],
    intro: "Small businesses and professionals get a simplified way to declare income. Let me see which applies and what it saves.",
    steps: [
      { id: "understand", title: "Understand the business" },
      { id: "gather", title: "Collect turnover and type" },
      { id: "compute", title: "Apply the presumptive schemes" },
      { id: "review", title: "Show what it means" },
    ],
    slots: [
      {
        id: "business_type",
        label: "Kind of business",
        question: "Is it a service or trading business, or a profession such as consulting, design, law, medicine or accounting?",
        input: {
          kind: "select",
          options: [
            { value: "business", label: "Business: trading, manufacturing, services" },
            { value: "profession", label: "Profession: consulting, design, IT, legal, medical" },
          ],
        },
        required: true,
        secret: false,
        memoryKey: "business_type",
        sources: ["ask"],
      },
      {
        id: "revenue",
        label: "Turnover or receipts",
        question: "What were your total receipts or turnover this year, roughly?",
        input: { kind: "money", min: 0 },
        required: true,
        secret: false,
        sources: ["vault", "ask"],
      },
      {
        id: "digital_share",
        label: "Digital receipts",
        question: "Did almost all of it (95% or more) come in digitally, by bank transfer, UPI or card, rather than cash?",
        input: { kind: "yesno" },
        required: true,
        secret: false,
        memoryKey: "mostly_digital_receipts",
        sources: ["ask"],
      },
      {
        id: "gst_registered",
        label: "GST registration",
        question: "Are you registered for GST?",
        input: { kind: "yesno" },
        required: true,
        secret: false,
        memoryKey: "gst_registered",
        sources: ["ask"],
      },
      {
        id: "gstin",
        label: "GSTIN",
        question: "Your fifteen-character GST number (GSTIN)?",
        input: { kind: "identifier", format: "gstin" },
        required: true,
        secret: true,
        dependsOn: yes("gst_registered"),
        sources: ["vault", "ask"],
      },
    ],
  },
  respond_notice: {
    id: "respond_notice",
    title: "Respond to a notice",
    triggers: ["notice", "letter", "intimation", "demand", "defective", "scrutiny", "department wrote"],
    intro: "A letter from the department is usually one of a few kinds, and each has a calm, specific response. Let me work out which this is.",
    steps: [
      { id: "understand", title: "Identify the kind of notice" },
      { id: "gather", title: "Collect what it says" },
      { id: "review", title: "Draft the response" },
    ],
    slots: [
      {
        id: "notice_kind",
        label: "Kind of notice",
        question: "Near the top the letter names a section. Which of these does it look like?",
        input: {
          kind: "select",
          options: [
            { value: "143_1", label: "143(1): a computation that differs from yours" },
            { value: "139_9", label: "139(9): the return is called defective" },
            { value: "245", label: "245: a refund set off against an old demand" },
            { value: "148", label: "148: income the department thinks was missed" },
            { value: "other", label: "Something else" },
          ],
        },
        required: true,
        secret: false,
        sources: ["ask"],
      },
      {
        id: "notice_amount",
        label: "Amount in the notice",
        question: "What amount does the letter mention? Put 0 if none.",
        input: { kind: "money", min: 0 },
        required: true,
        secret: false,
        sources: ["ask"],
      },
      {
        id: "notice_din",
        label: "Document number (DIN)",
        question: "There is a twenty-character document number on it (the DIN). Type it, or skip if you cannot find it.",
        input: { kind: "identifier", format: "din" },
        required: false,
        secret: true,
        sources: ["vault", "ask"],
      },
      {
        id: "notice_position",
        label: "Your position",
        question: "Do you think the department is right, or wrong?",
        input: {
          kind: "select",
          options: [
            { value: "agree", label: "They are right; I want to settle it" },
            { value: "disagree", label: "They are wrong; I want to say why" },
            { value: "unsure", label: "I am not sure" },
          ],
        },
        required: true,
        secret: false,
        sources: ["ask"],
      },
      {
        id: "notice_reason",
        label: "Your reason",
        question: "In a sentence or two, why is it wrong?",
        input: { kind: "text", maxLength: 400 },
        required: true,
        secret: false,
        dependsOn: [{ slot: "notice_position", equals: "disagree" }],
        sources: ["ask"],
      },
    ],
  },
  pay_tax: {
    id: "pay_tax",
    title: "Pay outstanding tax",
    triggers: ["pay", "challan", "outstanding", "balance", "self assessment", "owe"],
    intro: "Paying is one step: the amount, a payment reference, and a receipt that goes into your return.",
    steps: [
      { id: "gather", title: "Confirm the amount" },
      { id: "pay", title: "Record the payment" },
      { id: "review", title: "Hand over the receipt" },
    ],
    slots: [
      {
        id: "pay_amount",
        label: "Amount to pay",
        question: "How much do you need to pay?",
        input: { kind: "money", min: 1 },
        required: true,
        secret: false,
        sources: ["ask"],
      },
    ],
  },
  check_refund: {
    id: "check_refund",
    title: "Where is my refund?",
    triggers: ["refund", "money back", "status", "credited", "when will i get"],
    intro: "A refund moves through a fixed set of stages. Let me see where yours is.",
    steps: [
      { id: "gather", title: "Find the return" },
      { id: "review", title: "Show the stage it is at" },
    ],
    slots: [
      {
        id: "ack_number",
        label: "Acknowledgement number",
        question: "The fifteen-digit number on the receipt you got when the return was filed, if you have it. Skip otherwise.",
        input: { kind: "identifier", format: "ack" },
        required: false,
        secret: true,
        sources: ["vault", "ask"],
      },
    ],
  },
  demo_persona: {
    id: "demo_persona",
    title: "Walk through with a sample citizen",
    triggers: ["demo", "sample", "example", "show me how", "try it"],
    intro: "Three invented citizens live in this prototype. Pick one and their whole return is loaded, every figure invented.",
    steps: [
      { id: "gather", title: "Pick a sample citizen" },
      { id: "load", title: "Load their return and vault" },
      { id: "review", title: "Show where they stand" },
    ],
    slots: [
      {
        id: "persona",
        label: "Sample citizen",
        question: "Who would you like to see?",
        input: {
          kind: "select",
          options: [
            { value: "sunita", label: "Sunita Devi", detail: "First return, refund waiting" },
            { value: "rakesh", label: "Rakesh Kumar", detail: "Filed, two notices, a mis-tagged share sale" },
            { value: "priya", label: "Priya Sharma", detail: "Filed, refund held over a rent receipt" },
          ],
        },
        required: true,
        secret: false,
        sources: ["ask"],
      },
    ],
  },
};

export function taskById(id: TaskId): TaskSchema | null {
  return id === "unknown" ? null : TASKS[id];
}

/** Every slot spec across tasks, by id (slot ids are shared on purpose: one vault). */
export function slotSpec(slotId: string): SlotSpec | null {
  for (const task of Object.values(TASKS)) {
    const spec = task.slots.find((s) => s.id === slotId);
    if (spec) return spec;
  }
  return null;
}

/** The plan for a task, in order. The planner (§3.3 step 3) may drop optional steps later. */
export function planFor(task: TaskSchema): PlanStep[] {
  return task.steps.map((step) => ({ ...step }));
}
