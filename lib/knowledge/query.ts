import { DICTS } from "../i18n";
import type { TaxPeriod } from "./types";
import { periodForFinancialYear } from "./provisions";

/** Keep combining marks: stripping them corrupts Indian-language words. */
export function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[\u200b-\u200d\ufeff]/g, "").replace(/[^\p{L}\p{M}\p{N}().%-]+/gu, " ").trim();
}
const STOP = new Set("a an the is are was be can could should would i my me you your for of to on in and or it this that what how does do tax income under with have has please explain about".split(" "));
export function tokens(text: string): string[] {
  return normalize(text).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}

// Reuse all 23 shipped dictionaries as query aliases, not new legal translations.
const aliases: [string, string][] = Object.values(DICTS).flatMap((d): [string, string][] => [
  [d.check.standardDeduction, "16(ia) standard deduction"], [d.check.rebate87A, "87A rebate"],
  [d.check.cess, "cess-surcharge cess"], [d.regime.newRegimeName, "115BAC(1A) new regime"],
  [d.regime.oldRegimeName, "rates-old old regime"],
]);
aliases.push(["मानक कटौती", "16(ia) standard deduction"], ["स्टैंडर्ड डिडक्शन", "16(ia) standard deduction"],
  ["மருத்துவ காப்பீடு", "80D health insurance"], ["स्वास्थ्य बीमा", "80D health insurance"],
  ["tax slabs", "115BAC(1A) rates-old slabs"], ["mediclaim", "80D health insurance"],
  ["employer nps", "80CCD(2)"], ["deadline", "139(1)"], ["last date", "139(1)"],
  ["capital gains", "111A 112A 112"], ["home loan", "24"], ["fixed deposit", "80TTA-80TTB"]);

export function expandQuery(text: string): string {
  const q = normalize(text.slice(0, 2000));
  const extra = aliases.filter(([alias]) => {
    const a = normalize(alias);
    return a.length > 2 && (` ${q} `).includes(` ${a} `);
  }).map(([, expansion]) => expansion);
  return `${q} ${[...new Set(extra)].join(" ")}`.trim();
}

export function explicitSections(text: string): string[] {
  return [...new Set(normalize(text).match(/\b(?:16\(ia\)|24(?:\(b\))?|80[a-z]+(?:\([12][ab]?\))?|87a|111a|112a?|115bac(?:\(1a\))?|139\([1459]\))/gi) ?? [])];
}

/** Explicit years never silently fall back to the app's default AY. */
export function resolveQueryPeriod(text: string, fallback: TaxPeriod): { period: TaxPeriod; ambiguous: boolean } {
  const matches = [...text.matchAll(/\b(FY|AY|TY|financial year|assessment year|tax year)\s*(20\d{2})\s*[-–/]\s*(20\d{2}|\d{2})\b/gi)];
  if (!matches.length) return { period: fallback, ambiguous: /\b20\d{2}\s*[-–/]\s*\d{2,4}\b/.test(text) };
  const periods = matches.map((m) => {
    const start = Number(m[2]);
    if (Number(m[3]) % 100 !== (start + 1) % 100) return null;
    const fy = /^(AY|assessment)/i.test(m[1]) ? start - 1 : start;
    return periodForFinancialYear(`${fy}-${String((fy + 1) % 100).padStart(2, "0")}`);
  });
  const valid = periods.filter((p): p is TaxPeriod => p !== null);
  return { period: valid[0] ?? fallback, ambiguous: valid.length !== periods.length || new Set(valid.map((p) => p.financialYear)).size > 1 };
}
