import { describe, it, expect, beforeEach } from "vitest";
import {
  listRegisteredCAs,
  registerCA,
  loginCA,
  getRegisteredCA,
  setActiveCASession,
  getActiveCASession,
  requestCAReview,
  listDraftsForCA,
  SEED_REGISTERED_CAS,
} from "../ca-registry";
import { blankPersona } from "../../signin-flow";

describe("Wapsi CA Registry & Async Review Workflow", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("starts with clean slate (no pre-seeded CAs) until registered", () => {
    const cas = listRegisteredCAs();
    expect(cas.length).toBe(0);
  });

  it("registers a new Chartered Accountant with ICAI validation and password", async () => {
    const result = await registerCA({
      name: "CA Sumanth Joshi",
      membershipNo: "054321",
      password: "securePassword123",
      firmName: "Joshi & Associates",
      city: "Pune",
      email: "sumanth.joshi@puneca.com",
    });

    expect(result.ok).toBe(true);
    expect(result.ca).toBeDefined();
    expect(result.ca?.id).toBe("ca_054321");
    expect(result.ca?.membershipNo).toBe("054321");

    const found = getRegisteredCA("054321");
    expect(found).not.toBeNull();
    expect(found?.firmName).toBe("Joshi & Associates");

    // Can sign in using password with membership number
    const loginRes = await loginCA({
      identifier: "054321",
      password: "securePassword123",
    });
    expect(loginRes.ok).toBe(true);
    expect(loginRes.ca?.id).toBe("ca_054321");

    // Can sign in using Name
    const loginByName = await loginCA({
      identifier: "Sumanth Joshi",
      password: "securePassword123",
    });
    expect(loginByName.ok).toBe(true);
    expect(loginByName.ca?.id).toBe("ca_054321");

    // Fails with wrong password
    const badLogin = await loginCA({
      identifier: "054321",
      password: "wrongPassword",
    });
    expect(badLogin.ok).toBe(false);
    expect(badLogin.error).toContain("Incorrect password");
  });

  it("validates ICAI membership number constraints", async () => {
    const invalidResult = await registerCA({
      name: "Bad Number CA",
      membershipNo: "123", // too short
      password: "pass",
      firmName: "Practice",
      city: "Mumbai",
      email: "test@ca.com",
    });

    expect(invalidResult.ok).toBe(false);
    expect(invalidResult.error).toContain("valid 5 to 7 digit ICAI");
  });

  it("creates an asynchronous review request draft tied to a specific CA", async () => {
    const demoPersona = blankPersona("DEMPS4417K", "Sunita Rao", "en");

    const draft = await requestCAReview({
      caId: "ca_084920",
      citizenPan: "DEMPS4417K",
      citizenName: "Sunita Rao",
      pin: "2468",
      originalPersona: demoPersona,
      originalRegime: "new",
      permissions: {
        allowEdit: true,
        shareAIS: true,
        shareForm16: true,
      },
      clientNotes: "Please verify my NPS deduction under Old Regime.",
    });

    expect(draft.code).toMatch(/^CA-\d{4}-\d{2}$/);
    expect(draft.targetCaId).toBe("ca_084920");
    expect(draft.isDraft).toBe(true);
    expect(draft.clientNotes).toBe("Please verify my NPS deduction under Old Regime.");
    expect(draft.permissions?.allowEdit).toBe(true);

    // CA can see this draft in their queue
    const caQueue = listDraftsForCA("ca_084920");
    expect(caQueue.some((r) => r.code === draft.code)).toBe(true);
  });
});
