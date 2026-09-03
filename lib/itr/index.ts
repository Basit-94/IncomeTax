/**
 * The filed return as files (plan task 5.1): a documented subset of the ITD ITR-1 JSON
 * shape, and an ITR-V acknowledgement page as static HTML. Everything is synthetic; the
 * acknowledgement number carries a DEMO prefix so nobody mistakes it for a real one.
 */
import { createHash } from "node:crypto";
import type { TaxBreakdown } from "../engine/types";

export interface ReturnPerson {
  name: string;
  pan: string;
  dob?: string;
  aadhaarLast4?: string;
  mobile?: string;
  email?: string;
  bankAccountLast4?: string;
  ifsc?: string;
}

export interface FiledReturn {
  ackNumber: string;
  filedAt: string;
  /** Set by the mock e-verification step (plan task 4.3). */
  everifiedAt?: string;
  assessmentYear: string;
  form: "ITR-1" | "ITR-4";
  regime: "new" | "old";
  breakdown: TaxBreakdown;
  income: { salary: number; business: number; interest: number };
  deductions: { section: string; amount: number }[];
  person: ReturnPerson;
}

export function acknowledgementNumber(pan: string, filedAt: string): string {
  const digest = createHash("sha256").update(`${pan}|${filedAt}`).digest("hex");
  const digits = BigInt(`0x${digest.slice(0, 12)}`).toString().padStart(12, "0").slice(0, 12);
  return `DEMO${digits}`;
}

/** A recognisable subset of the department's ITR-1 JSON schema field names. */
export function buildItrJson(filed: FiledReturn): Record<string, unknown> {
  const b = filed.breakdown;
  return {
    ITR: {
      [filed.form.replace("-", "")]: {
        Form_ITR1: { FormName: filed.form, AssessmentYear: filed.assessmentYear.replace("-", ""), SchemaVer: "Ver1.0", FormVer: "Ver1.0", Description: "Synthetic prototype output; not filed with the department" },
        PersonalInfo: {
          AssesseeName: { FirstName: filed.person.name.split(" ")[0], SurNameOrOrgName: filed.person.name.split(" ").slice(1).join(" ") },
          PAN: filed.person.pan,
          DOB: filed.person.dob ?? null,
          AadhaarCardNo: filed.person.aadhaarLast4 ? `XXXXXXXX${filed.person.aadhaarLast4}` : null,
          Address: { MobileNo: filed.person.mobile ?? null, EmailAddress: filed.person.email ?? null },
        },
        FilingStatus: { ReturnFileSec: 11, OptOutNewTaxRegime: filed.regime === "old" ? "Y" : "N" },
        ITR1_IncomeDeductions: {
          GrossSalary: filed.income.salary,
          IncomeFromSal: Math.max(0, filed.income.salary - b.standardDeduction),
          DeductionUs16ia: b.standardDeduction,
          IncomeOthSrc: filed.income.interest + filed.income.business,
          GrossTotIncome: b.grossIncome,
          UsrDeductUndChapVIA: Object.fromEntries(filed.deductions.map((d) => [`Section${d.section}`, d.amount])),
          DeductUndChapVIA: { TotalChapVIADeductions: b.totalDeductions },
          TotalIncome: b.taxableIncome,
        },
        ITR1_TaxComputation: {
          TotalTaxPayable: b.taxBeforeRebate,
          Rebate87A: b.rebate87A,
          TaxPayableOnRebate: b.taxAfterRebate,
          EducationCess: b.cess,
          GrossTaxLiability: b.totalTax,
          NetTaxLiability: b.totalTax,
        },
        TaxPaid: { TaxesPaid: { TDS: b.tdsCredits, TotalTaxesPaid: b.tdsCredits }, BalTaxPayable: Math.max(0, -b.refundOrDue) },
        Refund: { RefundDue: Math.max(0, b.refundOrDue), BankAccountDtls: { AddtnlBankDetails: [{ IFSCCode: filed.person.ifsc ?? null, BankAccountNo: filed.person.bankAccountLast4 ? `XXXXXXXX${filed.person.bankAccountLast4}` : null, UseForRefund: "true" }] } },
        Verification: { Declaration: { AssesseeVerName: filed.person.name, Place: "Wapsi prototype", Date: filed.filedAt.slice(0, 10) }, AckNumber: filed.ackNumber },
      },
    },
  };
}

function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

function rupees(n: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.abs(n))}`;
}

/** The acknowledgement (ITR-V) as a self-contained page, paper-white like the receipt component. */
export function buildItrvHtml(filed: FiledReturn): string {
  const b = filed.breakdown;
  const refund = b.refundOrDue >= 0;
  const rows: [string, string][] = [
    ["Acknowledgement number", filed.ackNumber],
    ["Assessment year", filed.assessmentYear],
    ["Form", filed.form],
    ["Name", filed.person.name],
    ["PAN", filed.person.pan],
    ["Filed on", new Date(filed.filedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
    ["Regime", filed.regime === "new" ? "New (s.115BAC)" : "Old"],
    ["Total income", rupees(b.taxableIncome)],
    ["Tax payable", rupees(b.totalTax)],
    ["Tax already paid", rupees(b.tdsCredits)],
    [refund ? "Refund due" : "Balance payable", rupees(b.refundOrDue)],
  ];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>ITR-V ${esc(filed.ackNumber)} (synthetic)</title>
<style>
body{font-family:Georgia,"Noto Serif",serif;background:#fff;color:#111;margin:0;padding:32px}
.sheet{max-width:720px;margin:0 auto;border:1px solid #bbb;padding:32px}
h1{font-size:20px;margin:0 0 4px;letter-spacing:.04em}
.sub{font-size:12px;color:#555;margin:0 0 20px}
table{width:100%;border-collapse:collapse;font-size:14px}
td{padding:8px 4px;border-bottom:1px solid #e5e5e5}
td:last-child{text-align:right;font-family:ui-monospace,Menlo,monospace}
.stamp{margin-top:24px;display:inline-block;border:2px solid #b00;color:#b00;padding:6px 10px;font-size:12px;letter-spacing:.1em;transform:rotate(-3deg)}
.note{margin-top:20px;font-size:11px;color:#666}
</style></head><body><div class="sheet">
<h1>INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT</h1>
<p class="sub">Wapsi prototype · every figure and identifier is invented · nothing was sent to the Income Tax Department</p>
<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<div class="stamp">MOCK SPECIMEN</div>
<p class="note">The real ITR-V must be e-verified within 30 days of filing; this page exists to show what the citizen would hold at that moment.</p>
</div></body></html>`;
}
