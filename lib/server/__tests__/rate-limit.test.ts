import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "../rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests within the limit and blocks when exceeded", () => {
    const key = "test-ip";
    const now = 1_000_000;

    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(key, 5, 60_000, now + i * 100);
      expect(res.ok).toBe(true);
      expect(res.remaining).toBe(4 - i);
    }

    // 6th attempt within the 1-minute window should be blocked
    const blocked = checkRateLimit(key, 5, 60_000, now + 600);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetSeconds).toBeGreaterThan(0);

    // After the window expires, requests should be allowed again
    const later = checkRateLimit(key, 5, 60_000, now + 60_001);
    expect(later.ok).toBe(true);
  });
});
