import { describe, expect, it } from "vitest";
import type { Owner } from "../../server/session";
import { fromPersona, generateLockerRecord, TDS_194A_THRESHOLD, TDS_194_DIVIDEND_THRESHOLD } from "../generate";
import { PERSONAS } from "../../personas";
import { memoryDigiLocker } from "..";
import { MockDigiLockerProvider, issuedFromRecord, lockerCache } from "../provider";
import { MemoryLockerStore } from "../store";

const citizen: Owner = { pan: "ABCPD1982K", kind: "citizen", displayName: "Citizen 1982" };
const other: Owner = { pan: "BZSPA7412M", kind: "citizen", displayName: "Citizen 7412" };
const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
const NOW = "2026-09-07T12:00:00.000Z";

describe("DigiLocker mock — one generated person per PAN, kept (2026-09-07)", () => {
  it("the same seed always yields the same person; different seeds yield different people", () => {
    const a = generateLockerRecord(citizen.pan, "seed-1", "2026-27", NOW);
    const b = generateLockerRecord(citizen.pan, "seed-1", "2026-27", NOW);
    const c = generateLockerRecord(citizen.pan, "seed-2", "2026-27", NOW);
    expect(a).toEqual(b);
    expect(a.identity.name === c.identity.name && a.years["2026-27"].salary.gross === c.years["2026-27"].salary.gross).toBe(false);
  });

  it("a generated person is internally consistent: PAN initial, 12-digit Aadhaar, salary structure, quarterly TDS, thresholds", () => {
    for (const seed of ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]) {
      const r = generateLockerRecord(citizen.pan, seed, "2026-27", NOW);
      expect(r.identity.name.split(" ")[1][0]).toBe("D"); // ABCP*D*1982K → surname starts with D
      expect(r.identity.aadhaar).toMatch(/^\d{12}$/);
      expect(r.identity.dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const y = r.years["2026-27"];
      const s = y.salary;
      expect(s.basic + s.hra + s.special + s.perquisites).toBe(s.gross);
      expect(s.tdsQuarters.reduce((n, q) => n + q, 0)).toBe(s.tds);
      for (const i of y.ais.interest) expect(i.tds > 0).toBe(i.kind === "deposit" && i.amount > TDS_194A_THRESHOLD);
      for (const d of y.ais.dividends) expect(d.tds > 0).toBe(d.amount > TDS_194_DIVIDEND_THRESHOLD);
      expect(r.banks.length).toBeGreaterThanOrEqual(1);
      expect(r.banks.filter((b) => b.nominatedForRefund)).toHaveLength(1);
      expect(r.sample).toBe(true);
    }
  });

  it("a seeded persona's record agrees with the return", () => {
    const r = fromPersona(PERSONAS.sunita, NOW);
    expect(r.years["2026-27"].salary.gross).toBe(420000);
    expect(r.years["2026-27"].salary.tds).toBe(8400);
    expect(r.years["2026-27"].ais.interest[0]).toMatchObject({ bank: "Kaveri Cooperative Bank", amount: 1240 });
    expect(r.banks[0].ifsc).toBe("KAVC0001183");
    expect(r.sample).toBe(false);
  });

  it("the provider creates once, keeps, and links; a returning person gets the same papers", async () => {
    lockerCache.clear();
    const store = new MemoryLockerStore();
    const p = new MockDigiLockerProvider(store, { randomSeeds: true, now: () => NOW });
    const first = await p.record(citizen);
    lockerCache.clear(); // a "restart": the store, not the cache, must answer
    const again = await p.record(citizen);
    expect(again).toEqual(first);
    expect((await p.status(citizen)).linked).toBe(false);
    const linked = await p.link(citizen);
    expect(linked.linked).toBe(true);
    expect((await p.status(citizen)).linkedAt).toBe(NOW);
    await p.unlink(citizen);
    expect((await p.status(citizen)).linked).toBe(false);
    // Two people, two records.
    const second = await p.record(other);
    expect(second.identity.name).not.toBe(first.identity.name);
    lockerCache.clear();
  });

  it("without a database the PAN seeds the person, so a restart regenerates the same record", async () => {
    lockerCache.clear();
    const a = await memoryDigiLocker(() => NOW).record(citizen);
    lockerCache.clear();
    const b = await memoryDigiLocker(() => NOW).record(citizen);
    expect(a).toEqual(b);
    lockerCache.clear();
  });

  it("the catalogue holds the identity cards and the year's three papers; a pull carries fields with real SFT codes", async () => {
    lockerCache.clear();
    const p = memoryDigiLocker(() => NOW);
    const cat = await p.documents(citizen, "2026-27");
    expect(cat.map((d) => d.scope)).toEqual(["identity", "identity", "year", "year", "year"]);
    expect(cat.map((d) => d.docType)).toEqual(["OTHER", "OTHER", "FORM_16", "ANNUAL_INFO_STATEMENT", "FORM_26AS"]);
    expect(cat[0].uri).toMatch(/^in\.gov\.pan-PANCR-ABCPD1982K$/);
    const year = await p.pull(citizen, "2026-27");
    expect(year).toHaveLength(3);
    const ais = year.find((d) => d.docType === "ANNUAL_INFO_STATEMENT")!;
    expect(ais.fields.otherIncome?.every((r) => (r.kind === "interest" ? r.section === "SFT-016" : r.section === "SFT-015"))).toBe(true);
    const f16 = year.find((d) => d.docType === "FORM_16")!;
    expect(f16.fields.tan).toMatch(/^[A-Z]{4}\d{5}[A-Z]$/);
    expect(f16.fields.grossSalary).toBeGreaterThanOrEqual(400_000);
    const all = await p.pull(citizen, "2026-27", "all");
    expect(all).toHaveLength(5);
    expect(all[0].fields.pan).toBe(citizen.pan);
    // A demo persona's pull carries the seeded figures.
    const sun = await p.pull(sunita, "2026-27");
    expect(sun.find((d) => d.docType === "FORM_16")!.fields.grossSalary).toBe(420000);
    expect(issuedFromRecord(await p.record(sunita), "2026-27").every((d) => !d.sample)).toBe(true);
    lockerCache.clear();
  });

  it("a later assessment year extends the same person with new figures", async () => {
    lockerCache.clear();
    const p = memoryDigiLocker(() => NOW);
    const r1 = await p.record(citizen, "2026-27");
    const r2 = await p.record(citizen, "2027-28");
    expect(r2.identity).toEqual(r1.identity);
    expect(Object.keys(r2.years).sort()).toEqual(["2026-27", "2027-28"]);
    lockerCache.clear();
  });
});
