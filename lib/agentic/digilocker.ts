/**
 * The runtime's view of the DigiLocker mock (2026-09-07: rebuilt on lib/digilocker).
 *
 * Nothing here talks to the real DigiLocker. The provider (`lib/digilocker/provider.ts`) owns the
 * record — generated once per PAN, kept in the store, linked at onboarding — and fills `lockerCache`;
 * these synchronous helpers read that cache so the intake's question builder can list the consent
 * items without an await. When the cache is cold (tests, a fresh process) they build the same record
 * the provider would create without a database: the seeded persona's, or the PAN-seeded person.
 * Consent still gates every fetch: `listIssuedDocuments` only describes; the runtime imports after yes.
 */

import { createHash } from "node:crypto";
import { fromPersona, generateLockerRecord } from "../digilocker/generate";
import { issuedFromRecord, lockerCache, profileFromRecord } from "../digilocker/provider";
import type { IssuedDocument, LockerProfile, LockerRecord } from "../digilocker/types";
import { formatMoney } from "../money";
import { findPersonaByPan } from "../personas";
import type { Owner } from "../server/session";
import type { Lang } from "../types";

export type { IssuedDocument, LockerProfile } from "../digilocker/types";
export { TDS_194A_THRESHOLD, TDS_194_DIVIDEND_THRESHOLD } from "../digilocker/generate";

/** The record for an owner, from the provider's cache or rebuilt deterministically. Pure for a given cache. */
export function recordFor(owner: Owner, assessmentYear = "2026-27"): LockerRecord {
  const pan = owner.pan.toUpperCase();
  const cached = lockerCache.get(pan);
  if (cached && cached.years[assessmentYear]) return cached;
  const now = "2026-09-07T00:00:00.000Z";
  const persona = findPersonaByPan(pan);
  const rec = persona ? fromPersona(persona, now) : generateLockerRecord(pan, createHash("sha256").update(`digilocker-seed:${pan}`).digest("hex"), assessmentYear, now);
  lockerCache.set(pan, rec);
  return rec;
}

/** The standing record: identity, address, banks. */
export function readProfile(owner: Owner): LockerProfile {
  return profileFromRecord(recordFor(owner));
}

/** What the locker holds for this owner and year — the year's papers by default, the identity cards on request. */
export function listIssuedDocuments(owner: Owner, assessmentYear: string, scope: "identity" | "year" | "all" = "year"): IssuedDocument[] {
  return issuedFromRecord(recordFor(owner, assessmentYear), assessmentYear).filter((d) => scope === "all" || d.scope === scope);
}

/** One line per document for the consent card: what will be fetched, from whom. */
export function consentItems(docs: IssuedDocument[]): string[] {
  return docs.map((d) => `${d.title} · ${d.issuer}`);
}

/** The figures the fetched documents carried, as facts the conversation may state verbatim. */
export function fetchedFacts(docs: IssuedDocument[], lang: Lang): string[] {
  const facts: string[] = [];
  for (const d of docs) {
    const f = d.fields;
    if (d.scope === "identity") {
      facts.push(`${d.title.replace(/ — SAMPLE$/, "")} received from ${d.issuer}.`);
      continue;
    }
    if (d.docType === "FORM_16") {
      if (f.grossSalary !== undefined) facts.push(`Salary for the year per Form 16 from ${f.employerName ?? d.issuer}: ${formatMoney(f.grossSalary, lang)}`);
      if (f.tds !== undefined) facts.push(`Tax already deducted from salary (TDS) per Form 16: ${formatMoney(f.tds, lang)}`);
      for (const e of f.exemptAllowances ?? []) facts.push(`Allowance exempt u/s ${e.section} per Form 16: ${formatMoney(e.amount, lang)}`);
      for (const c of f.employerClaims ?? []) facts.push(`Reported by the employer under ${c.section.replace("_", "(") + (c.section.includes("_") ? ")" : "")}: ${formatMoney(c.amount, lang)}`);
    }
    if (d.docType === "ANNUAL_INFO_STATEMENT") {
      for (const row of f.otherIncome ?? []) facts.push(`${row.kind === "interest" ? "Interest" : "Dividends"} per AIS (${row.section ?? "AIS"}) from ${row.reporter}: ${formatMoney(row.amount, lang)}`);
      if (f.ltcg112A) facts.push(`Long-term gains on listed shares/funds per AIS (SFT-017) via ${f.ltcg112A.reporter}: ${formatMoney(f.ltcg112A.gain, lang)}`);
      for (const t of f.tdsOther ?? []) facts.push(`Tax deducted u/s ${t.section} by ${t.reporter} per AIS: ${formatMoney(t.amount, lang)}`);
    }
    if (d.sample) facts.push("These are SAMPLE figures from the DigiLocker mock, not real records.");
  }
  return [...new Set(facts)];
}
