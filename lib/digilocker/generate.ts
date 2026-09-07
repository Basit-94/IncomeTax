/**
 * The generator behind the DigiLocker mock (2026-09-07, user direction: "randomly generated, like
 * Aadhaar cards, PAN cards, or any other documents… generated every time a new user logs in. If an
 * old user logs in, then use their previously generated information").
 *
 * One seed → one person, every time: identity, employer, salary structure, the exemptions and
 * employer-reported deductions a Form 16 carries, the interest, dividends and gains an AIS carries,
 * the TDS by anyone, and the bank accounts. The TDS is computed by the tax engine on the generated
 * income and then jittered, so refunds and balances due both occur the way they do in life. TDS on
 * interest and dividends follows the FY 2025-26 thresholds (194A ₹50,000; 194 ₹10,000).
 *
 * Seeded personas do not come through here — their record is derived from the persona so the locker
 * agrees with the return (`fromPersona`).
 */

import { createHash } from "node:crypto";
import { computeTax } from "../engine/tax";
import type { Claim, Persona } from "../types";
import type { LockerEmployer, LockerIdentity, LockerRecord, LockerYear } from "./types";

export const TDS_194A_THRESHOLD = 50_000;
export const TDS_194_DIVIDEND_THRESHOLD = 10_000;

/* ------------------------------------------------------------------ prng -- */

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedNumber(seed: string): number {
  const h = createHash("sha256").update(seed).digest();
  return h.readUInt32LE(0);
}

class Rng {
  private next: () => number;
  constructor(seed: string) {
    this.next = mulberry32(seedNumber(seed));
  }
  float(): number {
    return this.next();
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  /** A rupee figure rounded to a sensible step. */
  money(min: number, max: number, step = 1000): number {
    return Math.round(this.int(min, max) / step) * step;
  }
}

/* ------------------------------------------------------------------ data -- */

const FIRST_F = ["Ananya", "Priya", "Kavya", "Meera", "Sneha", "Pooja", "Divya", "Neha", "Aishwarya", "Ritika", "Shreya", "Nandini", "Lakshmi", "Fatima", "Zainab", "Harpreet", "Gauri", "Ishita", "Sunita", "Rekha", "Tanvi", "Bhavya", "Aparna", "Radhika"];
const FIRST_M = ["Rahul", "Arjun", "Vikram", "Aditya", "Rohan", "Karthik", "Siddharth", "Aman", "Nikhil", "Sanjay", "Imran", "Faheem", "Manpreet", "Anirban", "Suresh", "Devendra", "Harish", "Pranav", "Rakesh", "Yash", "Varun", "Kunal", "Abhishek", "Mohit"];
const SURNAMES = ["Sharma", "Verma", "Iyer", "Nair", "Reddy", "Rao", "Patel", "Desai", "Mehta", "Shah", "Kulkarni", "Joshi", "Chatterjee", "Banerjee", "Das", "Ghosh", "Singh", "Kaur", "Gupta", "Agarwal", "Khan", "Ahmed", "D'Souza", "Fernandes", "Menon", "Pillai", "Bhat", "Hegde", "Yadav", "Mishra", "Tiwari", "Pandey", "Jain", "Malhotra", "Kapoor", "Bose", "Naidu", "Choudhary", "Dubey", "Thakur"];

const CITIES: { city: string; state: string; pin: string; areas: string[] }[] = [
  { city: "Bengaluru", state: "Karnataka", pin: "5600", areas: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar"] },
  { city: "Pune", state: "Maharashtra", pin: "4110", areas: ["Kothrud", "Hinjewadi", "Baner", "Viman Nagar", "Wakad"] },
  { city: "Hyderabad", state: "Telangana", pin: "5000", areas: ["Gachibowli", "Madhapur", "Kukatpally", "Banjara Hills", "Kondapur"] },
  { city: "Chennai", state: "Tamil Nadu", pin: "6000", areas: ["Adyar", "Velachery", "T. Nagar", "Anna Nagar", "Porur"] },
  { city: "Mumbai", state: "Maharashtra", pin: "4000", areas: ["Andheri West", "Powai", "Thane West", "Borivali", "Chembur"] },
  { city: "Gurugram", state: "Haryana", pin: "1220", areas: ["Sector 56", "DLF Phase 3", "Sohna Road", "Sector 14", "Palam Vihar"] },
  { city: "Kolkata", state: "West Bengal", pin: "7000", areas: ["Salt Lake", "New Town", "Ballygunge", "Behala", "Dum Dum"] },
  { city: "Jaipur", state: "Rajasthan", pin: "3020", areas: ["Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme", "Jagatpura"] },
  { city: "Ahmedabad", state: "Gujarat", pin: "3800", areas: ["Satellite", "Bopal", "Navrangpura", "Maninagar", "Prahlad Nagar"] },
  { city: "Kochi", state: "Kerala", pin: "6820", areas: ["Kakkanad", "Edappally", "Panampilly Nagar", "Kaloor", "Vyttila"] },
];

const EMPLOYERS: { name: string; tan: string; category: LockerEmployer["category"]; city: string }[] = [
  { name: "Tata Consultancy Services Ltd", tan: "MUMT12345A", category: "others", city: "Mumbai" },
  { name: "Infosys Ltd", tan: "BLRI04521C", category: "others", city: "Bengaluru" },
  { name: "Wipro Ltd", tan: "BLRW01928A", category: "others", city: "Bengaluru" },
  { name: "HCL Technologies Ltd", tan: "DELH09912B", category: "others", city: "Noida" },
  { name: "Tech Mahindra Ltd", tan: "PNET01289A", category: "others", city: "Pune" },
  { name: "Larsen & Toubro Ltd", tan: "MUML07731D", category: "others", city: "Mumbai" },
  { name: "Axis Bank Ltd", tan: "MUMA11402E", category: "others", city: "Mumbai" },
  { name: "Dr. Reddy's Laboratories Ltd", tan: "HYDD02219F", category: "others", city: "Hyderabad" },
  { name: "Zomato Ltd", tan: "DELZ03001G", category: "others", city: "Gurugram" },
  { name: "Bharat Heavy Electricals Ltd", tan: "DELB00123H", category: "psu", city: "New Delhi" },
  { name: "Indian Oil Corporation Ltd", tan: "MUMI00456J", category: "psu", city: "Mumbai" },
  { name: "Ministry of Railways", tan: "DELM00001K", category: "central_govt", city: "New Delhi" },
  { name: "Government of Karnataka — Education Dept", tan: "BLRG00212L", category: "state_govt", city: "Bengaluru" },
  { name: "Kendriya Vidyalaya Sangathan", tan: "DELK00789M", category: "central_govt", city: "New Delhi" },
];

const BANKS: { bank: string; ifsc: string }[] = [
  { bank: "State Bank of India", ifsc: "SBIN0001234" },
  { bank: "HDFC Bank Ltd", ifsc: "HDFC0000123" },
  { bank: "ICICI Bank Ltd", ifsc: "ICIC0000045" },
  { bank: "Axis Bank Ltd", ifsc: "UTIB0000210" },
  { bank: "Kotak Mahindra Bank", ifsc: "KKBK0000431" },
  { bank: "Punjab National Bank", ifsc: "PUNB0012300" },
  { bank: "Canara Bank", ifsc: "CNRB0000110" },
  { bank: "Bank of Baroda", ifsc: "BARB0KARNAT" },
];

const DIVIDEND_PAYERS = ["Infosys Ltd", "Tata Consultancy Services Ltd", "ITC Ltd", "Hindustan Unilever Ltd", "Reliance Industries Ltd", "Coal India Ltd", "Power Grid Corporation of India Ltd"];
const BROKERS = ["Zerodha Broking Ltd", "Nextbillion Tech (Groww)", "Upstox Securities Pvt Ltd", "Angel One Ltd", "HDFC Securities Ltd"];

/* ------------------------------------------------------------- generator -- */

const pad = (n: number, w: number) => String(n).padStart(w, "0");

function identityFor(rng: Rng, pan: string): LockerIdentity {
  const gender: "F" | "M" = rng.chance(0.5) ? "F" : "M";
  const first = rng.pick(gender === "F" ? FIRST_F : FIRST_M);
  // A PAN's fifth letter is the surname's initial; honour it where a surname exists.
  const initial = pan[4];
  const matching = SURNAMES.filter((s) => s[0].toUpperCase() === initial);
  const last = matching.length ? rng.pick(matching) : rng.pick(SURNAMES);
  const place = rng.pick(CITIES);
  const year = rng.int(1968, 2001);
  const dob = `${year}-${pad(rng.int(1, 12), 2)}-${pad(rng.int(1, 28), 2)}`;
  const aadhaar = `${rng.int(2, 9)}${pad(rng.int(0, 99_999_999_999), 11)}`;
  const handle = `${first}.${last.replace(/[^A-Za-z]/g, "")}`.toLowerCase();
  return {
    name: `${first} ${last}`,
    gender,
    dob,
    aadhaar,
    address: { line: `${rng.int(2, 240)}, ${rng.pick(place.areas)}`, city: place.city, state: place.state, pin: `${place.pin}${pad(rng.int(1, 96), 2)}` },
    mobile: `${rng.int(6, 9)}${pad(rng.int(0, 999_999_999), 9)}`,
    email: `${handle}${rng.int(1, 99)}@${rng.pick(["gmail.com", "outlook.com", "yahoo.co.in"])}`,
  };
}

function banksFor(rng: Rng, pan: string): LockerRecord["banks"] {
  const count = rng.chance(0.35) ? 2 : 1;
  const chosen: typeof BANKS = [];
  while (chosen.length < count) {
    const b = rng.pick(BANKS);
    if (!chosen.includes(b)) chosen.push(b);
  }
  return chosen.map((b, i) => ({
    id: `dl-bank-${pan.toLowerCase()}-${i + 1}`,
    bank: b.bank,
    maskedNumber: `•••• •••• ${pad(rng.int(0, 9999), 4)}`,
    ifsc: b.ifsc,
    status: "validated" as const,
    nominatedForRefund: i === 0,
  }));
}

function yearFor(rng: Rng, employer: LockerEmployer, banks: LockerRecord["banks"], assessmentYear: string): LockerYear {
  // Income: most people between ₹4L and ₹15L, a long tail to ₹45L.
  const gross = rng.chance(0.6) ? rng.money(400_000, 1_500_000, 5_000) : rng.chance(0.7) ? rng.money(1_500_000, 3_000_000, 10_000) : rng.money(3_000_000, 4_500_000, 10_000);
  const basic = Math.round(gross * (0.4 + rng.float() * 0.1) / 1000) * 1000;
  const hra = Math.round(basic * 0.4 / 1000) * 1000;
  const perquisites = rng.chance(0.3) ? rng.money(10_000, Math.max(10_000, Math.round(gross * 0.05)), 1000) : 0;
  const special = Math.max(0, gross - basic - hra - perquisites);
  // Renting → HRA exemption u/s 10(13A): least of HRA, rent − 10% basic, 50%/40% of basic.
  const renting = rng.chance(0.45);
  const exempt10: LockerYear["salary"]["exempt10"] = [];
  if (renting) {
    const rent = Math.round(basic * (0.35 + rng.float() * 0.2) / 1000) * 1000;
    const exemption = Math.max(0, Math.min(hra, rent - basic * 0.1, basic * 0.5));
    if (exemption > 0) exempt10.push({ section: "10(13A)", amount: Math.round(exemption / 100) * 100 });
  }
  if (rng.chance(0.25)) exempt10.push({ section: "10(5)", amount: rng.money(15_000, 60_000, 1000) });
  const employerClaims: LockerYear["salary"]["employerClaims"] = [];
  if (rng.chance(0.5)) employerClaims.push({ section: "80C", amount: Math.min(150_000, Math.round(basic * 0.12 / 100) * 100) });
  if (rng.chance(0.4)) employerClaims.push({ section: "80CCD_2", amount: Math.min(Math.round(basic * 0.1 / 100) * 100, 200_000) });
  if (rng.chance(0.3)) employerClaims.push({ section: "80D_SELF", amount: rng.money(8_000, 25_000, 500) });
  const professionalTax = rng.pick([2_400, 2_500, 2_500, 0]);

  // AIS: interest from the person's own banks, sometimes a deposit, sometimes dividends, sometimes listed-equity LTCG.
  const interest: LockerYear["ais"]["interest"] = banks.map((b) => ({ bank: b.bank, ifsc: b.ifsc, kind: "savings" as const, amount: rng.money(1_500, 38_000, 100), tds: 0 }));
  if (rng.chance(0.5)) {
    const b = rng.pick(banks);
    const amount = rng.money(6_000, 95_000, 500);
    interest.push({ bank: b.bank, ifsc: b.ifsc, kind: "deposit", amount, tds: amount > TDS_194A_THRESHOLD ? Math.round(amount * 0.1) : 0 });
  }
  const dividends: LockerYear["ais"]["dividends"] = [];
  if (rng.chance(0.35)) {
    const amount = rng.money(1_000, 26_000, 100);
    dividends.push({ company: rng.pick(DIVIDEND_PAYERS), amount, tds: amount > TDS_194_DIVIDEND_THRESHOLD ? Math.round(amount * 0.1) : 0 });
  }
  let ltcg112A: LockerYear["ais"]["ltcg112A"];
  if (rng.chance(0.22)) {
    const gain = rng.chance(0.85) ? rng.money(5_000, 120_000, 500) : rng.money(130_000, 400_000, 1000);
    const cost = Math.round(gain * (3 + rng.float() * 4) / 1000) * 1000;
    ltcg112A = { broker: rng.pick(BROKERS), sale: cost + gain, cost, gain };
  }
  const rentReceived = rng.chance(0.08) ? { payer: `${rng.pick(FIRST_M)} ${rng.pick(SURNAMES)}`, amount: rng.money(96_000, 360_000, 12_000) } : undefined;
  const sftFlags: LockerYear["ais"]["sftFlags"] = rng.chance(0.05) ? ["foreign_travel_2l"] : [];

  // TDS on salary: the engine's new-regime tax on what the employer knew, then life's jitter.
  const claims: Claim[] = employerClaims.map((c, i) => ({ id: `gen-${i}`, section: c.section, label: c.section, amount: c.amount, evidenceAttached: true }));
  const tax = computeTax({ facts: [{ kind: "salary", amount: gross }], claims, regime: "new", ageBand: "below_60" }).totalTax;
  let tds = tax > 0 ? Math.round((tax * (0.85 + rng.float() * 0.3)) / 100) * 100 : rng.chance(0.15) ? rng.money(2_000, 12_000, 100) : 0;
  tds = Math.max(0, tds);
  const q = [0.24, 0.25, 0.25, 0.26].map((share) => Math.round((tds * share) / 100) * 100);
  q[3] = tds - (q[0] + q[1] + q[2]);
  const challans: LockerYear["challans"] = [];
  if (tds < tax && rng.chance(0.3)) {
    challans.push({ bsr: `${rng.int(1_000_000, 9_999_999)}`, date: `${assessmentYear.slice(0, 4)}-0${rng.int(6, 7)}-${pad(rng.int(1, 28), 2)}`, serial: pad(rng.int(1, 99_999), 5), amount: Math.round((tax - tds) / 100) * 100 });
  }
  return {
    assessmentYear,
    salary: { gross, basic, hra, special, perquisites, exempt10, professionalTax, employerClaims, tdsQuarters: q, tds },
    ais: { interest, dividends, ltcg112A, rentReceived, sftFlags },
    challans,
  };
}

/** A whole person from one seed. The same seed always yields the same person. */
export function generateLockerRecord(pan: string, seed: string, assessmentYear: string, now: string): LockerRecord {
  const rng = new Rng(seed);
  const identity = identityFor(rng, pan);
  const employer = rng.pick(EMPLOYERS);
  const banks = banksFor(rng, pan);
  const year = yearFor(rng, employer, banks, assessmentYear);
  return { version: 1, pan, seed, identity, employer, years: { [assessmentYear]: year }, banks, linked: false, createdAt: now, updatedAt: now, sample: true };
}

/** A later assessment year for an existing record: same person, new figures. */
export function extendLockerRecord(record: LockerRecord, assessmentYear: string, now: string): LockerRecord {
  if (record.years[assessmentYear]) return record;
  const rng = new Rng(`${record.seed}:${assessmentYear}`);
  const year = yearFor(rng, record.employer, record.banks, assessmentYear);
  return { ...record, years: { ...record.years, [assessmentYear]: year }, updatedAt: now };
}

/** A seeded persona's record — the locker agrees with the return. */
export function fromPersona(persona: Persona, now: string): LockerRecord {
  const rng = new Rng(`persona:${persona.pan}`);
  const salaryFacts = persona.facts.filter((f) => f.kind === "salary");
  const gross = salaryFacts.reduce((n, f) => n + f.amount, 0);
  const employerName = salaryFacts[0]?.provenance.reporter ?? "Employer";
  const tan = salaryFacts[0]?.provenance.identifier?.replace(/^TAN\s+/i, "") ?? "MUMT00000A";
  const tds = persona.taxPaid.filter((t) => t.section.includes("192")).reduce((n, t) => n + t.amount, 0);
  const basic = Math.round(gross * 0.45 / 1000) * 1000;
  const hraClaim = persona.claims.find((c) => c.section === "HRA");
  const year: LockerYear = {
    assessmentYear: persona.assessmentYear,
    salary: {
      gross,
      basic,
      hra: Math.round(basic * 0.4 / 1000) * 1000,
      special: Math.max(0, gross - basic - Math.round(basic * 0.4 / 1000) * 1000),
      perquisites: 0,
      exempt10: hraClaim ? [{ section: "10(13A)", amount: hraClaim.amount }] : [],
      professionalTax: gross > 0 ? 2_400 : 0,
      employerClaims: persona.claims.filter((c) => /^80CCD_2$|^80CCD\(2\)$|^80C$|^80D/.test(c.section)).map((c) => ({ section: c.section, amount: c.amount })),
      tdsQuarters: [Math.round(tds * 0.25), Math.round(tds * 0.25), Math.round(tds * 0.25), tds - 3 * Math.round(tds * 0.25)],
      tds,
    },
    ais: {
      interest: persona.facts.filter((f) => f.kind === "interest").map((f) => ({ bank: f.provenance.reporter, ifsc: f.provenance.identifier?.replace(/^IFSC\s+/i, "") ?? "", kind: /deposit|fd/i.test(f.label) ? "deposit" as const : "savings" as const, amount: f.amount, tds: persona.taxPaid.filter((t) => t.section.includes("194A") && t.provenance.reporter === f.provenance.reporter).reduce((n, t) => n + t.amount, 0) })),
      dividends: persona.facts.filter((f) => f.kind === "dividend").map((f) => ({ company: f.provenance.reporter, amount: f.amount, tds: persona.taxPaid.filter((t) => /^194$/.test(t.section) && t.provenance.reporter === f.provenance.reporter).reduce((n, t) => n + t.amount, 0) })),
      ltcg112A: (() => {
        const l = persona.facts.filter((f) => f.kind === "capital_gains" && f.capitalGains?.assetClass === "equity_stt" && f.capitalGains.holding === "long");
        const gain = l.reduce((n, f) => n + f.amount, 0);
        return gain > 0 ? { broker: l[0].provenance.reporter, gain, cost: gain * 4, sale: gain * 5 } : undefined;
      })(),
      rentReceived: undefined,
      sftFlags: [],
    },
    challans: [],
  };
  const place = CITIES.find((c) => c.city === persona.city) ?? { city: persona.city, state: persona.state, pin: "5600", areas: ["Main Road"] };
  return {
    version: 1,
    pan: persona.pan,
    seed: `persona:${persona.pan}`,
    identity: {
      name: persona.name,
      gender: /^(sunita|priya)/i.test(persona.name) ? "F" : "M",
      dob: `${2026 - persona.age}-${pad(rng.int(1, 12), 2)}-${pad(rng.int(1, 28), 2)}`,
      aadhaar: `${rng.int(2, 9)}${pad(rng.int(0, 99_999_999_999), 11)}`,
      address: { line: `${rng.int(2, 240)}, ${place.areas[0]}`, city: persona.city, state: persona.state, pin: `${place.pin}${pad(rng.int(1, 96), 2)}` },
      mobile: persona.mobile.replace(/\s+/g, ""),
      email: `${persona.name.split(" ")[0].toLowerCase()}@example.in`,
    },
    employer: { name: employerName, tan, category: "others", city: persona.city },
    years: { [persona.assessmentYear]: year },
    banks: persona.banks,
    linked: false,
    createdAt: now,
    updatedAt: now,
    sample: false,
  };
}
