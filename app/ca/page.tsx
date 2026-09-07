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
  LogOut,
} from "lucide-react";
import type { Persona, Lang, IncomeFact, Claim, TaxAlreadyPaid } from "@/lib/types";
import { formatAmount, formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import {
  fetchReviewRecord,
  verifyPin,
  submitCAReview,
  createDemoReview,
  type CAReviewRecord,
  type CADetails,
} from "@/lib/ca/ca-store";
import {
  listDraftsForCA,
  getActiveCASession,
  clearCASession,
  type RegisteredCA,
} from "@/lib/ca/ca-registry";
import { PERSONAS } from "@/lib/personas";
import LanguageMenu from "@/components/ui/language-menu";
import { Munshi, MunshiAvatar } from "@/components/brand/munshi";

const REVIEW_STEPS = ["Income", "Deductions", "Regime", "Notes & send"] as const;
const SHEET_COLS = "grid grid-cols-[minmax(0,1fr)_92px_112px_136px_96px] gap-3";

type WorksheetRow = {
  key: string;
  line: string;
  section: string;
  filed: number;
  revised: number;
  onChange: (value: number) => void;
};

/** One handoff worksheet: Line · Section · Client filed · CA revised · Δ, with a totals row. */
function Worksheet({
  title,
  meta,
  rows,
  totalLabel,
  total,
  totalTone = "text-ink",
  note,
  lang,
  onInput,
}: {
  title: string;
  meta: string;
  rows: WorksheetRow[];
  totalLabel: string;
  total: number;
  totalTone?: string;
  note?: React.ReactNode;
  lang: Lang;
  onInput: (raw: string, setter: (value: number) => void) => void;
}) {
  return (
    <section className="glass rounded-[24px] px-[22px] py-[18px]">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h4 className="text-[15px] font-extrabold text-ink">{title}</h4>
        <span className="text-[11px] text-ink-3">{meta}</span>
      </header>
      <div className="mt-3 md:overflow-x-auto">
        <div className="md:min-w-[560px]">
          <div className={`${SHEET_COLS} max-md:hidden pb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-3`}>
            <span>Line</span>
            <span>Section</span>
            <span>Client filed</span>
            <span>CA revised</span>
            <span>Δ</span>
          </div>
          {rows.map((row) => {
            const delta = row.revised - row.filed;
            const blank = row.filed === 0 && row.revised === 0;
            return (
              <React.Fragment key={row.key}>
              {/* Phones (M8c): line + section pill, then "Client · value" against a 130 px editable CA input. */}
              <div className="md:hidden py-2.5 border-b border-dashed border-glass-edge last:border-b-0">
                <div className="flex items-center justify-between gap-2 text-[13.5px]">
                  <span className={`font-semibold ${blank ? "text-ink-3" : "text-ink"}`}>{row.line}</span>
                  <span className="glass-flat inline-flex shrink-0 rounded-full px-[11px] py-1 font-mono text-[12px] font-medium tracking-[.04em] text-ink-3">{row.section}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className="text-[12px] text-ink-3">
                    Client <span className="font-mono tabular-nums">{formatAmount(row.filed, lang)}</span>
                    {delta !== 0 && <span className={`ms-2 font-mono tabular-nums font-bold ${delta > 0 ? "text-ok-ink" : "text-warn"}`}>{delta > 0 ? "+" : "−"}{formatAmount(Math.abs(delta), lang)}</span>}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    aria-label={`${row.line} — CA revised`}
                    value={row.revised ? row.revised : ""}
                    onChange={(e) => onInput(e.target.value, row.onChange)}
                    className={`h-[34px] w-[130px] rounded-[14px] border-[1.5px] px-3 text-end font-mono text-[13px] font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-money/40 ${
                      delta !== 0 ? "bg-ok-soft border-ok text-ok-ink" : "bg-white/80 dark:bg-white/10 border-glass-edge text-ink"
                    }`}
                  />
                </div>
              </div>
              <div
                className={`${SHEET_COLS} max-md:hidden items-center py-2.5 border-b border-dashed border-glass-edge last:border-b-0`}
              >
                <span className={`text-[13.5px] font-semibold ${blank ? "text-ink-3" : "text-ink"}`}>{row.line}</span>
                <span>
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-white/55 dark:bg-white/10 border border-glass-edge text-[11px] font-bold text-ink-2">
                    {row.section}
                  </span>
                </span>
                <span className="font-mono text-[13px] tabular-nums text-ink-3">{formatAmount(row.filed, lang)}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  aria-label={`${row.line} — CA revised`}
                  value={row.revised ? row.revised : ""}
                  onChange={(e) => onInput(e.target.value, row.onChange)}
                  className={`h-9 w-full rounded-[14px] border-[1.5px] px-3 font-mono text-[13px] font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-money/40 ${
                    delta !== 0 ? "bg-ok-soft border-ok text-ok-ink" : "bg-white/80 dark:bg-white/10 border-glass-edge text-ink"
                  }`}
                />
                <span>
                  {delta === 0 ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11.5px] font-bold tabular-nums ${
                        delta > 0 ? "bg-ok-soft text-ok-ink" : "bg-warn-soft text-warn"
                      }`}
                    >
                      {delta > 0 ? "+" : "−"}
                      {formatAmount(Math.abs(delta), lang)}
                    </span>
                  )}
                </span>
              </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <footer className="mt-3 pt-3 border-t border-glass-edge flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">{note}</div>
        <div className="flex items-baseline gap-3 ms-auto">
          <span className="text-[13px] font-extrabold text-ink">{totalLabel}</span>
          <span className={`font-mono text-[16px] font-extrabold tabular-nums ${totalTone}`}>{formatMoney(total, lang)}</span>
        </div>
      </footer>
    </section>
  );
}

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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active Registered CA Session and incoming draft queue
  const [activeCa, setActiveCa] = useState<RegisteredCA | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<CAReviewRecord[]>([]);

  // UI preferences
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (urlCode && !code) setCode(urlCode);
  }, [urlCode, code]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("wapsi_theme");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
    document.body?.classList.toggle("dark", theme === "dark");
    document.body?.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("wapsi_theme", next);
  };

  useEffect(() => {
    const ca = getActiveCASession();
    if (ca) {
      setActiveCa(ca);
      setCaName(ca.name);
      setMembershipNo(ca.membershipNo);
      setFirmName(ca.firmName);
      setPendingDrafts(listDraftsForCA(ca.id));
    }
  }, []);

  const refreshDrafts = () => {
    if (activeCa) {
      setPendingDrafts(listDraftsForCA(activeCa.id));
    } else {
      setPendingDrafts(listDraftsForCA("ca_084920"));
    }
  };

  // Handle Login / Verification
  const handleVerify = async (e?: React.FormEvent, override?: { code: string; pin: string }) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setIsVerifying(true);
    const pinValue = (override?.pin ?? pin).trim();

    try {
      const cleanCode = (override?.code ?? code).toUpperCase().trim();
      if (!cleanCode) {
        setAuthError("Please enter the citizen's Access Code");
        setIsVerifying(false);
        return;
      }
      if (!pinValue) {
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

      const isValid = (activeCa && (rec.targetCaId === activeCa.id || !rec.targetCaId))
        ? true
        : await verifyPin(rec, pinValue);
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

  // The Citizen page's CA tab verified the code and PIN already and handed them over (read once).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wapsi_ca_handoff");
      if (!raw) return;
      sessionStorage.removeItem("wapsi_ca_handoff");
      const h = JSON.parse(raw) as { code?: string; pin?: string; name?: string; membershipNo?: string };
      if (!h.code || !h.pin) return;
      setCode(h.code);
      setPin(h.pin);
      if (h.name) setCaName(h.name);
      if (h.membershipNo) setMembershipNo(h.membershipNo);
      void handleVerify(undefined, { code: h.code, pin: h.pin });
    } catch {
      // no handoff: the login card below asks for the code and PIN
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const regimeBreakdowns = useMemo(() => {
    if (!caPersona) return null;
    return { new: computeForPersona(caPersona, "new"), old: computeForPersona(caPersona, "old") };
  }, [caPersona]);

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

  // What the client filed, for the "Client filed" column and the Δ pills.
  const original = record?.originalPersona;
  const filedFact = (kind: string) => original?.facts.find((f) => f.kind === kind);
  const filedAmount = (kind: string) => filedFact(kind)?.amount ?? 0;
  const filedClaim = (key: ClaimKey) => original?.claims.find((c) => isClaimMatch(c, key))?.amount ?? 0;
  const filedTds = original?.taxPaid.reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const withReporter = (line: string, kind: string) => {
    const reporter = filedFact(kind)?.provenance?.reporter;
    return reporter ? `${line} — ${reporter}` : line;
  };

  const incomeRows: WorksheetRow[] = [
    { key: "salary", line: withReporter("Salary", "salary"), section: "s.17", filed: filedAmount("salary"), revised: salaryFact?.amount ?? 0, onChange: (v) => updateIncomeAmount("salary", v) },
    { key: "interest", line: withReporter("Interest", "interest"), section: "s.56", filed: filedAmount("interest"), revised: interestFact?.amount ?? 0, onChange: (v) => updateIncomeAmount("interest", v) },
    { key: "dividend", line: withReporter("Dividends", "dividend"), section: "s.56", filed: filedAmount("dividend"), revised: dividendFact?.amount ?? 0, onChange: (v) => updateIncomeAmount("dividend", v) },
    { key: "capital_gains", line: withReporter("Sale of listed shares & assets", "capital_gains"), section: "s.111A / 112A", filed: filedAmount("capital_gains"), revised: capitalGainsFact?.amount ?? 0, onChange: updateCapitalGains },
    { key: "rent", line: "House property — rent received", section: "s.22", filed: filedAmount("rent"), revised: houseFact?.amount ?? 0, onChange: (v) => updateIncomeAmount("rent", v) },
    { key: "other", line: "Other taxable receipts", section: "s.56", filed: filedAmount("other"), revised: otherFact?.amount ?? 0, onChange: (v) => updateIncomeAmount("other", v) },
  ];
  const deductionRows: WorksheetRow[] = [
    { key: "80C", line: "Provident fund, LIC, ELSS, tuition", section: "80C", filed: filedClaim("80C"), revised: claim80C?.amount ?? 0, onChange: (v) => updateClaimByKey("80C", v) },
    { key: "80D_SELF", line: "Health cover — self & family", section: "80D", filed: filedClaim("80D_SELF"), revised: claim80DSelf?.amount ?? 0, onChange: (v) => updateClaimByKey("80D_SELF", v) },
    { key: "80D_PARENTS", line: "Health cover — parents", section: "80D", filed: filedClaim("80D_PARENTS"), revised: claim80DParents?.amount ?? 0, onChange: (v) => updateClaimByKey("80D_PARENTS", v) },
    { key: "80CCD", line: "NPS Tier-I additional", section: "80CCD(1B)", filed: filedClaim("80CCD"), revised: claim80CCD?.amount ?? 0, onChange: (v) => updateClaimByKey("80CCD", v) },
    { key: "HRA", line: "HRA exemption", section: "10(13A)", filed: filedClaim("HRA"), revised: claimHRA?.amount ?? 0, onChange: (v) => updateClaimByKey("HRA", v) },
    { key: "24B", line: "Home loan interest", section: "24(b)", filed: filedClaim("24B"), revised: claim24B?.amount ?? 0, onChange: (v) => updateClaimByKey("24B", v) },
  ];
  const taxPaidRows: WorksheetRow[] = [
    { key: "tds", line: "TDS / advance tax — Form 26AS", section: "s.192", filed: filedTds, revised: tdsTotal, onChange: updateTdsAmount },
  ];

  const firstName = record?.citizenName.split(" ")[0] ?? "the client";
  const initials = (record?.citizenName ?? "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const addedDeductions = deductionRows.filter((r) => r.revised > r.filed).map((r) => r.line);
  const munshiNote =
    addedDeductions.length === 0
      ? `Munshi ji: nothing added yet — the claims stand as ${firstName} filed them.`
      : `Munshi ji: ${addedDeductions.length === 1 ? addedDeductions[0] : `${addedDeductions.slice(0, -1).join(", ")} and ${addedDeductions[addedDeductions.length - 1]}`} ${addedDeductions.length === 1 ? "was the one" : "were the ones"} ${firstName} missed.`;
  const currentStep = caNotes.trim() ? 3 : 2;
  const positionText = (n: number) =>
    n < 0 ? `−${formatMoney(-n, lang)} due` : n > 0 ? `${formatMoney(n, lang)} refund` : `${formatMoney(0, lang)} due`;
  const positionTone = (n: number) => (n < 0 ? "text-bad" : n > 0 ? "text-ok-ink" : "text-ink");
  const regimeName = (r: "new" | "old") => (r === "new" ? "New" : "Old");
  const cheaperRegime: "new" | "old" =
    regimeBreakdowns && regimeBreakdowns.new.totalTax <= regimeBreakdowns.old.totalTax ? "new" : "old";
  const regimeSavings = regimeBreakdowns ? Math.abs(regimeBreakdowns.new.totalTax - regimeBreakdowns.old.totalTax) : 0;
  const auditTrail = [
    { at: "PIN", text: "Opened review · PIN verified" },
    ...[...incomeRows, ...deductionRows, ...taxPaidRows]
      .filter((r) => r.revised !== r.filed)
      .map((r) => ({ at: r.section, text: `${r.line} ${formatAmount(r.filed, lang)} → ${formatAmount(r.revised, lang)}` })),
    ...(record && recommendedRegime !== record.originalRegime ? [{ at: "Regime", text: `Regime → ${regimeName(recommendedRegime)}` }] : []),
  ];

  return (
    <div className="min-h-screen text-ink flex flex-col font-sans selection:bg-money selection:text-white">
      {/* Top Professional Header Bar */}
      <header className="border-b border-glass-edge bg-paper/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <MunshiAvatar size={38} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-ink-2">
                    Wapsi Professional
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-bg text-money text-[10px] font-mono font-bold uppercase tracking-wider border border-money/40">
                    CA Audit Portal
                  </span>
                </div>
                <p className="text-[11px] text-ink-3">
                  Assessment Year 2026-27 (FY 2025-26) · ICAI Standards
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {activeCa && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-bg border border-money/30 text-xs">
                <Award size={14} className="text-money" />
                <span className="font-bold text-ink truncate max-w-[140px]">{activeCa.name}</span>
                <span className="text-ink-3 font-mono text-[11px]">#{activeCa.membershipNo}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearCASession();
                    setActiveCa(null);
                    setRecord(null);
                  }}
                  title="Sign out of CA account"
                  className="ml-1 text-ink-3 hover:text-alarm cursor-pointer p-0.5"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
            <LanguageMenu lang={lang} onChange={setLang} label="Language" />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-paper-3 border border-line text-ink-2 hover:text-ink-2 transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              href="/"
              className="hidden sm:inline-flex text-xs font-bold text-ink-2 hover:text-money transition"
            >
              Return to Citizen Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!record ? (
          /* Login Screen (handoff 1c / m8b) */
          <div className="mx-auto w-full max-w-[560px] py-4 sm:py-10 animate-in fade-in zoom-in-95 duration-200 max-md:pb-28">
            <div className="glass rounded-[28px] px-5 py-6 sm:px-7 sm:py-7 flex flex-col gap-[18px]">
              <div className="flex items-start gap-3.5">
                <Munshi size={56} state={authError ? "concerned" : isVerifying ? "working" : "secure"} />
                <div className="min-w-0">
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Open a client's return</h2>
                  <p className="mt-1 text-[13.5px] text-ink-2 leading-[1.55]">
                    Enter the Access Code and secret PIN your client shared to inspect and optimise their draft.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-[18px]">
                <div>
                  <label htmlFor="ca-page-code" className="block text-[12.5px] font-bold text-ink-2 mb-1.5">Client review code</label>
                  <input
                    id="ca-page-code"
                    type="text"
                    placeholder="CA-7842-91"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-[54px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-center font-mono text-[20px] font-semibold uppercase tracking-[.14em] text-ink outline-none focus:border-money focus:shadow-[0_0_0_3px_rgba(255,122,26,.18)]"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="ca-page-pin" className="block text-[12.5px] font-bold text-ink-2 mb-1.5">Taxpayer security PIN</label>
                  <input
                    id="ca-page-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full h-[54px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-center font-mono text-[20px] font-semibold tracking-[.14em] text-ink outline-none focus:border-money focus:shadow-[0_0_0_3px_rgba(255,122,26,.18)]"
                  />
                </div>

                <div>
                  <span className="block text-[12px] font-bold uppercase tracking-[.08em] text-ink-3">Your stamp (optional)</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="CA Rajesh Sharma, FCA"
                      aria-label="CA name"
                      value={caName}
                      onChange={(e) => setCaName(e.target.value)}
                      className="h-[42px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-[13.5px] text-ink outline-none focus:border-money"
                    />
                    <input
                      type="text"
                      placeholder="084920"
                      aria-label="ICAI membership number"
                      value={membershipNo}
                      onChange={(e) => setMembershipNo(e.target.value)}
                      className="h-[42px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-center font-mono text-[13.5px] font-semibold uppercase tracking-[.14em] text-ink outline-none focus:border-money"
                    />
                  </div>
                </div>

                {authError && (
                  <p role="alert" className="flex items-center gap-2 rounded-[14px] bg-bad-soft px-3.5 py-3 text-[13px] font-semibold text-bad">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}

                <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]">
                  <button
                    type="submit"
                    disabled={isVerifying || !code.trim() || !pin.trim()}
                    className="btn-primary flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Lock size={16} />
                    <span>{isVerifying ? "Checking the code…" : "Open client return →"}</span>
                  </button>
                </div>

                <p className="text-center text-[13px] text-ink-3">
                  No code?{" "}
                  <button type="button" onClick={handleLaunchDemo} disabled={isVerifying} className="font-bold text-money hover:underline cursor-pointer disabled:opacity-60">
                    Load a demo review
                  </button>
                </p>
              </form>

              <div className="flex items-center justify-between font-mono text-[11px] text-ink-3">
                <span className="flex items-center gap-1.5 text-ok">
                  <Lock size={12} />
                  <span>Bank-grade encryption</span>
                </span>
                <span>Authorised users only</span>
              </div>
            </div>

            {/* Registered CA: Incoming Client Review Drafts Tray */}
            {pendingDrafts.length > 0 && (
              <div className="mt-6 glass rounded-[24px] p-5 border border-glass-edge animate-in fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-money animate-ping" />
                    <h3 className="text-[14px] font-extrabold text-ink">
                      Incoming Client Review Drafts ({pendingDrafts.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={refreshDrafts}
                    className="text-[11px] font-bold text-money hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-[12px] text-ink-2 mb-3">
                  These taxpayers requested an audit and saved their return draft for review. Click any draft to auto-populate credentials.
                </p>

                <div className="space-y-2">
                  {pendingDrafts.map((draft) => (
                    <div
                      key={draft.code}
                      onClick={() => {
                        setCode(draft.code);
                        setPin("2468"); // Default PIN for demo draft or prompt CA
                      }}
                      className="p-3 bg-paper-2 hover:bg-amber-bg border border-line hover:border-money/40 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[13px] text-ink">{draft.citizenName}</span>
                          <span className="font-mono text-[11px] text-ink-3">({draft.citizenPan})</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-bg text-money border border-money/30">
                            {draft.code}
                          </span>
                        </div>
                        {draft.clientNotes && (
                          <p className="text-[11px] text-ink-2 mt-1 italic">
                            "{draft.clientNotes}"
                          </p>
                        )}
                        <span className="text-[10.5px] text-ink-3 block mt-0.5">
                          Received {new Date(draft.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-money hover:underline shrink-0">
                        Review Draft →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CA Audit Workspace */
          <div className="space-y-6 animate-in fade-in duration-300 max-md:pb-24">
            {/* Sticky client strip: who, PIN state, before → after, save. */}
            <div className="sticky top-[64px] z-30 rounded-[20px] bg-paper/90 backdrop-blur-xl border border-glass-edge shadow-glass px-5 py-3.5 flex flex-wrap items-center gap-4 max-md:static max-md:px-4 max-md:py-3 max-md:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-[14px] ink-surface text-white grid place-items-center font-extrabold text-sm shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-extrabold text-ink">{record.citizenName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/55 dark:bg-white/10 border border-glass-edge font-mono text-[11px] font-bold text-ink-2 tracking-wider">
                      {record.citizenPan}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-ok-soft text-ok-ink text-[10.5px] font-bold">
                      Client PIN verified
                    </span>
                  </div>
                  <p className="text-[11.5px] text-ink-3 mt-0.5">
                    AY {record.assessmentYear} · review code {record.code} · client chose the{" "}
                    {regimeName(record.originalRegime)} regime
                  </p>
                </div>
              </div>

              <div className="ms-auto flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-[14px] bg-white/55 dark:bg-white/10 border border-glass-edge px-3.5 py-2">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">Client filed</span>
                    <span className={`font-mono text-[14px] font-extrabold tabular-nums ${positionTone(originalBreakdown?.refundOrDue ?? 0)}`}>
                      {positionText(originalBreakdown?.refundOrDue ?? 0)}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-ink-3 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">After review</span>
                    <span className={`font-mono text-[14px] font-extrabold tabular-nums ${positionTone(caBreakdown?.refundOrDue ?? 0)}`}>
                      {positionText(caBreakdown?.refundOrDue ?? 0)}
                    </span>
                  </div>
                  {caDelta > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-ok-soft text-ok-ink text-[10.5px] font-bold tabular-nums">
                      +{formatMoney(caDelta, lang)} for {firstName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecord(null);
                    setPin("");
                  }}
                  className="h-10 px-4 rounded-[14px] border border-glass-edge bg-white/55 dark:bg-white/10 text-[13px] font-bold text-ink hover:border-money/50 transition cursor-pointer"
                >
                  Exit review
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={isSaving}
                  className="btn-primary h-10 px-4 rounded-[14px] text-[13px] flex items-center gap-2 cursor-pointer disabled:opacity-60 max-md:hidden"
                >
                  {saveSuccess ? (
                    <>
                      <Check size={14} />
                      <span>Sent to {firstName}</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{isSaving ? "Sending…" : "Send review to client"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-[22px] items-start">
              {/* Worksheets */}
              <div className="space-y-4 min-w-0">
                <div className="inline-flex flex-wrap gap-1 p-1 rounded-[14px] glass-flat">
                  {REVIEW_STEPS.map((label, i) => {
                    const state = i < currentStep ? "done" : i === currentStep ? "current" : "pending";
                    return (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-2 h-8 px-3 rounded-[10px] text-[12.5px] font-bold ${
                          state === "done" ? "ink-surface text-white" : state === "current" ? "bg-amber-bg text-amber-ink" : "text-ink-3"
                        }`}
                      >
                        <span
                          className={`size-[18px] rounded-full grid place-items-center text-[10px] font-extrabold ${
                            state === "done" ? "bg-ok text-white" : state === "current" ? "bg-money text-white" : "border border-current"
                          }`}
                        >
                          {state === "done" ? "✓" : i + 1}
                        </span>
                        {label}
                      </span>
                    );
                  })}
                </div>

                <Worksheet
                  title="Income"
                  meta="from AIS / Form 16 · editable"
                  rows={incomeRows}
                  totalLabel="Gross total income"
                  total={caBreakdown?.grossIncome || 0}
                  lang={lang}
                  onInput={handleNumberChange}
                />

                <Worksheet
                  title="Deductions"
                  meta={`Chapter VI-A · ${recommendedRegime === "old" ? "CA-added rows highlighted" : "no effect under the new regime"}`}
                  rows={deductionRows}
                  totalLabel="Total deductions"
                  total={caBreakdown?.totalDeductions || 0}
                  totalTone="text-ok-ink"
                  lang={lang}
                  onInput={handleNumberChange}
                  note={
                    <span className="flex items-center gap-2 text-[15px] text-ink-2 pencil">
                      <MunshiAvatar size={24} />
                      <span>{munshiNote}</span>
                    </span>
                  }
                />

                <Worksheet
                  title="Taxes already paid"
                  meta="Form 26AS · TDS and advance tax"
                  rows={taxPaidRows}
                  totalLabel="Credit against tax"
                  total={caBreakdown?.tdsCredits || 0}
                  lang={lang}
                  onInput={handleNumberChange}
                />

                {/* Notes to the client */}
                <section className="glass rounded-[24px] px-[22px] py-[18px] space-y-3">
                  <header className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h4 className="text-[15px] font-extrabold text-ink">Notes to the client</h4>
                    <span className="text-[11px] text-ink-3">
                      visible to {firstName} · logged against membership {membershipNo}
                    </span>
                  </header>
                  <textarea
                    value={caNotes}
                    onChange={(e) => setCaNotes(e.target.value)}
                    placeholder={`What you changed and why — ${firstName} reads this word for word.`}
                    className="w-full min-h-[84px] rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge p-3 text-[13px] text-ink focus:ring-2 focus:ring-money/40 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[11.5px] text-ink-3">
                      Stamp: {caName} · {firmName}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Receipts checked", "No new income found", "Reconciled with 26AS", `Recommend the ${regimeName(recommendedRegime).toLowerCase()} regime`].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setCaNotes((prev) => (prev ? `${prev} ${chip}.` : `${chip}.`))}
                          className="px-2.5 py-1 rounded-full bg-white/55 dark:bg-white/10 border border-glass-edge hover:border-money/50 text-[11px] font-bold text-ink-2 transition cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Sticky rail */}
              <aside className="space-y-4 lg:sticky lg:top-[148px]">
                {/* Phones (M8c): Send review pinned above the home indicator. */}
                <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]">
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={isSaving}
                    className="btn-primary md:hidden h-[50px] w-full rounded-[14px] text-[14.5px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {saveSuccess ? <Check size={16} /> : <Save size={16} />}
                    <span>{saveSuccess ? `Sent to ${firstName}` : isSaving ? "Sending…" : "Send review to client"}</span>
                  </button>
                </div>
                <div className="ink-surface rounded-[24px] p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-soft">Recommend a regime</span>
                  <div className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-[12px] bg-white/10">
                    {(["new", "old"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRecommendedRegime(r)}
                        className={`h-8 rounded-[9px] text-[12.5px] font-bold transition cursor-pointer ${
                          recommendedRegime === r ? "bg-money text-white" : "text-white/75 hover:text-white"
                        }`}
                      >
                        {regimeName(r)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {(["new", "old"] as const).map((r) => (
                      <div
                        key={r}
                        className={`rounded-[14px] p-3 border ${
                          cheaperRegime === r ? "border-money bg-white/[0.16]" : "border-white/10 bg-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 min-h-5">
                          <span className="text-[11.5px] font-bold">{regimeName(r)}</span>
                          {cheaperRegime === r && regimeSavings > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-bg text-amber-ink text-[10px] font-extrabold tabular-nums whitespace-nowrap">
                              Saves {formatMoney(regimeSavings, lang)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[18px] font-extrabold tabular-nums">
                          {formatMoney(regimeBreakdowns?.[r].totalTax || 0, lang)}
                        </div>
                        <div className="text-[10.5px] text-white/60">tax</div>
                      </div>
                    ))}
                  </div>
                  <dl className="mt-4 space-y-1.5 text-[12.5px]">
                    {[
                      [`Taxable income (${regimeName(recommendedRegime).toLowerCase()})`, caBreakdown?.taxableIncome || 0],
                      ["Total tax", caBreakdown?.totalTax || 0],
                      ["TDS already paid", caBreakdown?.tdsCredits || 0],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="flex justify-between gap-3 text-white/80">
                        <dt>{label}</dt>
                        <dd className="font-mono font-bold tabular-nums text-white">{formatMoney(Number(value), lang)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-bold text-white/80">
                      {(caBreakdown?.refundOrDue ?? 0) < 0 ? "Balance due" : "Refund due"}
                    </span>
                    <span className="font-mono text-[22px] font-extrabold tabular-nums text-[#5EE6B0]">
                      {formatMoney(Math.abs(caBreakdown?.refundOrDue || 0), lang)}
                    </span>
                  </div>
                </div>

                <div className="glass rounded-[24px] p-5">
                  <h4 className="text-[15px] font-extrabold text-ink">Client vs CA</h4>
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_96px_96px] gap-y-2 gap-x-2 text-[12.5px]">
                    <span />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3 text-end">Client</span>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3 text-end">CA</span>
                    {(
                      [
                        ["Regime", regimeName(record.originalRegime), regimeName(recommendedRegime)],
                        ["Deductions", formatMoney(originalBreakdown?.totalDeductions || 0, lang), formatMoney(caBreakdown?.totalDeductions || 0, lang)],
                        ["Tax", formatMoney(originalBreakdown?.totalTax || 0, lang), formatMoney(caBreakdown?.totalTax || 0, lang)],
                        ["Due / refund", positionText(originalBreakdown?.refundOrDue ?? 0), positionText(caBreakdown?.refundOrDue ?? 0)],
                      ] as const
                    ).map(([label, client, ca]) => (
                      <React.Fragment key={label}>
                        <span className="text-ink-2">{label}</span>
                        <span className="font-mono tabular-nums text-ink-3 text-end">{client}</span>
                        <span className="font-mono tabular-nums font-bold text-ok-ink text-end">{ca}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-[24px] p-5">
                  <h4 className="text-[15px] font-extrabold text-ink">Audit trail</h4>
                  <ul className="mt-3 space-y-1.5">
                    {auditTrail.map((entry, i) => (
                      <li key={`${entry.at}-${i}`} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 text-[12.5px] text-ink-2">
                        <span className="font-mono text-[11px] text-ink-3 truncate">{entry.at}</span>
                        <span>{entry.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="glass rounded-[24px] p-5 text-[12px] text-ink-2">
                  Client documents are read-only here. Every change is logged against your membership number.
                </p>
              </aside>
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
