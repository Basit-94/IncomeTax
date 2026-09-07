/**
 * The one form of the yearly intake, as field specs — shared by both shells (2026-09-07).
 *
 * Pure and framework-free, and deliberately free of the agentic store (which pulls the database
 * driver), so the Manual facts step can import it into the browser. `lib/agentic/intake.ts`
 * re-exports these for the runtime; `components/flow/year-gap-form.tsx` renders them directly.
 */

import type { FormField } from "../agentic/types";
import type { AgenticStrings } from "../i18n/agenticStrings";
import type { GapGroup, YearAnswers } from "./year-intake";

/** The form keys the deductions group uses; `pf_amount` / `health_amount` kept from the first intake so nothing downstream moves. */
export const DEDUCTION_FIELDS: { key: string; section: "80C" | "80D_SELF" | "80CCD_1B" | "80E" | "80G" | "24B" | "80GG" | "80EEB"; label: keyof AgenticStrings }[] = [
  { key: "pf_amount", section: "80C", label: "ded80C" },
  { key: "health_amount", section: "80D_SELF", label: "ded80D" },
  { key: "ded_80CCD_1B", section: "80CCD_1B", label: "ded80CCD1B" },
  { key: "ded_80E", section: "80E", label: "ded80E" },
  { key: "ded_80G", section: "80G", label: "ded80G" },
  { key: "ded_24B", section: "24B", label: "ded24B" },
  { key: "ded_80GG", section: "80GG", label: "ded80GG" },
  { key: "ded_80EEB", section: "80EEB", label: "ded80EEB" },
];

export interface YearFormContext {
  gaps?: GapGroup[];
  carried?: Pick<YearAnswers, "housing" | "extras" | "deductions">;
  ownerKind: "demo" | "citizen";
  residencyKnown?: boolean;
  answers: Record<string, string | number | boolean>;
  s: AgenticStrings;
}

/** The fields of the one form, from the groups that are still open. */
export function formFieldsFor(ctx: YearFormContext, salaryKnown: boolean): FormField[] {
  const { s } = ctx;
  const gaps = ctx.gaps ?? [];
  const fields: FormField[] = [];
  if (gaps.includes("manual") || !salaryKnown) {
    if (!salaryKnown) fields.push({ key: "salary_amount", label: s.fieldSalary, type: "number", hint: s.fieldSalaryHint });
    fields.push({
      key: "employer_category", label: s.fieldEmployerCategory, type: "choice",
      choices: [
        { value: "others", label: s.employerOthers },
        { value: "central_govt", label: s.employerCentral },
        { value: "state_govt", label: s.employerState },
        { value: "psu", label: s.employerPsu },
        { value: "pensioner", label: s.employerPensioner },
      ],
    });
    fields.push({ key: "interest_amount", label: s.fieldInterest, type: "number", hint: s.fieldInterestHint });
  }
  // A citizen without a profile is asked about residency once, whatever else the papers answered; the guard needs it.
  if (ctx.ownerKind === "citizen" && !ctx.residencyKnown && ctx.answers.resident === undefined) fields.push({ key: "resident", label: s.fieldResident, type: "yes_no" });
  if (gaps.includes("housing")) {
    fields.push({
      key: "housing", label: s.askHousing, type: "choice", defaultValue: ctx.carried?.housing,
      choices: [
        { value: "rent", label: s.housingRent },
        { value: "own_self", label: s.housingOwnSelf },
        { value: "own_letout", label: s.housingOwnLetOut },
        { value: "family", label: s.housingFamily },
      ],
    });
  }
  if (gaps.includes("extras")) {
    fields.push({
      key: "extras", label: s.askExtras, type: "multi", defaultValue: ctx.carried?.extras?.join(","),
      choices: [
        { value: "business", label: s.extraBusiness },
        { value: "sold_assets", label: s.extraSoldAssets },
        { value: "foreign", label: s.extraForeign },
        { value: "director", label: s.extraDirector },
        { value: "crypto", label: s.extraCrypto },
        { value: "agri", label: s.extraAgri },
        { value: "disability", label: s.extraDisability },
        { value: "family_pension", label: s.extraFamilyPension },
        { value: "none", label: s.extraNone },
      ],
    });
  }
  // Deductions: the full set when the regime is open on a known income; on the no-papers path only the two the
  // first intake asked (PF, health) — the regime cannot be judged before the salary is typed, and eight blanks is a form.
  const deductionFields = gaps.includes("deductions") ? DEDUCTION_FIELDS : gaps.includes("manual") ? DEDUCTION_FIELDS.slice(0, 2) : [];
  for (const d of deductionFields) {
    const carried = ctx.carried?.deductions?.find((c) => c.section === d.section)?.amount;
    fields.push({ key: d.key, label: s[d.label] as string, type: "number", hint: d.key === "pf_amount" ? s.askDeductionsHint : undefined, defaultValue: carried });
  }
  return fields;
}

/** The one form's answers as the year's `YearAnswers`, for `record_year_intake`. */
export function yearAnswersFrom(a: Record<string, string | number | boolean>): YearAnswers {
  const out: YearAnswers = {};
  if (typeof a.housing === "string" && ["rent", "own_self", "own_letout", "family"].includes(a.housing)) out.housing = a.housing as YearAnswers["housing"];
  if (typeof a.extras === "string") {
    const list = a.extras.split(",").map((x) => x.trim()).filter(Boolean);
    out.extras = (list.length ? list : ["none"]) as YearAnswers["extras"];
  }
  const deductions = DEDUCTION_FIELDS.filter((d) => typeof a[d.key] === "number" && (a[d.key] as number) > 0).map((d) => ({ section: d.section, amount: a[d.key] as number }));
  // Only substance is recorded: a form answered with zeros leaves the year untouched, so a run that "stages nothing" still does.
  if (deductions.length) out.deductions = deductions;
  // Typed figures count only when they are figures; residency is the profile's fact and the run's guard already has it.
  const manual: NonNullable<YearAnswers["manual"]> = {};
  if (typeof a.salary_amount === "number" && a.salary_amount > 0) manual.salary = a.salary_amount;
  if (typeof a.interest_amount === "number" && a.interest_amount > 0) manual.interest = a.interest_amount;
  if (typeof a.employer_category === "string" && a.employer_category) manual.employerCategory = a.employer_category as NonNullable<YearAnswers["manual"]>["employerCategory"];
  if (Object.keys(manual).length) out.manual = manual;
  return out;
}
