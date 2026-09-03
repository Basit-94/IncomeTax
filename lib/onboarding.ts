import type { Lang } from "./types";

export const ONBOARDING_PROFILE_KEY = "wapsi_onboarding_profile";
export const ONBOARDING_DRAFT_KEY = "wapsi_onboarding_draft";
export const ONBOARDING_VERSION = 4;

/**
 * Onboarding v4 (plan task 0.7). Five pages, each a few quick picks, so the assistant
 * starts a conversation already knowing who it is talking to. Every answer here is a
 * fact, never an identifier or an amount: those belong to the vault (plan D11).
 *
 * Legacy intents (v1–v3) are the first four; the newer three describe why someone opens
 * an assistant rather than a form. Dictionary lookups that only know the legacy four go
 * through `legacyIntent()`.
 */
export type OnboardingIntent =
  | "file_return"
  | "check_refund"
  | "understand_notice"
  | "correct_prefill"
  | "plan_new_job"
  | "business_benefits"
  | "explore";

export type OnboardingProfession =
  | "salaried"
  | "self_employed"
  | "business_owner"
  | "student"
  | "retired"
  | "investor"
  | "homemaker"
  | "other";

export type OnboardingAgeBand = "under_30" | "30_44" | "45_59" | "60_plus" | "unknown";

export type OnboardingResidency = "resident" | "nri" | "unknown";

export type OnboardingIncomeSource =
  | "salary"
  | "freelance"
  | "business"
  | "rent"
  | "interest"
  | "dividends"
  | "property_sale"
  | "crypto"
  | "foreign"
  | "pension";

export type OnboardingIncomeBand =
  | "none"
  | "under_4"
  | "4_to_8"
  | "8_to_12"
  | "12_to_25"
  | "over_25"
  | "unknown";

export type OnboardingHolding =
  | "form16"
  | "pf"
  | "insurance"
  | "home_loan"
  | "rent_paid"
  | "nps"
  | "education_loan"
  | "donations"
  | "none";

export type OnboardingFilingHistory = "never" | "once" | "every_year";

export type OnboardingFiledBy = "self" | "ca" | "family" | "not_applicable";

export type OnboardingHelpLevel = "guide" | "do_it" | "expert";

/** Kept for the manual dashboard's existing consumers; derived, never asked (v4). */
export type OnboardingFocus =
  | "salary"
  | "freelance"
  | "business"
  | "rent"
  | "interest"
  | "investments"
  | "deductions"
  | "not_sure";

export interface OnboardingProfile {
  version: typeof ONBOARDING_VERSION;
  lang: Lang;
  intent: OnboardingIntent;
  profession: OnboardingProfession;
  ageBand: OnboardingAgeBand;
  residency: OnboardingResidency;
  incomeSources: OnboardingIncomeSource[];
  incomeBand: OnboardingIncomeBand;
  holdings: OnboardingHolding[];
  filingHistory: OnboardingFilingHistory;
  filedBy: OnboardingFiledBy;
  helpLevel: OnboardingHelpLevel;
  /** One optional line for the assistant, at most 200 characters. */
  note: string;
  focuses: OnboardingFocus[];
  completedAt: string;
}

export type OnboardingDraft = Partial<Omit<OnboardingProfile, "version" | "completedAt" | "focuses">>;

export interface Personalization {
  guided: boolean;
  regimeLens: "check_claims" | "compare_both";
}

export type DashboardDestination = "facts" | "overview" | "statement" | "actions";

export const INTENTS: readonly OnboardingIntent[] = [
  "file_return",
  "check_refund",
  "understand_notice",
  "correct_prefill",
  "plan_new_job",
  "business_benefits",
  "explore",
];
export const PROFESSIONS: readonly OnboardingProfession[] = [
  "salaried",
  "self_employed",
  "business_owner",
  "student",
  "retired",
  "investor",
  "homemaker",
  "other",
];
export const AGE_BANDS: readonly OnboardingAgeBand[] = ["under_30", "30_44", "45_59", "60_plus", "unknown"];
export const RESIDENCIES: readonly OnboardingResidency[] = ["resident", "nri", "unknown"];
export const INCOME_SOURCES: readonly OnboardingIncomeSource[] = [
  "salary",
  "freelance",
  "business",
  "rent",
  "interest",
  "dividends",
  "property_sale",
  "crypto",
  "foreign",
  "pension",
];
export const INCOME_BANDS: readonly OnboardingIncomeBand[] = [
  "none",
  "under_4",
  "4_to_8",
  "8_to_12",
  "12_to_25",
  "over_25",
  "unknown",
];
export const HOLDINGS: readonly OnboardingHolding[] = [
  "form16",
  "pf",
  "insurance",
  "home_loan",
  "rent_paid",
  "nps",
  "education_loan",
  "donations",
  "none",
];
export const FILING_HISTORY: readonly OnboardingFilingHistory[] = ["never", "once", "every_year"];
export const FILED_BY: readonly OnboardingFiledBy[] = ["self", "ca", "family", "not_applicable"];
export const HELP_LEVELS: readonly OnboardingHelpLevel[] = ["guide", "do_it", "expert"];
const FOCUSES: readonly OnboardingFocus[] = [
  "salary",
  "freelance",
  "business",
  "rent",
  "interest",
  "investments",
  "deductions",
  "not_sure",
];

export const NOTE_MAX = 200;

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isListOf<T extends string>(value: unknown, values: readonly T[]): value is T[] {
  return Array.isArray(value) && value.every((item) => isOneOf(item, values));
}

/** The old "focus" list, computed from what the person actually told us. */
export function deriveFocuses(
  sources: readonly OnboardingIncomeSource[],
  holdings: readonly OnboardingHolding[],
): OnboardingFocus[] {
  const focuses = new Set<OnboardingFocus>();
  for (const source of sources) {
    if (source === "salary" || source === "freelance" || source === "business" || source === "rent" || source === "interest") {
      focuses.add(source);
    } else if (source === "dividends" || source === "property_sale" || source === "crypto" || source === "foreign") {
      focuses.add("investments");
    } else if (source === "pension") {
      focuses.add("salary");
    }
  }
  if (holdings.some((holding) => holding !== "none" && holding !== "form16")) focuses.add("deductions");
  if (focuses.size === 0) focuses.add("not_sure");
  return Array.from(focuses);
}

/**
 * Completion needs every page answered. Income sources may be empty only when the person
 * said they had no income (or a migrated profile never asked); holdings may be empty for a
 * migrated profile (the summary asks them to complete it) but a fresh form requires a pick.
 */
export function createOnboardingProfile(draft: OnboardingDraft, lang: Lang): OnboardingProfile | null {
  if (
    !isOneOf(draft.intent, INTENTS) ||
    !isOneOf(draft.profession, PROFESSIONS) ||
    !isOneOf(draft.ageBand, AGE_BANDS) ||
    !isOneOf(draft.residency, RESIDENCIES) ||
    !isListOf(draft.incomeSources, INCOME_SOURCES) ||
    !isOneOf(draft.incomeBand, INCOME_BANDS) ||
    !isListOf(draft.holdings, HOLDINGS) ||
    !isOneOf(draft.filingHistory, FILING_HISTORY) ||
    !isOneOf(draft.filedBy, FILED_BY) ||
    !isOneOf(draft.helpLevel, HELP_LEVELS)
  ) {
    return null;
  }
  if (draft.incomeSources.length === 0 && draft.incomeBand !== "none" && draft.incomeBand !== "unknown") {
    return null;
  }
  const incomeSources = Array.from(new Set(draft.incomeSources));
  const holdings = draft.holdings.includes("none") ? ["none" as const] : Array.from(new Set(draft.holdings));
  const note = typeof draft.note === "string" ? draft.note.trim().slice(0, NOTE_MAX) : "";
  return {
    version: ONBOARDING_VERSION,
    lang,
    intent: draft.intent,
    profession: draft.profession,
    ageBand: draft.ageBand,
    residency: draft.residency,
    incomeSources,
    incomeBand: draft.incomeBand,
    holdings,
    filingHistory: draft.filingHistory,
    filedBy: draft.filingHistory === "never" ? "not_applicable" : draft.filedBy,
    helpLevel: draft.helpLevel,
    note,
    focuses: deriveFocuses(incomeSources, holdings),
    completedAt: new Date().toISOString(),
  };
}

/** Which of the migrated answers are still `unknown`/empty, for the summary screen. */
export function missingAnswers(profile: OnboardingProfile): string[] {
  const missing: string[] = [];
  if (profile.ageBand === "unknown") missing.push("ageBand");
  if (profile.residency === "unknown") missing.push("residency");
  if (profile.incomeBand === "unknown") missing.push("incomeBand");
  if (profile.incomeSources.length === 0 && profile.incomeBand !== "none") missing.push("incomeSources");
  if (profile.holdings.length === 0) missing.push("holdings");
  return missing;
}

export function getPersonalization(profile: OnboardingProfile): Personalization {
  // "Guide me" and "do it for me" both want plain words and pacing; "expert" wants the trail open.
  const guided = profile.helpLevel !== "expert";
  const hasDeductionSignals =
    profile.holdings.some((holding) => holding !== "none" && holding !== "form16") ||
    profile.profession === "self_employed" ||
    profile.profession === "business_owner";
  return {
    guided,
    regimeLens: hasDeductionSignals ? "check_claims" : "compare_both",
  };
}

/** The four intents the 23 dictionaries know; the newer ones map to their nearest job. */
export type LegacyIntent = "file_return" | "check_refund" | "understand_notice" | "correct_prefill";

export function legacyIntent(intent: OnboardingIntent): LegacyIntent {
  switch (intent) {
    case "check_refund":
    case "understand_notice":
    case "correct_prefill":
      return intent;
    case "explore":
      return "check_refund";
    default:
      return "file_return";
  }
}

export type LegacyProfession = Exclude<OnboardingProfession, "homemaker">;

export function legacyProfession(profession: OnboardingProfession): LegacyProfession {
  return profession === "homemaker" ? "other" : profession;
}

/**
 * Choose the first useful dashboard surface from the user's stated intent.
 * An unfiled return always starts with facts because every later calculation
 * depends on information the user confirms, even when their stated goal is a
 * refund check or a notice explanation.
 */
export function getDashboardDestination(profile: OnboardingProfile, hasFiled: boolean): DashboardDestination {
  if (!hasFiled) return "facts";
  switch (legacyIntent(profile.intent)) {
    case "understand_notice":
      return "actions";
    case "correct_prefill":
      return "statement";
    case "check_refund":
    case "file_return":
    default:
      return "overview";
  }
}

/* -------------------------------------------------------------- migration -- */

/**
 * v1 carried an income band and no mode; v2 a Simple/Full mode; v3 neither. All become v4
 * with the unasked answers marked `unknown`/empty. People are never sent back through
 * onboarding to re-answer what they already answered (plan §6); the summary invites them
 * to fill the gaps from "Change answers".
 */
function migrateLegacy(value: Record<string, unknown>): OnboardingDraft {
  const focuses = Array.isArray(value.focuses) ? (value.focuses as string[]).filter((f): f is OnboardingFocus => isOneOf(f, FOCUSES)) : [];
  const incomeSources: OnboardingIncomeSource[] = [];
  for (const focus of focuses) {
    if (focus === "investments") incomeSources.push("dividends");
    else if (focus !== "deductions" && focus !== "not_sure") incomeSources.push(focus);
  }
  const filingHistory = isOneOf(value.filingHistory, FILING_HISTORY) ? value.filingHistory : "never";
  return {
    lang: value.lang as Lang,
    intent: isOneOf(value.intent, INTENTS) ? value.intent : "file_return",
    profession: isOneOf(value.profession, PROFESSIONS) ? value.profession : "other",
    ageBand: "unknown",
    residency: "unknown",
    incomeSources,
    incomeBand: isOneOf(value.incomeBand, INCOME_BANDS) ? value.incomeBand : "unknown",
    holdings: [],
    filingHistory,
    filedBy: filingHistory === "never" ? "not_applicable" : "self",
    helpLevel: value.mode === "full" ? "expert" : "guide",
    note: "",
  };
}

/** Accept a stored profile of any version and return it at the current version, or null. */
export function normaliseOnboardingProfile(value: unknown): OnboardingProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.version === ONBOARDING_VERSION) {
    const profile = value as OnboardingProfile;
    const rebuilt = createOnboardingProfile(profile, profile.lang);
    return rebuilt ? { ...rebuilt, completedAt: profile.completedAt ?? rebuilt.completedAt } : null;
  }
  if (record.version === 1 || record.version === 2 || record.version === 3) {
    return createOnboardingProfile(migrateLegacy(record), record.lang as Lang);
  }
  return null;
}

export function loadOnboardingProfile(): OnboardingProfile | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    const value: unknown = JSON.parse(globalThis.localStorage.getItem(ONBOARDING_PROFILE_KEY) ?? "null");
    const profile = normaliseOnboardingProfile(value);
    if (profile && (value as { version?: number }).version !== ONBOARDING_VERSION) saveOnboardingProfile(profile);
    return profile;
  } catch {
    return null;
  }
}

export function loadOnboardingDraft(): OnboardingDraft {
  if (typeof globalThis.localStorage === "undefined") return {};
  try {
    const value: unknown = JSON.parse(globalThis.localStorage.getItem(ONBOARDING_DRAFT_KEY) ?? "null");
    return value && typeof value === "object" ? (value as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  if (typeof globalThis.localStorage === "undefined") return;
  globalThis.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
}

export function saveOnboardingProfile(profile: OnboardingProfile): void {
  if (typeof globalThis.localStorage === "undefined") return;
  globalThis.localStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
  globalThis.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
}
