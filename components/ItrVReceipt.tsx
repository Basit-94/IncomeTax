"use client";

/**
 * Form ITR-V — the acknowledgement produced after a return is filed.
 *
 * WHAT IS REAL HERE. The computation table is the live engine output for the
 * regime the citizen selected; every figure moves with the return. The SHA-256
 * is a genuine digest, computed with Web Crypto over a canonical JSON
 * serialisation of the exact figures printed below — so it actually changes when
 * the return changes, and re-deriving it from the printed values reproduces it.
 * The acknowledgement number is derived from that digest and the PAN, so it is
 * stable for a given return rather than random per render. The QR encodes the
 * ack number, PAN and hash, which is the shape a verification lookup would take.
 *
 * WHAT IS NOT. Nothing was filed. `wapsi.gov.in` is not a real domain, no
 * acknowledgement was issued by the department, and this document has no legal
 * standing whatsoever. It is printed with that stated on its face, not only in
 * this comment — a page that looks this much like a government form must say
 * what it is before someone photographs it.
 *
 * The previous version had a hardcoded ack number and a fake literal hash that
 * never changed. That is what made it a prop rather than a receipt.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { useTax } from "../context/TaxReturnContext";
import { Rupees } from "./Rupees";

/** Canonical, key-ordered payload. Order matters: the digest must be stable. */
interface ReceiptPayload {
  assessmentYear: string;
  pan: string;
  name: string;
  filingStatus: string;
  section: string;
  regime: string;
  grossTotalIncome: number;
  standardDeduction: number;
  chapterViaDeductions: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebateAndRelief: number;
  cess: number;
  totalTaxLiability: number;
  totalTaxesPaid: number;
  netPayableOrRefund: number;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * A 15-digit acknowledgement number, the length the department uses.
 *
 * Derived from the return's own digest rather than Math.random(), so the same
 * return always produces the same number — a receipt whose identifier changes
 * on re-render is not a receipt.
 */
function ackNumberFrom(hashHex: string): string {
  let digits = "";
  for (const ch of hashHex) {
    const v = parseInt(ch, 16);
    if (Number.isNaN(v)) continue;
    digits += String(v % 10);
    if (digits.length >= 15) break;
  }
  return digits.padEnd(15, "0").slice(0, 15);
}

export function ItrVReceipt(props?: { filedOn?: string }) {
  const { state, active, netRefund, netPayable, isPayable, isSettled } = useTax();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [hash, setHash] = useState<string>("");

  const payload = useMemo<ReceiptPayload>(
    () => ({
      assessmentYear: "2026-27",
      pan: state.pan,
      name: state.name,
      filingStatus: state.filingStatus,
      section: state.filingSection,
      regime: state.selectedRegime,
      grossTotalIncome: active.grossTotalIncome,
      standardDeduction: active.standardDeduction,
      chapterViaDeductions: active.totalDeductions - active.standardDeduction,
      taxableIncome: active.taxableIncome,
      taxBeforeRebate: active.taxBeforeRebate,
      rebateAndRelief: active.rebate87A + active.marginalRelief,
      cess: active.cess,
      totalTaxLiability: active.totalTaxLiability,
      totalTaxesPaid: active.totalTaxesPaid,
      netPayableOrRefund: active.netPayableOrRefund,
    }),
    [state.pan, state.name, state.filingStatus, state.filingSection, state.selectedRegime, active],
  );

  // Web Crypto's digest is async, so the hash lands a tick after first paint.
  // Guarded against a stale write if the return changes while it resolves.
  useEffect(() => {
    let cancelled = false;
    void sha256Hex(JSON.stringify(payload)).then((h) => {
      if (!cancelled) setHash(h);
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  const ackNumber = hash ? ackNumberFrom(hash) : "";
  const verifyUrl = hash
    ? `https://wapsi.gov.in/verify?ack=${ackNumber}&pan=${state.pan}&hash=${hash.slice(0, 32)}`
    : "";

  const filingDate =
    props?.filedOn ??
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const sectionLabel =
    state.filingSection === "139(5)"
      ? "139(5) — revised return"
      : "139(1) — on or before due date";

  return (
    <div className="mx-auto my-8 max-w-3xl space-y-4">
      {/*
        Print rules live in app/globals.css alongside the existing @media print
        block, not in a styled-jsx tag here — there was already one print rule
        set for `.printable-sheet` and a second, competing one in a component
        would be the next thing to drift.
      */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 print:hidden">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Acknowledgement preview</h3>
          <p className="text-xs text-gray-500">
            AY 2026-27 · figures are live and the hash below is computed from them
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-teal-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-900"
        >
          <Printer size={14} /> Print / save as PDF
        </button>
      </div>

      <div
        ref={receiptRef}
        className="printable-sheet rounded-xl border-2 border-gray-300 bg-white p-8 font-sans text-gray-900 shadow-md print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        {/* This banner prints. It is the first thing on the sheet by design. */}
        <p className="mb-4 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-900">
          Synthetic prototype document · nothing was filed with any authority · no legal standing
        </p>

        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
              Government of India · Income Tax Department
            </span>
            <h1 className="mt-0.5 text-xl font-extrabold text-gray-950">
              FORM ITR-V (ACKNOWLEDGEMENT)
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Assessment Year: <strong>2026-27</strong> | Financial Year:{" "}
              <strong>2025-26</strong>
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block rounded border border-dashed border-gray-400 bg-gray-50 p-2 text-center">
              <span className="block text-[10px] font-mono uppercase text-gray-500">
                e-Filing ack no
              </span>
              <span className="text-xs font-mono font-bold tabular-nums text-gray-900">
                {ackNumber || "computing…"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 py-4 text-xs">
          <div>
            <p className="text-gray-500">Name of assessee:</p>
            <p className="text-sm font-bold uppercase text-gray-900">{state.name}</p>
            <p className="mt-2 text-gray-500">PAN:</p>
            <p className="font-mono text-sm font-bold text-gray-900">{state.pan}</p>
            <p className="mt-2 text-gray-500">Status:</p>
            <p className="text-sm font-bold text-gray-900">{state.filingStatus}</p>
          </div>
          <div>
            <p className="text-gray-500">Filed under section:</p>
            <p className="font-bold text-gray-900">{sectionLabel}</p>
            <p className="mt-2 text-gray-500">Date and timestamp:</p>
            <p className="font-bold text-gray-900 tabular-nums">{filingDate} · 15:24 IST</p>
            <p className="mt-2 text-gray-500">Regime opted:</p>
            <p className="font-bold text-gray-900">
              {state.selectedRegime === "NEW" ? "New regime u/s 115BAC" : "Old regime"}
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200 py-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
            Statement of computation (rupees only)
          </h4>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-1.5 text-gray-600">1. Gross total income</td>
                <td className="py-1.5 text-right">
                  <Rupees value={active.grossTotalIncome} className="font-semibold" />
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">2. Standard deduction u/s 16(ia)</td>
                <td className="py-1.5 text-right">
                  <span className="font-semibold text-emerald-700">
                    −<Rupees value={active.standardDeduction} />
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">3. Deductions under Chapter VI-A</td>
                <td className="py-1.5 text-right">
                  <span className="font-semibold text-emerald-700">
                    −
                    <Rupees value={active.totalDeductions - active.standardDeduction} />
                  </span>
                </td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="py-2 text-gray-900">4. Total taxable income (1 − 2 − 3)</td>
                <td className="py-2 text-right">
                  <Rupees value={active.taxableIncome} className="text-gray-900" />
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">5. Tax on total income</td>
                <td className="py-1.5 text-right">
                  <Rupees value={active.taxBeforeRebate} className="font-semibold" />
                </td>
              </tr>
              {active.specialRateTax > 0 && (
                <tr>
                  <td className="py-1.5 pl-4 text-gray-500">
                    of which special rates (s.111A / 112A / 112)
                  </td>
                  <td className="py-1.5 text-right">
                    <Rupees value={active.specialRateTax} className="text-gray-500" />
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-1.5 text-gray-600">
                  6. Rebate u/s 87A {active.marginalRelief > 0 ? "(marginal relief)" : ""}
                </td>
                <td className="py-1.5 text-right">
                  <span className="font-semibold text-emerald-700">
                    −<Rupees value={active.rebate87A + active.marginalRelief} />
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">7. Health &amp; education cess (4%)</td>
                <td className="py-1.5 text-right">
                  <Rupees value={active.cess} className="font-semibold" />
                </td>
              </tr>
              <tr className="border-t border-gray-300 font-bold">
                <td className="py-2 text-gray-900">8. Net tax liability</td>
                <td className="py-2 text-right">
                  <Rupees value={active.totalTaxLiability} className="text-gray-900" />
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">9. Taxes paid — TDS per 26AS</td>
                <td className="py-1.5 text-right">
                  <Rupees value={active.tdsPaid} className="font-semibold text-emerald-700" />
                </td>
              </tr>
              {active.advanceTaxPaid > 0 && (
                <tr>
                  <td className="py-1.5 text-gray-600">10. Advance tax paid</td>
                  <td className="py-1.5 text-right">
                    <Rupees
                      value={active.advanceTaxPaid}
                      className="font-semibold text-emerald-700"
                    />
                  </td>
                </tr>
              )}
              {active.selfAssessmentPaid > 0 && (
                <tr>
                  <td className="py-1.5 text-gray-600">
                    11. Self-assessment tax u/s 140A (Challan 280)
                  </td>
                  <td className="py-1.5 text-right">
                    <Rupees
                      value={active.selfAssessmentPaid}
                      className="font-semibold text-emerald-700"
                    />
                  </td>
                </tr>
              )}
              <tr className="bg-teal-50 text-sm font-extrabold text-teal-950">
                <td className="p-2.5">
                  {/* Three outcomes. A challan settles the return at exactly nil,
                      and an acknowledgement that calls that a refund due is a
                      document stating money is owed back when none is. */}
                  {isPayable
                    ? "Net tax payable"
                    : isSettled
                      ? "Nothing further payable"
                      : "Net refund due"}
                </td>
                <td className="p-2.5 text-right">
                  <Rupees value={isPayable ? netPayable : netRefund} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {state.selfAssessmentPayments.length > 0 && (
          <div className="border-b border-gray-200 py-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              Details of self-assessment tax paid
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="pb-1 font-semibold">BSR code</th>
                  <th className="pb-1 font-semibold">Challan serial</th>
                  <th className="pb-1 font-semibold">Date</th>
                  <th className="pb-1 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.selfAssessmentPayments.map((p) => (
                  <tr key={`${p.bsrCode}-${p.challanNo}`}>
                    <td className="py-1.5 font-mono tabular-nums">{p.bsrCode}</td>
                    <td className="py-1.5 font-mono tabular-nums">{p.challanNo}</td>
                    <td className="py-1.5 font-mono tabular-nums">{p.date}</td>
                    <td className="py-1.5 text-right">
                      <Rupees value={p.amount} className="font-semibold" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-end justify-between gap-6 pt-4 text-[11px] text-gray-500">
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-gray-700">Verification digest:</p>
            <p className="break-all font-mono text-[9px] leading-relaxed text-gray-500">
              SHA-256: {hash || "computing…"}
            </p>
            <p className="text-[10px] text-gray-400">
              Computed with Web Crypto over the figures printed above. Change any one of
              them and this digest changes.
            </p>
            <p className="pt-1 text-[10px] text-gray-500">
              e-Verification: <span className="font-semibold">not performed</span> — this
              document was never submitted.
            </p>
          </div>

          <div className="shrink-0 text-center">
            {verifyUrl && (
              <div className="inline-block rounded border border-gray-300 bg-white p-1.5">
                <QRCodeSVG value={verifyUrl} size={92} level="M" />
              </div>
            )}
            <p className="mt-1 max-w-[110px] text-[9px] leading-tight text-gray-400">
              Encodes ack no, PAN and digest. The host is not a real domain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItrVReceipt;
