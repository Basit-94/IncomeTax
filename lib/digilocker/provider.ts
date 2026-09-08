/**
 * The mock DigiLocker (the only provider; Phase C, 2026-09-07). Nothing here talks to the real
 * DigiLocker — but the shape is the real one: a person links the locker once, the catalogue lists
 * what it holds (PAN card, Aadhaar, and for each year Form 16, AIS, 26AS), and a pull hands over the
 * documents as fields, only after the consent card the caller shows.
 *
 * Records are created on first access — random for a new PAN when a database can keep them,
 * PAN-seeded when it cannot (so a restart does not invent a second person) — and kept in the store
 * afterwards. The three seeded personas get records derived from their returns.
 */

import { createHash, randomBytes } from "node:crypto";
import type { ExtractedFields } from "../compliance/pdfExtract";
import { findPersonaByPan } from "../personas";
import type { Owner } from "../server/session";
import { extendLockerRecord, fromPersona, generateLockerRecord } from "./generate";
import type { DigiLockerProvider, IssuedDocument, LockerDocument, LockerProfile, LockerRecord, LockerStore, LockerYear } from "./types";

export interface MockProviderOptions {
  /** Random seeds need a store that survives the process; otherwise the PAN seeds the person. */
  randomSeeds: boolean;
  now?: () => string;
}

const fy = (ay: string) => `${Number(ay.slice(0, 4)) - 1}-${String(Number(ay.slice(5)) - 1).padStart(2, "0")}`;

/** The record cache the synchronous helpers in lib/agentic/digilocker.ts read; the provider fills it. */
export const lockerCache = new Map<string, LockerRecord>();

export class MockDigiLockerProvider implements DigiLockerProvider {
  readonly name = "mock";
  private readonly now: () => string;
  constructor(private readonly store: LockerStore, private readonly opts: MockProviderOptions) {
    this.now = opts.now ?? (() => new Date().toISOString());
  }

  async record(owner: Owner, assessmentYear = "2026-27"): Promise<LockerRecord> {
    const pan = owner.pan.toUpperCase();
    let rec = lockerCache.get(pan) ?? (await this.store.get(pan));
    if (!rec) {
      const persona = findPersonaByPan(pan);
      const preferredName = owner.displayName && !/^Citizen\s+\d{4}$/i.test(owner.displayName) && !/^Real User$/i.test(owner.displayName) ? owner.displayName : undefined;
      rec = persona
        ? fromPersona(persona, this.now())
        : generateLockerRecord(pan, this.opts.randomSeeds ? randomBytes(16).toString("hex") : createHash("sha256").update(`digilocker-seed:${pan}`).digest("hex"), assessmentYear, this.now(), preferredName);
      await this.store.put(rec);
    }
    const extended = extendLockerRecord(rec, assessmentYear, this.now());
    if (extended !== rec) await this.store.put(extended);
    lockerCache.set(pan, extended);
    return extended;
  }

  async status(owner: Owner) {
    const rec = await this.record(owner);
    return { linked: rec.linked, linkedAt: rec.linkedAt };
  }

  async link(owner: Owner): Promise<LockerRecord> {
    const rec = await this.record(owner);
    const linked: LockerRecord = { ...rec, linked: true, linkedAt: rec.linkedAt ?? this.now(), updatedAt: this.now() };
    await this.store.put(linked);
    lockerCache.set(linked.pan, linked);
    return linked;
  }

  async unlink(owner: Owner): Promise<void> {
    const rec = await this.record(owner);
    const unlinked: LockerRecord = { ...rec, linked: false, linkedAt: undefined, updatedAt: this.now() };
    await this.store.put(unlinked);
    lockerCache.set(unlinked.pan, unlinked);
  }

  async profile(owner: Owner): Promise<LockerProfile> {
    return profileFromRecord(await this.record(owner));
  }

  async documents(owner: Owner, assessmentYear: string): Promise<LockerDocument[]> {
    return catalogueFromRecord(await this.record(owner, assessmentYear), assessmentYear);
  }

  async pull(owner: Owner, assessmentYear: string, scope: "identity" | "year" | "all" = "year"): Promise<IssuedDocument[]> {
    return issuedFromRecord(await this.record(owner, assessmentYear), assessmentYear).filter((d) => scope === "all" || d.scope === scope);
  }
}

/* ---------------------------------------------------------- pure mappers -- */

export function profileFromRecord(rec: LockerRecord): LockerProfile {
  const a = rec.identity.address;
  return {
    identity: { name: rec.identity.name, pan: rec.pan, dob: rec.identity.dob, aadhaarLast4: rec.identity.aadhaar.slice(-4) },
    contact: { address: `${a.line}, ${a.city}, ${a.state} ${a.pin}`, mobile: rec.identity.mobile, email: rec.identity.email },
    banks: rec.banks,
    sample: rec.sample,
  };
}

export function catalogueFromRecord(rec: LockerRecord, assessmentYear: string): LockerDocument[] {
  const sampleTag = rec.sample ? " — SAMPLE" : "";
  const issued = `${Number(assessmentYear.slice(0, 4))}-06-${String(10 + (rec.seed.charCodeAt(0) % 15)).padStart(2, "0")}`;
  return [
    { uri: `in.gov.pan-PANCR-${rec.pan}`, docType: "OTHER", title: `PAN card${sampleTag}`, issuer: "Income Tax Department", scope: "identity", issuedOn: rec.identity.dob < "2000-01-01" ? "2015-03-12" : "2019-08-02" },
    { uri: `in.gov.uidai-ADHAR-${rec.identity.aadhaar.slice(-4)}`, docType: "OTHER", title: `Aadhaar (masked)${sampleTag}`, issuer: "UIDAI", scope: "identity", issuedOn: "2013-11-20" },
    { uri: `in.gov.incometax-FRM16-${assessmentYear.replace("-", "")}-${rec.pan}`, docType: "FORM_16", title: `Form 16 — FY ${fy(assessmentYear)} (${rec.employer.name})${sampleTag}`, issuer: rec.employer.name, scope: "year", issuedOn: issued },
    { uri: `in.gov.incometax-AIS-${assessmentYear.replace("-", "")}-${rec.pan}`, docType: "ANNUAL_INFO_STATEMENT", title: `Annual Information Statement — FY ${fy(assessmentYear)}${sampleTag}`, issuer: "Income Tax Department", scope: "year", issuedOn: issued },
    { uri: `in.gov.incometax-26AS-${assessmentYear.replace("-", "")}-${rec.pan}`, docType: "FORM_26AS", title: `Form 26AS — FY ${fy(assessmentYear)}${sampleTag}`, issuer: "Income Tax Department (TRACES)", scope: "year", issuedOn: issued },
  ];
}

function form16Fields(rec: LockerRecord, y: LockerYear): ExtractedFields {
  return {
    pan: rec.pan,
    name: rec.identity.name,
    dob: rec.identity.dob,
    employerName: rec.employer.name,
    tan: rec.employer.tan,
    grossSalary: y.salary.gross,
    tds: y.salary.tds,
    professionalTax: y.salary.professionalTax || undefined,
    exemptAllowances: y.salary.exempt10,
    employerClaims: y.salary.employerClaims,
  };
}

function aisFields(rec: LockerRecord, y: LockerYear): ExtractedFields {
  const otherIncome: NonNullable<ExtractedFields["otherIncome"]> = [
    ...y.ais.interest.map((i) => ({ kind: "interest" as const, label: `${i.kind === "savings" ? "Savings account" : "Deposit"} interest (${i.bank})`, amount: i.amount, reporter: i.bank, identifier: i.ifsc ? `IFSC ${i.ifsc}` : undefined, section: "SFT-016" })),
    ...y.ais.dividends.map((d) => ({ kind: "dividend" as const, label: `Dividend (${d.company})`, amount: d.amount, reporter: d.company, section: "SFT-015" })),
  ];
  const tdsOther: NonNullable<ExtractedFields["tdsOther"]> = [
    ...y.ais.interest.filter((i) => i.tds > 0).map((i) => ({ section: "194A", reporter: i.bank, amount: i.tds })),
    ...y.ais.dividends.filter((d) => d.tds > 0).map((d) => ({ section: "194", reporter: d.company, amount: d.tds })),
  ];
  return {
    pan: rec.pan,
    name: rec.identity.name,
    otherIncome,
    ltcg112A: y.ais.ltcg112A ? { ...y.ais.ltcg112A, reporter: y.ais.ltcg112A.broker } : undefined,
    tdsOther,
  };
}

function form26asFields(rec: LockerRecord, y: LockerYear): ExtractedFields {
  return {
    pan: rec.pan,
    name: rec.identity.name,
    employerName: rec.employer.name,
    tan: rec.employer.tan,
    tds: y.salary.tds,
    tdsOther: aisFields(rec, y).tdsOther,
  };
}

export function issuedFromRecord(rec: LockerRecord, assessmentYear: string): IssuedDocument[] {
  const y = rec.years[assessmentYear] ?? Object.values(rec.years)[0];
  const cat = catalogueFromRecord(rec, assessmentYear);
  const identityFields: ExtractedFields = { pan: rec.pan, name: rec.identity.name, dob: rec.identity.dob };
  return cat.map((d) => ({
    ...d,
    sample: rec.sample,
    fields: d.scope === "identity" ? identityFields : d.docType === "FORM_16" ? form16Fields(rec, y) : d.docType === "ANNUAL_INFO_STATEMENT" ? aisFields(rec, y) : form26asFields(rec, y),
  }));
}
