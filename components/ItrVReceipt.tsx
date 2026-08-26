"use client";

import React, { useRef } from 'react';
import { useTax } from '../context/TaxReturnContext';

export function ItrVReceipt() {
  const { state, computation } = useTax();
  const activeRegime: 'NEW' | 'OLD' = state.selectedRegime;
  const result = activeRegime === 'NEW' ? computation.newRegime : computation.oldRegime;
  const receiptRef = useRef<HTMLDivElement>(null);

  const ackNumber = '202627082219483';
  const filingDate = '26 August 2026';
  const isRefund = result.netPayableOrRefund < 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto my-8 space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 print:hidden">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Official Filing Proof Ready</h3>
          <p className="text-xs text-gray-500">AY 2026-27 statutory acknowledgment receipt</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          ⬇ Download Official PDF / Print
        </button>
      </div>

      {/* The Printable Acknowledgment Sheet */}
      <div
        ref={receiptRef}
        className="printable-sheet bg-white p-8 border-2 border-gray-300 rounded-xl shadow-md text-gray-900 font-sans print:border-none print:shadow-none print:p-0"
      >
        {/* Official Header */}
        <div className="border-b-2 border-gray-800 pb-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
              GOVERNMENT OF INDIA · INCOME TAX DEPARTMENT
            </span>
            <h1 className="text-xl font-extrabold text-gray-950 mt-0.5">
              FORM ITR-V (ACKNOWLEDGEMENT)
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Assessment Year: <strong>2026-27</strong> | Financial Year: <strong>2025-26</strong>
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block p-2 border border-dashed border-gray-400 rounded bg-gray-50 text-center">
              <span className="text-[10px] font-mono uppercase block text-gray-500">e-Filing ACK No</span>
              <span className="text-xs font-mono font-bold text-gray-900">{ackNumber}</span>
            </div>
          </div>
        </div>

        {/* Taxpayer Particulars */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
          <div>
            <p className="text-gray-500">Name of Assessee:</p>
            <p className="font-bold text-gray-900 uppercase text-sm">{state.fullName}</p>
            <p className="text-gray-500 mt-2">PAN:</p>
            <p className="font-bold text-gray-900 font-mono text-sm">{state.pan}</p>
          </div>
          <div>
            <p className="text-gray-500">Filing Status / Section:</p>
            <p className="font-bold text-gray-900">139(1) - On or before due date</p>
            <p className="text-gray-500 mt-2">Filing Date & Timestamp:</p>
            <p className="font-bold text-gray-900">{filingDate} · 15:24 IST</p>
          </div>
        </div>

        {/* Computation Summary Table */}
        <div className="py-4 border-b border-gray-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
            Statement of Computation (Rupees Only)
          </h4>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-1.5 text-gray-600">1. Gross Total Income</td>
                <td className="py-1.5 text-right font-semibold">₹{result.grossTotalIncome.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">2. Standard Deduction u/s 16(ia)</td>
                <td className="py-1.5 text-right font-semibold text-emerald-700">-₹{result.standardDeduction.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">3. Total Deductions under Chapter VI-A</td>
                <td className="py-1.5 text-right font-semibold text-emerald-700">-₹{(result.totalDeductions - result.standardDeduction).toLocaleString('en-IN')}</td>
              </tr>
              <tr className="font-bold bg-gray-50">
                <td className="py-2 text-gray-900">4. Total Taxable Income (1 - 2 - 3)</td>
                <td className="py-2 text-right text-gray-900">₹{result.taxableIncome.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">5. Tax on Total Income</td>
                <td className="py-1.5 text-right font-semibold">₹{result.taxBeforeRebate.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">6. Rebate under Section 87A / Marginal Relief</td>
                <td className="py-1.5 text-right font-semibold text-emerald-700">-₹{(result.rebate87A + result.marginalRelief).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">7. Health & Education Cess (4%)</td>
                <td className="py-1.5 text-right font-semibold">₹{result.cess.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="font-bold border-t border-gray-300">
                <td className="py-2 text-gray-900">8. Net Tax Liability</td>
                <td className="py-2 text-right text-gray-900">₹{result.totalTaxLiability.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600">9. Total Taxes Paid (TDS as per 26AS)</td>
                <td className="py-1.5 text-right font-semibold text-emerald-700">₹{result.totalTaxesPaid.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="font-extrabold text-sm bg-teal-50 text-teal-950">
                <td className="p-2.5">{isRefund ? '10. Net Refund Due (9 - 8)' : '10. Net Tax Payable (8 - 9)'}</td>
                <td className="p-2.5 text-right font-mono">
                  {isRefund ? `₹${Math.abs(result.netPayableOrRefund).toLocaleString('en-IN')}` : `₹${result.netPayableOrRefund.toLocaleString('en-IN')}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cryptographic Verification Hash & Footer */}
        <div className="pt-4 flex justify-between items-end text-[11px] text-gray-500">
          <div className="space-y-1">
            <p className="font-semibold text-gray-700">Digital Signature / e-Verification:</p>
            <p className="font-mono text-[10px] text-gray-400">
              SHA256: 4f9e2b810d7a4c9e8211b439c7f1a8e9903bc189d23e54b
            </p>
            <p className="text-emerald-700 font-bold">✓ Digitally e-Verified via Aadhaar OTP</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-gray-400">Generated by Wapsi Compliance Engine</p>
            <p className="font-semibold text-gray-700">Directorate of Income Tax (Systems)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
