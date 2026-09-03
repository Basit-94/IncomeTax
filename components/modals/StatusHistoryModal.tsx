"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Landmark,
  ExternalLink,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { Lang, RefundState, Persona, BankAccount } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { PERSONAS } from "@/lib/personas";

export interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  activeCitizen?: {
    name: string;
    pan: string;
    salary?: number;
    tds?: number;
    totalTaxesPaid?: number;
    taxDue?: number;
    banks?: BankAccount[];
    refund?: Persona["refund"];
  } | null;
  onViewReturnDetails?: () => void;
}

interface MultiYearRecord {
  ay: string;
  fy: string;
  form: string;
  filingDate: string;
  ackNumber: string;
  taxableIncome: number;
  taxPaid: number;
  outcome: "refund" | "settled" | "demand";
  outcomeAmount: number;
  statusEn: string;
  statusHi: string;
}

const LIFECYCLE_STAGES = [
  { id: 1, key: "submitted", labelEn: "Return Submitted u/s 139", labelHi: "रिटर्न दाखिल (धारा 139)" },
  { id: 2, key: "verified", labelEn: "e-Verified (Aadhaar / EVC)", labelHi: "ई-सत्यापित (आधार/ईवीसी)" },
  { id: 3, key: "cpc_queue", labelEn: "In CPC Processing Queue", labelHi: "सीपीसी प्रसंस्करण कतार में" },
  { id: 4, key: "order_143", labelEn: "Intimation Order u/s 143(1)", labelHi: "आकलन आदेश u/s 143(1)" },
  { id: 5, key: "determined", labelEn: "Refund / Outcome Determined", labelHi: "रिफंड राशि निर्धारित" },
  { id: 6, key: "sent_bank", labelEn: "Sent to SBI Refund Banker", labelHi: "एसबीआई रिफंड बैंकर को भेजा" },
  { id: 7, key: "credited", labelEn: "Refund Credited to Account", labelHi: "बैंक खाते में राशि जमा" },
];

function getStageFromRefundState(state?: RefundState): number {
  switch (state) {
    case "not_filed":
    case "filed_unverified":
      return 1;
    case "verified":
      return 2;
    case "in_queue":
      return 3;
    case "under_review":
      return 4;
    case "determined":
      return 5;
    case "sent_to_bank":
      return 6;
    case "credited":
      return 7;
    default:
      return 4;
  }
}

export default function StatusHistoryModal({
  isOpen,
  onClose,
  lang,
  activeCitizen,
  onViewReturnDetails,
}: StatusHistoryModalProps) {
  const isHindi = lang === "hi";

  // Tab state: "lifecycle" | "archive" | "itrv"
  const [activeTab, setActiveTab] = useState<"lifecycle" | "archive" | "itrv">("lifecycle");

  // Selected profile
  const [selectedPan, setSelectedPan] = useState<string>(() => activeCitizen?.pan || PERSONAS.sunita.pan);
  const [selectedName, setSelectedName] = useState<string>(() => activeCitizen?.name || PERSONAS.sunita.name);

  // Active refund simulation stage (1 to 7)
  const initialStage = activeCitizen?.refund ? getStageFromRefundState(activeCitizen.refund.state) : 4;
  const [currentStage, setCurrentStage] = useState<number>(initialStage);

  useEffect(() => {
    if (isOpen) {
      const pan = activeCitizen?.pan || PERSONAS.sunita.pan;
      const name = activeCitizen?.name || PERSONAS.sunita.name;
      const st = activeCitizen?.refund ? getStageFromRefundState(activeCitizen.refund.state) : 4;
      setSelectedPan(pan);
      setSelectedName(name);
      setCurrentStage(st);
      setActiveTab("lifecycle");
    }
  }, [isOpen, activeCitizen]);

  // Derive active bank account
  const activeBank = useMemo(() => {
    if (activeCitizen?.banks && activeCitizen.banks.length > 0) {
      return activeCitizen.banks.find((b) => b.nominatedForRefund) || activeCitizen.banks[0];
    }
    if (selectedPan === PERSONAS.rakesh.pan) {
      return PERSONAS.rakesh.banks[0];
    }
    if (selectedPan === PERSONAS.priya.pan) {
      return PERSONAS.priya.banks[0];
    }
    return PERSONAS.sunita.banks[0];
  }, [activeCitizen, selectedPan]);

  // Derive refund amount
  const currentRefundAmount = useMemo(() => {
    if (activeCitizen?.refund?.amount) return activeCitizen.refund.amount;
    if (activeCitizen?.tds && activeCitizen?.taxDue !== undefined) {
      return Math.max(0, activeCitizen.tds - activeCitizen.taxDue);
    }
    if (selectedPan === PERSONAS.rakesh.pan) return PERSONAS.rakesh.refund.amount;
    if (selectedPan === PERSONAS.priya.pan) return PERSONAS.priya.refund.amount;
    return PERSONAS.sunita.refund.amount;
  }, [activeCitizen, selectedPan]);

  const pastFilings: MultiYearRecord[] = useMemo(() => [
    {
      ay: "2026-27",
      fy: "2025-26",
      form: "ITR-1 (Sahaj)",
      filingDate: "2026-07-28",
      ackNumber: "289382100492817",
      taxableIncome: activeCitizen?.salary || 1425000,
      taxPaid: activeCitizen?.tds || 94118,
      outcome: currentRefundAmount > 0 ? "refund" : "settled",
      outcomeAmount: currentRefundAmount,
      statusEn: currentStage === 7 ? "Refund Credited u/s 143(1)" : "Under CPC Review & Verification",
      statusHi: currentStage === 7 ? "रिफंड बैंक में जमा u/s 143(1)" : "सीपीसी समीक्षा एवं सत्यापन प्रक्रियाधीन",
    },
    {
      ay: "2025-26",
      fy: "2024-25",
      form: "ITR-1 (Sahaj)",
      filingDate: "2025-07-19",
      ackNumber: "271940198274612",
      taxableIncome: 1250000,
      taxPaid: 75000,
      outcome: "refund",
      outcomeAmount: 14200,
      statusEn: "Processed u/s 143(1) — Refund Credited",
      statusHi: "धारा 143(1) के तहत संसाधित — रिफंड बैंक में जमा",
    },
    {
      ay: "2024-25",
      fy: "2023-24",
      form: "ITR-1 (Sahaj)",
      filingDate: "2024-07-22",
      ackNumber: "260192847192834",
      taxableIncome: 1100000,
      taxPaid: 62400,
      outcome: "settled",
      outcomeAmount: 0,
      statusEn: "Processed u/s 143(1) — Nil Demand",
      statusHi: "धारा 143(1) के तहत संसाधित — शून्य मांग",
    },
  ], [activeCitizen, currentRefundAmount, currentStage]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-paper shadow-2xl border border-line overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-start justify-between border-b border-line p-5 sm:px-6 sm:py-4 bg-paper-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-xs">
              <Clock size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="status-history-title" className="font-sans text-lg sm:text-xl font-black text-ink">
                  {isHindi ? "रिटर्न स्थिति और इतिहास केंद्र" : "Return Status & History Hub"}
                </h2>
                <span className="hidden sm:inline-flex rounded-full bg-teal-100 dark:bg-teal-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  AY 2026-27 & Archive
                </span>
              </div>
              <p className="text-xs text-ink-2">
                {isHindi
                  ? "7-चरणीय रिफंड ट्रैकर, विगत वर्षों के दाखिल रिटर्न और आधिकारिक ITR-V रसीदें।"
                  : "End-to-end 7-stage refund pipeline, multi-year filing archive & statutory ITR-V proof."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isHindi ? "संवाद बंद करें" : "Close dialog"}
            className="rounded-xl p-2 text-ink-3 hover:bg-paper-3 hover:text-ink transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION                                                            */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-center border-b border-line bg-paper px-6 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("lifecycle")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "lifecycle"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <RefreshCw size={15} />
            <span>{isHindi ? "1. 7-चरणीय रिफंड ट्रैकर" : "1. Live Refund Tracker"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "archive"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <TrendingUp size={15} />
            <span>{isHindi ? "2. बहु-वर्षीय रिटर्न इतिहास" : "2. Multi-Year Archive"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("itrv")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "itrv"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <FileText size={15} />
            <span>{isHindi ? "3. आधिकारिक ITR-V पावती" : "3. ITR-V Acknowledgment"}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB BODY (SCROLLABLE)                                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Taxpayer Identity Header Bar */}
          <div className="rounded-2xl border border-line bg-paper-2 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink-3 block">
                {activeCitizen ? "Active Logged-In Taxpayer:" : "Selected Demo Profile:"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-sm text-ink">{selectedName}</span>
                <span className="font-mono text-xs font-bold bg-paper-3 px-2 py-0.5 rounded border border-line text-ink-2">
                  {selectedPan}
                </span>
                {currentRefundAmount > 0 && (
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold px-2 py-0.5">
                    Refund: {formatMoney(currentRefundAmount, lang)}
                  </span>
                )}
              </div>
            </div>

            {/* If unauthenticated or exploring demo */}
            {!activeCitizen && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-ink-3 mr-1">{isHindi ? "डेमो प्रोफाइल:" : "Demo Profile:"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedName(PERSONAS.sunita.name);
                    setSelectedPan(PERSONAS.sunita.pan);
                    setCurrentStage(4);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    selectedPan === PERSONAS.sunita.pan
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-paper border-line text-ink-2 hover:text-ink"
                  }`}
                >
                  Sunita Devi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedName(PERSONAS.rakesh.name);
                    setSelectedPan(PERSONAS.rakesh.pan);
                    setCurrentStage(6);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    selectedPan === PERSONAS.rakesh.pan
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-paper border-line text-ink-2 hover:text-ink"
                  }`}
                >
                  Rakesh Kumar
                </button>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* TAB 1: 7-STAGE LIVE REFUND TRACKER                                      */}
          {/* ======================================================================= */}
          {activeTab === "lifecycle" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stepper Pipeline */}
              <div className="rounded-3xl border border-line bg-paper p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-ink">
                      {isHindi ? "सीपीसी बेंगलूरु 7-चरणीय रिटर्न व रिफंड लाइफसाइकिल" : "CPC Bengaluru 7-Stage Filing & Refund Pipeline"}
                    </h3>
                    <p className="text-xs text-ink-2">
                      Assessment Year 2026-27 · Mode: Direct Credit via NACH/ECS
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold px-3 py-1 border border-teal-200 dark:border-teal-800">
                    Stage {currentStage} of 7 Active
                  </span>
                </div>

                {/* Stepper Steps */}
                <div className="space-y-4">
                  {LIFECYCLE_STAGES.map((s) => {
                    const isDone = s.id < currentStage;
                    const isCurrent = s.id === currentStage;

                    return (
                      <div
                        key={s.id}
                        onClick={() => setCurrentStage(s.id)}
                        className={`flex items-start gap-3.5 p-3 rounded-2xl border transition cursor-pointer ${
                          isCurrent
                            ? "border-teal-500 bg-teal-50/25 dark:bg-teal-950/20 shadow-xs ring-1 ring-teal-500"
                            : isDone
                            ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/15"
                            : "border-line bg-paper opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div
                          className={`size-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : isCurrent
                              ? "bg-teal-600 text-white animate-pulse"
                              : "bg-paper-3 text-ink-3 border border-line"
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : s.id}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isCurrent ? "text-teal-700 dark:text-teal-300" : "text-ink"}`}>
                              {isHindi ? s.labelHi : s.labelEn}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-2 mt-0.5">
                            {s.id === 1 && "ITR-1 received electronically on CBDT e-Filing gateway."}
                            {s.id === 2 && "Identity confirmed via Aadhaar OTP. 30-day compliance satisfied."}
                            {s.id === 3 && "Automated checks running for AIS, 26AS, and TDS matching."}
                            {s.id === 4 && "Section 143(1) intimation issued. Nil adjustment to declared figures."}
                            {s.id === 5 && `Statutory refund of ${formatMoney(currentRefundAmount, lang)} determined.`}
                            {s.id === 6 && "Payment order transmitted to State Bank of India Cash Management."}
                            {s.id === 7 && `Amount credited directly to ${activeBank.bank} account.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pre-Validated Bank Details */}
              <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <Landmark size={16} className="text-teal-600" />
                    <span>{isHindi ? "सत्यापित बैंक खाता (Pre-Validated Refund Account):" : "Pre-Validated Bank Account Details:"}</span>
                  </span>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 flex items-center gap-1">
                    <ShieldCheck size={12} /> {activeBank.status === "validated" ? "ECS Pre-Validated" : "Account Verified"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-3.5 bg-paper rounded-xl border border-line">
                  <div>
                    <span className="text-ink-3 text-[10px] uppercase font-mono block">Bank Name:</span>
                    <strong className="text-ink text-xs mt-0.5 block">{activeBank.bank}</strong>
                  </div>
                  <div>
                    <span className="text-ink-3 text-[10px] uppercase font-mono block">Account Number:</span>
                    <strong className="font-mono text-ink text-xs mt-0.5 block">{activeBank.maskedNumber}</strong>
                  </div>
                  <div>
                    <span className="text-ink-3 text-[10px] uppercase font-mono block">IFSC:</span>
                    <strong className="font-mono text-ink text-xs mt-0.5 block">{activeBank.ifsc}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: MULTI-YEAR FILING ARCHIVE & LOSSES                               */}
          {/* ======================================================================= */}
          {activeTab === "archive" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border border-line bg-paper p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="font-bold text-sm text-ink">
                    {isHindi ? "विगत निर्धारण वर्षों का तुलनात्मक रिकॉर्ड:" : "Historical Assessment Years Filing Log:"}
                  </h3>
                  <span className="font-mono text-xs text-ink-3">Preserved for statutory period</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-line text-ink-3 text-[11px] font-mono">
                        <th className="pb-2 text-start">AY / FY</th>
                        <th className="pb-2 text-start">Form & Date</th>
                        <th className="pb-2 text-start">Ack Number</th>
                        <th className="pb-2 text-end">Taxable Income</th>
                        <th className="pb-2 text-end">Outcome</th>
                        <th className="pb-2 text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {pastFilings.map((row) => (
                        <tr key={row.ay} className="hover:bg-paper-2 transition">
                          <td className="py-3 font-mono font-bold text-ink">
                            AY {row.ay}
                            <span className="block text-[10px] text-ink-3 font-normal">FY {row.fy}</span>
                          </td>
                          <td className="py-3 text-ink">
                            {row.form}
                            <span className="block text-[10px] text-ink-3 font-mono">{row.filingDate}</span>
                          </td>
                          <td className="py-3 font-mono text-ink-2">{row.ackNumber}</td>
                          <td className="py-3 text-end font-mono font-semibold text-ink">
                            {formatMoney(row.taxableIncome, lang)}
                          </td>
                          <td className="py-3 text-end font-mono font-bold">
                            {row.outcome === "refund" ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{formatMoney(row.outcomeAmount, lang)}
                              </span>
                            ) : (
                              <span className="text-ink-2">Nil Demand</span>
                            )}
                          </td>
                          <td className="py-3 text-end">
                            <span className="rounded-md bg-paper-3 px-2 py-0.5 text-[10px] font-semibold border border-line text-ink">
                              {isHindi ? row.statusHi : row.statusEn}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Carry-Forward Loss Tracking */}
              <div className="rounded-2xl border border-line bg-paper-2 p-5 space-y-3">
                <span className="font-bold text-xs text-ink block">
                  {isHindi ? "हानि अग्रेषण खाता (Section 71 / 72 Carry-Forward Losses):" : "Eligible Carry-Forward Losses u/s 71/72:"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
                    <span className="text-ink-3 text-[10px] uppercase font-mono block">Short Term Capital Loss (STCL):</span>
                    <span className="font-mono font-bold text-sm text-ink">₹42,500</span>
                    <span className="text-[10px] text-ink-2 block">Origin: AY 2025-26 · Eligible for 7 more years</span>
                  </div>

                  <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
                    <span className="text-ink-3 text-[10px] uppercase font-mono block">House Property Loss:</span>
                    <span className="font-mono font-bold text-sm text-ink">₹0</span>
                    <span className="text-[10px] text-ink-2 block">Fully set off against income from salary</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: OFFICIAL ITR-V ACKNOWLEDGMENT                                    */}
          {/* ======================================================================= */}
          {activeTab === "itrv" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border-2 border-teal-200 dark:border-teal-900/60 bg-paper p-6 space-y-5 shadow-md">
                {/* Gov Header */}
                <div className="flex items-start justify-between border-b border-line pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 block">
                      INDIAN INCOME TAX RETURN VERIFICATION FORM
                    </span>
                    <h3 className="font-sans text-base font-black text-ink">
                      ITR-V Acknowledgment · AY 2026-27
                    </h3>
                  </div>
                  <span className="rounded-md bg-paper-3 px-2.5 py-1 font-mono text-xs font-bold border border-line text-ink">
                    Sahaj (ITR-1)
                  </span>
                </div>

                {/* Acknowledgment Number Hero Bar */}
                <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-700 dark:text-teal-300 block">
                      15-Digit Statutory Acknowledgment Number:
                    </span>
                    <span className="font-mono text-xl font-black text-ink tracking-wider">
                      2893 8210 0492 817
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-700 dark:text-teal-300 block">
                      Filing Timestamp:
                    </span>
                    <span className="font-mono text-xs font-bold text-ink">
                      2026-07-28 14:32:09 IST
                    </span>
                  </div>
                </div>

                {/* Return Facts & Verified Summary */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs border-y border-line py-4">
                  <div>
                    <dt className="text-ink-3">Taxpayer Name:</dt>
                    <dd className="font-bold text-ink mt-0.5">{selectedName}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Permanent Account Number (PAN):</dt>
                    <dd className="font-mono font-bold text-ink mt-0.5">{selectedPan}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Filing Section:</dt>
                    <dd className="font-bold text-ink mt-0.5">139(1) — On or Before Statutory Due Date</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Verification Mode:</dt>
                    <dd className="font-bold text-ink mt-0.5">e-Verified via Aadhaar OTP (EVC-881924)</dd>
                  </div>
                </dl>

                {/* Download Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-ink-3 font-mono">
                    SHA-256 Hash: 9f8a...2e10 (Digitally signed by CPC)
                  </span>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-2 border border-line text-xs font-semibold text-ink hover:bg-paper-3 transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>{isHindi ? "ITR-V प्रिंट करें" : "Print ITR-V"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FIXED FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line p-4 sm:p-5 bg-paper">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <ShieldCheck size={16} className="text-teal-600" />
            <span>
              {isHindi
                ? `करदाता: ${selectedName} (${selectedPan})`
                : `Taxpayer: ${selectedName} (${selectedPan})`}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewReturnDetails?.();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 transition cursor-pointer"
            >
              <span>{isHindi ? "डैशबोर्ड पर पूर्ण विवरण देखें" : "View Return in Dashboard"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
