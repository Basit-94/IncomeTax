import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOnboardingProfile,
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
  incomeBand: "8_to_12",
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
      incomeBand: "8_to_12",
      focuses: ["salary", "not_sure"],
    });
  });

  it("chooses guided explanations and claim review from the answers", () => {
    const profile = createOnboardingProfile(
      {
        ...completeDraft,
        filingHistory: "never",
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

  it("keeps a returning salaried filer on the shorter compare-both path", () => {
    const profile = createOnboardingProfile(
      { ...completeDraft, filingHistory: "every_year", focuses: ["salary"] },
      "en",
    );
    expect(profile).not.toBeNull();
    expect(getPersonalization(profile!)).toEqual({
      guided: false,
      regimeLens: "compare_both",
    });
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
