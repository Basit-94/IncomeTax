"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Printer,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Copy,
  Receipt,
  Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Lang, TaxAlreadyPaid } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { PERSONAS } from "@/lib/personas";
import type { SelfAssessmentPayment } from "@/context/TaxReturnContext";
import {
  CHALLAN_MAJOR_HEAD,
  CHALLAN_MAJOR_HEAD_LABEL,
  CHALLAN_MINOR_HEAD,
  CHALLAN_MINOR_HEAD_LABEL,
  CHALLAN_TYPE,
  ASSESSMENT_YEAR,
  FINANCIAL_YEAR,
  NET_BANKING_BANKS,
  UPI_QR_TTL_SECONDS,
  splitTaxAndCess,
  syntheticChallanIdentifiers,
  upiDeepLink,
} from "@/lib/compliance/challan280";

export interface PayTaxModalProps {
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
    grossTax?: number;
    hasPaidChallan?: boolean;
    challanPayments?: TaxAlreadyPaid[];
    taxPaidEntries?: TaxAlreadyPaid[];
  } | null;
  onApplyChallan?: (payment: SelfAssessmentPayment) => void;
}

type PaymentMethod = "UPI" | "NET_BANKING";
type PaymentStage = "select" | "processing" | "done";
type TaxHead = "300" | "100" | "400";

const TAX_HEADS: { code: TaxHead; labelEn: string; labelHi: string; descEn: string; descHi: string }[] = [
  {
    code: "300",
    labelEn: "Self-Assessment Tax (Sec 140A)",
    labelHi: "स्व-निर्धारण कर (धारा 140A)",
    descEn: "Mandatory payment for assessed balance due before filing return u/s 139.",
    descHi: "धारा 139 के तहत रिटर्न दाखिल करने से पहले बकाया कर का अनिवार्य भुगतान।",
  },
  {
    code: "100",
    labelEn: "Advance Tax (Sec 208-211)",
    labelHi: "अग्रिम कर (धारा 208-211)",
    descEn: "Quarterly tax installment during the financial year.",
    descHi: "वित्तीय वर्ष के दौरान त्रैमासिक अग्रिम कर किस्त।",
  },
  {
    code: "400",
    labelEn: "Regular Assessment Demand",
    labelHi: "नियमित निर्धारण मांग कर",
    descEn: "Paid against intimation / demand notices u/s 143(1)(a) or 156.",
    descHi: "धारा 143(1)(a) या 156 के डिमांड नोटिस के विरुद्ध भुगतान।",
  },
];

function parseChallanIdentifiers(identifier?: string, fallbackSeed: number = 10042) {
  if (identifier) {
    const bsrMatch = identifier.match(/BSR\s*(\d{7})/i);
    const serialMatch = identifier.match(/serial\s*(\d{5})/i);
    if (bsrMatch && serialMatch) {
      return { bsrCode: bsrMatch[1], challanNo: serialMatch[1] };
    }
  }
  return syntheticChallanIdentifiers(fallbackSeed);
}

export default function PayTaxModal({
  isOpen,
  onClose,
  lang,
  activeCitizen,
  onApplyChallan,
}: PayTaxModalProps) {
  const isHindi = lang === "hi";

  // Tab State: "gateway" (Pay) | "receipt" (Challan Counterfoil / Clearance) | "radar" (Advance Tax & 234 Penalty)
  const [activeTab, setActiveTab] = useState<"gateway" | "receipt" | "radar">("gateway");

  // Selected Taxpayer Identity
  const [selectedPan, setSelectedPan] = useState<string>(() => {
    return activeCitizen?.pan || PERSONAS.rakesh.pan;
  });
  const [selectedName, setSelectedName] = useState<string>(() => {
    return activeCitizen?.name || PERSONAS.rakesh.name;
  });

  // Selected Head (Default is 300 for Sec 140A)
  const [taxHead, setTaxHead] = useState<TaxHead>("300");

  // Payment Options
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [selectedBank, setSelectedBank] = useState<string>(NET_BANKING_BANKS[0].code);

  // Payment Processing Lifecycle
  const [stage, setStage] = useState<PaymentStage>("select");
  const [secondsLeft, setSecondsLeft] = useState<number>(UPI_QR_TTL_SECONDS);
  const [paymentReceipt, setPaymentReceipt] = useState<SelfAssessmentPayment | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Detect existing paid Challan 280 in active citizen's ledger
  const existingChallanEntry = useMemo(() => {
    return (
      activeCitizen?.challanPayments?.[0] ||
      activeCitizen?.taxPaidEntries?.find((t) => t.section === "140A")
    );
  }, [activeCitizen]);

  const hasPaidChallan = Boolean(
    activeCitizen?.hasPaidChallan || existingChallanEntry
  );

  // Exact assessed tax due extracted from the tax return computation
  const assessedTaxDue = activeCitizen
    ? Math.max(0, activeCitizen.taxDue ?? 0)
    : 18280;

  // Clearance status under Section 140A:
  // Either user already paid Challan 280, or pre-paid taxes (TDS) leave zero balance payable
  const isNilDue = activeCitizen !== null && activeCitizen !== undefined && assessedTaxDue <= 0;
  const isCleared = hasPaidChallan || isNilDue;

  // The payable amount is strictly locked to assessedTaxDue
  const [amount, setAmount] = useState<number>(assessedTaxDue);

  // Reconstructed receipt from existing ledger entry if already paid
  const existingReceipt: SelfAssessmentPayment | null = useMemo(() => {
    if (!existingChallanEntry) return null;
    const ids = parseChallanIdentifiers(
      existingChallanEntry.provenance?.identifier,
      existingChallanEntry.amount * 31 + 10042
    );
    return {
      bsrCode: ids.bsrCode,
      challanNo: ids.challanNo,
      amount: existingChallanEntry.amount,
      date: existingChallanEntry.provenance?.filedOn || new Date().toISOString().slice(0, 10),
      majorHead: CHALLAN_MAJOR_HEAD,
      minorHead: "300",
      method: "UPI",
      bank: "State Bank of India (UPI Gateway)",
    };
  }, [existingChallanEntry]);

  // Current receipt to display in Tab 2
  const activeReceipt = paymentReceipt || existingReceipt;

  // Initialize or reset state when modal opens or activeCitizen changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPan(activeCitizen?.pan || PERSONAS.rakesh.pan);
      setSelectedName(activeCitizen?.name || PERSONAS.rakesh.name);
      setStage("select");
      setPaymentReceipt(null);
      setSecondsLeft(UPI_QR_TTL_SECONDS);

      if (isCleared) {
        // If already paid or nil due, automatically show receipt / clearance tab!
        setActiveTab("receipt");
        setAmount(existingChallanEntry?.amount || 0);
      } else {
        // If tax is due, extract and lock exact amount, open on gateway tab!
        setActiveTab("gateway");
        setAmount(assessedTaxDue);
      }
    }
  }, [isOpen, activeCitizen, isCleared, existingChallanEntry, assessedTaxDue]);

  // UPI countdown timer
  useEffect(() => {
    if (!isOpen || stage !== "select" || method !== "UPI") return;
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [isOpen, stage, method, secondsLeft]);

  // Calculation helpers: 4% cess split
  const payableForSplit = isCleared && activeReceipt ? activeReceipt.amount : amount;
  const { baseTax, cess } = useMemo(() => splitTaxAndCess(payableForSplit), [payableForSplit]);

  const challanRef = useMemo(
    () => `WAPSI${selectedPan.slice(0, 5)}${amount}`,
    [selectedPan, amount]
  );

  const deepLink = useMemo(
    () => upiDeepLink(amount, challanRef),
    [amount, challanRef]
  );

  if (!isOpen) return null;

  const mmss = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const simulatePaymentSuccess = () => {
    setStage("processing");
    setTimeout(() => {
      const panSeed = [...selectedPan].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7);
      const ids = syntheticChallanIdentifiers(amount * 31 + panSeed + 10042);
      const payment: SelfAssessmentPayment = {
        ...ids,
        amount,
        date: new Date().toISOString().slice(0, 10),
        majorHead: CHALLAN_MAJOR_HEAD,
        minorHead: taxHead,
        method,
        bank: method === "NET_BANKING"
          ? NET_BANKING_BANKS.find((b) => b.code === selectedBank)?.name
          : "State Bank of India (UPI Gateway)",
      };
      setPaymentReceipt(payment);
      setStage("done");
      setActiveTab("receipt");
    }, 1400);
  };

  const handleApplyToReturn = () => {
    if (!paymentReceipt) return;
    onApplyChallan?.(paymentReceipt);
    onClose();
  };

  const copyUpiIntent = () => {
    navigator.clipboard.writeText("epaytax.cbdt@sbi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyReceiptDetails = () => {
    if (!activeReceipt) return;
    const text = `Challan 280 (ITNS 280) Details:
BSR Code: ${activeReceipt.bsrCode}
Challan No: ${activeReceipt.challanNo}
Date: ${activeReceipt.date}
Amount: ₹${activeReceipt.amount.toLocaleString("en-IN")}
PAN: ${selectedPan}`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-tax-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-paper shadow-2xl border border-line overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-start justify-between border-b border-line p-5 sm:px-6 sm:py-4 bg-paper-2">
          <div className="flex items-center gap-3">
            <div className={`flex size-11 items-center justify-center rounded-2xl ${
              isCleared
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
            } shadow-xs`}>
              {isCleared ? <ShieldCheck size={22} /> : <CreditCard size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="pay-tax-title" className="font-sans text-lg sm:text-xl font-black text-ink">
                  {isHindi ? "ई-पे टैक्स · चालान 280 (ITNS 280)" : "e-Pay Tax · Challan 280 (ITNS 280)"}
                </h2>
                <span className="hidden sm:inline-flex rounded-full bg-paper-3 px-2.5 py-0.5 text-[10px] font-mono font-bold text-ink-2 border border-line">
                  AY {ASSESSMENT_YEAR}
                </span>
                {isCleared ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Check size={11} />
                    <span>{isHindi ? "कर चुकता u/s 140A" : "Tax Cleared u/s 140A"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Lock size={10} />
                    <span>{formatMoney(assessedTaxDue, lang)} {isHindi ? "देय" : "Due"}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-2">
                {isHindi
                  ? "धारा 140A स्व-निर्धारण कर का आधिकारिक समाधान व CBDT रसीद केंद्र।"
                  : "CBDT statutory self-assessment tax settlement & official compliance counterfoil."}
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
        {/* TAB CONTROLS                                                              */}
        {/* ========================================================================= */}
        <div className="shrink-0 flex items-center border-b border-line bg-paper px-6 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("gateway")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "gateway"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <CreditCard size={15} />
            <span>{isHindi ? "1. ई-पे टैक्स गेटवे" : "1. e-Pay Tax Gateway"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "receipt"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Receipt size={15} />
            <span>
              {isCleared
                ? (isHindi ? "2. वैधानिक चालान काउंटरफ़ॉइल / कर समाधान" : "2. Statutory Counterfoil & Clearance")
                : (isHindi ? "2. वैधानिक चालान रसीद (BSR कोड)" : "2. Challan 280 Counterfoil")}
            </span>
            {isCleared && (
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("radar")}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "radar"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Clock size={15} />
            <span>{isHindi ? "3. अग्रिम कर समय सीमा व धारा 234" : "3. Advance Tax & Sec 234 Radar"}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB BODY (SCROLLABLE)                                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ======================================================================= */}
          {/* TAB 1: E-PAY TAX GATEWAY                                                */}
          {/* ======================================================================= */}
          {activeTab === "gateway" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* If user is already cleared (has paid or nil due), show clearance banner instead of prompt to pay */}
              {isCleared ? (
                <div className="rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-sans text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                        {isHindi
                          ? "धारा 140A के तहत आपकी कर देयता पूर्ण रूप से चुकता है"
                          : "Statutory Tax Obligation Fully Cleared u/s 140A"}
                      </h3>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                        {hasPaidChallan
                          ? (isHindi
                              ? `आपने पूर्व में ही ${formatMoney(existingReceipt?.amount || 0, lang)} का चालान 280 (BSR कोड: ${existingReceipt?.bsrCode || "0002148"}) जमा कर दिया है। अतिरिक्त भुगतान की कोई आवश्यकता नहीं है।`
                              : `You have already paid your self-assessment tax of ${formatMoney(existingReceipt?.amount || 0, lang)} via Challan 280 (BSR: ${existingReceipt?.bsrCode || "0002148"}). No further payment is required.`)
                          : (isHindi
                              ? `आपके पूर्व-भुगतान किए गए कर (TDS) ${formatMoney(activeCitizen?.tds || 0, lang)} आपकी कुल कर देयता को पूर्ण रूप से समायोजित करते हैं। देय शेष राशि शून्य (₹0) है।`
                              : `Your pre-paid taxes (TDS) of ${formatMoney(activeCitizen?.tds || 0, lang)} fully satisfy your total tax liability. Net tax payable is ₹0.00.`)}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Balance Due u/s 140A</span>
                      <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">₹0.00</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Taxes Credited</span>
                      <span className="font-mono text-xl font-bold text-ink">
                        {formatMoney(activeCitizen?.totalTaxesPaid || activeCitizen?.tds || existingReceipt?.amount || 0, lang)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Return Defect Status</span>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                        ✓ SEC 139(9) CLEAR
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      {isHindi
                        ? "चालान 280 काउंटरफ़ॉइल या कर समाधान प्रमाणपत्र देखने के लिए अगला टैब खोलें।"
                        : "View official counterfoil or compliance clearance certificate in Tab 2."}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("receipt")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Receipt size={14} />
                      <span>{isHindi ? "काउंटरफ़ॉइल / रसीद देखें" : "View Counterfoil / Receipt"}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Taxpayer Identity Bar */}
                  <div className="rounded-2xl border border-line bg-paper-2 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3 block">
                        {isHindi ? "करदाता का विवरण:" : "Taxpayer Identity:"}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-sm text-ink">{selectedName}</span>
                        <span className="font-mono text-xs font-bold bg-paper-3 px-2 py-0.5 rounded border border-line text-ink-2">
                          {selectedPan}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-[11px] font-mono font-semibold">
                        Major Head {CHALLAN_MAJOR_HEAD} · Minor Head {taxHead}
                      </span>
                    </div>
                  </div>

                  {/* EXTRACTED STATUTORY TAX DUE CARD (LOCKED TO EXACT AMOUNT) */}
                  <div className="rounded-3xl border-2 border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Lock size={13} className="text-indigo-600" />
                          <span>{isHindi ? "सटीक निकाला गया कर देय (धारा 140A स्व-निर्धारण)" : "Extracted Tax Due u/s 140A (Statutory Exact Amount)"}</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                        CBDT Rule 12 Precision
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
                      <div>
                        <span className="text-[11px] text-ink-3 font-mono block mb-1">
                          {isHindi ? "रिटर्न गणना से निकाली गई बकाया राशि:" : "Exact Assessed Balance Payable:"}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                            {formatMoney(assessedTaxDue, lang)}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                            Locked u/s 140A
                          </span>
                        </div>
                      </div>

                      {/* Statutory Cess Breakdown */}
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-line text-xs font-mono space-y-1 sm:min-w-[200px]">
                        <div className="flex justify-between text-ink-2">
                          <span>Base Income Tax:</span>
                          <strong className="text-ink">{formatMoney(baseTax, lang)}</strong>
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>Health & Edu Cess (4%):</span>
                          <strong className="text-ink">{formatMoney(cess, lang)}</strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-line font-bold text-indigo-600 dark:text-indigo-400">
                          <span>Total to Settle:</span>
                          <span>{formatMoney(assessedTaxDue, lang)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-ink-2 bg-paper p-3 rounded-xl border border-line leading-relaxed">
                      {isHindi
                        ? "यह राशि आपके आयकर रिटर्न (सकल कर दायित्व घटा टीडीएस) से सीधे निकाली गई है। धारा 140A के तहत मनमाना अमाउंट नहीं भरा जा सकता — सटीक देय राशि ही चालान 280 द्वारा जमा करनी होती है ताकि धारा 139(9) त्रुटि नोटिस से बचा जा सके।"
                        : "This exact amount is computed directly from your AY 2026-27 return assessment. Under Income Tax Section 140A, self-assessment tax must strictly match the assessed balance to prevent Section 139(9) defective return payment holds."}
                    </p>
                  </div>

                  {/* Major & Minor Tax Heads */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <span>{isHindi ? "कर का प्रकार (Minor Head u/s):" : "Type of Payment (Minor Head):"}</span>
                      </label>
                      <span className="text-[11px] font-mono text-ink-3">
                        Major Head: {CHALLAN_MAJOR_HEAD} (Income Tax other than Companies)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TAX_HEADS.map((th) => (
                        <div
                          key={th.code}
                          onClick={() => setTaxHead(th.code)}
                          className={`p-3.5 rounded-2xl border-2 transition cursor-pointer space-y-1.5 ${
                            taxHead === th.code
                              ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-600"
                              : "border-line bg-paper hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-paper-3 border border-line">
                              Head {th.code}
                            </span>
                            <div className="size-4 rounded-full border border-line flex items-center justify-center bg-paper">
                              {taxHead === th.code && <div className="size-2.5 rounded-full bg-indigo-600" />}
                            </div>
                          </div>
                          <p className="font-bold text-xs text-ink">{isHindi ? th.labelHi : th.labelEn}</p>
                          <p className="text-[11px] text-ink-2 leading-relaxed">{isHindi ? th.descHi : th.descEn}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Rails Selector */}
                  <div className="space-y-4 pt-2 border-t border-line">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        {isHindi ? "भुगतान माध्यम चुनें:" : "Choose Payment Rail:"}
                      </span>
                      <span className="text-xs text-ink-3 font-mono">
                        {method === "UPI" ? "Instant Dynamic QR (Locked Amount)" : "Internet Banking Gateway"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMethod("UPI")}
                        className={`p-3 rounded-2xl border-2 transition flex items-center justify-center gap-2.5 cursor-pointer ${
                          method === "UPI"
                            ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                            : "border-line bg-paper text-ink-2 hover:border-indigo-300"
                        }`}
                      >
                        <QrCode size={18} />
                        <span className="text-xs font-bold">{isHindi ? "UPI QR कोड (तत्काल)" : "UPI QR Code (Instant)"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMethod("NET_BANKING")}
                        className={`p-3 rounded-2xl border-2 transition flex items-center justify-center gap-2.5 cursor-pointer ${
                          method === "NET_BANKING"
                            ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                            : "border-line bg-paper text-ink-2 hover:border-indigo-300"
                        }`}
                      >
                        <Building2 size={18} />
                        <span className="text-xs font-bold">{isHindi ? "नेट बैंकिंग (शीर्ष बैंक)" : "Net Banking"}</span>
                      </button>
                    </div>

                    {/* UPI QR Canvas */}
                    {method === "UPI" && (
                      <div className="rounded-2xl border border-line bg-paper p-5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-start space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                              Locked to {formatMoney(assessedTaxDue, lang)}
                            </span>
                            <span className="font-mono text-xs text-ink-3">
                              {isHindi ? "समय शेष:" : "Expires in:"}{" "}
                              <strong className="text-indigo-600 font-bold">{mmss(secondsLeft)}</strong>
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-ink">
                            {isHindi ? `UPI ऐप से ${formatMoney(assessedTaxDue, lang)} का स्कैन करके भुगतान करें` : `Scan with Any UPI App to Pay ${formatMoney(assessedTaxDue, lang)}`}
                          </h4>
                          <p className="text-xs text-ink-2 max-w-sm leading-relaxed">
                            {isHindi
                              ? "GPay, PhonePe, Paytm, या BHIM से स्कैन करें। VPA: epaytax.cbdt@sbi पर सटीक राशि स्वतः लोड होगी।"
                              : "Compatible with Google Pay, PhonePe, BHIM, and Paytm. The exact statutory amount is pre-filled in the QR."}
                          </p>

                          <div className="pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={copyUpiIntent}
                              className="px-3 py-1 rounded-lg border border-line bg-paper-2 text-xs font-mono text-ink-2 hover:text-ink flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Copy size={12} />
                              <span>{copiedUpi ? "Copied!" : "epaytax.cbdt@sbi"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSecondsLeft(UPI_QR_TTL_SECONDS)}
                              className="p-1 text-ink-3 hover:text-ink transition cursor-pointer"
                              title="Refresh QR Timer"
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </div>

                        {/* QR Code Graphic */}
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0">
                          <QRCodeSVG
                            value={deepLink}
                            size={140}
                            level="M"
                            includeMargin={false}
                          />
                          <span className="mt-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                            NPCI · BHIM UPI · ₹{assessedTaxDue}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Net Banking Bank Selector */}
                    {method === "NET_BANKING" && (
                      <div className="rounded-2xl border border-line bg-paper p-5 space-y-3">
                        <label className="text-xs font-bold text-ink block">
                          {isHindi ? "अपना बैंक चुनें:" : "Select Authorized Collecting Bank:"}
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full p-2.5 text-xs font-semibold rounded-xl border border-line bg-paper text-ink focus:border-indigo-600 focus:outline-none"
                        >
                          {NET_BANKING_BANKS.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                          <option value="AXIS">Axis Bank (UTIB)</option>
                          <option value="PNB">Punjab National Bank (PUNB)</option>
                          <option value="CANARA">Canara Bank (CNRB)</option>
                        </select>
                        <p className="text-xs text-ink-3">
                          {isHindi
                            ? "बैंक के नेट-बैंकिंग गेटवे से सीधे ई-पे टैक्स प्राधिकरण।"
                            : "Authorized banking partner for instant Challan 280 credit generation."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Processing banner */}
                  {stage === "processing" && (
                    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-paper-2 border border-indigo-200 dark:border-indigo-900/60 gap-2.5 text-center animate-in fade-in">
                      <Loader2 size={26} className="animate-spin text-indigo-600" />
                      <p className="text-xs font-bold text-ink">
                        {isHindi
                          ? "आरबीआई / एकत्रित बैंक से डिजिटल पावती की प्रतीक्षा की जा रही है…"
                          : "Awaiting confirmation from collecting bank gateway…"}
                      </p>
                      <p className="text-[11px] text-ink-3 font-mono">
                        Generating BSR code and Challan serial number...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: CHALLAN 280 COUNTERFOIL / STATUTORY CLEARANCE                    */}
          {/* ======================================================================= */}
          {activeTab === "receipt" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {activeReceipt ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm">
                          {isHindi
                            ? "चालान 280 का सफल भुगतान — आयकर रिटर्न हेतु प्रमाण तैयार"
                            : "Challan 280 Paid & Verified — Official Compliance Proof Ready"}
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300">
                          {isHindi
                            ? "नीचे दिए गए BSR कोड और सीरियल नंबर आपके रिटर्न में धारा 140A के तहत जुड़ चुके हैं।"
                            : "These statutory fields (BSR Code, Serial Number, Tender Date) satisfy Section 140A and clear all defective notice holds."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={copyReceiptDetails}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Copy size={13} />
                        <span>{copiedReceipt ? "Copied!" : "Copy BSR"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer size={13} />
                        <span>{isHindi ? "प्रिंट" : "Print"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Authentic CBDT ITNS 280 Counterfoil */}
                  <div className="rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-paper p-6 space-y-5 shadow-md">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-line pb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                          INCOME TAX DEPARTMENT · TAXPAYER&apos;S COUNTERFOIL
                        </span>
                        <h3 className="font-sans text-base font-black text-ink">
                          ITNS 280 · Single Copy Tax Receipt (e-Challan)
                        </h3>
                      </div>
                      <div className="text-end">
                        <span className="rounded-md bg-paper-3 px-2 py-0.5 font-mono text-xs font-bold border border-line text-ink block">
                          AY {ASSESSMENT_YEAR}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold mt-1 block">
                          ✓ TIN-CBDT Verified
                        </span>
                      </div>
                    </div>

                    {/* Key Statutory Triplet: BSR, Serial, Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 dark:text-indigo-400 block">
                          BSR Code (7 Digits)
                        </span>
                        <span className="font-mono text-lg font-black text-ink">
                          {activeReceipt.bsrCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 dark:text-indigo-400 block">
                          Challan Serial (5 Digits)
                        </span>
                        <span className="font-mono text-lg font-black text-ink">
                          {activeReceipt.challanNo}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 dark:text-indigo-400 block">
                          Date of Tender
                        </span>
                        <span className="font-mono text-base font-bold text-ink">
                          {activeReceipt.date}
                        </span>
                      </div>
                    </div>

                    {/* Taxpayer & Head Details */}
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs border-y border-line py-4">
                      <div>
                        <dt className="text-ink-3">PAN & Taxpayer Name:</dt>
                        <dd className="font-bold text-ink mt-0.5">{selectedPan} · {selectedName}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-3">Major Head:</dt>
                        <dd className="font-bold text-ink mt-0.5">{CHALLAN_MAJOR_HEAD_LABEL}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-3">Minor Head:</dt>
                        <dd className="font-bold text-ink mt-0.5">
                          {activeReceipt.minorHead === "300"
                            ? CHALLAN_MINOR_HEAD_LABEL
                            : activeReceipt.minorHead === "100"
                            ? "100 — Advance Tax"
                            : "400 — Regular Assessment"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-3">Payment Mode / Bank:</dt>
                        <dd className="font-bold text-ink mt-0.5">{activeReceipt.bank || "State Bank of India (UPI Gateway)"}</dd>
                      </div>
                    </dl>

                    {/* Amounts Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-ink-2">Income Tax (Base Amount):</span>
                        <span className="font-mono font-bold text-ink">{formatMoney(baseTax, lang)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-2">Health & Education Cess (4%):</span>
                        <span className="font-mono font-bold text-ink">{formatMoney(cess, lang)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-line font-bold text-sm">
                        <span className="text-ink">Total Tax Deposited u/s 140A:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xl font-black">
                          {formatMoney(activeReceipt.amount, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isNilDue ? (
                /* Pre-paid tax satisfaction certificate for taxpayers with 0 tax due */
                <div className="rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 bg-paper p-6 space-y-5 shadow-md">
                  <div className="flex items-start justify-between border-b border-line pb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                        INCOME TAX DEPARTMENT · TAX SATISFACTION CLEARANCE
                      </span>
                      <h3 className="font-sans text-base font-black text-ink">
                        Section 140A Statutory Tax Clearance Certificate
                      </h3>
                    </div>
                    <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      AY {ASSESSMENT_YEAR}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                        Assessed Balance Due
                      </span>
                      <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹0.00
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                        Pre-Paid Taxes (TDS Credited)
                      </span>
                      <span className="font-mono text-lg font-black text-ink">
                        {formatMoney(activeCitizen?.tds || activeCitizen?.totalTaxesPaid || 0, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                        Filing Eligibility
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded inline-block mt-1">
                        ✓ 100% CLEARED TO FILE
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs border-y border-line py-4">
                    <div>
                      <dt className="text-ink-3">PAN & Taxpayer Name:</dt>
                      <dd className="font-bold text-ink mt-0.5">{selectedPan} · {selectedName}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-3">Pre-Paid Deductions Form:</dt>
                      <dd className="font-bold text-ink mt-0.5">Form 16 (Sec 192) & Form 26AS</dd>
                    </div>
                    <div>
                      <dt className="text-ink-3">Statutory Clearance Rule:</dt>
                      <dd className="font-bold text-ink mt-0.5">Income Tax Act Section 140A(1) & Rule 12</dd>
                    </div>
                    <div>
                      <dt className="text-ink-3">Defect Notice Risk u/s 139(9):</dt>
                      <dd className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">0% · Nil Balance Verified</dd>
                    </div>
                  </dl>

                  <div className="p-3.5 rounded-xl bg-paper-2 border border-line text-xs leading-relaxed text-ink-2">
                    <strong className="text-ink block mb-1">CBDT Statutory Assessment Note:</strong>
                    Under Section 140A(1) of the Income-tax Act, self-assessment tax is mandatory only when tax payable remains unpaid after credit for pre-paid taxes. Because your TDS credits equal or exceed your gross tax liability, your tax obligation is 100% satisfied. No Challan 280 needs to be deposited.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-line bg-paper-2 space-y-3">
                  <Receipt size={36} className="text-ink-3 opacity-60" />
                  <h4 className="font-bold text-sm text-ink">
                    {isHindi ? "कोई भुगतान चालान अभी उत्पन्न नहीं हुआ है" : "Outstanding Tax Due · Payment Pending"}
                  </h4>
                  <p className="text-xs text-ink-2 max-w-sm">
                    {isHindi
                      ? `आपके रिटर्न में ${formatMoney(assessedTaxDue, lang)} का टैक्स बकाया है। कृपया '1. ई-पे टैक्स गेटवे' में जाकर इसका भुगतान करें।`
                      : `Your return has an assessed balance payable of ${formatMoney(assessedTaxDue, lang)}. Complete the payment under Tab 1 to generate your BSR counterfoil.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("gateway")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition hover:bg-indigo-700 cursor-pointer"
                  >
                    {isHindi ? "गेटवे पर जाएं" : "Go to Payment Gateway"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: ADVANCE TAX RADAR & SEC 234 PENALTIES                             */}
          {/* ======================================================================= */}
          {activeTab === "radar" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Clock size={16} className="text-purple-600" />
                <span>
                  {isHindi ? "त्रैमासिक अग्रिम कर अनुसूची (FY 2025-26):" : "Statutory Advance Tax Schedule (FY 2025-26):"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-line bg-paper-2 space-y-1">
                  <span className="font-mono text-[10px] text-ink-3 font-bold block">15 JUNE 2025</span>
                  <p className="font-bold text-ink">1st Installment</p>
                  <p className="text-xs text-indigo-600 font-mono font-bold">15% of Net Tax</p>
                  <span className="text-[10px] text-ink-3 block">Sec 234C deferment applies if short</span>
                </div>

                <div className="p-3.5 rounded-2xl border border-line bg-paper-2 space-y-1">
                  <span className="font-mono text-[10px] text-ink-3 font-bold block">15 SEPTEMBER 2025</span>
                  <p className="font-bold text-ink">2nd Installment</p>
                  <p className="text-xs text-indigo-600 font-mono font-bold">Cumulative 45%</p>
                  <span className="text-[10px] text-ink-3 block">Sec 234C deferment applies if short</span>
                </div>

                <div className="p-3.5 rounded-2xl border border-line bg-paper-2 space-y-1">
                  <span className="font-mono text-[10px] text-ink-3 font-bold block">15 DECEMBER 2025</span>
                  <p className="font-bold text-ink">3rd Installment</p>
                  <p className="text-xs text-indigo-600 font-mono font-bold">Cumulative 75%</p>
                  <span className="text-[10px] text-ink-3 block">Sec 234C deferment applies if short</span>
                </div>

                <div className="p-3.5 rounded-2xl border border-line bg-paper-2 space-y-1">
                  <span className="font-mono text-[10px] text-ink-3 font-bold block">15 MARCH 2026</span>
                  <p className="font-bold text-ink">4th Installment</p>
                  <p className="text-xs text-indigo-600 font-mono font-bold">100% of Net Tax</p>
                  <span className="text-[10px] text-ink-3 block">Final settlement cutoff for FY</span>
                </div>
              </div>

              {/* Section 234 Rules Explanation */}
              <div className="rounded-2xl border border-line bg-paper-2 p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <AlertTriangle size={15} className="text-amber-500" />
                  <span>
                    {isHindi ? "आयकर अधिनियम की दंडात्मक ब्याज धाराएं:" : "Interest Penalties for Late / Short Payment:"}
                  </span>
                </div>

                <div className="space-y-2.5 text-ink-2 leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">धारा 234A (Section 234A):</strong>
                    31 जुलाई की वैधानिक समय सीमा के बाद रिटर्न दाखिल करने पर बकाया टैक्स पर प्रति माह 1% की दर से ब्याज।
                  </div>
                  <div className="p-2.5 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">धारा 234B (Section 234B):</strong>
                    यदि वित्तीय वर्ष समाप्त होने तक कुल देय टैक्स का 90% से कम भुगतान किया गया है, तो 1% प्रति माह ब्याज।
                  </div>
                  <div className="p-2.5 rounded-xl bg-paper border border-line/60">
                    <strong className="text-ink block">धारा 234C (Section 234C):</strong>
                    अग्रिम कर की व्यक्तिगत किस्तों (15%, 45%, 75%) में देरी होने पर 1% प्रति माह ब्याज।
                  </div>
                </div>
              </div>

              {/* Defective Return Warning u/s 139(9) */}
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs">
                <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-ink">
                    {isHindi ? "धारा 139(9) त्रुटिपूर्ण रिटर्न नियम (Defective Return Rule):" : "Section 139(9) Defective Return Safeguard:"}
                  </span>
                  <p className="text-ink-2 leading-relaxed">
                    {isHindi
                      ? "यदि किसी करदाता का टैक्स बकाया है और वह बिना चालान 280 भरे रिटर्न दाखिल करता है, तो सीपीसी उस रिटर्न को धारा 139(9) के तहत अमान्य/त्रुटिपूर्ण घोषित कर देता है। इसीलिए चालान 280 का भुगतान अनिवार्य है।"
                      : "A return filed with outstanding tax liability is deemed legally defective u/s 139(9). Paying self-assessment tax via Challan 280 generates the proof required to file a flawless, dispute-free return."}
                  </p>
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
            {isCleared ? (
              <>
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {isHindi
                    ? "धारा 140A कर देयता मुक्त (₹0 देय)"
                    : "Tax Obligation Cleared u/s 140A (₹0 Due)"}
                </span>
              </>
            ) : (
              <>
                <Lock size={15} className="text-indigo-600" />
                <span>
                  {isHindi
                    ? `निकाली गई सटीक चालान राशि: ${formatMoney(assessedTaxDue, lang)} · हेड ${taxHead}`
                    : `Extracted Challan Due: ${formatMoney(assessedTaxDue, lang)} · Minor Head ${taxHead}`}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>

            {paymentReceipt ? (
              <button
                type="button"
                onClick={handleApplyToReturn}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <Sparkles size={14} />
                <span>
                  {isHindi
                    ? `रिटर्न में चालान जोड़ें (${formatMoney(paymentReceipt.amount, lang)} चुकता)`
                    : `Apply Challan to My Return (Settles ${formatMoney(paymentReceipt.amount, lang)})`}
                </span>
                <ArrowRight size={14} />
              </button>
            ) : isCleared ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <Check size={14} />
                <span>{isHindi ? "सत्यापित · आगे बढ़ें" : "Verified · Continue"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={simulatePaymentSuccess}
                disabled={stage === "processing" || assessedTaxDue <= 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                {stage === "processing" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{isHindi ? "प्रक्रिया जारी है…" : "Processing…"}</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={14} />
                    <span>
                      {isHindi
                        ? `${formatMoney(assessedTaxDue, lang)} का तत्काल भुगतान अनुकरण करें`
                        : `Simulate Payment (${formatMoney(assessedTaxDue, lang)})`}
                    </span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
