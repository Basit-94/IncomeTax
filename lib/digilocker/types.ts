/**
 * The DigiLocker seam (Phase C, 2026-09-07 — "execute Phase C without real DigiLocker").
 *
 * Wapsi talks to DigiLocker through one interface, `DigiLockerProvider`. The only implementation is
 * the mock in `provider.ts`; a real one would sit behind the same methods (link → consent → list →
 * fetch) and nothing above this module would change. Every record is a `LockerRecord`: what the
 * locker holds for one PAN — identity, employer, the year's documents as fields, bank accounts —
 * generated once per person and kept, so a returning person sees the same papers.
 */

import type { ExtractedFields } from "../compliance/pdfExtract";
import type { EmployerCategory, SeventhProvisoTrigger } from "../return/year-intake";
import type { Owner } from "../server/session";
import type { BankAccount } from "../types";
import type { VaultDocType } from "../vault/types";

export interface LockerIdentity {
  name: string;
  gender: "F" | "M";
  /** ISO date. */
  dob: string;
  /** 12 digits, never shown unmasked outside the vault. */
  aadhaar: string;
  address: { line: string; city: string; state: string; pin: string };
  mobile: string;
  email: string;
}

export interface LockerEmployer {
  name: string;
  tan: string;
  category: EmployerCategory;
  city: string;
}

export interface LockerYear {
  assessmentYear: string;
  salary: {
    gross: number;
    basic: number;
    hra: number;
    special: number;
    perquisites: number;
    exempt10: { section: string; amount: number }[];
    professionalTax: number;
    employerClaims: { section: string; amount: number }[];
    tdsQuarters: number[];
    tds: number;
  };
  ais: {
    interest: { bank: string; ifsc: string; kind: "savings" | "deposit"; amount: number; tds: number }[];
    dividends: { company: string; amount: number; tds: number }[];
    ltcg112A?: { broker: string; sale: number; cost: number; gain: number };
    rentReceived?: { payer: string; amount: number };
    sftFlags: SeventhProvisoTrigger[];
  };
  challans: { bsr: string; date: string; serial: string; amount: number }[];
}

export interface LockerRecord {
  version: 1;
  pan: string;
  /** The random seed the record was generated from; kept so it can be regenerated identically. */
  seed: string;
  identity: LockerIdentity;
  employer: LockerEmployer;
  years: Record<string, LockerYear>;
  banks: BankAccount[];
  linked: boolean;
  linkedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Seeded personas carry their own figures; everything else is generated and says so. */
  sample: boolean;
}

/** One entry of the locker's catalogue — what the person sees before deciding to pull. */
export interface LockerDocument {
  /** A DigiLocker-style URI, e.g. `in.gov.pan-PANCR-ABCPD1982K`. */
  uri: string;
  docType: VaultDocType;
  title: string;
  issuer: string;
  scope: "identity" | "year";
  issuedOn: string;
}

/** A pulled document: catalogue entry plus the fields it carries. */
export interface IssuedDocument extends LockerDocument {
  fields: ExtractedFields;
  sample: boolean;
}

export interface LockerProfile {
  identity: { name: string; pan: string; dob?: string; aadhaarLast4?: string };
  contact: { address?: string; mobile?: string; email?: string };
  banks: BankAccount[];
  sample: boolean;
}

export interface LockerStore {
  get(pan: string): Promise<LockerRecord | null>;
  put(record: LockerRecord): Promise<void>;
}

export interface DigiLockerProvider {
  readonly name: string;
  /** The person's record, created on first access and kept afterwards; a new assessment year extends it. */
  record(owner: Owner, assessmentYear?: string): Promise<LockerRecord>;
  status(owner: Owner): Promise<{ linked: boolean; linkedAt?: string }>;
  link(owner: Owner): Promise<LockerRecord>;
  unlink(owner: Owner): Promise<void>;
  profile(owner: Owner): Promise<LockerProfile>;
  documents(owner: Owner, assessmentYear: string): Promise<LockerDocument[]>;
  /** The year's documents with their fields — Form 16, AIS, 26AS — plus the identity cards. */
  pull(owner: Owner, assessmentYear: string, scope?: "identity" | "year" | "all"): Promise<IssuedDocument[]>;
}
