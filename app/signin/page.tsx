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
import { ArrowLeft, Moon, Sun } from "lucide-react";
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
import type { CitizenVaultUser } from "@/lib/vault/vault-store";
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
      void ensureServerSession(existing).then((r) => (r.ok ? router.replace("/app") : clearSession()));
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

  /* --- the sign-in state machine: portal → code → /app -------------------- */
  const [panInput, setPanInput] = useState("");
  const [panInputError, setPanInputError] = useState<string | null>(null);
  const [pending, setPending] = useState<Persona | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const arrive = useCallback(() => router.replace("/app"), [router]);

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
          {pending ? (
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
        </div>
      </main>
    </div>
  );
}
