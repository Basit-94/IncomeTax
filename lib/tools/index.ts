/**
 * Small pure helpers behind the manual-mode tiles (plan §5, task 4.2). Whole rupees in,
 * whole rupees out; no framework, no dates other than the ones the statute fixes.
 */

/* ------------------------------------------------------------------ HRA -- */

export interface HraInput {
  /** Annual basic salary (plus DA if it counts for retirement benefits). */
  basic: number;
  /** Annual house rent allowance received. */
  hraReceived: number;
  /** Annual rent actually paid. */
  rentPaid: number;
  /** Delhi, Mumbai, Kolkata, Chennai count as metro for the 50% limit. */
  metro: boolean;
}

export interface HraResult {
  exempt: number;
  taxable: number;
  limits: { received: number; rentMinusTenPercent: number; percentOfBasic: number };
  binding: "received" | "rentMinusTenPercent" | "percentOfBasic";
}

/** s.10(13A): the least of HRA received, rent − 10% of basic, and 50%/40% of basic. */
export function hraExemption(input: HraInput): HraResult {
  const received = Math.max(0, Math.round(input.hraReceived));
  const rentMinusTenPercent = Math.max(0, Math.round(input.rentPaid - 0.1 * input.basic));
  const percentOfBasic = Math.round((input.metro ? 0.5 : 0.4) * input.basic);
  const exempt = Math.min(received, rentMinusTenPercent, percentOfBasic);
  const binding = exempt === received ? "received" : exempt === rentMinusTenPercent ? "rentMinusTenPercent" : "percentOfBasic";
  return { exempt, taxable: received - exempt, limits: { received, rentMinusTenPercent, percentOfBasic }, binding };
}

/* ---------------------------------------------------------- advance tax -- */

export interface AdvanceTaxInstalment {
  due: string;
  label: string;
  cumulativeShare: number;
  cumulativeAmount: number;
  instalment: number;
}

export const ADVANCE_TAX_THRESHOLD = 10_000;

/**
 * s.208/211 for FY 2025-26: nothing below ₹10,000 of liability after TDS; otherwise 15%,
 * 45%, 75%, 100% cumulative by the four dates. Presumptive (44AD/44ADA) pays all by 15 March.
 */
export function advanceTaxSchedule(liabilityAfterTds: number, opts: { presumptive?: boolean } = {}): { applies: boolean; instalments: AdvanceTaxInstalment[] } {
  const liability = Math.max(0, Math.round(liabilityAfterTds));
  if (liability < ADVANCE_TAX_THRESHOLD) return { applies: false, instalments: [] };
  const dates: [string, string, number][] = opts.presumptive
    ? [["2026-03-15", "By 15 March 2026", 1]]
    : [
        ["2025-06-15", "By 15 June 2025", 0.15],
        ["2025-09-15", "By 15 September 2025", 0.45],
        ["2025-12-15", "By 15 December 2025", 0.75],
        ["2026-03-15", "By 15 March 2026", 1],
      ];
  let paidSoFar = 0;
  const instalments = dates.map(([due, label, share]) => {
    const cumulativeAmount = Math.round(liability * share);
    const instalment = cumulativeAmount - paidSoFar;
    paidSoFar = cumulativeAmount;
    return { due, label, cumulativeShare: share, cumulativeAmount, instalment };
  });
  return { applies: true, instalments };
}

/* ------------------------------------------------------------- calendar -- */

export interface CalendarEntry {
  date: string;
  title: string;
  detail: string;
  audience: "everyone" | "salaried" | "business" | "filed";
}

/** The dates that matter for AY 2026-27 (FY 2025-26), in order. */
export const TAX_CALENDAR: CalendarEntry[] = [
  { date: "2025-06-15", title: "First advance-tax instalment", detail: "15% of the year's expected tax, if more than ₹10,000 is due after TDS.", audience: "business" },
  { date: "2025-09-15", title: "Second advance-tax instalment", detail: "45% cumulative.", audience: "business" },
  { date: "2025-12-15", title: "Third advance-tax instalment", detail: "75% cumulative.", audience: "business" },
  { date: "2026-03-15", title: "Last advance-tax instalment", detail: "100%. Presumptive-scheme businesses pay everything by this date.", audience: "business" },
  { date: "2026-03-31", title: "Financial year ends", detail: "Investments and premiums must be paid by now to count for this year.", audience: "everyone" },
  { date: "2026-06-15", title: "Salary statement (Form 16) due from employers", detail: "Employers must hand it over by this date; it carries the figures the return needs.", audience: "salaried" },
  { date: "2026-07-31", title: "Return due", detail: "For everyone whose accounts need no audit. Filing later costs a fee and forfeits some losses.", audience: "everyone" },
  { date: "2026-10-31", title: "Return due (audited accounts)", detail: "For businesses and professionals whose accounts are audited.", audience: "business" },
  { date: "2026-12-31", title: "Last day for a late or revised return", detail: "A belated return or a correction to a filed one must be in by now.", audience: "everyone" },
];

export type CalendarStatus = "past" | "soon" | "later";

export function calendarWithStatus(today: string): (CalendarEntry & { status: CalendarStatus; daysAway: number })[] {
  const now = new Date(`${today}T00:00:00Z`).getTime();
  return TAX_CALENDAR.map((entry) => {
    const daysAway = Math.round((new Date(`${entry.date}T00:00:00Z`).getTime() - now) / 86_400_000);
    const status: CalendarStatus = daysAway < 0 ? "past" : daysAway <= 45 ? "soon" : "later";
    return { ...entry, status, daysAway };
  });
}

/** Thirty days from filing for e-verification. */
export function everifyDeadline(filedAtIso: string): string {
  const d = new Date(filedAtIso);
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}

/* ----------------------------------------------------------- TDS check -- */

export interface TdsMismatch {
  form16: number;
  statement: number;
  difference: number;
  direction: "match" | "statement_lower" | "statement_higher";
  advice: string;
}

/** Form 16 says one thing, the department's statement (26AS/AIS) another. */
export function tdsMismatch(form16Tds: number, statementTds: number, tolerance = 10): TdsMismatch {
  const form16 = Math.max(0, Math.round(form16Tds));
  const statement = Math.max(0, Math.round(statementTds));
  const difference = statement - form16;
  if (Math.abs(difference) <= tolerance) {
    return { form16, statement, difference: 0, direction: "match", advice: "They agree. The credit will land against your return without a query." };
  }
  if (difference < 0) {
    return {
      form16,
      statement,
      difference,
      direction: "statement_lower",
      advice: "The department has less than your employer deducted. Only the employer can fix this: ask them to revise their quarterly TDS return so the missing credit appears; claim the Form 16 figure and keep the statement as proof.",
    };
  }
  return {
    form16,
    statement,
    difference,
    direction: "statement_higher",
    advice: "The department has more than your Form 16 shows, often a second deductor (a bank or a previous employer). Claim what the statement shows and check each deductor listed in it.",
  };
}
