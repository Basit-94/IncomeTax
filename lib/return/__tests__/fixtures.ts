import { vi } from "vitest";
import type { Persona } from "../../types";

/** Minimal valid Persona for persistence/state tests. */
export function makePersona(): Persona {
  return {
    id: "sunita",
    name: "Sunita Sharma",
    age: 34,
    city: "Pune",
    state: "Maharashtra",
    occupation: "Teacher",
    pan: "DEMPX1234S",
    mobile: "9876543210",
    preferredLang: "en",
    situation: "Salaried, one Form 16",
    act: 1,
    actLabel: "Act I",
    embodies: "confirm-don't-compose filing",
    assessmentYear: "2026-27",
    facts: [
      {
        id: "fact-salary",
        label: "Salary",
        amount: 900000,
        kind: "salary",
        provenance: {
          reporter: "Employer",
          reporterKind: "employer",
          filedOn: "2026-05-15",
          statement: "AIS",
          onlyReporterCanFix: false,
        },
      },
      {
        id: "fact-interest",
        label: "Savings interest",
        amount: 12000,
        kind: "interest",
        provenance: {
          reporter: "Bank",
          reporterKind: "bank",
          filedOn: "2026-05-20",
          statement: "AIS",
          onlyReporterCanFix: true,
        },
      },
    ],
    taxPaid: [],
    claims: [],
    banks: [],
    refund: {
      state: "not_filed",
      amount: 0,
      holds: [],
      timeline: [],
    },
    notices: [],
  };
}

/** In-memory localStorage stub backed by a Map — no jsdom. */
export function installLocalStorageStub(): Map<string, string> {
  const store = new Map<string, string>();
  const stub = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  vi.stubGlobal("localStorage", stub);
  return store;
}
