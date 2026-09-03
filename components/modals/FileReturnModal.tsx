"use client";

import { useState, useRef, useId } from "react";
import {
  X,
  FileText,
  Upload,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  FileCheck,
  Sparkles,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import type { Lang } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import {
  detectDocumentKind,
  extractFieldsFromPdf,
  isEmptyExtraction,
  type ExtractedFields,
} from "@/lib/compliance/pdfExtract";
import type { IngestedDocument } from "@/context/TaxReturnContext";

interface FileReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  onLaunchPersona: (personaId: "sunita" | "rakesh" | "priya", directToDashboard?: boolean) => void;
  onLaunchPan: (pan: string) => void;
  onLaunchWithForm16: (doc: IngestedDocument) => void;
}

type TabType = "custom_pan" | "form16" | "demo_personas";

export default function FileReturnModal({
  isOpen,
  onClose,
  lang,
  onLaunchPersona,
  onLaunchPan,
  onLaunchWithForm16,
}: FileReturnModalProps) {
  // Custom PAN is now the FIRST and default tab
  const [activeTab, setActiveTab] = useState<TabType>("custom_pan");

  // Custom PAN State
  const [customPanInput, setCustomPanInput] = useState("");
  const [panError, setPanError] = useState<string | null>(null);
  const panInputId = useId();

  // Form 16 Ingestion State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<IngestedDocument | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const isHindi = lang === "hi";

  const handleFileDrop = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError(
        isHindi
          ? "कृपया केवल PDF प्रारूप में फॉर्म 16 या AIS दस्तावेज़ अपलोड करें।"
          : "Please upload a valid Form 16 or AIS document in PDF format.",
      );
      return;
    }

    setIsReadingPdf(true);
    setPdfError(null);
    setPdfResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const extracted: ExtractedFields = await extractFieldsFromPdf(bytes);
      const kind = detectDocumentKind(bytes, file.name);

      // Brief parse beat for comfortable user perception
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (isEmptyExtraction(extracted)) {
        setPdfError(
          isHindi
            ? "इस PDF में कोई डिजिटल टेक्स्ट परत नहीं मिली। यह स्कैन की गई फोटोकॉपी या पासवर्ड-संरक्षित फ़ाइल हो सकती है। कृपया डिजिटल फॉर्म 16 का उपयोग करें या सीधे पैन दर्ज करके आगे बढ़ें।"
            : "No digital text layer found in this PDF. It may be a scanned image/photocopy or password-protected. Client-side extraction reads digital text PDFs (TRACES Form 16 Part A/B). You can proceed via Custom PAN instead.",
        );
        setIsReadingPdf(false);
        return;
      }

      const doc: IngestedDocument = {
        fileName: file.name,
        kind,
        ingestedAt: new Date().toISOString(),
        extracted,
      };

      setPdfResult(doc);
      setIsReadingPdf(false);
    } catch {
      setPdfError(
        isHindi
          ? "फ़ाइल पढ़ने में त्रुटि हुई। कृपया जांचें कि फ़ाइल सुरक्षित या दूषित तो नहीं है।"
          : "Error reading file. Please check if the file is corrupted or password-protected.",
      );
      setIsReadingPdf(false);
    }
  };

  const handleSampleForm16 = () => {
    setIsReadingPdf(true);
    setPdfError(null);
    setPdfResult(null);

    setTimeout(() => {
      const sampleDoc: IngestedDocument = {
        fileName: "Form16_PartB_Sample_AY2026-27.pdf",
        kind: "FORM_16",
        ingestedAt: new Date().toISOString(),
        extracted: {
          pan: "ABCDE1234F",
          name: "Amitabh Sen",
          employerName: "Tech Mahindra Ltd",
          grossSalary: 1250000,
          tds: 45000,
        },
      };
      setPdfResult(sampleDoc);
      setIsReadingPdf(false);
    }, 600);
  };

  const handlePanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = customPanInput.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!cleanPan) {
      setPanError(isHindi ? "कृपया अपना 10 अंकों का पैन नंबर दर्ज करें।" : "Please enter your 10-character PAN.");
      return;
    }

    if (!panRegex.test(cleanPan)) {
      setPanError(
        isHindi
          ? "अमान्य पैन प्रारूप। पैन 5 अक्षर, 4 अंक और 1 अक्षर होना चाहिए (उदा. ABCDE1234F)।"
          : "Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F).",
      );
      return;
    }

    setPanError(null);
    onLaunchPan(cleanPan);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-return-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-paper p-6 shadow-2xl border border-line text-start">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <FileText size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="file-return-title" className="font-sans text-xl font-bold text-ink">
                  {isHindi ? "रिटर्न दाखिल या समीक्षा करें (AY 2026-27)" : "File or Review Return (AY 2026-27)"}
                </h2>
                <span className="rounded-md border border-line bg-paper-3 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  ITR-1 / Form 16
                </span>
              </div>
              <p className="text-xs text-ink-2 mt-0.5">
                {isHindi
                  ? "सटीक तथ्यों के साथ 5-चरणीय रिटर्न निर्माण, फॉर्म 16 आयात और लाइफसाइकिल ट्रैकर।"
                  : "Unified facts-first return builder, Form 16 ingestion, and lifecycle reviewer."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-ink-3 hover:bg-paper-3 hover:text-ink transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs - CUSTOM PAN FIRST */}
        <div className="mt-4 flex border-b border-line gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("custom_pan")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "custom_pan"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <UserCheck size={14} />
            <span>{isHindi ? "अपना पैन दर्ज करें" : "File with Your PAN"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("form16")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "form16"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Upload size={14} />
            <span>{isHindi ? "फॉर्म 16 / AIS अपलोड" : "Upload Form 16 / AIS"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("demo_personas")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "demo_personas"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            <Sparkles size={14} />
            <span>{isHindi ? "1-क्लिक डेमो (सुनीता देवी)" : "1-Click Demo (Sunita)"}</span>
          </button>
        </div>

        {/* TAB 1: FILE WITH YOUR PAN (FIRST TAB) */}
        {activeTab === "custom_pan" && (
          <div className="mt-4 space-y-5 animate-in fade-in duration-150">
            {/* Custom PAN Entry Card */}
            <div className="rounded-xl border border-line bg-paper-2 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-sm font-bold text-ink">
                    {isHindi ? "अपने पैन नंबर से रिटर्न शुरू करें" : "File Return with Your Permanent Account Number"}
                  </h3>
                  <p className="text-xs text-ink-2 mt-0.5">
                    {isHindi
                      ? "अपना 10-अंकों का पैन दर्ज करें। यदि आपका रिटर्न पहले से दाखिल है, तो यह आपकी वर्तमान स्थिति लोड करेगा।"
                      : "Enter your 10-character PAN. If you have filed, it loads your status; otherwise, it starts your fresh return."}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePanSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor={panInputId} className="block text-[11px] font-mono font-semibold uppercase text-ink-3 mb-1">
                    {isHindi ? "पैन नंबर (10 अक्षर)" : "Permanent Account Number (PAN)"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <input
                        id={panInputId}
                        type="text"
                        maxLength={10}
                        autoFocus
                        value={customPanInput}
                        onChange={(e) => {
                          setCustomPanInput(e.target.value.toUpperCase());
                          if (panError) setPanError(null);
                        }}
                        placeholder="ABCDE1234F"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className={`w-full rounded-lg border bg-paper-3 px-3.5 py-2.5 text-base font-mono tracking-widest uppercase text-ink transition focus:outline-none ${
                          panError ? "border-alarm" : "border-line focus:border-money"
                        }`}
                      />
                      {panError && <p className="mt-1 text-xs text-alarm font-medium">{panError}</p>}
                    </div>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer whitespace-nowrap"
                    >
                      <span>{isHindi ? "रिटर्न शुरू करें" : "Begin Filing"}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Review Filed Returns (Personas) */}
            <div className="border-t border-line pt-4">
              <div className="flex items-baseline justify-between mb-2.5">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-ink-3">
                  {isHindi ? "या पहले से दाखिल रिटर्न की समीक्षा करें (डेमो)" : "Or Review Filed Returns (Interactive Demo)"}
                </h4>
                <span className="text-[10px] text-ink-3">
                  {isHindi ? "तत्काल पूर्वावलोकन" : "Instant prefill"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rakesh */}
                <button
                  type="button"
                  onClick={() => onLaunchPersona("rakesh", true)}
                  className="group flex flex-col justify-between rounded-xl border border-line bg-paper-2 p-3 text-start transition hover:border-money hover:bg-paper-3 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold text-ink group-hover:text-money">
                        Rakesh Kumar
                      </span>
                      <span className="rounded bg-paper-3 px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
                        DEMPK8823R
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-2 mt-1 leading-snug">
                      {isHindi
                        ? "दाखिल रिटर्न, पूंजीगत लाभ विवाद, 143(1)(a) नोटिस और रिफंड होल्ड।"
                        : "Filed return, capital gains dispute, s.143(1)(a) notice, and refund hold."}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2 text-[10px] font-semibold text-money">
                    <span>{isHindi ? "ITR-V व स्थिति देखें" : "View ITR-V & Status"}</span>
                    <ArrowRight size={12} />
                  </div>
                </button>

                {/* Priya */}
                <button
                  type="button"
                  onClick={() => onLaunchPersona("priya", true)}
                  className="group flex flex-col justify-between rounded-xl border border-line bg-paper-2 p-3 text-start transition hover:border-money hover:bg-paper-3 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold text-ink group-hover:text-money">
                        Priya Sharma
                      </span>
                      <span className="rounded bg-paper-3 px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
                        DEMPS9052M
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-2 mt-1 leading-snug">
                      {isHindi
                        ? "दाखिल रिटर्न, HRA किराया रसीद सत्यापन और बैंक IFSC सुधार।"
                        : "Filed return, HRA rent-receipt verification, and bank IFSC correction."}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2 text-[10px] font-semibold text-money">
                    <span>{isHindi ? "ITR-V व स्थिति देखें" : "View ITR-V & Status"}</span>
                    <ArrowRight size={12} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD FORM 16 / AIS PDF */}
        {activeTab === "form16" && (
          <div className="mt-4 space-y-4 animate-in fade-in duration-150">
            {/* Extraction Honest Capability Note */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30 p-2.5 text-xs text-ink-2 flex items-start gap-2">
              <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="m-0 leading-relaxed text-[11px]">
                {isHindi
                  ? "क्लाइंट-साइड पार्सर: यह डिजिटल रूप से उत्पन्न फॉर्म 16 (पार्ट A/B) और AIS PDF से टेक्स्ट लेयर को सीधे पढ़ता है। स्कैन की गई छवियों/फोटोकॉपी के लिए आप अपना पैन दर्ज करके मैन्युअल रिटर्न शुरू कर सकते हैं।"
                  : "Client-side byte parser: Reads digital text streams from Form 16 Part A/B and AIS PDFs. Scanned photocopies without text layers are not supported and can be entered via Custom PAN."}
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFileDrop(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-line bg-paper-2 hover:border-emerald-500/60 hover:bg-paper-3"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileDrop(file);
                  e.target.value = "";
                }}
              />

              {isReadingPdf ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <Loader2 size={26} className="animate-spin text-emerald-600" />
                  <p className="text-xs font-bold text-ink">
                    {isHindi ? "दस्तावेज़ से वेतन व टीडीएस का विश्लेषण हो रहा है..." : "Extracting salary and TDS facts from document..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-paper-3 text-emerald-700 dark:text-emerald-300 mb-2">
                    <Upload size={20} />
                  </div>
                  <h4 className="font-sans text-sm font-bold text-ink">
                    {isHindi ? "फॉर्म 16 या AIS PDF यहाँ खींचें व छोड़ें" : "Drop your Form 16 or AIS PDF here"}
                  </h4>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {isHindi
                      ? "या फ़ाइल चुनने के लिए क्लिक करें — पैन, सकल वेतन और टीडीएस स्वचालित रूप से निकाले जाएंगे"
                      : "or click to browse — PAN, gross salary, and TDS are extracted automatically"}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
                    <Lock size={12} className="text-money" />
                    <span>
                      {isHindi
                        ? "आपके ब्राउज़र में सुरक्षित (Zero upload). फ़ाइल कभी किसी सर्वर पर नहीं भेजी जाती।"
                        : "Processed purely inside your browser. The file is never uploaded to any server."}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Quick Demo Sample Button */}
            {!pdfResult && (
              <div className="flex items-center justify-between rounded-lg border border-line bg-paper-2 px-3 py-2 text-xs">
                <span className="text-ink-2">
                  {isHindi ? "क्या आपके पास अभी PDF फ़ाइल नहीं है?" : "Don't have a Form 16 PDF handy to test?"}
                </span>
                <button
                  type="button"
                  onClick={handleSampleForm16}
                  className="inline-flex items-center gap-1 font-bold text-money hover:underline cursor-pointer"
                >
                  <FileSpreadsheet size={13} />
                  <span>{isHindi ? "डेमो फॉर्म 16 लोड करें" : "Load Sample Form 16"}</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {pdfError && (
              <div className="flex items-start gap-2 rounded-xl border border-alarm/30 bg-alarm/5 p-3 text-xs text-alarm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="m-0 font-medium leading-relaxed">{pdfError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("custom_pan")}
                    className="mt-2 text-xs font-bold underline cursor-pointer hover:opacity-80"
                  >
                    {isHindi ? "पैन दर्ज करके मैन्युअल रूप से आगे बढ़ें →" : "Proceed with Custom PAN instead →"}
                  </button>
                </div>
              </div>
            )}

            {/* Ingested Result Card */}
            {pdfResult && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/40 p-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span className="font-sans text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {pdfResult.kind === "AIS" ? "AIS Document Parsed" : "Form 16 Data Ingested"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-3">{pdfResult.fileName}</span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {pdfResult.extracted.name && (
                    <div className="rounded-lg bg-paper p-2 border border-line col-span-1 sm:col-span-2">
                      <span className="text-[10px] text-ink-3 block">{isHindi ? "कर्मचारी का नाम" : "Employee Name"}</span>
                      <span className="font-sans font-bold text-ink truncate block">
                        {pdfResult.extracted.name}
                        {pdfResult.extracted.employerName && (
                          <span className="text-[11px] font-normal text-ink-2 block truncate">
                            {pdfResult.extracted.employerName}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {pdfResult.extracted.pan && (
                    <div className="rounded-lg bg-paper p-2 border border-line">
                      <span className="text-[10px] text-ink-3 block">PAN</span>
                      <span className="font-mono font-bold text-ink">{pdfResult.extracted.pan}</span>
                    </div>
                  )}
                  {pdfResult.extracted.grossSalary !== undefined && (
                    <div className="rounded-lg bg-paper p-2 border border-line">
                      <span className="text-[10px] text-ink-3 block">{isHindi ? "सकल वेतन" : "Gross Salary"}</span>
                      <span className="font-mono font-bold text-ink">
                        {formatMoney(pdfResult.extracted.grossSalary, lang)}
                      </span>
                    </div>
                  )}
                  {pdfResult.extracted.tds !== undefined && (
                    <div className="rounded-lg bg-paper p-2 border border-line">
                      <span className="text-[10px] text-ink-3 block">{isHindi ? "कटौती किया गया टैक्स" : "TDS Deducted"}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(pdfResult.extracted.tds, lang)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onLaunchWithForm16(pdfResult)}
                    className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer"
                  >
                    <span>{isHindi ? "इस फॉर्म 16 के साथ रिटर्न शुरू करें" : "Launch Return with Extracted Data"}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 1-CLICK SALARIED DEMO (SUNITA DEVI) */}
        {activeTab === "demo_personas" && (
          <div className="mt-4 space-y-4 animate-in fade-in duration-150">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block rounded-md bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200 uppercase">
                    {isHindi ? "अनुशंसित डेमो पथ" : "Recommended Demo Flow"}
                  </span>
                  <h3 className="mt-1.5 font-sans text-base font-bold text-ink">
                    {isHindi ? "सुनीता देवी — वेतनभोगी प्रथम-बार रिटर्न" : "Sunita Devi — First-Time Salaried Return"}
                  </h3>
                  <p className="text-xs text-ink-2 mt-0.5">
                    PAN: <span className="font-mono font-bold text-ink">DEMPS4417K</span> · {isHindi ? "निर्धारण वर्ष" : "AY"} 2026-27
                  </p>
                </div>
                <div className="text-end">
                  <span className="text-[11px] font-medium text-ink-3 block">
                    {isHindi ? "प्रत्याशित रिफंड" : "Expected Refund"}
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(8400, lang)}
                  </span>
                </div>
              </div>

              {/* 5-Step Pipeline Blueprint */}
              <div className="mt-4 grid grid-cols-5 gap-1.5 text-center text-[10px] font-medium text-ink-2">
                <div className="rounded-lg bg-paper-2 p-1.5 border border-line">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">1. {isHindi ? "तथ्य" : "Facts"}</span>
                  <span className="text-[9px] text-ink-3 block truncate">₹4.2L Salary</span>
                </div>
                <div className="rounded-lg bg-paper-2 p-1.5 border border-line">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">2. {isHindi ? "कटौतियां" : "Claims"}</span>
                  <span className="text-[9px] text-ink-3 block truncate">80C, 80D</span>
                </div>
                <div className="rounded-lg bg-paper-2 p-1.5 border border-line">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">3. {isHindi ? "व्यवस्था" : "Regime"}</span>
                  <span className="text-[9px] text-ink-3 block truncate">₹75k Std Ded</span>
                </div>
                <div className="rounded-lg bg-paper-2 p-1.5 border border-line">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">4. {isHindi ? "जांच" : "Check"}</span>
                  <span className="text-[9px] text-ink-3 block truncate">CASS Radar</span>
                </div>
                <div className="rounded-lg bg-paper-2 p-1.5 border border-line">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">5. {isHindi ? "दाखिल" : "File"}</span>
                  <span className="text-[9px] text-ink-3 block truncate">ITR-V Receipt</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-ink-2">
                <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={14} />
                  <span>{isHindi ? "तथ्य पहले से सत्यापित और तैयार" : "Prefilled from Form 16 u/s 192"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchPersona("sunita", true)}
                  className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer"
                >
                  <span>{isHindi ? "5-चरणीय रिटर्न शुरू करें" : "Launch 5-Step Return Pipeline"}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-paper-2 p-3 text-xs text-ink-2 flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-money shrink-0" />
              <p className="m-0 leading-relaxed">
                {isHindi
                  ? "वापसी में हर आंकड़ा एक तथ्य है जो पुष्टि की प्रतीक्षा करता है। आप प्रत्येक आय और टीडीएस प्रविष्टि को स्वीकृत या सुधार सकते हैं।"
                  : "In Wapsi, every number is a fact awaiting confirmation. You can confirm or correct any salary and tax-paid entry before submission."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
