"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Upload,
  Lock,
  ChevronDown,
  Check,
  Edit2,
  Sparkles,
  Loader2,
  UserCheck,
  FileText,
  Building2,
} from "lucide-react";
import type { Lang } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import {
  type AISFeedbackCode,
  AIS_FEEDBACK_CODES,
  AIS_FEEDBACK_LABELS,
  AIS_FEEDBACK_HELP,
} from "@/lib/compliance/aisFeedback";
import {
  detectDocumentKind,
  extractFieldsFromPdf,
  isEmptyExtraction,
  type ExtractedFields,
} from "@/lib/compliance/pdfExtract";

export interface ReconcileRow {
  id: string;
  category: string;
  source: string;
  reported: number;
  declared: number;
  section: string;
  status: "matched" | "mismatch";
  feedbackCode: AISFeedbackCode;
  explanation?: string;
}

interface MatchRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  activeCitizen?: { name: string; pan: string; salary?: number; tds?: number } | null;
  onLaunchFullReconcile?: () => void;
  onResumeReturn?: () => void;
  onApplyReconciliation?: (reconciledRows: ReconcileRow[]) => void;
}

const HINDI_FEEDBACK_LABELS: Record<AISFeedbackCode, string> = {
  CODE_1: "जानकारी पूरी तरह सही है",
  CODE_2: "आय कर-मुक्त है (धारा 10/कृषि)",
  CODE_3: "आंशिक रूप से सही (राशि में अंतर)",
  CODE_4: "अन्य पैन / संयुक्त खाता धारक की आय",
  CODE_5: "जानकारी अस्वीकृत / दोहराव प्रविष्टि",
};

const HINDI_FEEDBACK_HELP: Record<AISFeedbackCode, string> = {
  CODE_1: "राशि और स्रोत दोनों सही हैं। इसे पूरा स्वीकार करें।",
  CODE_2: "यह आय प्राप्त हुई है, लेकिन कानूनी रूप से कर-मुक्त है।",
  CODE_3: "स्रोत सही है लेकिन राशि गलत है। अपनी वास्तविक राशि दर्ज करें।",
  CODE_4: "यह आय किसी अन्य व्यक्ति या संयुक्त खाते की है जो आपकी नहीं है।",
  CODE_5: "यह लेन-देन कभी प्राप्त नहीं हुआ, या बैंक द्वारा दोहराया गया है।",
};

export const INITIAL_RECONCILE_ROWS: ReconcileRow[] = [
  {
    id: "salary",
    category: "Salary Income",
    source: "Infosys Technologies Ltd (Form 16 Part A/B)",
    reported: 1450000,
    declared: 1450000,
    section: "192",
    status: "matched",
    feedbackCode: "CODE_1",
  },
  {
    id: "savings_interest",
    category: "Savings Bank Interest",
    source: "State Bank of India (SFT-005)",
    reported: 45000,
    declared: 15000,
    section: "194A",
    status: "mismatch",
    feedbackCode: "CODE_5",
    explanation: "SBI reported duplicate interest under merged branch IFSC.",
  },
  {
    id: "dividend",
    category: "Dividend Income",
    source: "TCS Ltd & HDFC AMC (SFT-006)",
    reported: 18400,
    declared: 18400,
    section: "194",
    status: "matched",
    feedbackCode: "CODE_1",
  },
  {
    id: "capital_gains",
    category: "LTCG on Equity Mutual Funds",
    source: "CAMS / KFintech Registrar (SFT-012)",
    reported: 120000,
    declared: 120000,
    section: "112A",
    status: "matched",
    feedbackCode: "CODE_1",
    explanation: "Exempt within ₹1.25L threshold exemption u/s 112A.",
  },
  {
    id: "tds_salary",
    category: "TDS on Salary",
    source: "Infosys Technologies Ltd (26AS Part A)",
    reported: 85000,
    declared: 85000,
    section: "192",
    status: "matched",
    feedbackCode: "CODE_1",
  },
  {
    id: "tds_bank",
    category: "TDS on Bank Deposits",
    source: "HDFC Bank Ltd (26AS Part A1)",
    reported: 4200,
    declared: 4200,
    section: "194A",
    status: "matched",
    feedbackCode: "CODE_1",
  },
];

/**
 * Reusable Feedback Dropdown modeled exactly after LanguageMenu:
 * - Outside-click dismissal via mousedown
 * - Internal scroll container (`max-h-60 overflow-y-auto`)
 * - Smart vertical positioning (opens upwards on lower rows to prevent overflow)
 */
function FeedbackDropdown({
  row,
  index,
  totalRows,
  isHindi,
  onSelectCode,
}: {
  row: ReconcileRow;
  index: number;
  totalRows: number;
  isHindi: boolean;
  onSelectCode: (code: AISFeedbackCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Lower half rows pop up so the menu stays completely visible
  const popUp = index >= totalRows - 3;

  const currentLabel = isHindi
    ? HINDI_FEEDBACK_LABELS[row.feedbackCode]
    : AIS_FEEDBACK_LABELS[row.feedbackCode];

  return (
    <div ref={rootRef} className="relative inline-block text-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-h-[36px] cursor-pointer items-center justify-between gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
          row.status === "mismatch"
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:border-amber-500"
            : "border-line bg-paper-2 hover:bg-paper text-ink"
        }`}
      >
        <span className="truncate max-w-[150px]">{currentLabel}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`shrink-0 text-ink-2 transition-transform duration-150 ${
            open ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute right-0 z-50 max-h-60 w-80 overflow-y-auto rounded-xl border border-line bg-paper p-1 shadow-2xl animate-in fade-in ${
            popUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {AIS_FEEDBACK_CODES.map((code) => {
            const isSelected = row.feedbackCode === code;
            const label = isHindi ? HINDI_FEEDBACK_LABELS[code] : AIS_FEEDBACK_LABELS[code];
            const help = isHindi ? HINDI_FEEDBACK_HELP[code] : AIS_FEEDBACK_HELP[code];

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectCode(code);
                  setOpen(false);
                }}
                className={`flex w-full flex-col gap-0.5 rounded-lg p-2.5 text-start text-xs transition-colors cursor-pointer hover:bg-paper-2 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/50 font-semibold text-blue-700 dark:text-blue-300"
                    : "text-ink"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {isSelected && <Check size={13} className="text-blue-600 shrink-0" />}
                    <span>{label}</span>
                  </span>
                  <span className="font-mono text-[9px] text-ink-3 bg-paper-3 px-1.5 py-0.5 rounded border border-line">
                    {code}
                  </span>
                </div>
                <p className="text-[10.5px] font-normal text-ink-2 leading-relaxed mt-0.5">
                  {help}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MatchRecordsModal({
  isOpen,
  onClose,
  lang,
  activeCitizen,
  onLaunchFullReconcile,
  onResumeReturn,
  onApplyReconciliation,
}: MatchRecordsModalProps) {
  const isHindi = lang === "hi";

  const [activeTab, setActiveTab] = useState<"matcher" | "upload" | "personas">("matcher");
  const [rows, setRows] = useState<ReconcileRow[]>(() => {
    // If activeCitizen is provided, seed salary and TDS from their actual session
    return INITIAL_RECONCILE_ROWS.map((r) => {
      if (r.id === "salary" && activeCitizen?.salary !== undefined) {
        return { ...r, reported: activeCitizen.salary, declared: activeCitizen.salary };
      }
      if (r.id === "tds_salary" && activeCitizen?.tds !== undefined) {
        return { ...r, reported: activeCitizen.tds, declared: activeCitizen.tds };
      }
      return r;
    });
  });

  const [editingAmountRowId, setEditingAmountRowId] = useState<string | null>(null);
  const [tempAmountInput, setTempAmountInput] = useState<string>("");

  // Tab 2: PDF Dropzone & Ingestion state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "reading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [uploadedDoc, setUploadedDoc] = useState<{
    fileName: string;
    kind: string;
    extracted: ExtractedFields;
  } | null>(null);

  if (!isOpen) return null;

  // Real-time totals
  const totalReported = rows.reduce((acc, r) => acc + (r.id.startsWith("tds") ? 0 : r.reported), 0);
  const totalDeclared = rows.reduce((acc, r) => acc + (r.id.startsWith("tds") ? 0 : r.declared), 0);
  const totalMismatch = Math.max(0, totalReported - totalDeclared);

  const handleSelectFeedbackCode = (rowId: string, code: AISFeedbackCode) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;

        let newDeclared = r.declared;
        let newStatus: "matched" | "mismatch" = "matched";

        if (code === "CODE_1") {
          newDeclared = r.reported;
          newStatus = "matched";
        } else if (code === "CODE_5") {
          newDeclared = r.id === "savings_interest" ? 15000 : 0;
          newStatus = "mismatch";
        } else if (code === "CODE_2" || code === "CODE_4") {
          newDeclared = 0;
          newStatus = "mismatch";
        } else if (code === "CODE_3") {
          newStatus = "mismatch";
          setEditingAmountRowId(rowId);
          setTempAmountInput(String(r.declared));
        }

        return {
          ...r,
          feedbackCode: code,
          declared: newDeclared,
          status: newStatus,
        };
      })
    );
  };

  const handleSaveCustomAmount = (rowId: string) => {
    const parsed = parseInt(tempAmountInput.replace(/[^0-9]/g, ""), 10) || 0;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const isMatched = parsed === r.reported;
          return {
            ...r,
            declared: parsed,
            status: isMatched ? "matched" : "mismatch",
            feedbackCode: isMatched ? "CODE_1" : "CODE_3",
          };
        }
        return r;
      })
    );
    setEditingAmountRowId(null);
  };

  const handleApply = () => {
    onClose();
    if (onApplyReconciliation) {
      onApplyReconciliation(rows);
    } else if (onResumeReturn) {
      onResumeReturn();
    } else if (onLaunchFullReconcile) {
      onLaunchFullReconcile();
    }
  };

  // Real PDF extraction handler for Tab 2
  const handleProcessPdf = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError(isHindi ? "कृपया केवल PDF फ़ाइल चुनें।" : "Please select a valid PDF file.");
      setUploadPhase("error");
      return;
    }

    setUploadPhase("reading");
    setUploadError("");
    setUploadedDoc(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const extracted = await extractFieldsFromPdf(bytes);
      const kind = detectDocumentKind(bytes, file.name);

      if (isEmptyExtraction(extracted)) {
        setUploadError(
          isHindi
            ? "इस PDF से कोई PAN या आय आंकड़े नहीं पढ़े जा सके। कृपया मूल डिजिटल PDF का उपयोग करें।"
            : "No valid PAN or income figures detected. Please upload an original digital Form 16 / AIS PDF."
        );
        setUploadPhase("error");
        return;
      }

      // Update rows in Tab 1 with the extracted values
      setRows((prev) =>
        prev.map((r) => {
          if (r.id === "salary" && extracted.grossSalary !== undefined) {
            return {
              ...r,
              reported: extracted.grossSalary,
              declared: extracted.grossSalary,
              source: extracted.employerName
                ? `${extracted.employerName} (${kind})`
                : r.source,
            };
          }
          if (r.id === "tds_salary" && extracted.tds !== undefined) {
            return {
              ...r,
              reported: extracted.tds,
              declared: extracted.tds,
              source: extracted.employerName
                ? `${extracted.employerName} (${kind})`
                : r.source,
            };
          }
          return r;
        })
      );

      setUploadedDoc({
        fileName: file.name,
        kind,
        extracted,
      });
      setUploadPhase("success");
    } catch (err: any) {
      setUploadError(
        isHindi
          ? "फ़ाइल पढ़ने में त्रुटि। यह पासवर्ड से सुरक्षित या दूषित हो सकती है।"
          : "Failed to read PDF. The file may be password protected or corrupted."
      );
      setUploadPhase("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-records-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl h-[88vh] flex flex-col rounded-3xl bg-paper shadow-2xl border border-blue-500/40 text-start overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-line p-5 sm:p-6 bg-paper">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30 shrink-0">
              <FileCheck2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="match-records-title" className="font-sans text-xl md:text-2xl font-bold text-ink">
                  {isHindi ? "सरकारी रिकॉर्ड का मिलान (AIS · 26AS · TDS)" : "Match Official Records (AIS · 26AS · Form 16)"}
                </h2>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Card 02
                </span>
              </div>
              <p className="text-xs text-ink-2 mt-0.5">
                {activeCitizen ? (
                  <span>
                    {isHindi ? "सक्रिय करदाता सत्र:" : "Active Session:"}{" "}
                    <span className="font-bold text-ink">{activeCitizen.name}</span> (PAN:{" "}
                    <span className="font-mono font-bold text-ink">{activeCitizen.pan}</span>)
                  </span>
                ) : (
                  <span>
                    {isHindi
                      ? "CBDT दिशा-निर्देशों के अनुसार AIS, 26AS और फॉर्म 16 का पंक्ति-वार मिलान।"
                      : "Row-by-row reconciliation with official CBDT feedback codes."}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-ink-3 hover:bg-paper-3 hover:text-ink transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fixed Navigation Tabs */}
        <div className="shrink-0 flex items-center gap-2 border-b border-line/70 px-5 sm:px-6 pt-3 pb-3 bg-paper">
          <button
            type="button"
            onClick={() => setActiveTab("matcher")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "matcher"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink"
            }`}
          >
            {isHindi ? "1. लाइव मिलान व CBDT फीडबैक" : "1. Live Record Matcher"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink"
            }`}
          >
            <Upload size={13} />
            <span>{isHindi ? "2. AIS / 26AS PDF अपलोड करें" : "2. Drop AIS / 26AS PDF"}</span>
            {uploadedDoc && <span className="size-2 rounded-full bg-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("personas")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "personas"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink"
            }`}
          >
            <UserCheck size={13} />
            <span>
              {activeCitizen
                ? isHindi
                  ? "3. आपका करदाता केस"
                  : "3. Your Case & Examples"
                : isHindi
                ? "3. उदाहरण विवाद (डेमो)"
                : "3. Dispute Examples"}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body: ONLY this container scrolls */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: LIVE MATCHER */}
          {activeTab === "matcher" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Live Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-line bg-paper-2 p-4">
                <div>
                  <span className="font-mono text-[10px] uppercase text-ink-3 block">
                    {isHindi ? "विभाग को रिपोर्ट की गई कुल आय" : "Total AIS Reported"}
                  </span>
                  <span className="font-mono text-base font-bold text-ink">
                    {formatMoney(totalReported, lang)}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-ink-3 block">
                    {isHindi ? "करदाता द्वारा वास्तविक घोषित" : "Actual Declared in Return"}
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(totalDeclared, lang)}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-ink-3 block">
                    {isHindi ? "सुलझाया गया अंतर (फीडबैक दर्ज)" : "Discrepancy Defended"}
                  </span>
                  <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                    {totalMismatch > 0 ? `+${formatMoney(totalMismatch, lang)}` : "Fully Reconciled"}
                  </span>
                </div>
              </div>

              {/* Upload Notification if a PDF was ingested */}
              {uploadedDoc && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-emerald-900 dark:text-emerald-200">
                      <strong>{uploadedDoc.fileName}</strong> {isHindi ? "से आंकड़े स्वतः लोड किए गए।" : "extracted & loaded into table."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    {isHindi ? "विवरण देखें" : "View details"}
                  </button>
                </div>
              )}

              {/* Instructions Callout */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-ink-2">
                <ChevronDown size={14} className="text-blue-600 shrink-0" />
                <span>
                  {isHindi
                    ? "भाषा मेनू की तरह ही स्क्रॉल ड्रॉपडाउन में CBDT फीडबैक विकल्प देखें व चुनें।"
                    : "Dropdown operates with identical smooth scroll to the portal's language menu."}
                </span>
              </div>

              {/* Reconciliation Table */}
              <div className="rounded-2xl border border-line bg-paper">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-paper-3/70 text-ink-2 font-mono text-[11px]">
                      <th className="p-3 text-start">{isHindi ? "आय / कर मद" : "Source / Line Item"}</th>
                      <th className="p-3 text-start">Sec</th>
                      <th className="p-3 text-end">{isHindi ? "AIS रिपोर्ट" : "Reported (AIS)"}</th>
                      <th className="p-3 text-end">{isHindi ? "वास्तविक (घोषित)" : "Actual (Declared)"}</th>
                      <th className="p-3 text-center">{isHindi ? "स्थिति" : "Status"}</th>
                      <th className="p-3 text-end">{isHindi ? "CBDT फीडबैक" : "Feedback Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {rows.map((r, index) => {
                      const hasMismatch = r.status === "mismatch";
                      const isEditingAmount = editingAmountRowId === r.id;

                      return (
                        <tr key={r.id} className="hover:bg-paper-2/60 transition">
                          {/* Line item info */}
                          <td className="p-3">
                            <span className="font-bold text-ink block">{r.category}</span>
                            <span className="text-[11px] text-ink-3 truncate block max-w-xs">{r.source}</span>
                            {r.explanation && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 italic block mt-0.5">
                                {r.explanation}
                              </span>
                            )}
                          </td>

                          {/* Section */}
                          <td className="p-3 font-mono text-ink-2">{r.section}</td>

                          {/* Reported (AIS) */}
                          <td className="p-3 text-end font-mono font-bold text-ink">
                            {formatMoney(r.reported, lang)}
                          </td>

                          {/* Actual / Declared (with quick inline edit) */}
                          <td className="p-3 text-end">
                            {isEditingAmount ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-mono text-xs text-ink-3">₹</span>
                                <input
                                  type="text"
                                  autoFocus
                                  value={tempAmountInput}
                                  onChange={(e) => setTempAmountInput(e.target.value)}
                                  className="w-24 rounded border border-blue-500 bg-paper px-1.5 py-0.5 text-end font-mono font-bold text-ink text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveCustomAmount(r.id)}
                                  className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700 cursor-pointer"
                                  title="Save"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 group">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                  {formatMoney(r.declared, lang)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAmountRowId(r.id);
                                    setTempAmountInput(String(r.declared));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-blue-600 transition cursor-pointer p-0.5"
                                  title="Edit amount"
                                >
                                  <Edit2 size={11} />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            {hasMismatch ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                <AlertCircle size={11} />
                                <span>{isHindi ? "अंतर" : "Discrepancy"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 size={11} />
                                <span>{isHindi ? "सत्यापित" : "Matched"}</span>
                              </span>
                            )}
                          </td>

                          {/* Feedback Dropdown (LanguageMenu style) */}
                          <td className="p-3 text-end relative">
                            <FeedbackDropdown
                              row={r}
                              index={index}
                              totalRows={rows.length}
                              isHindi={isHindi}
                              onSelectCode={(code) => handleSelectFeedbackCode(r.id, code)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FUNCTIONAL INGEST AIS / 26AS PDF */}
          {activeTab === "upload" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleProcessPdf(file);
                }}
              />

              {uploadPhase === "reading" ? (
                <div className="rounded-2xl border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-10 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                  <h4 className="font-bold text-ink text-sm">
                    {isHindi ? "PDF का विश्लेषण किया जा रहा है..." : "Parsing PDF bytes & decrypting SFT streams..."}
                  </h4>
                  <p className="text-xs text-ink-2 max-w-sm mx-auto">
                    {isHindi
                      ? "धारा 203 प्रमाण पत्र, नियोक्ता TAN, सकल वेतन व TDS कटौतियों का मिलान किया जा रहा है।"
                      : "Scanning text streams locally for PAN, Employer TAN, Gross Salary, and Section 192/194 TDS credits."}
                  </p>
                </div>
              ) : uploadPhase === "success" && uploadedDoc ? (
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-6 space-y-4 text-start">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                        {isHindi ? "दस्तावेज़ सफलतापूर्वक पढ़ा गया!" : "Document Successfully Analyzed & Applied!"}
                      </h4>
                    </div>
                    <span className="font-mono text-[11px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
                      {uploadedDoc.kind}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-paper p-4 rounded-xl border border-line">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">
                        {isHindi ? "करदाता / कर्मचारी" : "Employee Name"}
                      </span>
                      <span className="font-bold text-xs text-ink">
                        {uploadedDoc.extracted.name || activeCitizen?.name || "Verified Citizen"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">PAN</span>
                      <span className="font-mono font-bold text-xs text-ink">
                        {uploadedDoc.extracted.pan || activeCitizen?.pan || "ABCDE1234F"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">
                        {isHindi ? "सकल वेतन" : "Gross Salary"}
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {uploadedDoc.extracted.grossSalary
                          ? formatMoney(uploadedDoc.extracted.grossSalary, lang)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">
                        {isHindi ? "काटा गया TDS" : "TDS Credit"}
                      </span>
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {uploadedDoc.extracted.tds
                          ? formatMoney(uploadedDoc.extracted.tds, lang)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {uploadedDoc.extracted.employerName && (
                    <div className="flex items-center gap-2 text-xs text-ink-2 bg-paper-2 p-2.5 rounded-lg border border-line">
                      <Building2 size={14} className="text-ink-3 shrink-0" />
                      <span>
                        {isHindi ? "नियोक्ता / डिडक्टर:" : "Deductor / Employer:"}{" "}
                        <strong className="text-ink">{uploadedDoc.extracted.employerName}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("matcher")}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <span>{isHindi ? "तालिका (Tab 1) में आंकड़े देखें →" : "View Extracted Figures in Matcher (Tab 1) →"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-ink-2 hover:text-ink underline cursor-pointer"
                    >
                      {isHindi ? "दूसरी PDF अपलोड करें" : "Upload a different PDF"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dragCounter.current += 1;
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "copy";
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dragCounter.current -= 1;
                    if (dragCounter.current <= 0) {
                      dragCounter.current = 0;
                      setIsDragging(false);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dragCounter.current = 0;
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void handleProcessPdf(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed p-8 transition-all text-center cursor-pointer ${
                    isDragging
                      ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 ring-4 ring-blue-500/20 scale-[1.01]"
                      : "border-line hover:border-blue-500 bg-paper-2"
                  }`}
                >
                  <div className="pointer-events-none">
                    <div className={`mx-auto flex size-14 items-center justify-center rounded-full mb-3 transition-transform ${
                      isDragging
                        ? "bg-blue-600 text-white scale-110 shadow-lg"
                        : "bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300"
                    }`}>
                      <Upload size={24} />
                    </div>
                    <h3 className="font-sans text-base font-bold text-ink">
                      {isDragging
                        ? (isHindi ? "PDF फ़ाइल यहाँ छोड़ें" : "Drop your PDF file here now")
                        : (isHindi ? "अपनी AIS, 26AS या फॉर्म 16 PDF यहाँ खींचें व छोड़ें" : "Drop your AIS, Form 26AS or Form 16 PDF here")}
                    </h3>
                    <p className="text-xs text-ink-2 mt-1 max-w-md mx-auto leading-relaxed">
                      {isHindi
                        ? "फ़ाइल चुनने के लिए क्लिक करें या PDF यहाँ छोड़ें। यह आपके ब्राउज़र में 100% स्थानीय रूप से पढ़ा जाएगा और तालिका 1 में स्वतः भर जाएगा।"
                        : "Click to browse or drop file here. Unpacks stream locally in browser and populates Tab 1 with exact figures."}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-3">
                      <Lock size={12} className="text-emerald-600" />
                      <span>{isHindi ? "100% शून्य-सर्वर अपलोड (ब्राउज़र में प्रोसेस)" : "100% Client-side · Zero server storage"}</span>
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL CITIZEN CASE + BENCHMARK DEMOS */}
          {activeTab === "personas" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* PRIMARY CARD: Logged-in Citizen's Own Case */}
              {activeCitizen ? (
                <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/30 p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {isHindi ? "★ आपका सक्रिय रिटर्न केस" : "★ Your Active Filing Case"}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold bg-paper px-2.5 py-1 rounded border border-emerald-500/30 text-ink">
                      {activeCitizen.pan}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-sans text-lg font-bold text-ink">
                      {activeCitizen.name}
                    </h3>
                    <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
                      {isHindi
                        ? "यह आपके सक्रिय सत्र का ड्राफ्ट है। आपके फॉर्म 16 और पूर्व-भरे रिटर्न के आंकड़े नीचे दिए गए हैं। AIS/26AS में रिपोर्ट किए गए बैंक ब्याज और लाभांश से इनका मिलान करें।"
                        : "Your live active return draft. Cross-check your verified Form 16 figures against bank interest and dividend statements to dispute any duplicate reporting."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-paper p-3 rounded-xl border border-line">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">
                        {isHindi ? "सकल वेतन" : "Gross Salary"}
                      </span>
                      <span className="font-mono font-bold text-xs text-ink">
                        {formatMoney(activeCitizen.salary || 1450000, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">
                        {isHindi ? "काटा गया TDS" : "TDS Paid"}
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatMoney(activeCitizen.tds || 85000, lang)}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-mono uppercase text-ink-3 block">
                        {isHindi ? "स्थिति" : "Filing Status"}
                      </span>
                      <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                        {isHindi ? "ड्राफ्ट सक्रिय" : "Draft Active (ITR-1)"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-ink-3">
                      {isHindi ? "आपके आंकड़े तैयार हैं" : "Session synchronized"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("matcher");
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <span>{isHindi ? "मेरे आंकड़े मिलान में लोड करें →" : "Reconcile My Active Return →"}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-line bg-paper-2 p-4 text-center text-xs text-ink-2">
                  <span>
                    {isHindi
                      ? "आप वर्तमान में एक सामान्य डेमो सत्र में हैं। अपने व्यक्तिगत आंकड़ों के लिए पोर्टल पर लॉगिन करें।"
                      : "You are viewing general benchmark cases. Log in or upload a Form 16 to see your personal active case here."}
                  </span>
                </div>
              )}

              {/* SECTION HEADER: Educational Benchmark Demonstrations */}
              <div className="pt-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-3">
                  {isHindi ? "अथवा डेमो विवाद केस देखें:" : "Or Explore Demo Benchmark Cases:"}
                </span>
              </div>

              {/* DEMO BENCHMARK CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Priya Sharma */}
                <div className="rounded-2xl border border-line bg-paper-2 p-4 text-start space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink text-sm">Priya Sharma</span>
                    <span className="font-mono text-[10px] bg-paper-3 px-2 py-0.5 rounded border border-line">
                      DEMPS9052M
                    </span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {isHindi
                      ? "SBI शाखा विलय के कारण बचत बैंक ब्याज ₹45,000 दर्ज हो गया था, जबकि वास्तविक ₹15,000 था। CBDT डुप्लीकेट फीडबैक कोड (CODE_5) के साथ ₹9,360 अतिरिक्त टैक्स से बचाया।"
                      : "SBI duplicate reporting due to branch IFSC merger. AIS showed ₹45k vs actual ₹15k. Resolved with CBDT code 'Information is duplicate' (CODE_5)."}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-line/60 text-xs">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {isHindi ? "बचत: ₹9,360" : "Defended: ₹9,360"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectFeedbackCode("savings_interest", "CODE_5");
                        setActiveTab("matcher");
                      }}
                      className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isHindi ? "डेमो लोड करें" : "Load Demo Case"}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Rakesh Kumar */}
                <div className="rounded-2xl border border-line bg-paper-2 p-4 text-start space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink text-sm">Rakesh Kumar</span>
                    <span className="font-mono text-[10px] bg-paper-3 px-2 py-0.5 rounded border border-line">
                      DEMPK8823R
                    </span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {isHindi
                      ? "धारा 112A पूंजीगत लाभ पर सीपीसी द्वारा धारा 143(1)(a) विसंगति नोटिस। AIS और डीमैट स्टेटमेंट के मिलान से नोटिस का कानूनी उत्तर तैयार किया गया।"
                      : "CPC Section 143(1)(a) notice proposing adjustment on capital gains u/s 112A. Reconciled with CAMS/KFintech records to clear refund hold."}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-line/60 text-xs">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {isHindi ? "रिफंड होल्ड मुक्त" : "Refund Hold Cleared"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectFeedbackCode("capital_gains", "CODE_1");
                        setActiveTab("matcher");
                      }}
                      className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isHindi ? "डेमो लोड करें" : "Load Demo Case"}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line p-4 sm:p-5 bg-paper">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <ShieldCheck size={16} className="text-blue-600" />
            <span>
              {isHindi
                ? "CBDT अनुदेश संख्या 1/2022 के अनुरूप स्वचालित फीडबैक प्रणाली।"
                : "CBDT Instruction No. 1/2022 compliant reconciliation."}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{isHindi ? "रिटर्न में आंकड़े लागू करें" : "Apply to My Return Draft"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
