import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../db";
import { createOnboardingProfile } from "../../onboarding";
import {
  authenticate,
  createSession,
  createUser,
  deleteUser,
  DEMO_PASSWORD,
  DEMO_USERNAME,
  destroySession,
  getUserByUsername,
  hashPassword,
  resetSignInFailuresForTests,
  seedDemoAccount,
  setOnboarding,
  setPreferences,
  signIn,
  UsernameTaken,
  verifyPassword,
} from "../auth";

describe("auth", () => {
  beforeEach(() => {
    resetDbForTests();
    resetSignInFailuresForTests();
  });

  it("hashes with scrypt and verifies only the right password", () => {
    const stored = hashPassword("12345");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("12345", stored)).toBe(true);
    expect(verifyPassword("12346", stored)).toBe(false);
    expect(verifyPassword("12345", "garbage")).toBe(false);
  });

  it("seeds the demo account once and signs it in", () => {
    seedDemoAccount();
    seedDemoAccount();
    const user = getUserByUsername(DEMO_USERNAME);
    expect(user).not.toBeNull();
    const result = signIn(DEMO_USERNAME, DEMO_PASSWORD);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.username).toBe("asabs");
      expect(result.user.mode).toBe("agentic");
      expect(result.user.onboardedAt).toBeNull();
      expect(authenticate(result.token)?.id).toBe(user!.id);
    }
  });

  it("rejects a wrong password with a generic failure and locks after ten tries", () => {
    seedDemoAccount();
    for (let i = 0; i < 10; i++) {
      expect(signIn("ASABS", "wrong")).toEqual({ ok: false, failure: "bad_credentials" });
    }
    expect(signIn("asabs", DEMO_PASSWORD)).toEqual({ ok: false, failure: "locked" });
    // The window passes: the lock lifts.
    const later = new Date(Date.now() + 16 * 60 * 1000);
    expect(signIn("asabs", DEMO_PASSWORD, later).ok).toBe(true);
  });

  it("refuses duplicate and malformed usernames", () => {
    createUser("priya_s", "secret1");
    expect(() => createUser("Priya_S", "other")).toThrow(UsernameTaken);
    expect(() => createUser("ab", "secret1")).toThrow();
    expect(() => createUser("has space", "secret1")).toThrow();
    expect(() => createUser("okname", "abc")).toThrow();
  });

  it("sessions expire, slide, and can be destroyed", () => {
    const user = createUser("rakesh", "secret1");
    const start = new Date("2026-09-03T00:00:00Z");
    const token = createSession(user.id, start);
    expect(authenticate(token, start)?.id).toBe(user.id);
    // Day 29: still valid, and the expiry slides forward from here.
    const day29 = new Date(start.getTime() + 29 * 86_400_000);
    expect(authenticate(token, day29)?.id).toBe(user.id);
    const day58 = new Date(day29.getTime() + 29 * 86_400_000);
    expect(authenticate(token, day58)?.id).toBe(user.id);
    const day100 = new Date(day58.getTime() + 42 * 86_400_000);
    expect(authenticate(token, day100)).toBeNull();
    const fresh = createSession(user.id);
    destroySession(fresh);
    expect(authenticate(fresh)).toBeNull();
    expect(authenticate("not-a-token")).toBeNull();
    expect(authenticate(undefined)).toBeNull();
  });

  it("stores onboarding once and preferences on the account", () => {
    const user = createUser("sunita", "secret1");
    const profile = createOnboardingProfile(
      {
        lang: "hi",
        intent: "file_return",
        profession: "salaried",
        ageBand: "30_44",
        residency: "resident",
        incomeSources: ["salary"],
        incomeBand: "8_to_12",
        holdings: ["form16"],
        filingHistory: "never",
        filedBy: "self",
        helpLevel: "guide",
      },
      "hi",
    )!;
    const after = setOnboarding(user.id, profile)!;
    expect(after.onboardedAt).not.toBeNull();
    expect(after.onboarding?.intent).toBe("file_return");
    expect(after.lang).toBe("hi");
    const firstStamp = after.onboardedAt;
    // Editing answers later never resets the stamp: onboarding shows once.
    const edited = setOnboarding(user.id, { ...profile, intent: "check_refund" })!;
    expect(edited.onboardedAt).toBe(firstStamp);
    expect(edited.onboarding?.intent).toBe("check_refund");
    const prefs = setPreferences(user.id, { mode: "manual", theme: "dark", lang: "ta" })!;
    expect(prefs.mode).toBe("manual");
    expect(prefs.theme).toBe("dark");
    expect(prefs.lang).toBe("ta");
  });

  it("deletes a user and removes sessions and data", () => {
    const user = createUser("todelete", "secret1");
    const token = createSession(user.id);
    expect(authenticate(token)?.id).toBe(user.id);
    deleteUser(user.id);
    expect(getUserByUsername("todelete")).toBeNull();
    expect(authenticate(token)).toBeNull();
  });
});
