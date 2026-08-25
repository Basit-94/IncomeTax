import type { Lang } from "./types";

export const ONBOARDING_PROFILE_KEY = "wapsi_onboarding_profile";
export const ONBOARDING_DRAFT_KEY = "wapsi_onboarding_draft";
export const ONBOARDING_VERSION = 1;

export type OnboardingIntent =
  | "file_return"
  | "check_refund"
  | "understand_notice"
  | "correct_prefill";

export type OnboardingProfession =
  | "salaried"
  | "self_employed"
  | "business_owner"
  | "student"
  | "retired"
  | "investor"
  | "other";

export type OnboardingIncomeBand =
  | "none"
  | "under_4"
  | "4_to_8"
  | "8_to_12"
  | "12_to_25"
  | "over_25";

export type OnboardingFilingHistory = "never" | "once" | "every_year";

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
  incomeBand: OnboardingIncomeBand;
  filingHistory: OnboardingFilingHistory;
  focuses: OnboardingFocus[];
  completedAt: string;
}

export type OnboardingDraft = Partial<
  Omit<OnboardingProfile, "version" | "completedAt">
>;

export interface Personalization {
  guided: boolean;
  regimeLens: "check_claims" | "compare_both";
}

export type DashboardDestination = "facts" | "overview" | "statement" | "actions";

const INTENTS: OnboardingIntent[] = [
  "file_return",
  "check_refund",
  "understand_notice",
  "correct_prefill",
];
const PROFESSIONS: OnboardingProfession[] = [
  "salaried",
  "self_employed",
  "business_owner",
  "student",
  "retired",
  "investor",
  "other",
];
const INCOME_BANDS: OnboardingIncomeBand[] = [
  "none",
  "under_4",
  "4_to_8",
  "8_to_12",
  "12_to_25",
  "over_25",
];
const FILING_HISTORY: OnboardingFilingHistory[] = ["never", "once", "every_year"];
const FOCUSES: OnboardingFocus[] = [
  "salary",
  "freelance",
  "business",
  "rent",
  "interest",
  "investments",
  "deductions",
  "not_sure",
];

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function createOnboardingProfile(
  draft: OnboardingDraft,
  lang: Lang,
): OnboardingProfile | null {
  if (
    !isOneOf(draft.intent, INTENTS) ||
    !isOneOf(draft.profession, PROFESSIONS) ||
    !isOneOf(draft.incomeBand, INCOME_BANDS) ||
    !isOneOf(draft.filingHistory, FILING_HISTORY) ||
    !Array.isArray(draft.focuses) ||
    draft.focuses.length === 0 ||
    draft.focuses.some((focus) => !isOneOf(focus, FOCUSES))
  ) {
    return null;
  }

  return {
    version: ONBOARDING_VERSION,
    lang,
    intent: draft.intent,
    profession: draft.profession,
    incomeBand: draft.incomeBand,
    filingHistory: draft.filingHistory,
    focuses: Array.from(new Set(draft.focuses)),
    completedAt: new Date().toISOString(),
  };
}

export function getPersonalization(profile: OnboardingProfile): Personalization {
  const guided =
    profile.filingHistory === "never" || profile.focuses.includes("not_sure");
  const hasDeductionSignals =
    profile.focuses.includes("rent") ||
    profile.focuses.includes("deductions") ||
    profile.profession === "self_employed" ||
    profile.profession === "business_owner";

  return {
    guided,
    regimeLens: hasDeductionSignals ? "check_claims" : "compare_both",
  };
}

/**
 * Choose the first useful dashboard surface from the user's stated intent.
 * An unfiled return always starts with facts because every later calculation
 * depends on information the user confirms, even when their stated goal is a
 * refund check or a notice explanation.
 */
export function getDashboardDestination(
  profile: OnboardingProfile,
  hasFiled: boolean,
): DashboardDestination {
  if (!hasFiled) return "facts";

  switch (profile.intent) {
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

export function loadOnboardingProfile(): OnboardingProfile | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      globalThis.localStorage.getItem(ONBOARDING_PROFILE_KEY) ?? "null",
    );
    if (
      !value ||
      typeof value !== "object" ||
      (value as OnboardingProfile).version !== ONBOARDING_VERSION
    ) {
      return null;
    }
    const profile = value as OnboardingProfile;
    return createOnboardingProfile(profile, profile.lang);
  } catch {
    return null;
  }
}

export function loadOnboardingDraft(): OnboardingDraft {
  if (typeof globalThis.localStorage === "undefined") return {};
  try {
    const value: unknown = JSON.parse(
      globalThis.localStorage.getItem(ONBOARDING_DRAFT_KEY) ?? "null",
    );
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
