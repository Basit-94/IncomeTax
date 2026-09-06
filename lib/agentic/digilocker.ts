/**
 * DigiLocker, mocked (user direction 2026-09-06: "some info it could take from
 * DigiLocker, obviously mocked, but it should take permission").
 *
 * Nothing here talks to the real DigiLocker. The mock "issues" the documents a
 * citizen's locker would hold for the year — Form 16 and the AIS — as fields,
 * and the agent stores them in the vault through `VaultService.importIssued`
 * ONLY after the citizen has said yes to a consent card that lists them.
 *
 * Demo personas get their own seeded figures, so the mock agrees with the
 * return. Any other PAN gets SAMPLE figures derived from the PAN itself —
 * deterministic, clearly labelled, never presented as the person's real data.
 */

import { createHash } from "node:crypto";
import type { ExtractedFields } from "../compliance/pdfExtract";
import { formatMoney } from "../money";
import { findPersonaByPan } from "../personas";
import type { Owner } from "../server/session";
import type { Lang } from "../types";
import type { VaultDocType } from "../vault/types";

export interface IssuedDocument {
  docType: VaultDocType;
  title: string;
  issuer: string;
  fields: ExtractedFields;
  /** True when the figures are invented samples rather than seeded persona data. */
  sample: boolean;
}

const SAMPLE_EMPLOYERS = ["Tata Consultancy Services Ltd", "Wipro Ltd", "HCL Technologies Ltd", "Larsen & Toubro Ltd", "Axis Bank Ltd"];

/** What the locker holds for this owner and year. Pure: the same PAN always yields the same documents. */
export function listIssuedDocuments(owner: Owner, assessmentYear: string): IssuedDocument[] {
  const persona = findPersonaByPan(owner.pan);
  if (persona) {
    const salary = persona.facts.filter((f) => f.kind === "salary");
    const gross = salary.reduce((n, f) => n + f.amount, 0);
    const tds = persona.taxPaid.filter((t) => t.section.includes("192")).reduce((n, t) => n + t.amount, 0);
    const employer = salary[0]?.provenance.reporter ?? "Employer";
    return [
      { docType: "FORM_16", title: `Form 16 — FY ${fy(assessmentYear)} (${employer})`, issuer: employer, fields: { pan: persona.pan, name: persona.name, employerName: employer, grossSalary: gross, tds }, sample: false },
      { docType: "ANNUAL_INFO_STATEMENT", title: `Annual Information Statement — FY ${fy(assessmentYear)}`, issuer: "Income Tax Department", fields: { pan: persona.pan, name: persona.name }, sample: false },
    ];
  }
  const h = createHash("sha256").update(`digilocker-mock:${owner.pan}`).digest();
  const gross = 500_000 + (h[0] % 100) * 10_000; // ₹5,00,000 … ₹14,90,000
  const employer = SAMPLE_EMPLOYERS[h[1] % SAMPLE_EMPLOYERS.length];
  const tds = Math.max(0, Math.round(((gross - 400_000) * 0.05) / 100) * 100);
  return [
    { docType: "FORM_16", title: `Form 16 — FY ${fy(assessmentYear)} (${employer}) — SAMPLE`, issuer: `${employer} (DigiLocker mock, sample)`, fields: { pan: owner.pan, employerName: employer, grossSalary: gross, tds }, sample: true },
    { docType: "ANNUAL_INFO_STATEMENT", title: `Annual Information Statement — FY ${fy(assessmentYear)} — SAMPLE`, issuer: "Income Tax Department (DigiLocker mock, sample)", fields: { pan: owner.pan }, sample: true },
  ];
}

/** One line per document for the consent card: what will be fetched, from whom. */
export function consentItems(docs: IssuedDocument[]): string[] {
  return docs.map((d) => `${d.title} · ${d.issuer}`);
}

/** The figures a fetched Form 16 carried, as facts the conversation may state verbatim. */
export function fetchedFacts(docs: IssuedDocument[], lang: Lang): string[] {
  const facts: string[] = [];
  for (const d of docs) {
    if (d.docType !== "FORM_16") continue;
    if (d.fields.grossSalary !== undefined) facts.push(`Salary for the year per Form 16 from ${d.fields.employerName ?? d.issuer}: ${formatMoney(d.fields.grossSalary, lang)}`);
    if (d.fields.tds !== undefined) facts.push(`Tax already deducted from salary (TDS) per Form 16: ${formatMoney(d.fields.tds, lang)}`);
    if (d.sample) facts.push("These are SAMPLE figures from the DigiLocker mock, not real records.");
  }
  return facts;
}

function fy(assessmentYear: string): string {
  const [a, b] = assessmentYear.split("-").map(Number);
  return `${a - 1}-${String(b - 1).padStart(2, "0")}`;
}
