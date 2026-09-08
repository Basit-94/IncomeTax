"use client";

/**
 * "This year's papers" — the Manual shell's primary document intake card (facts step).
 * Supports:
 *  1. Government DigiLocker fetch
 *  2. Dual document ingestion: Form 16 (Salary/TDS) and AIS/TIS (Interest/Financial transactions)
 *  3. Adaptive UI: Shows what is already on record and asks ONLY for missing documents
 *  4. Smart Companion Document Matching:
 *     - If Anthony D'Souza Form 16 is uploaded, suggests ONLY Anthony D'Souza AIS.
 *     - If Faheem Ahmed Form 16 is uploaded, suggests ONLY Faheem Ahmed AIS.
 *     - If another citizen (Priya Sharma, Arjun Mehta, custom user) is active, does NOT show mismatched sample names.
 *  5. Direct Inline Manual Income Entry (Bank Interest / Salary):
 *     - As soon as the citizen enters their interest or salary, it satisfies the requirement and DOES NOT ask anymore.
 */

import { useState, useRef, type ReactNode } from "react";
import { CheckCircle2, ShieldCheck, FileText, ArrowRight, Loader2, FileUp, Sparkles, X } from "lucide-react";
import type { ExtractedFields } from "../../lib/compliance/pdfExtract";
import { formatMoney } from "../../lib/money";
import type { Lang } from "../../lib/types";
import { MunshiAvatar } from "../brand/munshi";
import { localize } from "../mock-i18n";
import DigiLockerModal from "../digilocker/digilocker-modal";
import type { IngestedDocument } from "../../context/TaxReturnContext";
import { detectDocumentKind, extractFieldsFromPdf, isEmptyExtraction } from "../../lib/compliance/pdfExtract";

export interface FetchedDocument {
  id: string | null;
  docType: "FORM_16" | "ANNUAL_INFO_STATEMENT" | string;
  title: string;
  issuer: string;
  sample: boolean;
  fields: ExtractedFields;
}

interface YearPapersCardProps {
  lang: Lang;
  assessmentYear: string;
  /** The profile linked DigiLocker at onboarding — the fetch is offered first and as one tap. */
  linked: boolean;
  /** Already fetched this year: the card shows what was read instead of offering the fetch again. */
  fetched?: FetchedDocument[];
  onFetched: (documents: FetchedDocument[]) => void;
  children?: ReactNode;
  hasForm16?: boolean;
  hasAIS?: boolean;
  form16Doc?: IngestedDocument | null;
  aisDoc?: IngestedDocument | null;
  citizenName?: string;
  citizenPan?: string;
  onIngestDocument?: (doc: IngestedDocument) => void;
  onRemoveDocument?: (kind: "FORM_16" | "AIS") => void;
  onDeclareIncome?: (item: { kind: "salary" | "interest"; amount: number; label: string }) => void;
  onEnterManually?: (target?: "salary" | "interest") => void;
}

export function detectPersonKey(
  citizenName?: string,
  citizenPan?: string,
  form16Doc?: IngestedDocument | null,
  aisDoc?: IngestedDocument | null
): "anthony" | "faheem" | "other" {
  const texts = [
    citizenName || "",
    citizenPan || "",
    form16Doc?.fileName || "",
    form16Doc?.extracted?.name || "",
    form16Doc?.extracted?.pan || "",
    aisDoc?.fileName || "",
    aisDoc?.extracted?.name || "",
    aisDoc?.extracted?.pan || "",
  ].join(" ").toLowerCase();

  if (texts.includes("anthony") || texts.includes("d'souza") || texts.includes("abcpd1982k")) {
    return "anthony";
  }
  if (texts.includes("faheem") || texts.includes("ahmed")) {
    return "faheem";
  }
  return "other";
}

export default function YearPapersCard({
  lang,
  assessmentYear,
  linked,
  fetched,
  onFetched,
  children,
  hasForm16 = false,
  hasAIS = false,
  form16Doc,
  aisDoc,
  citizenName,
  citizenPan,
  onIngestDocument,
  onRemoveDocument,
  onDeclareIncome,
  onEnterManually,
}: YearPapersCardProps) {
  const [phase, setPhase] = useState<"idle" | "consent" | "fetching" | "error">("idle");
  const [isLockerModalOpen, setIsLockerModalOpen] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [activeUploadKind, setActiveUploadKind] = useState<"FORM_16" | "AIS" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Direct inline manual income declaration state
  const [manualInterestInput, setManualInterestInput] = useState("");
  const [manualSalaryInput, setManualSalaryInput] = useState("");
  const [manualEmployerInput, setManualEmployerInput] = useState("");
  const [showInlineManual, setShowInlineManual] = useState(false);

  const form16InputRef = useRef<HTMLInputElement>(null);
  const aisInputRef = useRef<HTMLInputElement>(null);

  /** The catalogue being pulled, ticking off as each document arrives. */
  const [pulling, setPulling] = useState<{ title: string; done: boolean }[]>([]);
  const fy = `${Number(assessmentYear.slice(0, 4)) - 1}-${String(Number(assessmentYear.slice(5)) - 1).padStart(2, "0")}`;
  const L = (s: string) => localize(s, lang);

  const personKey = detectPersonKey(citizenName, citizenPan, form16Doc, aisDoc);

  const fetchNow = async () => {
    setPhase("fetching");
    try {
      const cat = await fetch(`/api/digilocker/documents?assessmentYear=${assessmentYear}&scope=year`, { credentials: "same-origin" });
      const catalogue = cat.ok ? ((await cat.json()) as { documents: { title: string }[] }).documents : [];
      setPulling(catalogue.map((d) => ({ title: d.title, done: false })));
      const res = await fetch("/api/digilocker", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessmentYear, scope: "year" }) });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { ok: boolean; documents: FetchedDocument[] };
      for (let i = 0; i < Math.max(catalogue.length, 1); i += 1) {
        await new Promise((r) => setTimeout(r, 450));
        setPulling((list) => list.map((d, idx) => (idx === i ? { ...d, done: true } : d)));
      }
      onFetched(body.documents);
      setPhase("idle");
    } catch {
      setPhase("error");
    }
  };

  const handleFileUpload = async (file: File, explicitKind?: "FORM_16" | "AIS") => {
    setUploadError(null);
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf");
    if (!isPdf) {
      setUploadError(L("Please upload a valid PDF file."));
      return;
    }

    try {
      setActiveUploadKind(explicitKind || "FORM_16");
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const extracted = await extractFieldsFromPdf(bytes);
      const detected = detectDocumentKind(bytes, file.name);
      const kind = explicitKind || detected;

      await new Promise((r) => setTimeout(r, 600));

      if (isEmptyExtraction(extracted)) {
        setUploadError(L("No figures could be extracted from this PDF. Please verify the document."));
        return;
      }

      const doc: IngestedDocument = {
        fileName: file.name,
        kind,
        ingestedAt: new Date().toISOString(),
        extracted,
      };

      onIngestDocument?.(doc);
    } catch {
      setUploadError(L("Error reading file. The PDF may be password-protected or unsupported."));
    } finally {
      setActiveUploadKind(null);
    }
  };

  const handleLoadSample = async (fileName: string, targetKind: "FORM_16" | "AIS") => {
    setUploadError(null);
    setLoadingSample(fileName);
    try {
      const res = await fetch(`/api/sample-docs?file=${encodeURIComponent(fileName)}`);
      if (!res.ok) throw new Error("Could not fetch sample document");
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const extracted = await extractFieldsFromPdf(bytes);
      const kind = targetKind;

      const doc: IngestedDocument = {
        fileName,
        kind,
        ingestedAt: new Date().toISOString(),
        extracted,
      };

      onIngestDocument?.(doc);
    } catch (err) {
      console.error("Failed to load sample:", err);
      setUploadError(L("Failed to load sample document."));
    } finally {
      setLoadingSample(null);
    }
  };

  const handleManualInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = Number(manualInterestInput.replace(/[^0-9]/g, ""));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      setUploadError(L("Please enter a valid interest amount (e.g. 15,000)."));
      return;
    }
    setUploadError(null);
    onDeclareIncome?.({
      kind: "interest",
      amount: cleanNum,
      label: "Savings & Deposit Interest (Self-Declared)",
    });
    setManualInterestInput("");
    setShowInlineManual(false);
  };

  const handleManualSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = Number(manualSalaryInput.replace(/[^0-9]/g, ""));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      setUploadError(L("Please enter a valid salary amount (e.g. 12,00,000)."));
      return;
    }
    setUploadError(null);
    onDeclareIncome?.({
      kind: "salary",
      amount: cleanNum,
      label: manualEmployerInput ? `Salary · ${manualEmployerInput}` : "Gross Annual Salary (Self-Declared)",
    });
    setManualSalaryInput("");
    setManualEmployerInput("");
    setShowInlineManual(false);
  };

  if (fetched?.length) {
    return (
      <div className="rounded-[24px] bg-ok-soft p-4 text-start space-y-2 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-ok text-white"><CheckCircle2 size={18} /></div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink">{L("This year's papers, read from DigiLocker")}</p>
            <p className="text-[11px] text-ink-2">{fetched.map((d) => d.title).join(" · ")}</p>
          </div>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2 text-[12px] text-ink-2">
          {fetched.flatMap((d) => {
            const f = d.fields;
            const rows: string[] = [];
            if (f.grossSalary !== undefined) rows.push(`${L("Salary")} · ${formatMoney(f.grossSalary, lang)}`);
            if (f.tds !== undefined) rows.push(`TDS · ${formatMoney(f.tds, lang)}`);
            for (const e of f.exemptAllowances ?? []) rows.push(`u/s ${e.section} · ${formatMoney(e.amount, lang)}`);
            for (const r of f.otherIncome ?? []) rows.push(`${r.reporter} · ${formatMoney(r.amount, lang)}`);
            if (f.ltcg112A) rows.push(`LTCG 112A · ${formatMoney(f.ltcg112A.gain, lang)}`);
            return rows;
          }).map((row) => <li key={row} className="font-mono tabular-nums truncate">{row}</li>)}
        </ul>
        {fetched.some((d) => d.sample) && <p className="text-[11px] text-ink-3">{L("Sample figures from the DigiLocker mock, not real records.")}</p>}
      </div>
    );
  }

  const bothComplete = hasForm16 && hasAIS;

  return (
    <div className="glass rounded-[24px] p-5 sm:p-6 space-y-5 border border-glass-edge">
      {/* Header with Munshi ji and intelligent context */}
      <div className="flex items-start gap-3.5">
        <span className="shrink-0"><MunshiAvatar size={38} state={phase === "fetching" || activeUploadKind || loadingSample ? "working" : "explaining"} /></span>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight font-serif">
              {L("This Year's Tax Papers")} (FY {fy})
            </h3>
            {hasForm16 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok px-2.5 py-0.5 rounded-full bg-ok-soft border border-ok/20">
                <CheckCircle2 size={12} /> Form 16 Active
              </span>
            )}
            {hasAIS && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok px-2.5 py-0.5 rounded-full bg-ok-soft border border-ok/20">
                <CheckCircle2 size={12} /> AIS / Interest Active
              </span>
            )}
            {!hasForm16 && !hasAIS && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-3 px-2 py-0.5 rounded-full bg-paper-2 border border-line">
                0 of 2 Documents
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
            {bothComplete
              ? L("Both your Form 16 and AIS / interest records are matched. Review your reconciled figures below in the statement.")
              : hasForm16 && !hasAIS
              ? L("Form 16 is recorded. Please provide your AIS / TIS statement below to reconcile interest & tax credits, or declare interest manually.")
              : hasAIS && !hasForm16
              ? L("AIS statement is recorded. Please provide your Form 16 below to reconcile salary & employer TDS, or declare salary manually.")
              : L("Provide both Form 16 (salary) and AIS / TIS (bank interest & taxes paid) to auto-fill your return, or fetch them directly from DigiLocker.")}
          </p>
        </div>
      </div>

      {/* Reconciled / Active Documents Badges */}
      {(hasForm16 || hasAIS) && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {hasForm16 && (
            <div className="p-3.5 rounded-[16px] bg-ok-soft/60 border border-ok/25 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-[10px] bg-ok text-white flex items-center justify-center font-bold text-xs shrink-0">
                  F16
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-ink truncate">
                    {form16Doc?.fileName || "Form 16 on Record"}
                  </p>
                  <p className="text-[11px] text-ink-2 font-mono truncate">
                    {form16Doc?.extracted.grossSalary ? `${formatMoney(form16Doc.extracted.grossSalary, lang)} Salary` : "Salary & TDS Imported"}
                    {form16Doc?.extracted.employerName && ` · ${form16Doc.extracted.employerName}`}
                  </p>
                </div>
              </div>
              {onRemoveDocument && (
                <button
                  type="button"
                  onClick={() => onRemoveDocument("FORM_16")}
                  className="text-[11px] font-semibold text-ink-3 hover:text-money underline cursor-pointer shrink-0"
                >
                  {L("Replace")}
                </button>
              )}
            </div>
          )}

          {hasAIS && (
            <div className="p-3.5 rounded-[16px] bg-ok-soft/60 border border-ok/25 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-[10px] bg-ok text-white flex items-center justify-center font-bold text-xs shrink-0">
                  AIS
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-ink truncate">
                    {aisDoc?.fileName || "AIS / Interest on Record"}
                  </p>
                  <p className="text-[11px] text-ink-2 font-mono truncate">
                    {aisDoc?.extracted.otherIncome?.[0]?.amount
                      ? `${formatMoney(aisDoc.extracted.otherIncome[0].amount, lang)} Interest`
                      : "Interest & Tax Credits Recorded"}
                  </p>
                </div>
              </div>
              {onRemoveDocument && (
                <button
                  type="button"
                  onClick={() => onRemoveDocument("AIS")}
                  className="text-[11px] font-semibold text-ink-3 hover:text-money underline cursor-pointer shrink-0"
                >
                  {L("Replace")}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {uploadError && (
        <div className="p-3 rounded-[14px] bg-alarm-soft border border-alarm/30 text-xs text-alarm flex items-center justify-between">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="cursor-pointer text-alarm hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pulling DigiLocker progress */}
      {phase === "fetching" ? (
        <ul className="rounded-[18px] bg-amber-bg p-4 space-y-1.5 text-[13px] text-amber-ink" role="status" aria-live="polite">
          <li className="font-semibold">{L("Pulling from Government DigiLocker…")}</li>
          {(pulling.length ? pulling : [{ title: `Form 16 — FY ${fy}`, done: false }, { title: `Annual Information Statement — FY ${fy}`, done: false }]).map((d) => (
            <li key={d.title} className="flex items-center gap-2">
              <span className={`inline-flex size-4 items-center justify-center rounded-full ${d.done ? "bg-ok text-white" : "border border-amber-ink/40 text-transparent"}`} aria-hidden="true">
                <CheckCircle2 size={10} />
              </span>
              <span className={d.done ? "" : "opacity-80"}>{d.title}</span>
            </li>
          ))}
        </ul>
      ) : !bothComplete ? (
        <div className="space-y-4">
          {/* Top Options Bar: DigiLocker */}
          <div className="rounded-[18px] border border-glass-edge bg-paper-2 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">{L("Government DigiLocker Auto-Fetch")}</p>
                <p className="text-[11px] text-ink-3">{L("Pull both Form 16 and AIS statement directly in 1 tap.")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLockerModalOpen(true)}
              className="px-4 py-2 rounded-[12px] btn-primary text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{linked ? L("Fetch Now (1 Tap)") : L("Fetch via DigiLocker")}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Adaptive Upload Sections */}
          <div className={`grid gap-3.5 ${!hasForm16 && !hasAIS ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {/* Form 16 Upload Card */}
            {!hasForm16 && (
              <div className="rounded-[20px] border-2 border-dashed border-line hover:border-money/60 bg-paper-3/60 p-4.5 flex flex-col justify-between space-y-3 transition-colors">
                <input
                  ref={form16InputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFileUpload(f, "FORM_16");
                    e.target.value = "";
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => form16InputRef.current?.click()}
                  className="cursor-pointer space-y-2 text-center py-2"
                >
                  <div className="size-10 mx-auto rounded-full bg-paper border border-line flex items-center justify-center text-ink-2 shadow-xs">
                    {activeUploadKind === "FORM_16" ? <Loader2 size={18} className="animate-spin text-money" /> : <FileUp size={18} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">{L("Upload Form 16 (PDF)")}</h4>
                    <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                      {L("Extracts Salary, Allowances & Section 192 TDS")}
                    </p>
                  </div>
                </div>

                {/* Smart Companion Sample Matcher: Form 16 */}
                {hasAIS ? (
                  // AIS is already on record; suggest ONLY the matching companion Form 16
                  <div className="pt-2 border-t border-line/60">
                    <p className="text-[10px] font-semibold text-ink-3 mb-1.5 flex items-center gap-1">
                      <Sparkles size={11} className="text-money" />
                      <span>{L("Matching Companion Form 16:")}</span>
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {personKey === "anthony" ? (
                        <button
                          type="button"
                          disabled={Boolean(loadingSample)}
                          onClick={() => handleLoadSample("Form 16 - Anthony D'Souza.pdf", "FORM_16")}
                          className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {loadingSample === "Form 16 - Anthony D'Souza.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                          <span>Anthony D'Souza (Form 16)</span>
                        </button>
                      ) : personKey === "faheem" ? (
                        <button
                          type="button"
                          disabled={Boolean(loadingSample)}
                          onClick={() => handleLoadSample("Form 16 - Faheem Ahmed.pdf", "FORM_16")}
                          className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {loadingSample === "Form 16 - Faheem Ahmed.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                          <span>Faheem Ahmed (Form 16)</span>
                        </button>
                      ) : (
                        <p className="text-[11px] text-ink-3">
                          {L("Upload your employer's Form 16 PDF above, or declare salary manually below.")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Neither document on record: show paired sample options
                  <div className="pt-2 border-t border-line/60">
                    <p className="text-[10px] font-semibold text-ink-3 mb-1.5 flex items-center gap-1">
                      <Sparkles size={11} className="text-money" />
                      <span>{L("Quick Load Sample Document:")}</span>
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={Boolean(loadingSample)}
                        onClick={() => handleLoadSample("Form 16 - Anthony D'Souza.pdf", "FORM_16")}
                        className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {loadingSample === "Form 16 - Anthony D'Souza.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                        <span>Anthony D'Souza (Form 16)</span>
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(loadingSample)}
                        onClick={() => handleLoadSample("Form 16 - Faheem Ahmed.pdf", "FORM_16")}
                        className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {loadingSample === "Form 16 - Faheem Ahmed.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                        <span>Faheem Ahmed (Form 16)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Manual Salary Input Fallback */}
                {hasAIS && !hasForm16 && (
                  <div className="pt-2 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => setShowInlineManual(!showInlineManual)}
                      className="text-[11px] font-semibold text-money hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <FileText size={12} />
                      <span>{showInlineManual ? L("Hide manual salary form") : L("Don't have Form 16? Declare salary manually")}</span>
                    </button>
                    {showInlineManual && (
                      <form onSubmit={handleManualSalarySubmit} className="mt-2.5 p-3 rounded-[14px] bg-paper-2 border border-line space-y-2 animate-in fade-in">
                        <input
                          type="text"
                          value={manualEmployerInput}
                          onChange={(e) => setManualEmployerInput(e.target.value)}
                          placeholder={L("Employer Name (e.g. TCS Ltd)")}
                          className="w-full h-8 px-2.5 rounded-[8px] bg-paper border border-line text-xs text-ink focus:outline-none focus:border-money"
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1.5 text-xs text-ink-3 font-bold">₹</span>
                            <input
                              type="text"
                              required
                              value={manualSalaryInput}
                              onChange={(e) => setManualSalaryInput(e.target.value.replace(/[^0-9,]/g, ""))}
                              placeholder={L("Gross Annual Salary (e.g. 12,00,000)")}
                              className="w-full h-8 pl-6 pr-2 rounded-[8px] bg-paper border border-line text-xs font-mono font-semibold text-ink focus:outline-none focus:border-money"
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn-primary h-8 px-3 rounded-[8px] text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                          >
                            {L("Save & Complete")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AIS / TIS Upload Card */}
            {!hasAIS && (
              <div className="rounded-[20px] border-2 border-dashed border-line hover:border-money/60 bg-paper-3/60 p-4.5 flex flex-col justify-between space-y-3 transition-colors">
                <input
                  ref={aisInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFileUpload(f, "AIS");
                    e.target.value = "";
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => aisInputRef.current?.click()}
                  className="cursor-pointer space-y-2 text-center py-2"
                >
                  <div className="size-10 mx-auto rounded-full bg-paper border border-line flex items-center justify-center text-ink-2 shadow-xs">
                    {activeUploadKind === "AIS" ? <Loader2 size={18} className="animate-spin text-money" /> : <FileUp size={18} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">{L("Upload AIS / TIS Statement (PDF)")}</h4>
                    <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                      {L("Extracts Bank Interest, SFT, Dividends & Section 194A TDS")}
                    </p>
                  </div>
                </div>

                {/* Smart Companion Sample Matcher: AIS */}
                {hasForm16 ? (
                  // Form 16 is already on record; suggest ONLY the matching companion AIS
                  <div className="pt-2 border-t border-line/60">
                    <p className="text-[10px] font-semibold text-ink-3 mb-1.5 flex items-center gap-1">
                      <Sparkles size={11} className="text-money" />
                      <span>{L("Matching Companion AIS:")}</span>
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {personKey === "anthony" ? (
                        <button
                          type="button"
                          disabled={Boolean(loadingSample)}
                          onClick={() => handleLoadSample("AIS _ TIS Statement - Anthony D'Souza.pdf", "AIS")}
                          className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {loadingSample === "AIS _ TIS Statement - Anthony D'Souza.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                          <span>Anthony D'Souza (AIS)</span>
                        </button>
                      ) : personKey === "faheem" ? (
                        <button
                          type="button"
                          disabled={Boolean(loadingSample)}
                          onClick={() => handleLoadSample("AIS _ TIS Statement - Faheem Ahmed.pdf", "AIS")}
                          className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {loadingSample === "AIS _ TIS Statement - Faheem Ahmed.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                          <span>Faheem Ahmed (AIS)</span>
                        </button>
                      ) : (
                        <p className="text-[11px] text-ink-3">
                          {L("Upload your own AIS statement above, or enter bank interest manually below.")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Neither document on record: show paired sample options
                  <div className="pt-2 border-t border-line/60">
                    <p className="text-[10px] font-semibold text-ink-3 mb-1.5 flex items-center gap-1">
                      <Sparkles size={11} className="text-money" />
                      <span>{L("Quick Load Sample Document:")}</span>
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={Boolean(loadingSample)}
                        onClick={() => handleLoadSample("AIS _ TIS Statement - Anthony D'Souza.pdf", "AIS")}
                        className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {loadingSample === "AIS _ TIS Statement - Anthony D'Souza.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                        <span>Anthony D'Souza (AIS)</span>
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(loadingSample)}
                        onClick={() => handleLoadSample("AIS _ TIS Statement - Faheem Ahmed.pdf", "AIS")}
                        className="px-2.5 py-1 rounded-[8px] bg-paper border border-line hover:border-money text-[11px] font-medium text-ink flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {loadingSample === "AIS _ TIS Statement - Faheem Ahmed.pdf" ? <Loader2 size={10} className="animate-spin" /> : "⚡"}
                        <span>Faheem Ahmed (AIS)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Manual Interest Declaration: Immediately satisfies AIS and stops asking */}
                {hasForm16 && !hasAIS && (
                  <div className="pt-2 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => setShowInlineManual(!showInlineManual)}
                      className="text-[11px] font-semibold text-money hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <FileText size={12} />
                      <span>{showInlineManual ? L("Hide manual interest form") : L("Don't have AIS? Declare bank interest manually")}</span>
                    </button>
                    {showInlineManual && (
                      <form onSubmit={handleManualInterestSubmit} className="mt-2.5 p-3 rounded-[14px] bg-paper-2 border border-line space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-ink flex items-center gap-1">
                            <span>{L("Savings & Deposit Interest (₹)")}</span>
                          </label>
                          <span className="text-[10px] text-ink-3">Section 194A</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1.5 text-xs text-ink-3 font-bold">₹</span>
                            <input
                              type="text"
                              required
                              autoFocus
                              value={manualInterestInput}
                              onChange={(e) => setManualInterestInput(e.target.value.replace(/[^0-9,]/g, ""))}
                              placeholder={L("e.g. 15,000")}
                              className="w-full h-8 pl-6 pr-2 rounded-[8px] bg-paper border border-line text-xs font-mono font-semibold text-ink focus:outline-none focus:border-money"
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn-primary h-8 px-3 rounded-[8px] text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                          >
                            {L("Save & Complete")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option 3: Manual Figure Entry Link (Scrolls down to Statement declaration form) */}
          {!hasForm16 && !hasAIS && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  if (onEnterManually) {
                    onEnterManually();
                  } else {
                    const el = document.getElementById("manual-income-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-money transition underline cursor-pointer"
              >
                <FileText size={13} />
                <span>{L("Don't have tax documents? Enter all income figures manually →")}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* When both are complete */
        <div className="rounded-[18px] bg-ok-soft/70 border border-ok/30 p-4 text-xs text-ink flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-ok shrink-0" />
            <span className="font-semibold">
              {L("All tax documents matched and pre-filled. Please verify each line item below.")}
            </span>
          </div>
        </div>
      )}

      {/* Official Government DigiLocker Modal */}
      <DigiLockerModal
        isOpen={isLockerModalOpen}
        onClose={() => setIsLockerModalOpen(false)}
        onConsentSuccess={fetchNow}
        assessmentYear={assessmentYear}
        lang={lang}
        citizenName={citizenName}
        citizenPan={citizenPan}
      />
    </div>
  );
}
