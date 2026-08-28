import type { Lang } from "./types";

export const ONBOARDING_PROFILE_KEY = "wapsi_onboarding_profile";
export const ONBOARDING_DRAFT_KEY = "wapsi_onboarding_draft";
export const ONBOARDING_VERSION = 2;

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

/**
 * The Simple / Full-detail split, chosen explicitly and early. This is the product's central
 * seam (PLAN.md §3.2): two coherent experiences, not a density slider. Asked as its own
 * question because inferring it from proxies guesses at the one thing the user can state.
 */
export type OnboardingMode = "simple" | "full";

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
  mode: OnboardingMode;
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
const MODES: OnboardingMode[] = ["simple", "full"];
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
    !isOneOf(draft.mode, MODES) ||
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
    mode: draft.mode,
    filingHistory: draft.filingHistory,
    focuses: Array.from(new Set(draft.focuses)),
    completedAt: new Date().toISOString(),
  };
}

export function getPersonalization(profile: OnboardingProfile): Personalization {
  // The user's explicit choice IS the guidance level; the old heuristic survives only as the
  // migration default for v1 profiles that never answered the question.
  const guided = profile.mode === "simple";
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

/**
 * v1 profiles carried an income band (asked, then never used — deleted in v2) and no mode.
 * They are migrated, not invalidated: bumping people back through onboarding to re-answer
 * questions we already have answers to is the exact annoyance Phase 3 exists to remove.
 */
function migrateV1(value: Record<string, unknown>): OnboardingDraft {
  const focuses = Array.isArray(value.focuses) ? (value.focuses as OnboardingFocus[]) : [];
  const guided = value.filingHistory === "never" || focuses.includes("not_sure");
  return {
    lang: value.lang as Lang,
    intent: value.intent as OnboardingIntent,
    profession: value.profession as OnboardingProfession,
    mode: guided ? "simple" : "full",
    filingHistory: value.filingHistory as OnboardingFilingHistory,
    focuses,
  };
}

export function loadOnboardingProfile(): OnboardingProfile | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      globalThis.localStorage.getItem(ONBOARDING_PROFILE_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (record.version === 1) {
      const migrated = createOnboardingProfile(migrateV1(record), record.lang as Lang);
      if (migrated) saveOnboardingProfile(migrated);
      return migrated;
    }
    if (record.version !== ONBOARDING_VERSION) return null;
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
