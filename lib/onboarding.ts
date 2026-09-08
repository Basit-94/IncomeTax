import type { BankAccount, Lang } from "./types";

export const ONBOARDING_PROFILE_KEY = "wapsi_onboarding_profile";
export const ONBOARDING_DRAFT_KEY = "wapsi_onboarding_draft";
export const ONBOARDING_VERSION = 3;

/**
 * v3 (2026-09-07, user direction: "only mention those questions that can be exactly the same every
 * year… if something gets updated every year, add it in the agentic mode"). The profile holds what
 * never changes about a person — identity, contact, residency, refund account, how much detail they
 * like, and whether DigiLocker is linked. Everything with a tax year attached (intent, employer, salary,
 * housing, deductions, regime) lives on the year's return as a `YearIntake` (lib/return/year-intake.ts).
 */

/** Why the person came — asked every visit in the Agentic opener; kept here as the shared vocabulary. */
export type OnboardingIntent =
  | "file_return"
  | "check_refund"
  | "understand_notice"
  | "correct_prefill";

/**
 * The Simple / Full-detail split, chosen explicitly and early. This is the product's central
 * seam (PLAN.md §3.2): two coherent experiences, not a density slider.
 */
export type OnboardingMode = "simple" | "full";

export type Residency = "resident" | "nri" | "rnor";

export interface OnboardingIdentity {
  /** As on the PAN record; locked in the interface. */
  name: string;
  pan: string;
  /** ISO date. */
  dob?: string;
  aadhaarLast4?: string;
}

export interface OnboardingContact {
  mobile?: string;
  email?: string;
  /** One line, as the Aadhaar record carries it; editable. */
  address?: string;
}

/** The two rare standing facts — off by default, never asked yearly. */
export interface OnboardingStanding {
  representative?: { name: string; capacity: string };
  disability?: "40_79" | "80_plus";
}

export interface OnboardingProfile {
  version: typeof ONBOARDING_VERSION;
  lang: Lang;
  mode: OnboardingMode;
  identity: OnboardingIdentity;
  contact: OnboardingContact;
  residency: Residency;
  banks: BankAccount[];
  refundAccountId?: string;
  standing?: OnboardingStanding;
  /** A permission, not data: the yearly fetch still shows its own consent card. */
  connections: { digilocker: { linked: boolean; linkedAt?: string } };
  completedAt: string;
  /** Rebuilt from a v1/v2 record: identity may be blank until the person confirms it on the dashboard. */
  migratedFrom?: 1 | 2;
}

export type OnboardingDraft = Partial<
  Omit<OnboardingProfile, "version" | "completedAt" | "migratedFrom">
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
const MODES: OnboardingMode[] = ["simple", "full"];
const RESIDENCIES: Residency[] = ["resident", "nri", "rnor"];
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function isOnboardingIntent(value: unknown): value is OnboardingIntent {
  return isOneOf(value, INTENTS);
}

export function createOnboardingProfile(
  draft: OnboardingDraft,
  lang: Lang,
): OnboardingProfile | null {
  const identity = draft.identity;
  if (
    !identity ||
    typeof identity.pan !== "string" ||
    !PAN_RE.test(identity.pan) ||
    typeof identity.name !== "string" ||
    identity.name.trim().length === 0 ||
    !isOneOf(draft.mode, MODES)
  ) {
    return null;
  }
  const banks = Array.isArray(draft.banks) ? draft.banks : [];
  const refundAccountId =
    draft.refundAccountId && banks.some((b) => b.id === draft.refundAccountId)
      ? draft.refundAccountId
      : banks.find((b) => b.nominatedForRefund)?.id ?? banks[0]?.id;

  return {
    version: ONBOARDING_VERSION,
    lang,
    mode: draft.mode,
    identity: { ...identity, name: identity.name.trim() },
    contact: draft.contact ?? {},
    residency: isOneOf(draft.residency, RESIDENCIES) ? draft.residency : "resident",
    banks,
    refundAccountId,
    standing: draft.standing,
    connections: draft.connections ?? { digilocker: { linked: false } },
    completedAt: new Date().toISOString(),
  };
}

/** A migrated profile with no PAN still needs the identity screen once. */
export function isProfileComplete(profile: OnboardingProfile): boolean {
  return PAN_RE.test(profile.identity.pan) && profile.identity.name.length > 0;
}

/**
 * The person's explicit choice IS the guidance level. The regime lens comes from the year's intake:
 * an open regime (deductions could still flip it) means the claims are checked first.
 */
export function getPersonalization(
  profile: OnboardingProfile,
  regimeLean: "new" | "old" | "open" = "new",
): Personalization {
  return {
    guided: profile.mode === "simple",
    regimeLens: regimeLean === "open" ? "check_claims" : "compare_both",
  };
}

/**
 * Choose the first useful dashboard surface from the year's stated intent.
 * An unfiled return always starts with facts because every later calculation
 * depends on information the user confirms, even when their stated goal is a
 * refund check or a notice explanation.
 */
export function getDashboardDestination(
  intent: OnboardingIntent | null | undefined,
  hasFiled: boolean,
): DashboardDestination {
  if (!hasFiled) return "facts";

  switch (intent) {
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
 * v1 (intent, profession, incomeBand, filingHistory, focuses) and v2 (+ mode) carried nothing that
 * survives a year unchanged except language and mode. Both migrate to v3 with a blank identity and
 * DigiLocker unlinked; the person is never sent back through onboarding — the dashboard offers to
 * complete the profile instead (same reasoning as the v1→v2 migration this replaces).
 */
function migrateLegacy(value: Record<string, unknown>): OnboardingProfile {
  const version = value.version === 1 ? 1 : 2;
  let mode: OnboardingMode = "simple";
  if (isOneOf(value.mode, MODES)) mode = value.mode;
  else if (version === 1) {
    const focuses = Array.isArray(value.focuses) ? (value.focuses as string[]) : [];
    mode = value.filingHistory === "never" || focuses.includes("not_sure") ? "simple" : "full";
  }
  return {
    version: ONBOARDING_VERSION,
    lang: value.lang as Lang,
    mode,
    identity: { name: "", pan: "" },
    contact: {},
    residency: "resident",
    banks: [],
    connections: { digilocker: { linked: false } },
    completedAt: typeof value.completedAt === "string" ? value.completedAt : new Date().toISOString(),
    migratedFrom: version,
  };
}

function isV3(value: Record<string, unknown>): value is OnboardingProfile & Record<string, unknown> {
  const identity = value.identity as Record<string, unknown> | undefined;
  return (
    value.version === ONBOARDING_VERSION &&
    typeof value.lang === "string" &&
    isOneOf(value.mode, MODES) &&
    !!identity &&
    typeof identity.pan === "string" &&
    typeof identity.name === "string" &&
    Array.isArray(value.banks) &&
    typeof value.completedAt === "string"
  );
}

export function loadOnboardingProfile(): OnboardingProfile | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      globalThis.localStorage.getItem(ONBOARDING_PROFILE_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (record.version === 1 || record.version === 2) {
      const migrated = migrateLegacy(record);
      saveOnboardingProfile(migrated);
      return migrated;
    }
    if (!isV3(record)) return null;
    return {
      ...record,
      contact: record.contact ?? {},
      residency: isOneOf(record.residency, RESIDENCIES) ? record.residency : "resident",
      connections: record.connections ?? { digilocker: { linked: false } },
    };
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

/**
 * What the profile knows about the person, written onto a blank or placeholder persona (2026-09-07): the
 * name from the PAN record replaces "Citizen 1982", the city/state come from the address, the mobile and
 * the pre-validated banks fill in where the persona had none. Seeded figures are never touched.
 */
export function applyProfileToPersona<T extends { name: string; city: string; state: string; mobile: string; banks: BankAccount[] }>(persona: T, profile: OnboardingProfile): T {
  const placeholderName = isPlaceholderName(persona.name);
  const parts = (profile.contact.address ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  const city = parts.length >= 2 ? parts[parts.length - 2] : "";
  const state = parts.length >= 1 ? parts[parts.length - 1].replace(/\s+\d{6}.*$/, "").replace(/\s*\(DigiLocker mock, sample\)$/, "") : "";
  return {
    ...persona,
    name: placeholderName && profile.identity.name ? profile.identity.name : persona.name,
    city: persona.city || city,
    state: persona.state || state,
    mobile: persona.mobile || profile.contact.mobile || "",
    banks: persona.banks.length ? persona.banks : profile.banks,
  };
}

/**
 * The profile written onto a whole return, wherever that return just arrived (2026-09-09).
 *
 * The server's copy of the return is created at sign-up, BEFORE onboarding runs, so it carries the
 * "Citizen 6666" placeholder and no bank. Every surface that pulls it — the Manual page and the
 * Agentic page both do — has to re-apply the profile, or the placeholder comes back and is shown as
 * the person's name. Idempotent: `applyProfileToPersona` fills only a placeholder name and empty
 * city/state/mobile/banks, so applying it twice changes nothing.
 */
export function applyProfileToReturn<T extends { persona: P; baselinePersona: P }, P extends { name: string; city: string; state: string; mobile: string; banks: BankAccount[] }>(
  state: T,
  profile: OnboardingProfile | null = loadOnboardingProfile(),
): T {
  if (!profile) return state;
  return {
    ...state,
    persona: applyProfileToPersona(state.persona, profile),
    baselinePersona: applyProfileToPersona(state.baselinePersona, profile),
  };
}

/** The name to show for this person: the PAN record's, never the `Citizen 6666` sign-up placeholder. */
export function isPlaceholderName(name: string | undefined | null): boolean {
  return !name || /^Citizen\s+\d{4}$/i.test(name.trim()) || /^Real User$/i.test(name.trim());
}

/**
 * The part of the profile the Agentic runtime may see (plan.md §5.5: identifiers stay out of the
 * model's reach). First name, a masked refund account, residency, the DigiLocker link and the mode —
 * no PAN, no Aadhaar, no address.
 */
export interface ProfileSeed {
  firstName?: string;
  refundAccount?: string;
  residency: Residency;
  digilockerLinked: boolean;
  mode: OnboardingMode;
}

export function profileSeed(profile: OnboardingProfile): ProfileSeed {
  const refund = profile.banks.find((b) => b.id === profile.refundAccountId);
  const first = profile.identity.name.trim().split(/\s+/)[0];
  // "Citizen 1982" is the sign-up placeholder, not a name to greet with.
  const greetable = first && !/^citizen$/i.test(first) && !/^real$/i.test(first);
  return {
    firstName: greetable ? first : undefined,
    refundAccount: refund ? `${refund.bank} ${refund.maskedNumber}` : undefined,
    residency: profile.residency,
    digilockerLinked: profile.connections.digilocker.linked,
    mode: profile.mode,
  };
}
