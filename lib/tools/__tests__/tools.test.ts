import { describe, expect, it } from "vitest";
import { advanceTaxSchedule, calendarWithStatus, everifyDeadline, hraExemption, tdsMismatch } from "../index";

describe("manual-mode helpers", () => {
  it("HRA: the least of the three limits binds", () => {
    // Basic ₹6,00,000, HRA ₹2,40,000, rent ₹2,16,000, metro: rent − 10% basic = ₹1,56,000 binds.
    const metro = hraExemption({ basic: 600_000, hraReceived: 240_000, rentPaid: 216_000, metro: true });
    expect(metro).toMatchObject({ exempt: 156_000, taxable: 84_000, binding: "rentMinusTenPercent" });
    expect(metro.limits.percentOfBasic).toBe(300_000);
    // Non-metro with a small allowance: the allowance itself binds.
    expect(hraExemption({ basic: 600_000, hraReceived: 100_000, rentPaid: 300_000, metro: false })).toMatchObject({ exempt: 100_000, binding: "received" });
    // No rent: nothing exempt.
    expect(hraExemption({ basic: 600_000, hraReceived: 100_000, rentPaid: 0, metro: false }).exempt).toBe(0);
  });

  it("advance tax: threshold, cumulative shares, presumptive single date", () => {
    expect(advanceTaxSchedule(9_999).applies).toBe(false);
    const schedule = advanceTaxSchedule(100_000);
    expect(schedule.applies).toBe(true);
    expect(schedule.instalments.map((i) => i.instalment)).toEqual([15_000, 30_000, 30_000, 25_000]);
    expect(schedule.instalments.map((i) => i.cumulativeAmount)).toEqual([15_000, 45_000, 75_000, 100_000]);
    const presumptive = advanceTaxSchedule(50_000, { presumptive: true });
    expect(presumptive.instalments).toHaveLength(1);
    expect(presumptive.instalments[0]).toMatchObject({ due: "2026-03-15", instalment: 50_000 });
  });

  it("calendar: statuses relative to today, e-verify deadline", () => {
    const entries = calendarWithStatus("2026-07-01");
    const due = entries.find((e) => e.date === "2026-07-31")!;
    expect(due.status).toBe("soon");
    expect(due.daysAway).toBe(30);
    expect(entries.find((e) => e.date === "2026-03-15")!.status).toBe("past");
    expect(entries.find((e) => e.date === "2026-12-31")!.status).toBe("later");
    expect(everifyDeadline("2026-09-03T05:01:21.000Z")).toBe("2026-10-03");
  });

  it("TDS mismatch: agree within tolerance, otherwise say who can fix it", () => {
    expect(tdsMismatch(110_000, 110_005).direction).toBe("match");
    const lower = tdsMismatch(110_000, 84_600);
    expect(lower).toMatchObject({ direction: "statement_lower", difference: -25_400 });
    expect(lower.advice).toContain("employer");
    const higher = tdsMismatch(110_000, 112_240);
    expect(higher).toMatchObject({ direction: "statement_higher", difference: 2_240 });
    expect(higher.advice).toContain("deductor");
  });
});
