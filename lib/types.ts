/**
 * Wapsi domain types.
 *
 * The organising idea: every number the department shows a citizen carries
 * `Provenance` — who reported it, under what identifier, and when. The real
 * portal shows figures with no origin, so a citizen who spots an error cannot
 * tell whose mistake they are arguing with, or who has to fix it. (A Form 26AS
 * error, for instance, can *only* be corrected by the deductor filing a
 * correction statement — but nothing in the interface tells you that.)
 *
 * Money is whole rupees as `number`. A production system would use integer
 * paise; this is a prototype and the shortcut is disclosed on /honesty.
 */

export type Lang = "en" | "hi" | "ta";

export type PersonaId = "sunita" | "rakesh" | "priya";

/** Sandbox-generated citizens are not one of the seeded personas. */
export type CustomPersonaId = "custom";

export type ReporterKind =
  | "employer"
  | "bank"
  | "broker"
  | "registrar"
  | "department"
  | "self";

/** Where a fact came from. Attached to every figure we show. */
export interface Provenance {
  reporter: string;
  reporterKind: ReporterKind;
  /** TAN, IFSC, SEBI registration — whatever identifies the reporter. */
  identifier?: string;
  /** ISO date the reporter filed it. */
  filedOn: string;
  /** Which statement it surfaced in. */
  statement: "AIS" | "TIS" | "26AS" | "SFT" | "self";
  /**
   * True where only the reporter can correct this. The citizen needs to know
   * that arguing with the department is the wrong move.
   */
  onlyReporterCanFix: boolean;
}

export type IncomeKind =
  | "salary"
  | "interest"
  | "dividend"
  | "capital_gains"
  | "rent"
  | "other";

export interface Fact {
  id: string;
  kind: IncomeKind;
  amount: number;
  
  // Both en/hi/ta labels and titles/sources are supported for compatibility
  title?: string;
  label: string;
  source?: string;
  provenance: Provenance;
  
  confirmed?: boolean;
  disputed?: boolean;
  disputeReason?: string;
  
  /** Citizen has flagged this as wrong, with their own figure. */
  dispute?: { citizenAmount: number; reason: string };
}

export type IncomeFact = Fact;

export interface TaxAlreadyPaid {
  id: string;
  label: string;
  amount: number;
  /** Section under which it was deducted — 192 salary, 194A interest, etc. */
  section: string;
  provenance: Provenance;
}

export type ClaimSection =
  | "80C"
  | "80D_SELF"
  | "80D_PARENTS"
  | "80CCD_2"
  | "24B"
  | "80E"
  | "80TTA"
  | "HRA"
  | string;

/** A deduction the citizen is claiming (80C, 80GG, 80D...). */
export interface Claim {
  id: string;
  section: ClaimSection;
  amount: number;
  
  // Both structures supported
  title?: string;
  label: string;
  /** Whether the citizen has evidence attached. Drives the NUDGE-style hold. */
  evidenceAttached: boolean;
}

export interface CorrectionEvent {
  id: string;
  factId: string;
  field: "amount" | "existence";
  oldValue: any;
  newValue: any;
  timestamp: string;
  reverted?: boolean;
}

export type BankStatus = "validated" | "failed" | "under_process";

export type BankFailure =
  | "stale_ifsc"
  | "name_mismatch"
  | "pan_not_linked"
  | "dormant";

export interface BankAccount {
  id: string;
  bank: string;
  maskedNumber: string;
  ifsc: string;
  status: BankStatus;
  failure?: BankFailure;
  /** Set where a merger moved the account to a new bank's IFSC series. */
  supersededBy?: { bank: string; ifsc: string; mergerNote: string };
  nominatedForRefund: boolean;
}

/* ------------------------------------------------------------------ refunds */

/**
 * The refund state machine. The real portal collapses all of this into
 * "Under processing", which is why a citizen cannot tell queued from broken.
 */
export type RefundState =
  | "not_filed"
  | "filed_unverified"
  | "verified"
  | "in_queue"
  | "under_review"
  | "determined"
  | "sent_to_bank"
  | "credited"
  | "failed";

export const REFUND_SEQUENCE: RefundState[] = [
  "filed_unverified",
  "verified",
  "in_queue",
  "under_review",
  "determined",
  "sent_to_bank",
  "credited",
];

export type HoldKind =
  | "ais_mismatch"
  | "nudge_deduction"
  | "high_value_claim"
  | "demand_setoff"
  | "bank_invalid"
  | "unverified";

/**
 * A named reason the money has stopped moving, with the action that releases
 * it. A hold the citizen cannot act on is just opacity with extra words, so
 * every hold must carry a resolution path.
 */
export interface RefundHold {
  id: string;
  kind: HoldKind;
  headline: string;
  detail: string;
  /** What the citizen does about it. */
  action: { label: string; href: string };
  /** Roughly how long resolving it takes, so the wait is bounded. */
  clearsInDays: number;
  resolved: boolean;
}

/**
 * Canonical timeline headlines, stored as KEYS in persisted data so a saved
 * history renders in the reader's language. Narrative events seeded with the
 * personas carry their own prose and omit this key.
 */
export type TimelineKey =
  | "filed"
  | "verified"
  | "in_queue"
  | "under_review"
  | "determined"
  | "sent_to_bank"
  | "credited";

export interface TimelineEvent {
  id: string;
  on: string;
  state: RefundState;
  /** i18n dictionary key — preferred over `headline` when present. */
  headlineKey?: TimelineKey;
  /** Literal narrative prose (seeded events); rendered via localize fallback. */
  headline?: string;
  /** Who moved it — the department, a bank, or the citizen. */
  actor: "department" | "bank" | "citizen" | "reporter";
  detail?: string;
}

export interface RefundCase {
  state: RefundState;
  amount: number;
  filedOn?: string;
  verifiedOn?: string;
  /** Cohort framing: "returns filed in your week are being processed now." */
  cohortWeekOf?: string;
  cohortWindowDays?: [number, number];
  holds: RefundHold[];
  timeline: TimelineEvent[];
}

/* ------------------------------------------------------------------ notices */

export type NoticeKind =
  | "143_1_a"
  | "245_setoff"
  | "139_9_defective"
  | "ais_campaign";

export interface NoticeItem {
  id: string;
  /** The department's claim, in plain language. */
  claim: string;
  amount: number;
  /** The exact reported row this claim rests on. */
  basis: Provenance;
  /** What the citizen says is actually true. Pre-written, editable. */
  citizenTruth?: string;
  position?: "agree" | "disagree";
  draftedResponse?: string;
}

export interface Notice {
  id: string;
  kind: NoticeKind;
  /** Document Identification Number. Without a valid DIN a communication is
   *  deemed never to have been issued (CBDT Circular 19/2019) — so we surface
   *  it, and let the citizen check it. */
  din: string;
  issuedOn: string;
  respondBy: string;
  /** Plain-language headline. Never the statutory language. */
  headline: string;
  /** What happens if the citizen does nothing, in money and days. */
  consequence: string;
  amountAtStake: number;
  items: NoticeItem[];
  status: "open" | "responded" | "closed";
  /** For s.245: the old demand being set off against this year's refund. */
  setOff?: {
    assessmentYear: string;
    raisedOn: string;
    originalOrder: string;
    amount: number;
    noticeEverReceived: boolean;
  };
}

/* ----------------------------------------------------------------- personas */

export interface Persona {
  /** A seeded persona id, or "custom" for sandbox-generated citizens. */
  id: PersonaId | CustomPersonaId;
  name: string;
  age: number;
  city: string;
  state: string;
  occupation: string;
  /** Structurally valid but entirely invented. The DEMP prefix is the tell. */
  pan: string;
  mobile: string;
  preferredLang: Lang;
  /** One line for the reviewer login card. */
  situation: string;
  /** Which act of the journey this persona is standing in. */
  act: 1 | 2 | 3;
  actLabel: string;
  /** The documented real-world failure this persona embodies. */
  embodies: string;
  assessmentYear: string;
  facts: IncomeFact[];
  taxPaid: TaxAlreadyPaid[];
  claims: Claim[];
  banks: BankAccount[];
  refund: RefundCase;
  notices: Notice[];
}
