"use client";

/**
 * /signin — the sign-in page as its own thing (user request 2026-09-06).
 *
 * It mounts the SAME AuthPortal (Sign In / Sign Up / With Doc / Demo) and
 * OtpScreen the Manual journey uses, under a plain brand bar with language and
 * theme only — no Agentic/Manual switch, no filing flow. A successful sign-in
 * saves the session and the return snapshot, then lands on the Agentic home
 * (/app), where the person decides what to do.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, LayoutDashboard, Moon, ShieldCheck, Sliders, Sparkles, Sun, Zap } from "lucide-react";
import type { IngestedDocument } from "@/context/TaxReturnContext";
import { clearSession, loadSession, saveSession, type SessionInfo } from "@/lib/auth-client";
import { ensureServerSession } from "@/lib/session-client";
import { localize } from "@/components/mock-i18n";
import { dict, isLang } from "@/lib/i18n";
import { isRtl } from "@/lib/i18n/languages";
import { PERSONAS } from "@/lib/personas";
import { save as savePersist } from "@/lib/return/persist";
import { mirrorReturn } from "@/lib/return-sync-client";
import { MOCK_OTP, blankPersona, completeSignIn, panIssueMessage, persistSignIn, personaForPan, returnStateFor, sessionForVaultUser } from "@/lib/signin-flow";
import type { Lang, Persona, PersonaId, Provenance } from "@/lib/types";
import { addDocumentToVault, type CitizenVaultUser } from "@/lib/vault/vault-store";
import AuthPortal from "@/components/auth/auth-portal";
import { PrototypeBanner } from "@/components/agentic/header-frame";
import { LogoMark } from "@/components/brand/logo";
import OtpScreen from "@/components/otp-screen";
import LanguageMenu from "@/components/ui/language-menu";

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-paper" />}>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab");

  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const t = dict(lang);

  /* --- preferences: same keys and effects as the other pages ------------- */
  useEffect(() => {
    const savedLang = localStorage.getItem("wapsi_lang");
    if (savedLang && isLang(savedLang)) setLang(savedLang);
    const savedTheme = localStorage.getItem("wapsi_theme");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    // Already signed in with a session the server accepts: straight to the Agentic home. A stale
    // client-only session (e.g. an old vault sign-up with no backend) is cleared so this page can start over.
    const existing = loadSession();
    if (existing) {
      void ensureServerSession(existing).then((r) => {
        if (r.ok) setShowModeSelect(true);
        else clearSession();
      });
    }
  }, [router]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
    document.body?.classList.toggle("dark", theme === "dark");
    document.body?.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);
  useEffect(() => {
    document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("wapsi_lang", l);
    window.dispatchEvent(new Event("wapsi_lang_change"));
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("wapsi_theme", next);
  };

  /* --- the sign-in state machine: portal → code → mode selection ----------- */
  const [panInput, setPanInput] = useState("");
  const [panInputError, setPanInputError] = useState<string | null>(null);
  const [pending, setPending] = useState<Persona | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const arrive = useCallback(() => {
    setPending(null);
    setShowModeSelect(true);
  }, []);

  const onPanChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setPanInput(clean);
    setPanInputError(panIssueMessage(clean, t) || null);
  };
  const onPanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = panInput.toUpperCase().trim();
    const issue = panIssueMessage(clean, t);
    if (issue) return setPanInputError(issue);
    setPanInputError(null);
    setPending(personaForPan(clean, lang));
    setOtp(["", "", "", "", "", ""]);
    setOtpError(false);
  };
  const onLaunchPersona = async (personaId: PersonaId | "custom", direct?: boolean) => {
    if (personaId === "custom") return;
    const persona = PERSONAS[personaId];
    if (!direct) {
      setPending(persona);
      setOtp(MOCK_OTP.split(""));
      return;
    }
    setAuthBusy(true);
    const res = await fetch("/api/session/demo", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId, pan: persona.pan, displayName: persona.name }),
    });
    if (res.ok) {
      const clientSession: SessionInfo = {
        token: `demo_${persona.id}_${Date.now()}`,
        pan: persona.pan,
        fullName: persona.name,
        personalisedMessage: "Welcome to Wapsi",
        isMock: true,
      };
      saveSession(clientSession);
      const state = returnStateFor(persona, lang);
      savePersist(state);
      try {
        await mirrorReturn(state);
      } catch {}
      setAuthBusy(false);
      return arrive();
    }
    const out = await completeSignIn(persona, MOCK_OTP, lang);
    setAuthBusy(false);
    if (out.ok) arrive();
    else {
      setPending(persona);
      setOtp(MOCK_OTP.split(""));
      setAuthNote(out.reason === "unreachable" ? t.login.authUnreachable : out.reason === "rejected" ? t.login.authRejected(out.detail ?? "") : null);
    }
  };
  const onVerify = async () => {
    if (!pending || authBusy) return;
    const code = otp.join("");
    if (code !== MOCK_OTP) {
      setOtpError(true);
      setAuthNote(null);
      return;
    }
    setAuthBusy(true);
    setAuthNote(t.login.authVerifying);
    setOtpError(false);
    const res = await fetch("/api/session/demo", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: pending.id === "custom" ? "custom" : pending.id, pan: pending.pan, displayName: pending.name }),
    });
    if (res.ok) {
      const clientSession: SessionInfo = {
        token: `demo_${pending.id}_${Date.now()}`,
        pan: pending.pan,
        fullName: pending.name,
        personalisedMessage: "Welcome to Wapsi",
        isMock: true,
      };
      saveSession(clientSession);
      const state = returnStateFor(pending, lang);
      savePersist(state);
      try {
        await mirrorReturn(state);
      } catch {}
      setAuthBusy(false);
      return arrive();
    }
    const out = await completeSignIn(pending, code, lang);
    setAuthBusy(false);
    if (out.ok) return arrive();
    setOtpError(true);
    setAuthNote(out.reason === "unreachable" ? t.login.authUnreachable : out.reason === "rejected" ? t.login.authRejected(out.detail ?? "") : null);
  };
  const onSignUpComplete = async (user: CitizenVaultUser) => {
    // The same path the Manual page takes: a client session for the new account, a clean return.
    setAuthBusy(true);
    const server = await persistSignIn(sessionForVaultUser(user), blankPersona(user.pan, user.fullName ?? "", lang), lang);
    setAuthBusy(false);
    if (server.ok) return arrive();
    clearSession();
    setAuthNote(t.login.authUnreachable);
  };
  const onLaunchWithForm16 = async (doc: IngestedDocument) => {
    const pan = doc.extracted.pan?.trim().toUpperCase() || panInput.toUpperCase().trim() || "";
    if (!pan) {
      setPanInputError(t.validate.panShape);
      throw new Error(t.validate.panShape);
    }
    const base = personaForPan(pan, lang);
    const name = doc.extracted.name?.trim() || base.name;
    const employer = doc.extracted.employerName?.trim() || "Employer";
    const provenance: Provenance = { reporter: `${employer}, per uploaded ${doc.kind}`, reporterKind: "employer", identifier: doc.fileName, filedOn: doc.ingestedAt.slice(0, 10), statement: doc.kind === "AIS" ? "AIS" : "26AS", onlyReporterCanFix: true };
    const persona: Persona = { ...base, name, facts: [...base.facts], taxPaid: [...base.taxPaid] };
    if (doc.extracted.grossSalary !== undefined) {
      const i = persona.facts.findIndex((f) => f.kind === "salary");
      const fact = { id: i >= 0 ? persona.facts[i].id : `form16-salary-${Date.now()}`, label: `Gross salary (${employer})`, amount: doc.extracted.grossSalary, kind: "salary" as const, provenance };
      if (i >= 0) persona.facts[i] = { ...persona.facts[i], ...fact };
      else persona.facts.push(fact);
    }
    if (doc.extracted.tds !== undefined) {
      const i = persona.taxPaid.findIndex((x) => x.section === "192");
      const paid = { id: i >= 0 ? persona.taxPaid[i].id : `form16-tds-${Date.now()}`, label: `TDS u/s 192 (${employer})`, amount: doc.extracted.tds, section: "192", provenance };
      if (i >= 0) persona.taxPaid[i] = { ...persona.taxPaid[i], ...paid };
      else persona.taxPaid.push(paid);
    }
    setAuthBusy(true);
    const res = await fetch("/api/session/demo", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: "custom", pan, displayName: name }),
    });
    if (res.ok) {
      const clientSession: SessionInfo = {
        token: `demo_form16_${pan}_${Date.now()}`,
        pan,
        fullName: name,
        personalisedMessage: "Welcome to Wapsi",
        isMock: true,
      };
      saveSession(clientSession);
      const state = returnStateFor(persona, lang);
      savePersist(state);
      try {
        await mirrorReturn(state);
      } catch {}
      if (doc.file) {
        try {
          const fd = new FormData();
          fd.append("file", doc.file);
          fd.append("docType", doc.kind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16");
          fd.append("assessmentYear", "2026-27");
          if (employer) fd.append("issuer", employer);
          fd.append("title", doc.fileName);
          await fetch("/api/vault/documents", { method: "POST", body: fd });
        } catch {
          // best-effort vault upload
        }
      }
      // Auto-populate Citizen Tax Vault with the document and its extracted figures
      try {
        await addDocumentToVault(pan, {
          id: `doc_${doc.kind.toLowerCase()}_${Date.now()}`,
          title: doc.fileName,
          docType: doc.kind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
          issuer: employer,
          uploadedAt: new Date().toISOString().slice(0, 10),
          sizeKb: doc.file ? Math.max(1, Math.round(doc.file.size / 1024)) : 142,
          status: "verified",
          provenance: "uploaded",
          hasOriginalBytes: Boolean(doc.file),
          fields: {
            pan,
            name,
            employerName: employer,
            grossSalary: doc.extracted.grossSalary,
            tds: doc.extracted.tds,
          },
        });
      } catch (err) {
        console.warn("[SignIn] addDocumentToVault error:", err);
      }
      setAuthBusy(false);
      return arrive();
    }
    const out = await completeSignIn(persona, MOCK_OTP, lang);
    setAuthBusy(false);
    if (out.ok) {
      if (doc.file) {
        try {
          const fd = new FormData();
          fd.append("file", doc.file);
          fd.append("docType", doc.kind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16");
          fd.append("assessmentYear", "2026-27");
          if (employer) fd.append("issuer", employer);
          fd.append("title", doc.fileName);
          await fetch("/api/vault/documents", { method: "POST", body: fd });
        } catch {
          // best-effort vault upload
        }
      }
      try {
        await addDocumentToVault(pan, {
          id: `doc_${doc.kind.toLowerCase()}_${Date.now()}`,
          title: doc.fileName,
          docType: doc.kind === "AIS" ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
          issuer: employer,
          uploadedAt: new Date().toISOString().slice(0, 10),
          sizeKb: doc.file ? Math.max(1, Math.round(doc.file.size / 1024)) : 142,
          status: "verified",
          provenance: "uploaded",
          hasOriginalBytes: Boolean(doc.file),
          fields: {
            pan,
            name,
            employerName: employer,
            grossSalary: doc.extracted.grossSalary,
            tds: doc.extracted.tds,
          },
        });
      } catch (err) {
        console.warn("[SignIn] addDocumentToVault error:", err);
      }
      arrive();
    } else {
      setPending(persona);
      setOtp(MOCK_OTP.split(""));
    }
  };
  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    setOtp((prev) => prev.map((d, i) => (i === index ? digit : d)));
    setOtpError(false);
    if (digit) (document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null)?.focus();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      <PrototypeBanner t={t} />
      <header className="h-[56px] shrink-0 px-4 flex items-center gap-3">
        <a href="/" className="flex items-center shrink-0 hover:opacity-80" aria-label={t.shell.productName}>
          <LogoMark t={t} size="sm" />
        </a>
        <a href="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft size={14} aria-hidden="true" /> {localize("Back to home", lang)}
        </a>
        <div className="flex-1" />
        <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} className="shrink-0" />
        <button type="button" onClick={toggleTheme} className="size-[38px] rounded-full border border-line bg-paper-2 text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer shrink-0" aria-label={theme === "dark" ? t.shell.light : t.shell.dark}>
          {theme === "dark" ? <Sun size={15} className="text-money" aria-hidden="true" /> : <Moon size={15} className="text-money" aria-hidden="true" />}
        </button>
      </header>

      <main id="main-content" className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-5xl">
          {showModeSelect ? (
            <div className="mx-auto w-full max-w-4xl text-center py-6 sm:py-12 space-y-9 animate-in fade-in zoom-in-95 duration-200">
              {/* Header block with status pill and rich typography */}
              <div className="space-y-3.5 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Session Authenticated · AY 2026-27</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight text-balance">
                  Choose Your Filing Path
                </h1>
                <p className="text-sm sm:text-base text-ink-2 leading-relaxed text-balance">
                  Wapsi offers two distinct ways to file with full mathematical parity. Switch between autonomous AI assistance and granular visual control at any time.
                </p>
              </div>

              {/* Two Master Choice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 text-start">
                {/* Card 1: Agentic Copilot Mode */}
                <div
                  onClick={() => {
                    try { localStorage.setItem("wapsi_user_mode", "agentic"); } catch {}
                    router.replace("/app");
                  }}
                  className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl border-2 border-amber-500/40 hover:border-money bg-paper shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Subtle decorative aura */}
                  <div className="absolute -top-16 -right-16 size-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />

                  <div className="space-y-6 relative">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="size-13 rounded-2xl bg-amber-bg border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Bot size={26} aria-hidden="true" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-bg text-amber-800 dark:text-amber-200 border border-amber-500/30">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Recommended · AI Autonomous</span>
                      </span>
                    </div>

                    {/* Headline & Description */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-money transition font-serif">
                        Agentic Copilot Mode
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-2 mt-2 leading-relaxed">
                        Conversational AI agent that reads your Form 16, checks AIS/26AS, optimizes deductions, and files your return step-by-step.
                      </p>
                    </div>

                    {/* Feature Pillars */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Zero Data Entry:</strong> Auto-reads PDF & DigiLocker Form 16 in seconds</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>AIS/26AS Audit:</strong> Detects mismatches & auto-stages CBDT feedback</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Regime Optimizer:</strong> Computes exact rupee delta between New & Old</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>CA Collaboration:</strong> 1-click review sharing with your trusted CA</span>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-8 pt-5 border-t border-line/70">
                    <button
                      type="button"
                      className="w-full py-3.5 px-5 rounded-2xl bg-ink text-paper group-hover:bg-money group-hover:text-white font-semibold text-sm flex items-center justify-between transition-all duration-200 shadow-sm cursor-pointer"
                    >
                      <span>Launch Agentic Copilot</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Card 2: Manual Filing Mode */}
                <div
                  onClick={() => {
                    try { localStorage.setItem("wapsi_user_mode", "manual"); } catch {}
                    router.replace("/");
                  }}
                  className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl border-2 border-line hover:border-ink-2 bg-paper shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="space-y-6 relative">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="size-13 rounded-2xl bg-paper-3 border border-line text-ink flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <LayoutDashboard size={26} aria-hidden="true" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-paper-3 text-ink-2 border border-line">
                        <Sliders size={12} className="text-ink-3" />
                        <span>Visual 5-Step · Full Control</span>
                      </span>
                    </div>

                    {/* Headline & Description */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-money transition font-serif">
                        Manual Filing Mode
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-2 mt-2 leading-relaxed">
                        Hands-on, visual 5-step interactive workflow with full control over each deduction and tax head.
                      </p>
                    </div>

                    {/* Feature Pillars */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>Structured 5-Stage Form:</strong> Guided steps from Income to Final ITR-V</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>Direct Rupee Precision:</strong> Fine-tune 80C, 80D, 80CCD, HRA & 24(b)</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>Live Calculation Meter:</strong> Real-time tax breakdown & marginal relief</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>Zero Lock-in:</strong> Client-side storage with instant export and reset</span>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-8 pt-5 border-t border-line/70">
                    <button
                      type="button"
                      className="w-full py-3.5 px-5 rounded-2xl border-2 border-line bg-paper-2 group-hover:border-ink-2 text-ink font-semibold text-sm flex items-center justify-between transition-all duration-200 shadow-xs cursor-pointer"
                    >
                      <span>Enter Manual Dashboard</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Assurance Strip */}
              <div className="pt-2">
                <p className="text-xs text-ink-3 font-mono flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-money shrink-0" />
                  <span>Both modes use the exact same AY 2026-27 statutory calculation engine and secure Tax Vault.</span>
                </p>
              </div>
            </div>
          ) : pending ? (
            <OtpScreen
              persona={pending}
              t={t}
              otp={otp}
              otpError={otpError}
              authNote={authNote}
              authBusy={authBusy}
              mockCode={MOCK_OTP}
              handleOtpChange={handleOtpChange}
              onAutoFill={() => {
                setOtp(MOCK_OTP.split(""));
                setOtpError(false);
              }}
              onBack={() => {
                setPending(null);
                setAuthNote(null);
              }}
              onVerify={() => void onVerify()}
            />
          ) : (
            <AuthPortal
              t={t}
              lang={lang}
              panInput={panInput}
              panInputError={panInputError}
              onPanChange={onPanChange}
              onPanSubmit={onPanSubmit}
              onLaunchPersona={(id, direct) => void onLaunchPersona(id, direct)}
              onSignUpComplete={(u) => void onSignUpComplete(u)}
              onLaunchWithForm16={(d) => void onLaunchWithForm16(d)}
              initialTab={initialTab === "personas" || initialTab === "signup" || initialTab === "document" ? initialTab : undefined}
              authBusy={authBusy}
            />
          )}

          {/* Chartered Accountant Entry Link */}
          <div className="mt-8 text-center">
            <a
              href="/ca"
              className="inline-flex items-center gap-2 text-xs font-semibold text-ink-3 hover:text-teal-700 dark:hover:text-teal-400 transition"
            >
              <span>Are you a Chartered Accountant or Tax Professional?</span>
              <span className="font-bold underline">Access Client Review Portal →</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
