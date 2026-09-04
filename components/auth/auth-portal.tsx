"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  ShieldCheck,
  ChevronRight,
  UserPlus,
  LogIn,
  Users,
  Sparkles,
  Lock,
  ArrowRight,
  FileCheck,
  Building2,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  HelpCircle,
  KeyRound,
} from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Lang, PersonaId } from "@/lib/types";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import { PERSONAS } from "@/lib/personas";
import {
  syncVaultUser,
  createVaultUserFromPan,
  addDocumentToVault,
  type CitizenVaultUser,
  type VaultDocument,
} from "@/lib/vault/vault-store";
import { extractFieldsFromPdf, detectDocumentKind, isEmptyExtraction } from "@/lib/compliance/pdfExtract";
import type { IngestedDocument } from "@/context/TaxReturnContext";

interface AuthPortalProps {
  t: Dict;
  lang?: Lang;
  panInput: string;
  panInputError: string | null;
  onPanChange: (pan: string) => void;
  onPanSubmit: (e: React.FormEvent) => void;
  onLaunchPersona?: (personaId: PersonaId | "custom", directToDashboard?: boolean) => void;
  onSignUpComplete?: (user: CitizenVaultUser) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
}

export default function AuthPortal({
  t,
  lang = "en",
  panInput,
  panInputError,
  onPanChange,
  onPanSubmit,
  onLaunchPersona,
  onSignUpComplete,
  onLaunchWithForm16,
}: AuthPortalProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "document" | "personas">("signin");
  const ps = getPortalStrings(lang || "en");

  // --- Sign Up Form State (Strictly PAN-only per directive) ---
  const [signUpPan, setSignUpPan] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [isSubmittingSignUp, setIsSubmittingSignUp] = useState(false);

  // --- Document Sign In State ---
  const [docPhase, setDocPhase] = useState<"idle" | "reading" | "success" | "manual_pan" | "error">("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [, setExtractedPan] = useState<string>("");
  const [manualPanForDoc, setManualPanForDoc] = useState<string>("");
  const [docStatusMsg, setDocStatusMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Indian PAN format regex: 5 uppercase letters, 4 digits, 1 uppercase letter
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = signUpPan.trim().toUpperCase();

    if (!cleanPan || cleanPan.length !== 10) {
      setSignUpError(ps.panRequiredError);
      return;
    }

    if (!PAN_REGEX.test(cleanPan)) {
      setSignUpError(ps.panRegexError);
      return;
    }

    setIsSubmittingSignUp(true);
    setSignUpError(null);

    try {
      // Create clean citizen vault record from PAN alone (zero prefilled amounts)
      const newUser = createVaultUserFromPan(cleanPan, { clean: true });

      // Automatically sync to PostgreSQL database by default (no user prompt)
      const syncResult = await syncVaultUser(newUser);
      newUser.syncedToPostgres = syncResult.syncedToPostgres;
      newUser.dbStatus = syncResult.dbStatus;

      onPanChange(cleanPan);

      if (onSignUpComplete) {
        onSignUpComplete(newUser);
      } else {
        onPanSubmit(e);
      }
    } catch (err) {
      setSignUpError("Registration error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingSignUp(false);
    }
  };

  // --- Process File Upload for Document Sign In ---
  const processDocument = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      setDocPhase("reading");
      setDocStatusMsg(ps.readingDoc);

      try {
        let foundPan: string | undefined = undefined;
        let detectedName: string | undefined = undefined;
        let employerName: string | undefined = undefined;
        let grossSalary: number | undefined = undefined;
        let tdsAmount: number | undefined = undefined;
        let detectedKind: "FORM_16" | "AIS" = "FORM_16";

        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          detectedKind = detectDocumentKind(bytes, file.name);
          const extracted = await extractFieldsFromPdf(bytes);

          if (!isEmptyExtraction(extracted)) {
            foundPan = extracted.pan;
            detectedName = extracted.name;
            employerName = extracted.employerName;
            grossSalary = extracted.grossSalary;
            tdsAmount = extracted.tds;
          }
        } else {
          // For text, json, or other documents, read text stream
          const text = await file.text();
          const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
          if (panMatch) {
            foundPan = panMatch[0];
          }
          const nameMatch = text.match(/(?:Name of (?:the )?Employee|Name of (?:the )?Deductee|Name)[\s:]+([A-Za-z\s]{3,35})/i);
          if (nameMatch) {
            detectedName = nameMatch[1].trim();
          }
        }

        // Slight parse beat for high-trust user feedback
        await new Promise((r) => setTimeout(r, 600));

        if (foundPan && PAN_REGEX.test(foundPan.trim().toUpperCase())) {
          const cleanPan = foundPan.trim().toUpperCase();
          setExtractedPan(cleanPan);
          setDocPhase("success");
          setDocStatusMsg(
            `${cleanPan}: ${ps.readingDoc}`
          );

          // 1. Automatically store document in Citizen Tax Vault by default
          const vaultDoc: VaultDocument = {
            id: `doc_${Date.now()}`,
            title: file.name,
            docType: detectedKind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
            issuer: employerName || "Uploaded Tax Document",
            uploadedAt: new Date().toISOString().slice(0, 10),
            sizeKb: Math.max(1, Math.round(file.size / 1024)),
            status: "verified",
          };

          const updatedUser = await addDocumentToVault(cleanPan, vaultDoc);

          // 2. Prepare ingested document
          const ingested: IngestedDocument = {
            fileName: file.name,
            kind: detectedKind,
            ingestedAt: new Date().toISOString(),
            extracted: {
              pan: cleanPan,
              name: detectedName,
              employerName,
              grossSalary,
              tds: tdsAmount,
            },
          };

          onPanChange(cleanPan);

          // 3. Log user in directly
          if (onLaunchWithForm16) {
            onLaunchWithForm16(ingested);
          } else if (onSignUpComplete) {
            onSignUpComplete(updatedUser);
          }
        } else {
          // Document was read, but no 10-character PAN found in text stream
          setDocPhase("manual_pan");
          setDocStatusMsg(ps.panOnlySub);
        }
      } catch {
        setDocPhase("error");
        setDocStatusMsg(ps.docError);
      }
    },
    [ps, onLaunchWithForm16, onPanChange, onSignUpComplete]
  );

  const handleManualPanForDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = manualPanForDoc.trim().toUpperCase();

    if (!cleanPan || !PAN_REGEX.test(cleanPan)) {
      setDocStatusMsg(ps.panRegexError);
      return;
    }

    if (!uploadedFile) return;

    setDocPhase("reading");
    setDocStatusMsg(ps.readingDoc);

    const vaultDoc: VaultDocument = {
      id: `doc_${Date.now()}`,
      title: uploadedFile.name,
      docType: uploadedFile.name.toLowerCase().includes("ais") ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
      issuer: "Citizen Tax Document",
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeKb: Math.max(1, Math.round(uploadedFile.size / 1024)),
      status: "verified",
    };

    // Auto-stored in vault by default without prompting
    const updatedUser = await addDocumentToVault(cleanPan, vaultDoc);

    const ingested: IngestedDocument = {
      fileName: uploadedFile.name,
      kind: uploadedFile.name.toLowerCase().includes("ais") ? "AIS" : "FORM_16",
      ingestedAt: new Date().toISOString(),
      extracted: { pan: cleanPan },
    };

    onPanChange(cleanPan);

    if (onLaunchWithForm16) {
      onLaunchWithForm16(ingested);
    } else if (onSignUpComplete) {
      onSignUpComplete(updatedUser);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-line ring-1 ring-black/5 dark:ring-white/10 bg-paper shadow-2xl overflow-hidden transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* =================================================================== */}
        {/* LEFT COLUMN: Wapsi Philosophy & Tax Discrepancy Storytelling       */}
        {/* =================================================================== */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#0c1322] via-[#162238] to-[#0f172a] text-[#f8fafc] p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-line/40">
          {/* Subtle watermark background */}
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none select-none">
            <ShieldCheck size={320} />
          </div>

          <div className="space-y-6 relative z-10">
            {/* Stamp Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-3.5 py-1 text-xs font-mono font-bold text-amber-300 tracking-wider shadow-xs backdrop-blur-xs">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                <span>{ps.sovereignPortal}</span>
              </span>
            </div>

            {/* Brand Headline */}
            <div className="space-y-2 text-start">
              <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white dark:text-white">
                Wapsi (वापसी)
              </h1>
              <p className="text-amber-300 dark:text-amber-300 font-sans text-lg sm:text-xl font-semibold leading-snug">
                {ps.tagline}
              </p>
            </div>

            {/* Tax Discrepancy Questions & Core Value Propositions */}
            <div className="space-y-3.5 pt-1 text-start">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-slate-300 dark:text-slate-300 font-semibold">
                {ps.discrepanciesTitle}
              </h2>

              <div className="space-y-3">
                {/* 1. Excess TDS */}
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 border-l-4 border-l-amber-400 p-3.5 transition duration-200">
                  <TrendingDown size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <strong className="text-white dark:text-white font-sans text-sm block font-bold">
                      {ps.disc1Title}
                    </strong>
                    <p className="text-[#cbd5e1] leading-relaxed text-[12px]">
                      {ps.disc1Desc}
                    </p>
                  </div>
                </div>

                {/* 2. AIS / 26AS Mismatch */}
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 border-l-4 border-l-sky-400 p-3.5 transition duration-200">
                  <Building2 size={20} className="text-sky-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <strong className="text-white dark:text-white font-sans text-sm block font-bold">
                      {ps.disc2Title}
                    </strong>
                    <p className="text-[#cbd5e1] leading-relaxed text-[12px]">
                      {ps.disc2Desc}
                    </p>
                  </div>
                </div>

                {/* 3. Old vs New Regime */}
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 border-l-4 border-l-emerald-400 p-3.5 transition duration-200">
                  <FileCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <strong className="text-white dark:text-white font-sans text-sm block font-bold">
                      {ps.disc3Title}
                    </strong>
                    <p className="text-[#cbd5e1] leading-relaxed text-[12px]">
                      {ps.disc3Desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge - Cleaned: Removed raw port number */}
          <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-2 font-sans font-semibold text-slate-200">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>{ps.vaultBadge}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-400/30">
              AY 2026-27
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Interactive Sign In, Sign Up, Document, Personas     */}
        {/* =================================================================== */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-paper">
          <div>
            {/* Segmented Tabs Bar */}
            <div className="flex rounded-2xl border border-line bg-paper-2 p-1 gap-1 text-xs font-bold mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "signin"
                    ? "bg-paper text-navy shadow-xs border border-line font-bold"
                    : "text-ink-2 hover:text-ink font-semibold"
                }`}
              >
                <LogIn size={14} />
                <span>{ps.signInTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "signup"
                    ? "bg-paper text-money shadow-xs border border-line font-bold"
                    : "text-ink-2 hover:text-ink font-semibold"
                }`}
              >
                <UserPlus size={14} />
                <span>{ps.signUpTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("document")}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "document"
                    ? "bg-paper text-indigo-600 dark:text-indigo-400 shadow-xs border border-line font-bold"
                    : "text-ink-2 hover:text-ink font-semibold"
                }`}
              >
                <FileUp size={14} />
                <span>{ps.docTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("personas")}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "personas"
                    ? "bg-paper text-amber-600 shadow-xs border border-line font-bold"
                    : "text-ink-2 hover:text-ink font-semibold"
                }`}
              >
                <Users size={14} />
                <span>{ps.demoTab}</span>
              </button>
            </div>

            {/* TAB 1: SIGN IN (PAN ONLY) */}
            {activeTab === "signin" && (
              <form onSubmit={onPanSubmit} className="space-y-5 animate-in fade-in">
                <div className="text-start">
                  <h3 className="font-sans text-xl font-bold text-ink">
                    {ps.panOnlyLabel}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1">
                    {ps.panOnlySub}
                  </p>
                </div>

                <div className="space-y-2 text-start">
                  <label htmlFor="auth-pan-input" className="block font-mono text-xs font-semibold uppercase text-ink-2">
                    {t.landing.panLabel}
                  </label>
                  <input
                    id="auth-pan-input"
                    type="text"
                    value={panInput}
                    onChange={(e) => onPanChange(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="DEMPS1234F"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className={`min-h-12 w-full rounded-xl border bg-paper-3 px-4 py-3 text-center font-mono text-xl uppercase tracking-widest text-ink transition-colors ${
                      panInputError ? "border-alarm ring-1 ring-alarm" : "border-line focus:border-money focus:ring-2 focus:ring-money/20"
                    }`}
                  />
                  {panInputError && (
                    <p role="alert" className="text-xs font-semibold text-alarm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{panInputError}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-ink-3 font-mono">
                    {ps.testOtpCode}
                  </p>
                </div>

                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 font-sans text-sm font-bold text-white shadow-md hover:opacity-90 transition cursor-pointer"
                >
                  <KeyRound size={16} />
                  <span>{ps.signInBtn} →</span>
                </button>

                {/* Quick Persona Fill Buttons */}
                <div className="pt-3 border-t border-line/50 text-start">
                  <span className="text-[11px] text-ink-3 font-mono uppercase block mb-2">
                    {ps.quickDemoPan}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onPanChange(PERSONAS.sunita.pan)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-line bg-paper-2 hover:bg-paper-3 font-mono text-ink transition cursor-pointer"
                    >
                      Sunita ({PERSONAS.sunita.pan})
                    </button>
                    <button
                      type="button"
                      onClick={() => onPanChange(PERSONAS.rakesh.pan)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-line bg-paper-2 hover:bg-paper-3 font-mono text-ink transition cursor-pointer"
                    >
                      Rakesh ({PERSONAS.rakesh.pan})
                    </button>
                    <button
                      type="button"
                      onClick={() => onPanChange(PERSONAS.priya.pan)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-line bg-paper-2 hover:bg-paper-3 font-mono text-ink transition cursor-pointer"
                    >
                      Priya ({PERSONAS.priya.pan})
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: SIGN UP (PAN ONLY per user instruction) */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUpSubmit} className="space-y-5 animate-in fade-in">
                <div className="text-start">
                  <h3 className="font-sans text-xl font-bold text-ink">
                    {ps.signUpTitle}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1">
                    {ps.signUpSub}
                  </p>
                </div>

                {signUpError && (
                  <div className="p-3 rounded-xl border border-alarm/30 bg-alarm/10 text-xs text-alarm flex items-center gap-2 text-start">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{signUpError}</span>
                  </div>
                )}

                <div className="space-y-2 text-start">
                  <label htmlFor="signup-pan-input" className="block font-mono text-xs font-semibold uppercase text-ink-2">
                    {ps.panInputLabel}
                  </label>
                  <input
                    id="signup-pan-input"
                    type="text"
                    required
                    value={signUpPan}
                    onChange={(e) => {
                      setSignUpPan(e.target.value.toUpperCase());
                      setSignUpError(null);
                    }}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-h-12 w-full rounded-xl border border-line focus:border-money focus:ring-2 focus:ring-money/20 bg-paper-3 px-4 py-3 text-center font-mono text-xl uppercase tracking-widest text-ink transition-colors"
                  />
                  <div className="rounded-xl border border-line/60 bg-paper-2 p-3.5 text-[11px] text-ink-2 space-y-1 text-start">
                    <div className="flex items-center gap-1.5 font-bold text-ink">
                      <Lock size={12} className="text-emerald-500" />
                      <span>{ps.instantVaultTitle}</span>
                    </div>
                    <p className="leading-relaxed">
                      {ps.instantVaultDesc}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSignUp}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-money px-4 py-3 font-sans text-sm font-bold text-white shadow-md hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSignUp ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{ps.readingDoc}</span>
                    </>
                  ) : (
                    <>
                      <span>{ps.signUpBtnText}</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: SIGN IN WITH TAX DOCUMENT (Form 16 / AIS / PAN Scan) */}
            {activeTab === "document" && (
              <div className="space-y-5 animate-in fade-in text-start">
                <div>
                  <h3 className="font-sans text-xl font-bold text-ink">
                    {ps.docSignInTitle}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1">
                    {ps.docSignInDesc}
                  </p>
                </div>

                {/* Dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void processDocument(file);
                  }}
                />

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
                    if (file) void processDocument(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-navy bg-navy/5"
                      : "border-line hover:border-money hover:bg-paper-2 bg-paper-3"
                  }`}
                >
                  <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                    {docPhase === "reading" ? <Loader2 size={24} className="animate-spin" /> : <FileUp size={24} />}
                  </div>

                  <div className="space-y-1">
                    <p className="font-sans font-bold text-sm text-ink">
                      {ps.dropzoneTitle}
                    </p>
                    <p className="font-mono text-xs text-ink-3">
                      Form 16 Part A/B · AIS / TIS · Form 26AS · PAN scan (.pdf, .png, .jpg, .txt)
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                    {ps.clientSideOnly}
                  </span>
                </div>

                {/* Status Messages */}
                {docStatusMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      docPhase === "error"
                        ? "border-alarm/30 bg-alarm/10 text-alarm"
                        : docPhase === "success"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-line bg-paper-2 text-ink"
                    }`}
                  >
                    {docPhase === "reading" && <Loader2 size={15} className="animate-spin shrink-0 mt-0.5" />}
                    {docPhase === "success" && <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />}
                    {docPhase === "error" && <AlertCircle size={15} className="text-alarm shrink-0 mt-0.5" />}
                    {docPhase === "manual_pan" && <HelpCircle size={15} className="text-indigo-600 shrink-0 mt-0.5" />}
                    <span>{docStatusMsg}</span>
                  </div>
                )}

                {/* Fallback Manual PAN if document had no readable text */}
                {docPhase === "manual_pan" && (
                  <form onSubmit={handleManualPanForDocSubmit} className="space-y-3 pt-1 animate-in fade-in">
                    <label className="block text-xs font-mono uppercase font-semibold text-ink-2">
                      {ps.panInputLabel}:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={manualPanForDoc}
                        onChange={(e) => setManualPanForDoc(e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="DEMPS9052M"
                        className="flex-1 min-h-11 rounded-xl border border-line px-3 font-mono uppercase text-center text-ink"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
                      >
                        {ps.signInBtn}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 4: DEMO PERSONAS */}
            {activeTab === "personas" && (
              <div className="space-y-4 animate-in fade-in text-start">
                <div>
                  <h3 className="font-sans text-xl font-bold text-ink">
                    {ps.demoTitle}
                  </h3>
                  <p className="text-xs text-ink-2 mt-1">
                    {ps.demoSub}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {(["sunita", "rakesh", "priya"] as const).map((id) => {
                    const person = PERSONAS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          onPanChange(person.pan);
                          if (onLaunchPersona) onLaunchPersona(id, true);
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-line bg-paper-2 hover:bg-paper-3 hover:border-money transition text-start cursor-pointer group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-ink">{person.name}</span>
                            <span className="font-mono text-[10px] bg-paper px-2 py-0.5 rounded border border-line text-ink-2">
                              {person.pan}
                            </span>
                          </div>
                          <p className="text-xs text-ink-2">{t.personas[id].phase} · {t.personas[id].action}</p>
                        </div>
                        <ArrowRight size={16} className="text-ink-3 group-hover:text-money group-hover:translate-x-1 transition" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Reassurance - Cleaned: Removed guest exploration per strict security directive */}
          <div className="pt-5 border-t border-line/60 mt-6 flex items-center justify-between text-xs text-ink-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              <Lock size={12} />
              <span>{ps.bankGrade}</span>
            </span>
            <span className="font-mono text-[11px] text-ink-3">
              {ps.authorizedOnly}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
