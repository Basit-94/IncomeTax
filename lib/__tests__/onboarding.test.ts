import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOnboardingProfile,
  getDashboardDestination,
  getPersonalization,
  loadOnboardingProfile,
  saveOnboardingProfile,
  type OnboardingDraft,
} from "../onboarding";
import { installLocalStorageStub } from "../return/__tests__/fixtures";

const completeDraft: OnboardingDraft = {
  lang: "en",
  intent: "file_return",
  profession: "salaried",
  mode: "full",
  filingHistory: "never",
  focuses: ["salary", "not_sure"],
};

describe("onboarding profile", () => {
  beforeEach(() => installLocalStorageStub());

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires every short answer before completing", () => {
    expect(createOnboardingProfile({ lang: "en" }, "en")).toBeNull();
    expect(createOnboardingProfile(completeDraft, "en")).toMatchObject({
      intent: "file_return",
      mode: "full",
      focuses: ["salary", "not_sure"],
    });
  });

  it("the chosen mode decides guidance; deduction signals decide the regime lens", () => {
    const profile = createOnboardingProfile(
      {
        ...completeDraft,
        mode: "simple",
        profession: "business_owner",
        focuses: ["business", "deductions"],
      },
      "en",
    );
    expect(profile).not.toBeNull();
    expect(getPersonalization(profile!)).toEqual({
      guided: true,
      regimeLens: "check_claims",
    });
  });

  it("an explicit full-detail choice wins even for a first-time filer", () => {
    // v2 semantics: the user's stated mode IS the guidance level. filingHistory no longer
    // overrides what the person explicitly asked for.
    const profile = createOnboardingProfile(
      { ...completeDraft, mode: "full", filingHistory: "never", focuses: ["salary"] },
      "en",
    );
    expect(profile).not.toBeNull();
    expect(getPersonalization(profile!)).toEqual({
      guided: false,
      regimeLens: "compare_both",
    });
  });

  it("migrates a stored v1 profile instead of sending the user back through onboarding", () => {
    // A v1 profile has an incomeBand and no mode. It must load as v2 with mode derived from
    // the old guided heuristic — re-asking answered questions is what Phase 3 removes.
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
    const migrated = loadOnboardingProfile();
    expect(migrated).toMatchObject({ version: 2, mode: "simple", profession: "salaried" });
  });

  it("opens the filed dashboard on the surface that matches the stated intent", () => {
    const noticeProfile = createOnboardingProfile(
      { ...completeDraft, intent: "understand_notice", filingHistory: "every_year" },
      "en",
    );
    const correctionProfile = createOnboardingProfile(
      { ...completeDraft, intent: "correct_prefill", filingHistory: "every_year" },
      "en",
    );

    expect(getDashboardDestination(noticeProfile!, true)).toBe("actions");
    expect(getDashboardDestination(correctionProfile!, true)).toBe("statement");
    expect(getDashboardDestination(noticeProfile!, false)).toBe("facts");
  });

  it("round-trips a completed profile in local storage", () => {
    const profile = createOnboardingProfile(completeDraft, "en");
    expect(profile).not.toBeNull();
    saveOnboardingProfile(profile!);
    expect(loadOnboardingProfile()).toMatchObject({
      lang: "en",
      intent: "file_return",
      profession: "salaried",
    });
  });
});
