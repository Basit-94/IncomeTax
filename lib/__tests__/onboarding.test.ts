import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOnboardingProfile,
  deriveFocuses,
  getDashboardDestination,
  getPersonalization,
  legacyIntent,
  legacyProfession,
  loadOnboardingProfile,
  missingAnswers,
  normaliseOnboardingProfile,
  saveOnboardingProfile,
  type OnboardingDraft,
} from "../onboarding";
import { installLocalStorageStub } from "../return/__tests__/fixtures";

const completeDraft: OnboardingDraft = {
  lang: "en",
  intent: "plan_new_job",
  profession: "salaried",
  ageBand: "under_30",
  residency: "resident",
  incomeSources: ["salary", "interest"],
  incomeBand: "12_to_25",
  holdings: ["form16", "pf", "rent_paid"],
  filingHistory: "never",
  filedBy: "self",
  helpLevel: "do_it",
  note: "  Joined a new company in July.  ",
};

describe("onboarding v4", () => {
  beforeEach(() => installLocalStorageStub());

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires every page before completing, then derives the rest", () => {
    expect(createOnboardingProfile({ lang: "en" }, "en")).toBeNull();
    expect(createOnboardingProfile({ ...completeDraft, helpLevel: undefined }, "en")).toBeNull();
    const profile = createOnboardingProfile(completeDraft, "en");
    expect(profile).toMatchObject({
      version: 4,
      intent: "plan_new_job",
      // "never filed" makes the who-did-it answer moot.
      filedBy: "not_applicable",
      note: "Joined a new company in July.",
      focuses: ["salary", "interest", "deductions"],
    });
  });

  it("allows no income sources only when there is no income", () => {
    expect(createOnboardingProfile({ ...completeDraft, incomeSources: [] }, "en")).toBeNull();
    expect(createOnboardingProfile({ ...completeDraft, incomeSources: [], incomeBand: "none" }, "en")).not.toBeNull();
  });

  it("collapses holdings to 'none' when none is picked and caps the note", () => {
    const profile = createOnboardingProfile(
      { ...completeDraft, holdings: ["pf", "none"], note: "x".repeat(400) },
      "en",
    );
    expect(profile?.holdings).toEqual(["none"]);
    expect(profile?.note).toHaveLength(200);
    expect(profile?.focuses).toEqual(["salary", "interest"]);
  });

  it("derives the legacy focus list from sources and holdings", () => {
    expect(deriveFocuses([], [])).toEqual(["not_sure"]);
    expect(deriveFocuses(["crypto", "pension"], ["donations"])).toEqual(["investments", "salary", "deductions"]);
    expect(deriveFocuses(["business"], ["form16"])).toEqual(["business"]);
  });

  it("help level decides guidance; deduction signals decide the regime lens", () => {
    const guided = createOnboardingProfile(completeDraft, "en")!;
    expect(getPersonalization(guided)).toEqual({ guided: true, regimeLens: "check_claims" });
    const expert = createOnboardingProfile(
      { ...completeDraft, helpLevel: "expert", holdings: ["form16"], profession: "salaried" },
      "en",
    )!;
    expect(getPersonalization(expert)).toEqual({ guided: false, regimeLens: "compare_both" });
  });

  it("maps the newer intents and professions onto what the dictionaries know", () => {
    expect(legacyIntent("plan_new_job")).toBe("file_return");
    expect(legacyIntent("business_benefits")).toBe("file_return");
    expect(legacyIntent("explore")).toBe("check_refund");
    expect(legacyIntent("understand_notice")).toBe("understand_notice");
    expect(legacyProfession("homemaker")).toBe("other");
    expect(legacyProfession("retired")).toBe("retired");
  });

  it("migrates v1, v2 and v3 profiles instead of re-asking, and flags the gaps", () => {
    globalThis.localStorage.setItem(
      "wapsi_onboarding_profile",
      JSON.stringify({
        version: 1,
        lang: "en",
        intent: "file_return",
        profession: "salaried",
        incomeBand: "8_to_12",
        filingHistory: "never",
        focuses: ["salary", "not_sure"],
        completedAt: "2026-06-01T00:00:00.000Z",
      }),
    );
    const v1 = loadOnboardingProfile()!;
    expect(v1).toMatchObject({ version: 4, incomeBand: "8_to_12", incomeSources: ["salary"], helpLevel: "guide" });
    expect(missingAnswers(v1)).toEqual(["ageBand", "residency", "holdings"]);
    // The migrated copy is written back so the next load is a plain v4 read.
    expect(JSON.parse(globalThis.localStorage.getItem("wapsi_onboarding_profile")!).version).toBe(4);

    const v2 = normaliseOnboardingProfile({
      version: 2,
      lang: "hi",
      intent: "check_refund",
      profession: "retired",
      mode: "full",
      filingHistory: "every_year",
      focuses: ["interest", "investments"],
      completedAt: "2026-08-01T00:00:00.000Z",
    })!;
    expect(v2).toMatchObject({ version: 4, lang: "hi", helpLevel: "expert", filedBy: "self" });
    expect(v2.incomeSources).toEqual(["interest", "dividends"]);
    expect(v2).not.toHaveProperty("mode");

    const v3 = normaliseOnboardingProfile({
      version: 3,
      lang: "ta",
      intent: "correct_prefill",
      profession: "business_owner",
      filingHistory: "once",
      focuses: ["business", "deductions"],
      completedAt: "2026-09-01T00:00:00.000Z",
    })!;
    expect(v3).toMatchObject({ version: 4, incomeBand: "unknown", filedBy: "self" });
    expect(normaliseOnboardingProfile({ version: 99 })).toBeNull();
  });

  it("opens the filed dashboard on the surface that matches the stated intent", () => {
    const notice = createOnboardingProfile({ ...completeDraft, intent: "understand_notice", filingHistory: "every_year" }, "en")!;
    const correction = createOnboardingProfile({ ...completeDraft, intent: "correct_prefill", filingHistory: "every_year" }, "en")!;
    const explore = createOnboardingProfile({ ...completeDraft, intent: "explore", filingHistory: "every_year" }, "en")!;
    expect(getDashboardDestination(notice, true)).toBe("actions");
    expect(getDashboardDestination(correction, true)).toBe("statement");
    expect(getDashboardDestination(explore, true)).toBe("overview");
    expect(getDashboardDestination(notice, false)).toBe("facts");
  });

  it("round-trips a completed profile in local storage", () => {
    const profile = createOnboardingProfile(completeDraft, "en")!;
    saveOnboardingProfile(profile);
    expect(loadOnboardingProfile()).toMatchObject({ lang: "en", intent: "plan_new_job", ageBand: "under_30" });
  });
});
