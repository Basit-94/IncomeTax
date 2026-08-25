import type { Lang, Persona } from "../lib/types";

// Random names & banks for custom sandbox generator
export const MOCK_NAMES = ["Amit Patel", "Deepa Rao", "Vijay Nair", "Neha Sharma", "Rohan Gupta", "Sandhya Iyer"];
export const MOCK_BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank"];

// --- DETERMINISTIC SEEDED RANDOM GENERATOR ---
export function generateSeededUser(seedString: string, lang: Lang): Persona {
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i);
  }
  
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  const randomName = MOCK_NAMES[Math.floor(rand() * MOCK_NAMES.length)];
  const randomBank = MOCK_BANKS[Math.floor(rand() * MOCK_BANKS.length)];
  const randomPAN = `DEMP${String.fromCharCode(65 + Math.floor(rand() * 26))}${Math.floor(1000 + rand() * 9000)}${String.fromCharCode(65 + Math.floor(rand() * 26))}`;
  
  const salaryVal = Math.floor(450000 + rand() * 200000); // 4.5L to 6.5L
  const interestVal = Math.floor(2500 + rand() * 4000);   // 2.5K to 6.5K
  const tdsVal = Math.floor(12000 + rand() * 8000);

  return {
    id: "custom",
    name: randomName,
    age: 29,
    city: "Bengaluru",
    state: "Karnataka",
    occupation: "Independent Consultant",
    pan: randomPAN,
    mobile: "90000 00004",
    preferredLang: lang,
    situation: "Seeded Sandbox Profile: generated deterministically to ensure a reproducible reviewer demo.",
    act: 1,
    actLabel: "Confirm, don't compose",
    embodies: "Custom sandbox workspace.",
    assessmentYear: "2026-27",
    facts: [
      {
        id: "custom-salary",
        label: "Your primary contract income",
        amount: salaryVal,
        kind: "salary",
        provenance: {
          reporter: "Acme Tech Solutions LLP",
          reporterKind: "employer",
          identifier: "TAN ACME99812A",
          filedOn: "2026-05-18",
          statement: "26AS",
          onlyReporterCanFix: true,
        }
      },
      {
        id: "custom-interest",
        label: "Savings interest",
        amount: interestVal,
        kind: "interest",
        provenance: {
          reporter: "Deccan Union Bank",
          reporterKind: "bank",
          identifier: "IFSC DECU0834471",
          filedOn: "2026-06-05",
          statement: "AIS",
          onlyReporterCanFix: true,
        }
      }
    ],
    taxPaid: [
      {
        id: "custom-tds-192",
        label: "Tax withheld (TDS)",
        amount: tdsVal,
        section: "192",
        provenance: {
          reporter: "Acme Tech Solutions LLP",
          reporterKind: "employer",
          identifier: "TAN ACME99812A",
          filedOn: "2026-05-18",
          statement: "26AS",
          onlyReporterCanFix: true,
        }
      }
    ],
    claims: [
      {
        id: "custom-80c",
        section: "80C",
        label: "Provident Fund / ELSS Mutual Funds",
        amount: 50000,
        evidenceAttached: true,
      }
    ],
    banks: [
      {
        id: "custom-bank-1",
        bank: randomBank,
        maskedNumber: `•••• •••• ${Math.floor(1000 + rand() * 9000)}`,
        ifsc: "SBIN0001834",
        status: "validated",
        nominatedForRefund: true,
      }
    ],
    refund: {
      state: "not_filed",
      amount: tdsVal,
      holds: [],
      timeline: []
    },
    notices: []
  };
}
