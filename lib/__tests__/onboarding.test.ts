import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyProfileToReturn,
  createOnboardingProfile,
  getDashboardDestination,
  getPersonalization,
  isPlaceholderName,
  isProfileComplete,
  loadOnboardingProfile,
  profileSeed,
  saveOnboardingProfile,
  type OnboardingDraft,
} from "../onboarding";
import { installLocalStorageStub } from "../return/__tests__/fixtures";

const completeDraft: OnboardingDraft = {
  lang: "en",
  mode: "full",
  identity: { name: "Sunita Devi", pan: "DEMPS4417K", dob: "1992-03-04", aadhaarLast4: "4417" },
  contact: { mobile: "90000 00001", address: "Tiruppur, Tamil Nadu" },
  residency: "resident",
  banks: [{ id: "b1", bank: "Kaveri Cooperative Bank", maskedNumber: "•••• •••• 1183", ifsc: "KAVC0001183", status: "validated", nominatedForRefund: true }],
  connections: { digilocker: { linked: true, linkedAt: "2026-09-07T10:00:00.000Z" } },
};

describe("onboarding profile v3 — only what never changes (2026-09-07)", () => {
  beforeEach(() => installLocalStorageStub());

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("needs a PAN-shaped identity and a mode, nothing about the tax year", () => {
    expect(createOnboardingProfile({ lang: "en", mode: "full" }, "en")).toBeNull();
    expect(createOnboardingProfile({ ...completeDraft, identity: { name: "X", pan: "not-a-pan" } }, "en")).toBeNull();
    const profile = createOnboardingProfile(completeDraft, "en");
    expect(profile).toMatchObject({ version: 3, mode: "full", identity: { pan: "DEMPS4417K" }, residency: "resident", refundAccountId: "b1" });
    expect(profile && "intent" in profile).toBe(false);
    expect(profile && "profession" in profile).toBe(false);
  });

  it("defaults residency to resident and the refund account to the nominated bank", () => {
    const profile = createOnboardingProfile({ ...completeDraft, residency: undefined, refundAccountId: "not-a-bank" }, "en");
    expect(profile?.residency).toBe("resident");
    expect(profile?.refundAccountId).toBe("b1");
  });

  it("the chosen mode decides guidance; the year's regime lean decides the lens", () => {
    const profile = createOnboardingProfile({ ...completeDraft, mode: "simple" }, "en")!;
    expect(getPersonalization(profile, "open")).toEqual({ guided: true, regimeLens: "check_claims" });
    expect(getPersonalization(profile, "new")).toEqual({ guided: true, regimeLens: "compare_both" });
    expect(getPersonalization(createOnboardingProfile(completeDraft, "en")!).guided).toBe(false);
  });

  it("migrates stored v1 and v2 profiles instead of sending the user back through onboarding", () => {
    globalThis.localStorage.setItem(
      "wapsi_onboarding_profile",
      JSON.stringify({ version: 2, lang: "hi", intent: "file_return", profession: "salaried", mode: "full", filingHistory: "never", focuses: ["salary"], completedAt: "2026-06-01T00:00:00.000Z" }),
    );
    const v2 = loadOnboardingProfile();
    expect(v2).toMatchObject({ version: 3, lang: "hi", mode: "full", migratedFrom: 2, connections: { digilocker: { linked: false } } });
    expect(isProfileComplete(v2!)).toBe(false);

    globalThis.localStorage.setItem(
      "wapsi_onboarding_profile",
      JSON.stringify({ version: 1, lang: "en", intent: "file_return", profession: "salaried", incomeBand: "8_to_12", filingHistory: "never", focuses: ["salary", "not_sure"], completedAt: "2026-06-01T00:00:00.000Z" }),
    );
    expect(loadOnboardingProfile()).toMatchObject({ version: 3, mode: "simple", migratedFrom: 1 });
  });

  it("opens the filed dashboard on the surface that matches the year's intent", () => {
    expect(getDashboardDestination("understand_notice", true)).toBe("actions");
    expect(getDashboardDestination("correct_prefill", true)).toBe("statement");
    expect(getDashboardDestination("check_refund", true)).toBe("overview");
    expect(getDashboardDestination(undefined, true)).toBe("overview");
    expect(getDashboardDestination("understand_notice", false)).toBe("facts");
  });

  it("round-trips a completed profile in local storage", () => {
    const profile = createOnboardingProfile(completeDraft, "en")!;
    saveOnboardingProfile(profile);
    expect(loadOnboardingProfile()).toMatchObject({ version: 3, identity: { pan: "DEMPS4417K" }, banks: [{ id: "b1" }] });
    expect(isProfileComplete(profile)).toBe(true);
  });

  it("the seed the runtime sees carries no identifier", () => {
    const seed = profileSeed(createOnboardingProfile(completeDraft, "en")!);
    expect(seed).toEqual({ firstName: "Sunita", refundAccount: "Kaveri Cooperative Bank •••• •••• 1183", residency: "resident", digilockerLinked: true, mode: "full" });
    expect(JSON.stringify(seed)).not.toContain("DEMPS4417K");
    expect(JSON.stringify(seed)).not.toContain("4417\"");
  });
});

describe("the PAN record's name replaces the sign-up placeholder wherever a return arrives (2026-09-09)", () => {
  const profile = createOnboardingProfile(completeDraft, "en")!;
  const placeholder = {
    name: "Citizen 6666",
    city: "",
    state: "",
    mobile: "",
    banks: [] as never[],
  };
  const stateWith = (name: string) => ({
    persona: { ...placeholder, name },
    baselinePersona: { ...placeholder, name },
    other: "untouched",
  });

  it("knows a placeholder from a real name", () => {
    expect(isPlaceholderName("Citizen 6666")).toBe(true);
    expect(isPlaceholderName("Real User")).toBe(true);
    expect(isPlaceholderName("")).toBe(true);
    expect(isPlaceholderName(undefined)).toBe(true);
    expect(isPlaceholderName("Sunita Devi")).toBe(false);
    // A real name that merely starts with the word must survive.
    expect(isPlaceholderName("Citizen Kane")).toBe(false);
  });

  it("writes the profile onto both personas and leaves the rest of the return alone", () => {
    const applied = applyProfileToReturn(stateWith("Citizen 6666"), profile);
    expect(applied.persona.name).toBe("Sunita Devi");
    expect(applied.baselinePersona.name).toBe("Sunita Devi");
    expect(applied.persona.city).toBe("Tiruppur");
    expect(applied.persona.state).toBe("Tamil Nadu");
    expect(applied.persona.mobile).toBe("90000 00001");
    expect(applied.persona.banks).toHaveLength(1);
    expect(applied.other).toBe("untouched");
  });

  it("never overwrites a real name, and applying twice changes nothing", () => {
    const once = applyProfileToReturn(stateWith("Rakesh Kumar"), profile);
    expect(once.persona.name).toBe("Rakesh Kumar");
    const twice = applyProfileToReturn(applyProfileToReturn(stateWith("Citizen 6666"), profile), profile);
    expect(twice).toEqual(applyProfileToReturn(stateWith("Citizen 6666"), profile));
  });

  it("is a no-op when nobody has onboarded yet", () => {
    const state = stateWith("Citizen 6666");
    expect(applyProfileToReturn(state, null)).toBe(state);
  });
});
