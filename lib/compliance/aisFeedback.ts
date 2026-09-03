/**
 * CBDT AIS feedback codes — the department's own vocabulary for disagreeing
 * with a reported row.
 *
 * These are not free text. When a citizen says "no, this is wrong" about an AIS
 * entry, the portal makes them pick one of these; the code is what travels back
 * to the reporter and what decides whether the entry is corrected, reassigned,
 * or dropped. A dispute without one is not something the department can act on,
 * which is why the reducer requires it.
 *
 * SINGLE SOURCE. Two copies of this table already existed — one in
 * `lib/agent/copilot-engine.ts` and one in the agent's system prompt — and they
 * had drifted. This module is now the only definition; both import it.
 *
 * Table (aligned 2026-09-03 to the pre-audit spec, which follows the order of
 * the department's own AIS feedback options):
 *   CODE_1 correct · CODE_2 not fully correct · CODE_3 other PAN / year ·
 *   CODE_4 duplicate · CODE_5 denied.
 *
 * Pure data, no React: the agent (server) and the reconciliation surface
 * (client) both read it.
 */

export type AISFeedbackCode = "CODE_1" | "CODE_2" | "CODE_3" | "CODE_4" | "CODE_5";

export const AIS_FEEDBACK_CODES: readonly AISFeedbackCode[] = [
  "CODE_1",
  "CODE_2",
  "CODE_3",
  "CODE_4",
  "CODE_5",
] as const;

/** Short label — what goes in the dropdown. */
export const AIS_FEEDBACK_LABELS: Readonly<Record<AISFeedbackCode, string>> = {
  CODE_1: "Information is correct",
  CODE_2: "Information is not fully correct",
  CODE_3: "Information relates to other PAN / financial year",
  CODE_4: "Information is duplicate",
  CODE_5: "Information is denied",
};

/** One line of plain language, for the citizen who does not know which to pick. */
export const AIS_FEEDBACK_HELP: Readonly<Record<AISFeedbackCode, string>> = {
  CODE_1: "The amount and the source are both right. Nothing to change.",
  CODE_2: "The source is right but the figure is not. You will enter the correct amount and say why, with proof if you have it.",
  CODE_3: "This belongs to someone else's PAN, a joint holder, or a different year.",
  CODE_4: "The same transaction was reported twice — for instance by both the fund house and its registrar.",
  CODE_5: "You never received this at all.",
};

/**
 * Which codes need the citizen's own words before the dispute can be filed.
 * CODE_2 always does — "not fully correct" is meaningless without the reason
 * and, ideally, the document that shows the right figure.
 */
export const AIS_FEEDBACK_REQUIRES_EXPLANATION: Readonly<Record<AISFeedbackCode, boolean>> = {
  CODE_1: false,
  CODE_2: true,
  CODE_3: false,
  CODE_4: false,
  CODE_5: false,
};

/** The codes that mean the citizen is contesting the row. CODE_1 is agreement. */
export const DISPUTE_FEEDBACK_CODES: readonly AISFeedbackCode[] = [
  "CODE_2",
  "CODE_3",
  "CODE_4",
  "CODE_5",
] as const;

export function isAISFeedbackCode(value: string): value is AISFeedbackCode {
  return (AIS_FEEDBACK_CODES as readonly string[]).includes(value);
}
