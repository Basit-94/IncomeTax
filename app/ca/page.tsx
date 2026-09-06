"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Award,
  Lock,
  ArrowRight,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Home,
  Briefcase,
  ChevronRight,
  Info,
  User,
  Building,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import type { Persona, Lang, IncomeFact, Claim, TaxAlreadyPaid } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import {
  fetchReviewRecord,
  verifyPin,
  submitCAReview,
  createDemoReview,
  type CAReviewRecord,
  type CADetails,
} from "@/lib/ca/ca-store";
import { PERSONAS } from "@/lib/personas";
import LanguageMenu from "@/components/ui/language-menu";

function CAPortalContent() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") || "";

  // Authentication State
  const [code, setCode] = useState(urlCode);
  const [pin, setPin] = useState("");
  const [caName, setCaName] = useState("CA Rajesh Sharma, FCA");
  const [membershipNo, setMembershipNo] = useState("084920");
  const [firmName, setFirmName] = useState("Sharma & Associates, CAs");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Active Review State
  const [record, setRecord] = useState<CAReviewRecord | null>(null);
  const [caPersona, setCaPersona] = useState<Persona | null>(null);
  const [recommendedRegime, setRecommendedRegime] = useState<"new" | "old">("old");
  const [caNotes, setCaNotes] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"salary" | "house" | "capital" | "other" | "deductions" | "tds">("deductions");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // UI preferences
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    if (urlCode && !code) setCode(urlCode);
  }, [urlCode, code]);

  // Handle Login / Verification
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setIsVerifying(true);

    try {
      const cleanCode = code.toUpperCase().trim();
      if (!cleanCode) {
        setAuthError("Please enter the citizen's Access Code");
        setIsVerifying(false);
        return;
      }
      if (!pin.trim()) {
        setAuthError("Please enter the Security PIN set by the citizen");
        setIsVerifying(false);
        return;
      }

      let rec = await fetchReviewRecord(cleanCode);
      if (!rec) {
        setAuthError(`No draft found with Access Code "${cleanCode}". Verify the code or try our demo.`);
        setIsVerifying(false);
        return;
      }

      const isValid = await verifyPin(rec, pin.trim());
      if (!isValid) {
        setAuthError("Incorrect Security PIN. Please ask the taxpayer for their secret PIN.");
        setIsVerifying(false);
        return;
      }

      // Successful authentication
      setRecord(rec);
      // Initialize CA working draft from caPersona if exists, else originalPersona
      const initialCaPersona: Persona = rec.caPersona
        ? JSON.parse(JSON.stringify(rec.caPersona))
        : JSON.parse(JSON.stringify(rec.originalPersona));
      setCaPersona(initialCaPersona);
      setRecommendedRegime(rec.caRegime || rec.originalRegime || "old");
      setCaNotes(rec.caNotes || "");
      if (rec.caDetails?.name) setCaName(rec.caDetails.name);
      if (rec.caDetails?.membershipNo) setMembershipNo(rec.caDetails.membershipNo);
      if (rec.caDetails?.firmName) setFirmName(rec.caDetails.firmName);
    } catch {
      setAuthError("Failed to authenticate review code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Launch Demo with Sunita Rao
  const handleLaunchDemo = async () => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const demoRec = await createDemoReview(PERSONAS.sunita);
      setCode(demoRec.code);
      setPin("1234");
      setRecord(demoRec);
      setCaPersona(JSON.parse(JSON.stringify(demoRec.caPersona!)));
      setRecommendedRegime(demoRec.caRegime || "old");
      setCaNotes(demoRec.caNotes || "");
      setCaName(demoRec.caDetails?.name || "CA Rajesh Sharma, FCA");
      setMembershipNo(demoRec.caDetails?.membershipNo || "084920");
      setFirmName(demoRec.caDetails?.firmName || "Sharma & Associates, CAs");
    } finally {
      setIsVerifying(false);
    }
  };

  // Computations
  const originalBreakdown = useMemo(() => {
    if (!record) return null;
    return computeForPersona(record.originalPersona, record.originalRegime);
  }, [record]);

  const caBreakdown = useMemo(() => {
    if (!caPersona) return null;
    return computeForPersona(caPersona, recommendedRegime);
  }, [caPersona, recommendedRegime]);

  const caDelta = useMemo(() => {
    if (!originalBreakdown || !caBreakdown) return 0;
    return caBreakdown.refundOrDue - originalBreakdown.refundOrDue;
  }, [originalBreakdown, caBreakdown]);

  // Clean numeric input parser: strips leading zeros and non-digits (e.g. "01000" -> 1000, "" -> 0)
  const handleNumberChange = (raw: string, setter: (val: number) => void) => {
    const sanitized = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
    const num = sanitized === "" ? 0 : Number(sanitized);
    setter(isNaN(num) ? 0 : Math.max(0, num));
  };

  // Editing helpers for CA fact sheet with full immutability
  const updateIncomeAmount = (kind: string, amount: number) => {
    if (!caPersona) return;
    const sanitizedAmount = Math.max(0, amount);
    const nextFacts = caPersona.facts.map((f) => ({ ...f }));
    const existing = nextFacts.find((f) => f.kind === kind);
    if (existing) {
      existing.amount = sanitizedAmount;
    } else if (sanitizedAmount > 0) {
      nextFacts.push({
        id: `ca_fact_${kind}_${Date.now()}`,
        kind: kind as any,
        amount: sanitizedAmount,
        label: `${kind.replace(/_/g, " ").toUpperCase()}`,
        provenance: {
          reporter: "CA Review Adjustments",
          reporterKind: "self",
          filedOn: new Date().toISOString().slice(0, 10),
          statement: "self",
          onlyReporterCanFix: false,
        },
      });
    }
    setCaPersona({
      ...caPersona,
      facts: nextFacts,
      claims: caPersona.claims.map((c) => ({ ...c })),
      taxPaid: caPersona.taxPaid.map((t) => ({ ...t })),
    });
  };

  const updateCapitalGains = (amount: number) => {
    if (!caPersona) return;
    const sanitizedAmount = Math.max(0, amount);
    const nextFacts = caPersona.facts.map((f) => ({ ...f }));
    const existing = nextFacts.find((f) => f.kind === "capital_gains");
    if (existing) {
      existing.amount = sanitizedAmount;
    } else if (sanitizedAmount > 0) {
      nextFacts.push({
        id: `ca_cg_${Date.now()}`,
        kind: "capital_gains",
        amount: sanitizedAmount,
        label: "Capital Gains on Securities",
        capitalGains: { assetClass: "equity_stt", holding: "short" },
        provenance: {
          reporter: "Broker / AIS Verified by CA",
          reporterKind: "broker",
          filedOn: new Date().toISOString().slice(0, 10),
          statement: "AIS",
          onlyReporterCanFix: false,
        },
      });
    }
    setCaPersona({
      ...caPersona,
      facts: nextFacts,
      claims: caPersona.claims.map((c) => ({ ...c })),
      taxPaid: caPersona.taxPaid.map((t) => ({ ...t })),
    });
  };

  type ClaimKey = "80C" | "80CCD" | "80D_SELF" | "80D_PARENTS" | "HRA" | "24B";

  const isClaimMatch = (c: Claim, key: ClaimKey): boolean => {
    const s = (c.section || "").toUpperCase().trim();
    const l = (c.label || "").toUpperCase().trim();
    switch (key) {
      case "80C":
        return s === "80C" || s.startsWith("80C_") || l.includes("80C") || l.includes("PROVIDENT");
      case "80CCD":
        return s.includes("80CCD") || l.includes("NPS") || l.includes("PENSION SYSTEM");
      case "80D_SELF":
        return (s === "80D" || s === "80D_SELF") && !l.includes("PARENT") && !s.includes("PARENT");
      case "80D_PARENTS":
        return s === "80D_PARENTS" || l.includes("PARENT");
      case "HRA":
        return s === "HRA" || s.includes("10(13A)") || l.includes("HOUSE RENT") || l.includes("HRA");
      case "24B":
        return s === "24B" || s.includes("24") || l.includes("HOME LOAN") || l.includes("HOUSING LOAN");
    }
  };

  const updateClaimByKey = (key: ClaimKey, amount: number) => {
    if (!caPersona) return;
    const sanitizedAmount = Math.max(0, amount);
    const standardSectionMap: Record<ClaimKey, string> = {
      "80C": "80C",
      "80CCD": "80CCD_1B",
      "80D_SELF": "80D_SELF",
      "80D_PARENTS": "80D_PARENTS",
      "HRA": "HRA",
      "24B": "24B",
    };
    const standardLabelMap: Record<ClaimKey, string> = {
      "80C": "Section 80C - Provident Fund & Investments",
      "80CCD": "Section 80CCD(1B) - National Pension System (NPS)",
      "80D_SELF": "Section 80D - Health Insurance (Self & Family)",
      "80D_PARENTS": "Section 80D - Health Insurance (Parents)",
      "HRA": "Section 10(13A) - House Rent Allowance (HRA) Exemption",
      "24B": "Section 24(b) - Interest on Housing Loan",
    };

    const nextClaims = caPersona.claims.map((c) => ({ ...c }));
    const idx = nextClaims.findIndex((c) => isClaimMatch(c, key));

    if (idx >= 0) {
      nextClaims[idx].amount = sanitizedAmount;
    } else if (sanitizedAmount > 0) {
      nextClaims.push({
        id: `ca_claim_${key.toLowerCase()}_${Date.now()}`,
        section: standardSectionMap[key] as any,
        amount: sanitizedAmount,
        label: standardLabelMap[key],
        evidenceAttached: true,
      });
    }

    setCaPersona({
      ...caPersona,
      claims: nextClaims,
      facts: caPersona.facts.map((f) => ({ ...f })),
      taxPaid: caPersona.taxPaid.map((t) => ({ ...t })),
    });
  };

  const updateTdsAmount = (amount: number) => {
    if (!caPersona) return;
    const sanitizedAmount = Math.max(0, amount);
    const nextTaxPaid: TaxAlreadyPaid[] = [
      {
        id: "ca_tds_consolidated",
        label: "Tax Deducted at Source (TDS) / Advance Tax Paid",
        amount: sanitizedAmount,
        section: "192",
        provenance: {
          reporter: "Form 26AS / AIS Verified by CA",
          reporterKind: "department",
          filedOn: new Date().toISOString().slice(0, 10),
          statement: "26AS",
          onlyReporterCanFix: false,
        },
      },
    ];

    setCaPersona({
      ...caPersona,
      taxPaid: nextTaxPaid,
      facts: caPersona.facts.map((f) => ({ ...f })),
      claims: caPersona.claims.map((c) => ({ ...c })),
    });
  };

  const handleSaveReview = async () => {
    if (!record || !caPersona) return;
    setIsSaving(true);
    try {
      const updated = await submitCAReview({
        code: record.code,
        caPersona,
        caRegime: recommendedRegime,
        caNotes,
        caDetails: {
          name: caName,
          membershipNo,
          firmName,
        },
      });
      if (updated) {
        setRecord(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Helper getters
  const salaryFact = caPersona?.facts.find((f) => f.kind === "salary");
  const houseFact = caPersona?.facts.find((f) => f.kind === "rent");
  const interestFact = caPersona?.facts.find((f) => f.kind === "interest");
  const dividendFact = caPersona?.facts.find((f) => f.kind === "dividend");
  const otherFact = caPersona?.facts.find((f) => f.kind === "other");
  const capitalGainsFact = caPersona?.facts.find((f) => f.kind === "capital_gains");

  const claim80C = caPersona?.claims.find((c) => isClaimMatch(c, "80C"));
  const claim80DSelf = caPersona?.claims.find((c) => isClaimMatch(c, "80D_SELF"));
  const claim80DParents = caPersona?.claims.find((c) => isClaimMatch(c, "80D_PARENTS"));
  const claim80CCD = caPersona?.claims.find((c) => isClaimMatch(c, "80CCD"));
  const claimHRA = caPersona?.claims.find((c) => isClaimMatch(c, "HRA"));
  const claim24B = caPersona?.claims.find((c) => isClaimMatch(c, "24B"));
  const tdsTotal = caPersona?.taxPaid.reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col font-sans selection:bg-teal-500 selection:text-white`}>
      {/* Top Professional Header Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="size-9 rounded-xl bg-gradient-to-br from-teal-700 to-indigo-900 flex items-center justify-center text-white font-serif font-black text-lg shadow-sm">
                W
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    Wapsi Professional
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-teal-500/30">
                    CA Audit Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assessment Year 2026-27 (FY 2025-26) · ICAI Standards
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageMenu lang={lang} onChange={setLang} label="Language" />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              href="/"
              className="hidden sm:inline-flex text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition"
            >
              Return to Citizen Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!record ? (
          /* Login Screen */
          <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 mb-2">
                <Award size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Taxpayer Audit & Review Access
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Enter the shareable Access Code and secret Security PIN provided by your client to inspect and optimize their draft return.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Client Review Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CA-7842-91"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full text-center tracking-widest text-xl font-mono font-bold p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Taxpayer Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="4 to 6 digit secret PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center tracking-widest text-xl font-mono font-bold p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reviewing Professional Stamp (Optional)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="CA Full Name"
                      value={caName}
                      onChange={(e) => setCaName(e.target.value)}
                      className="text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="ICAI Membership No."
                      value={membershipNo}
                      onChange={(e) => setMembershipNo(e.target.value)}
                      className="text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !code.trim() || !pin.trim()}
                  className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock size={16} />
                  <span>{isVerifying ? "Verifying Access..." : "Access Client Return Draft"}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Demo Section for Evaluators/Judges */}
              <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 block">
                  Testing Without a Citizen Draft?
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instantly load a pre-configured sample client (Sunita Rao - Salaried IT Professional) to test the CA audit & reconciliation interface.
                </p>
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  disabled={isVerifying}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Launch Demo Client Audit</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CA Audit Workspace */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Taxpayer Information Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {record.citizenName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {record.citizenName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                      {record.citizenPan}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-800 dark:text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                      AY {record.assessmentYear}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Original Citizen Selection: <strong>{record.originalRegime.toUpperCase()} Regime</strong> (
                    {originalBreakdown?.refundOrDue && originalBreakdown.refundOrDue >= 0
                      ? `Refund: ${formatMoney(originalBreakdown.refundOrDue, lang)}`
                      : `Due: ${formatMoney(Math.abs(originalBreakdown?.refundOrDue || 0), lang)}`}
                    )
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 ms-auto">
                <button
                  onClick={() => {
                    setRecord(null);
                    setPin("");
                  }}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Exit Review
                </button>
                <button
                  onClick={handleSaveReview}
                  disabled={isSaving}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check size={14} className="text-emerald-300" />
                      <span>Transmitted to Taxpayer!</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{isSaving ? "Saving..." : "Save & Return to Taxpayer"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Split Screen Audit Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Manual Form Fact Sheets (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto text-xs font-bold">
                  {(
                    [
                      ["deductions", "Chapter VI-A Claims"],
                      ["salary", "Salary & Allowances"],
                      ["house", "House Property"],
                      ["capital", "Capital Gains"],
                      ["other", "Other Sources"],
                      ["tds", "TDS & Tax Paid"],
                    ] as const
                  ).map(([tabKey, label]) => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                        activeTab === tabKey
                          ? "bg-teal-800 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Chapter VI-A Deductions */}
                {activeTab === "deductions" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Chapter VI-A Deductions Audit
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Verify eligible exemptions under the Old Tax Regime.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-800 dark:text-teal-300 font-mono text-xs font-bold">
                        Total: {formatMoney(caBreakdown?.totalDeductions || 0, lang)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* 80C */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <label className="text-slate-700 dark:text-slate-300">
                            Section 80C (PPF, EPF, ELSS, Life Insurance)
                          </label>
                          <span className="text-slate-400 font-mono">Max: ₹1,50,000</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claim80C?.amount ? claim80C.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("80C", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      {/* 80CCD(1B) NPS */}
                      <div className="space-y-1.5 p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <label className="flex items-center gap-1.5">
                            <Sparkles size={14} />
                            <span>Section 80CCD(1B) - National Pension System (NPS)</span>
                          </label>
                          <span className="font-mono">Max: ₹50,000</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Additional deduction over and above the ₹1.5 Lakh 80C limit.
                        </p>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claim80CCD?.amount ? claim80CCD.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("80CCD", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      {/* 80D Mediclaim Self */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <label className="text-slate-700 dark:text-slate-300">
                            Section 80D - Health Insurance (Self & Family)
                          </label>
                          <span className="text-slate-400 font-mono">Max: ₹25,000 / ₹50,000</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claim80DSelf?.amount ? claim80DSelf.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("80D_SELF", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      {/* 80D Mediclaim Parents */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <label className="text-slate-700 dark:text-slate-300">
                            Section 80D - Health Insurance (Parents)
                          </label>
                          <span className="text-slate-400 font-mono">Max: ₹25,000 / ₹50,000</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claim80DParents?.amount ? claim80DParents.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("80D_PARENTS", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      {/* Section 10 HRA Exemption */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <label className="text-slate-700 dark:text-slate-300">
                            Section 10(13A) - House Rent Allowance (HRA) Exemption
                          </label>
                          <span className="text-slate-400 font-mono">Rent Receipts Required</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claimHRA?.amount ? claimHRA.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("HRA", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      {/* Section 24b Housing Loan Interest */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <label className="text-slate-700 dark:text-slate-300">
                            Section 24(b) - Interest on Housing Loan
                          </label>
                          <span className="text-slate-400 font-mono">Max: ₹2,00,000</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claim24B?.amount ? claim24B.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("24B", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Salary */}
                {activeTab === "salary" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Income from Salary (Section 17)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gross salary as per Form 16 Part B / Section 17(1).
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Gross Salary
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={salaryFact?.amount ? salaryFact.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateIncomeAmount("salary", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Standard Deduction (Automatic u/s 16ia)</span>
                          <span className="font-mono text-teal-700 dark:text-teal-400">
                            {recommendedRegime === "new" ? "₹75,000 (New)" : "₹50,000 (Old)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Budget 2024 increased New Regime standard deduction to ₹75,000.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: House Property */}
                {activeTab === "house" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Income / Loss from House Property
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rental receipts or interest on borrowed housing loan (Section 24b).
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Rental Income Received
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={houseFact?.amount ? houseFact.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateIncomeAmount("rent", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <label className="text-slate-700 dark:text-slate-300">
                            Interest on Housing Loan (Section 24b)
                          </label>
                          <span className="text-slate-400 font-mono">Max: ₹2,00,000</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={claim24B?.amount ? claim24B.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateClaimByKey("24B", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Capital Gains */}
                {activeTab === "capital" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Capital Gains (Securities & Assets)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Short & Long Term Capital Gains as reported by brokers or AIS.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Capital Gains Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={capitalGainsFact?.amount ? capitalGainsFact.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateCapitalGains(val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Special rates apply u/s 111A (STCG 20%) or s.112A (LTCG 12.5% above ₹1.25 Lakh).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Other Sources */}
                {activeTab === "other" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Income from Other Sources (Section 56)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Savings interest, fixed deposits, and dividends as per AIS.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Interest from Bank Accounts & Deposits
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={interestFact?.amount ? interestFact.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateIncomeAmount("interest", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Dividend Income
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={dividendFact?.amount ? dividendFact.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateIncomeAmount("dividend", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Other Taxable Receipts
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={otherFact?.amount ? otherFact.amount : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateIncomeAmount("other", val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 6: TDS */}
                {activeTab === "tds" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Tax Deducted at Source (TDS) / Advance Tax
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total taxes already paid according to Form 26AS.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Total TDS Credits Claimed
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={tdsTotal ? tdsTotal : ""}
                          onChange={(e) =>
                            handleNumberChange(e.target.value, (val) =>
                              updateTdsAmount(val)
                            )
                          }
                          className="w-full p-3 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Sticky Real-Time Computation & Remarks (5 cols) */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
                {/* Live Regime Comparison Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-teal-600" />
                      <span>Live Tax Impact Analysis</span>
                    </h4>
                    <span className="text-[10px] font-mono uppercase bg-teal-500/10 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md font-bold">
                      Real-Time
                    </span>
                  </div>

                  {/* Tax Delta Gain Callout */}
                  {caDelta > 0 && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1 animate-in fade-in duration-200">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                        CA Value Optimization
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Your adjustments unlock{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-extrabold">
                          +{formatMoney(caDelta, lang)}
                        </strong>{" "}
                        in extra refund for this taxpayer!
                      </p>
                    </div>
                  )}

                  {/* Regime Toggle */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      CA Recommended Regime
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecommendedRegime("old")}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          recommendedRegime === "old"
                            ? "bg-teal-900 text-white border-teal-700 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span className="block text-xs font-bold">Old Regime</span>
                        <span className="text-[10px] opacity-80">With Exemptions</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommendedRegime("new")}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          recommendedRegime === "new"
                            ? "bg-teal-900 text-white border-teal-700 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span className="block text-xs font-bold">New Regime</span>
                        <span className="text-[10px] opacity-80">Default Slabs</span>
                      </button>
                    </div>
                  </div>

                  {/* Computation Breakdown Table */}
                  <div className="space-y-2 font-mono text-xs border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-950/60">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Gross Total Income:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(caBreakdown?.grossIncome || 0, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Standard Deduction:</span>
                      <span className="text-slate-900 dark:text-white">
                        -{formatMoney(caBreakdown?.standardDeduction || 0, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Chapter VI-A Claims:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        -{formatMoney(caBreakdown?.totalDeductions || 0, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1.5 font-bold">
                      <span>Taxable Income:</span>
                      <span className="text-slate-900 dark:text-white">
                        {formatMoney(caBreakdown?.taxableIncome || 0, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Gross Tax Liability:</span>
                      <span className="text-slate-900 dark:text-white">
                        {formatMoney(caBreakdown?.totalTax || 0, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>TDS / Advance Tax:</span>
                      <span className="text-teal-700 dark:text-teal-400 font-bold">
                        {formatMoney(caBreakdown?.tdsCredits || 0, lang)}
                      </span>
                    </div>

                    <div className="border-t-2 border-slate-300 dark:border-slate-700 pt-2 flex justify-between items-baseline text-sm font-bold">
                      <span className="font-sans">
                        {caBreakdown?.refundOrDue && caBreakdown.refundOrDue >= 0
                          ? "Net Refund Due:"
                          : "Net Tax Payable:"}
                      </span>
                      <span
                        className={`text-base font-extrabold ${
                          caBreakdown?.refundOrDue && caBreakdown.refundOrDue >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatMoney(Math.abs(caBreakdown?.refundOrDue || 0), lang)}
                      </span>
                    </div>
                  </div>

                  {/* CA Remarks & Advisory Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      CA Advisory Remarks & Explanations
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Explain adjustments made (e.g. Added ₹50k NPS 80CCD claim, recommended Old Regime to maximize refund)..."
                      value={caNotes}
                      onChange={(e) => setCaNotes(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />

                    {/* Quick remark insertion chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "+ Claimed 80CCD(1B) NPS ₹50k",
                        "+ Applied Section 10 HRA",
                        "+ Reconciled with 26AS",
                        "+ Recommended Old Regime",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setCaNotes((prev) => (prev ? `${prev} ${chip}` : chip))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={isSaving}
                    className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-300" />
                        <span>Saved & Transmitted to Client!</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>{isSaving ? "Saving..." : "Save & Return to Taxpayer"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CAPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-sm">Loading CA Portal...</div>}>
      <CAPortalContent />
    </Suspense>
  );
}
