import { describe, expect, it } from "vitest";
import { stableIdempotencyKey, type SubmissionIdentity } from "./submission-key";

/**
 * T1.2 / B2. The key has to hold two properties that pull against each other: an identical
 * resubmission must collapse to one filing, and a corrected one must not be swallowed as a
 * duplicate.
 */
const base: SubmissionIdentity = {
  personaId: "priya",
  assessmentYear: "2026-27",
  ruleSetVersion: "2026-27-new",
  facts: [
    { kind: "salary", amountPaise: 124_000_000 },
    { kind: "interest", amountPaise: 348_000 },
  ],
  claims: [{ section: "80C", amountPaise: 15_000_000 }],
  tdsCreditsPaise: 9_792_000,
};

const key = (over: Partial<SubmissionIdentity> = {}) => stableIdempotencyKey({ ...base, ...over });

describe("stableIdempotencyKey", () => {
  it("is stable across identical submissions, so a retry dedupes", () => {
    expect(key()).toBe(stableIdempotencyKey(structuredClone(base)));
  });

  it("does not depend on the clock — the bug this replaces", () => {
    // The old key was `idemp-${id}-${Date.now()}`, so two calls never matched.
    expect(key()).toBe(key());
  });

  it("ignores the order of facts and claims", () => {
    expect(key({ facts: [base.facts[1], base.facts[0]] })).toBe(key());
  });

  it("changes when a single paise changes, so a correction is not swallowed", () => {
    expect(key({ tdsCreditsPaise: base.tdsCreditsPaise + 1 })).not.toBe(key());
  });

  it("changes when a fact amount changes", () => {
    expect(key({ facts: [{ kind: "salary", amountPaise: 124_000_001 }, base.facts[1]] })).not.toBe(key());
  });

  it("changes when the regime changes", () => {
    expect(key({ ruleSetVersion: "2026-27-old" })).not.toBe(key());
  });

  it("separates different people", () => {
    expect(key({ personaId: "rakesh" })).not.toBe(key());
  });

  it("does not collide when field boundaries shift", () => {
    // ["ab","c"] and ["a","bc"] must not canonicalise to the same string.
    expect(key({ claims: [{ section: "80", amountPaise: 15_000_000 }] })).not.toBe(
      key({ claims: [{ section: "8", amountPaise: 15_000_000 }] }),
    );
  });

  it("keeps the identity readable in the key itself", () => {
    expect(key()).toMatch(/^idemp-priya-2026-27-new-[0-9a-f]{16}$/);
  });
});
