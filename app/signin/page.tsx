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
import { ArrowLeft, ArrowRight, CheckCircle2, LayoutDashboard, Moon, ShieldCheck, Sliders, Sparkles, Sun, Zap } from "lucide-react";
import { MunshiAvatar } from "@/components/brand/munshi";
import Onboarding, { type OnboardingIdentitySeed } from "@/components/onboarding";
import { applyProfileToReturn, isPlaceholderName, loadOnboardingDraft, loadOnboardingProfile, saveOnboardingProfile, type OnboardingProfile } from "@/lib/onboarding";
import type { IngestedDocument } from "@/context/TaxReturnContext";
import { clearSession, loadSession, saveSession, type SessionInfo } from "@/lib/auth-client";
import { ensureServerSession } from "@/lib/session-client";
import { localize } from "@/components/mock-i18n";
import { dict, isLang } from "@/lib/i18n";
import { PERSONAS, findPersonaByPan } from "@/lib/personas";
import { load as loadPersist, save as savePersist } from "@/lib/return/persist";
import { emptyYearIntake } from "@/lib/return/year-intake";
import { mirrorReturn } from "@/lib/return-sync-client";
import { MOCK_OTP, blankPersona, completeSignIn, panIssueMessage, persistSignIn, personaForPan, returnStateFor, sessionForVaultUser } from "@/lib/signin-flow";
import type { Lang, Persona, PersonaId, Provenance, IncomeFact, TaxPaid } from "@/lib/types";
import { addDocumentToVault, getLocalVaultUser, setLocalVaultUser, type CitizenVaultUser } from "@/lib/vault/vault-store";
import AuthPortal from "@/components/auth/auth-portal";
import { PrototypeBanner } from "@/components/agentic/header-frame";
import { BrandBox } from "@/components/agentic/header-frame";
import OtpScreen from "@/components/otp-screen";
import LanguageMenu from "@/components/ui/language-menu";
import LegalNameModal from "@/components/auth/legal-name-modal";

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
    if (savedTheme === "dark") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
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
  // Keep form and document layout in standard LTR structure so forms, cards,
  // badges, and inputs never shift or invert sides for Urdu/RTL.
  useEffect(() => {
    document.documentElement.dir = "ltr";
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
  // The quick setup (language, intent, situation, mode, focus) runs once, only when an account is created
  // here — never on a returning sign-in (user, 2026-09-07). "Change answers" on the dashboard reopens it later.
  const [showOnboarding, setShowOnboarding] = useState(false);
  /** The account just created — its PAN and name seed the profile's identity screen. */
  const [newUser, setNewUser] = useState<CitizenVaultUser | null>(null);
  /** The same seed for the other first-time doors: an unknown PAN, or a Form 16 we just read a name off. */
  const [identitySeed, setIdentitySeed] = useState<OnboardingIdentitySeed | undefined>(undefined);

  const arrive = useCallback((opts?: { newAccount?: boolean; pan?: string }) => {
    setPending(null);
    // Onboarding runs once, for a person this browser does not know yet: an account just created, or a
    // sign-in with a PAN / Form 16 that is not one of the seeded demo citizens — that is a new account in
    // everything but name (user, 2026-09-09). A seeded demo persona already has its name, banks and figures,
    // so it goes straight through, and anyone who already has a profile is never asked twice.
    const firstTimeHere = opts?.newAccount || (opts?.pan ? !findPersonaByPan(opts.pan) : false);
    if (firstTimeHere && !loadOnboardingProfile()) setShowOnboarding(true);
    else setShowModeSelect(true);
  }, []);

  const finishOnboarding = (profile: OnboardingProfile) => {
    saveOnboardingProfile(profile);
    // The person the PAN record named replaces the sign-up placeholder on the return and the session (2026-09-07).
    const stored = loadPersist();
    if (stored && "state" in stored) {
      const applied = applyProfileToReturn(stored.state, profile);
      savePersist(applied);
      // …and on the server's copy, which was created at sign-up with the placeholder. Without this push the
      // next pull overwrites the name everywhere it is shown (user, 2026-09-09).
      void mirrorReturn(applied).catch(() => undefined);
    }
    const sess = loadSession();
    if (sess && profile.identity.name && sess.pan === profile.identity.pan) saveSession({ ...sess, fullName: profile.identity.name });
    // The vault card and the document previews read the vault record's own name, not the return's.
    const vault = getLocalVaultUser();
    if (vault && vault.pan === profile.identity.pan && profile.identity.name && isPlaceholderName(vault.fullName)) {
      setLocalVaultUser({ ...vault, fullName: profile.identity.name, email: vault.email || profile.contact.email, mobile: vault.mobile || profile.contact.mobile, address: vault.address || profile.contact.address });
    }
    if (profile.lang !== lang) {
      setLang(profile.lang);
      localStorage.setItem("wapsi_lang", profile.lang);
      window.dispatchEvent(new Event("wapsi_lang_change"));
    }
    try {
      localStorage.setItem("wapsi_user_mode", profile.mode === "full" ? "manual" : "agentic");
    } catch {}
    setShowOnboarding(false);
    setShowModeSelect(true);
  };

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
    // An unknown PAN is a first-time person: carry it into onboarding so the identity screen starts filled.
    if (!findPersonaByPan(clean)) setIdentitySeed({ pan: clean, name: "" });
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
      return arrive({ pan: persona.pan });
    }
    const out = await completeSignIn(persona, MOCK_OTP, lang);
    setAuthBusy(false);
    if (out.ok) arrive({ pan: persona.pan });
    else {
      setPending(persona);
      setOtp(MOCK_OTP.split(""));
      setAuthNote(out.reason === "unreachable" ? t.login.authUnreachable : out.reason === "rejected" ? t.login.authRejected(out.detail ?? "") : null);
    }
  };
  const [showNameModal, setShowNameModal] = useState(false);

  const finishSignInWithPersona = async (personaToUse: Persona) => {
    setAuthBusy(true);
    setAuthNote(t.login.authVerifying);
    setOtpError(false);
    const res = await fetch("/api/session/demo", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: personaToUse.id === "custom" ? "custom" : personaToUse.id, pan: personaToUse.pan, displayName: personaToUse.name }),
    });
    if (res.ok) {
      const clientSession: SessionInfo = {
        token: `demo_${personaToUse.id}_${Date.now()}`,
        pan: personaToUse.pan,
        fullName: personaToUse.name,
        personalisedMessage: "Welcome to Wapsi",
        isMock: true,
      };
      saveSession(clientSession);
      const state = returnStateFor(personaToUse, lang);
      savePersist(state);
      try {
        await mirrorReturn(state);
      } catch {}
      setAuthBusy(false);
      return arrive({ pan: personaToUse.pan });
    }
    const out = await completeSignIn(personaToUse, MOCK_OTP, lang);
    setAuthBusy(false);
    if (out.ok) return arrive({ pan: personaToUse.pan });
    setOtpError(true);
    setAuthNote(out.reason === "unreachable" ? t.login.authUnreachable : out.reason === "rejected" ? t.login.authRejected(out.detail ?? "") : null);
  };

  const onVerify = async () => {
    if (!pending || authBusy) return;
    const code = otp.join("");
    if (code !== MOCK_OTP) {
      setOtpError(true);
      setAuthNote(null);
      return;
    }
    // If citizen entered custom PAN with default placeholder name, capture their full legal name
    if (pending.id === "custom" && (!pending.name || /^Citizen\s+\d{4}$/i.test(pending.name))) {
      setShowNameModal(true);
      return;
    }
    await finishSignInWithPersona(pending);
  };

  const handleConfirmLegalName = async (fullName: string) => {
    if (!pending) return;
    const updated = { ...pending, name: fullName };
    setPending(updated);
    setShowNameModal(false);
    await finishSignInWithPersona(updated);
  };
  const onSignUpComplete = async (user: CitizenVaultUser) => {
    // The same path the Manual page takes: a client session for the new account, a clean return.
    setAuthBusy(true);
    const server = await persistSignIn(sessionForVaultUser(user), blankPersona(user.pan, user.fullName ?? "", lang), lang);
    setAuthBusy(false);
    setNewUser(user);
    if (server.ok) return arrive({ newAccount: true });
    clearSession();
    setAuthNote(t.login.authUnreachable);
  };
  const onLaunchWithForm16 = async (doc: IngestedDocument) => {
    const isAis = doc.kind === "AIS" || /ais|annual\s*info|tis/i.test(doc.fileName);
    const docKind: "FORM_16" | "AIS" = isAis ? "AIS" : "FORM_16";
    const pan = doc.extracted.pan?.trim().toUpperCase() || panInput.toUpperCase().trim() || "";
    if (!pan) {
      setPanInputError(t.validate.panShape);
      throw new Error(t.validate.panShape);
    }
    const base = personaForPan(pan, lang);
    const name = doc.extracted.name?.trim() || base.name;
    // The document already named them; onboarding starts from that instead of an empty identity screen.
    setIdentitySeed({ pan, name: doc.extracted.name?.trim() || "" });

    const employer = doc.extracted.employerName?.trim() || (isAis ? "Income Tax Department" : "Employer");
    const statement: Provenance["statement"] = isAis ? "AIS" : "26AS";
    const provenance: Provenance = {
      reporter: `${employer}, per uploaded ${docKind}`,
      reporterKind: isAis ? "bank" : "employer",
      identifier: doc.fileName,
      filedOn: doc.ingestedAt.slice(0, 10),
      statement,
      onlyReporterCanFix: true,
    };

    let facts: IncomeFact[] = [];
    let taxPaid: TaxPaid[] = [];

    if (isAis) {
      // AIS Mode: clear Form 16 cache; record AIS
      if (typeof window !== "undefined") {
        localStorage.removeItem("wapsi_ingested_form16");
        localStorage.setItem("wapsi_ingested_ais", JSON.stringify({ ...doc, kind: "AIS" }));
      }

      // Extract interest & other income rows (NO salary fact so portal correctly asks for Form 16)
      if (doc.extracted.otherIncome && doc.extracted.otherIncome.length > 0) {
        for (const item of doc.extracted.otherIncome) {
          facts.push({
            id: `ais-${item.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label: item.label || (item.kind === "interest" ? `Deposit & Savings Interest (${item.reporter})` : `Dividend (${item.reporter})`),
            amount: item.amount,
            kind: item.kind,
            provenance: {
              reporter: item.reporter || "AIS",
              reporterKind: item.kind === "dividend" ? "broker" : "bank",
              identifier: item.identifier || doc.fileName,
              filedOn: doc.ingestedAt.slice(0, 10),
              statement: "AIS",
              onlyReporterCanFix: true,
            },
          });
        }
      } else {
        // Fallback AIS interest row if not explicitly broken down
        facts.push({
          id: `ais-interest-${Date.now()}`,
          label: "Savings & Deposit Interest (AIS)",
          amount: 28400,
          kind: "interest",
          provenance: {
            reporter: "State Bank of India (AIS)",
            reporterKind: "bank",
            identifier: doc.fileName,
            filedOn: doc.ingestedAt.slice(0, 10),
            statement: "AIS",
            onlyReporterCanFix: true,
          },
        });
      }

      if (doc.extracted.tdsOther && doc.extracted.tdsOther.length > 0) {
        for (const item of doc.extracted.tdsOther) {
          taxPaid.push({
            id: `ais-tds-${item.section}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label: `TDS u/s ${item.section} (${item.reporter})`,
            amount: item.amount,
            section: item.section,
            provenance: {
              reporter: item.reporter || "Bank per AIS",
              reporterKind: "bank",
              identifier: doc.fileName,
              filedOn: doc.ingestedAt.slice(0, 10),
              statement: "AIS",
              onlyReporterCanFix: true,
            },
          });
        }
      } else if (doc.extracted.tds && doc.extracted.tds > 0) {
        taxPaid.push({
          id: `ais-tds-194a-${Date.now()}`,
          label: "TDS on Interest u/s 194A (AIS)",
          amount: doc.extracted.tds,
          section: "194A",
          provenance: {
            reporter: "Bank per AIS",
            reporterKind: "bank",
            identifier: doc.fileName,
            filedOn: doc.ingestedAt.slice(0, 10),
            statement: "AIS",
            onlyReporterCanFix: true,
          },
        });
      }
    } else {
      // Form 16 Mode: clear AIS cache; record Form 16
      if (typeof window !== "undefined") {
        localStorage.removeItem("wapsi_ingested_ais");
        localStorage.setItem("wapsi_ingested_form16", JSON.stringify({ ...doc, kind: "FORM_16" }));
      }

      if (doc.extracted.grossSalary !== undefined) {
        facts.push({
          id: `form16-salary-${Date.now()}`,
          label: `Gross salary (${employer})`,
          amount: doc.extracted.grossSalary,
          kind: "salary",
          provenance,
        });
      }
      if (doc.extracted.tds !== undefined) {
        taxPaid.push({
          id: `form16-tds-${Date.now()}`,
          label: `TDS u/s 192 (${employer})`,
          amount: doc.extracted.tds,
          section: "192",
          provenance,
        });
      }
    }

    const persona: Persona = {
      ...base,
      id: "custom",
      name,
      pan,
      facts,
      taxPaid,
      refund: {
        state: "not_filed",
        amount: taxPaid.reduce((s, t) => s + t.amount, 0),
        holds: [],
        timeline: [],
      },
    };

    setAuthBusy(true);
    const res = await fetch("/api/session/demo", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: "custom", pan, displayName: name }),
    });
    if (res.ok) {
      const clientSession: SessionInfo = {
        token: `demo_${docKind.toLowerCase()}_${pan}_${Date.now()}`,
        pan,
        fullName: name,
        personalisedMessage: "Welcome to Wapsi",
        isMock: true,
      };
      saveSession(clientSession);
      const state = returnStateFor(persona, lang);
      const now = new Date().toISOString();
      state.yearIntake = {
        ...emptyYearIntake("2026-27", now),
        intent: "file_return",
        sources: {
          chosen: "manual",
          consentAt: now,
          documents: {
            form16: isAis ? [] : [doc.fileName],
            ais: isAis ? doc.fileName : undefined,
          },
        },
      };
      savePersist(state);
      try {
        await mirrorReturn(state);
      } catch {}
      if (doc.file) {
        try {
          const fd = new FormData();
          fd.append("file", doc.file);
          fd.append("docType", isAis ? "ANNUAL_INFO_STATEMENT" : "FORM_16");
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
          id: `doc_${docKind.toLowerCase()}_${Date.now()}`,
          title: doc.fileName,
          docType: isAis ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
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
            otherIncome: doc.extracted.otherIncome,
            tdsOther: doc.extracted.tdsOther,
            exemptAllowances: doc.extracted.exemptAllowances,
            employerClaims: doc.extracted.employerClaims,
            ltcg112A: doc.extracted.ltcg112A,
          },
        });
      } catch (err) {
        console.warn("[SignIn] addDocumentToVault error:", err);
      }
      setAuthBusy(false);
      return arrive({ pan });
    }
    const out = await completeSignIn(persona, MOCK_OTP, lang);
    setAuthBusy(false);
    if (out.ok) {
      if (doc.file) {
        try {
          const fd = new FormData();
          fd.append("file", doc.file);
          fd.append("docType", isAis ? "ANNUAL_INFO_STATEMENT" : "FORM_16");
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
          id: `doc_${docKind.toLowerCase()}_${Date.now()}`,
          title: doc.fileName,
          docType: isAis ? "ANNUAL_INFO_STATEMENT" : "FORM_16",
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
            otherIncome: doc.extracted.otherIncome,
            tdsOther: doc.extracted.tdsOther,
            exemptAllowances: doc.extracted.exemptAllowances,
            employerClaims: doc.extracted.employerClaims,
            ltcg112A: doc.extracted.ltcg112A,
          },
        });
      } catch (err) {
        console.warn("[SignIn] addDocumentToVault error:", err);
      }
      arrive({ pan });
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
      <header className="h-[64px] max-md:h-[56px] shrink-0 px-6 max-md:px-4 flex items-center gap-3.5 max-md:gap-2.5">
        <a href="/" className="hidden md:flex items-center shrink-0 hover:opacity-80" aria-label={t.shell.productName}>
          <BrandBox t={t} />
        </a>
        {/* M2: a back circle and the screen title instead of the brand box */}
        <a href="/" className="md:hidden glass-flat size-9 rounded-full flex items-center justify-center text-ink shrink-0" aria-label={localize("Back to home", lang)}>
          <ArrowLeft size={16} aria-hidden="true" />
        </a>
        <span className="md:hidden flex-1 min-w-0 truncate text-[16px] font-extrabold text-ink">
          {showOnboarding ? t.onboarding.eyebrow : pending ? t.login.portalHeading : localize("Sign in", lang)}
        </span>
        <div className="hidden md:block flex-1" />
        <LanguageMenu lang={lang} onChange={changeLang} label={t.shell.language} className="shrink-0" />
        <button type="button" onClick={toggleTheme} className="glass-flat size-[38px] rounded-full text-ink-2 hover:text-ink flex items-center justify-center cursor-pointer shrink-0" aria-label={theme === "dark" ? t.shell.light : t.shell.dark}>
          {theme === "dark" ? <Sun size={15} className="text-money" aria-hidden="true" /> : <Moon size={15} className="text-money" aria-hidden="true" />}
        </button>
        <a href="/" className="hidden sm:inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={14} aria-hidden="true" /> {localize("Back to home", lang)}
        </a>
      </header>

      <main id="main-content" className="own-width flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-5xl">
          {showOnboarding ? (
            <Onboarding
              lang={lang}
              t={t}
              initialDraft={loadOnboardingDraft()}
              onLanguageChange={changeLang}
              onComplete={finishOnboarding}
              identity={newUser ? { pan: newUser.pan, name: newUser.fullName, dob: newUser.dateOfBirth, mobile: newUser.mobile, email: newUser.email, address: newUser.address } : identitySeed}
            />
          ) : showModeSelect ? (
            <div className="mx-auto w-full max-w-4xl text-center py-6 sm:py-12 space-y-9 animate-in fade-in zoom-in-95 duration-200">
              {/* Header block with status pill and rich typography */}
              <div className="space-y-3.5 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-ok-soft text-ok-ink shadow-xs">
                  <span className="size-2 rounded-full bg-ok" />
                  <span>{localize("Session Authenticated · AY 2026-27", lang)}</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight text-balance">
                  {localize("Choose Your Filing Path", lang)}
                </h1>
                <p className="text-sm sm:text-base text-ink-2 leading-relaxed text-balance">
                  {localize("Wapsi offers two distinct ways to file with full mathematical parity. Switch between autonomous AI assistance and granular visual control at any time.", lang)}
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
                  className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-[26px] border-2 border-money/40 hover:border-money glass hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Subtle decorative aura */}
                  <div className="absolute -top-16 -right-16 size-36 bg-money/10 rounded-full blur-2xl pointer-events-none group-hover:bg-money/15 transition-all" />

                  <div className="space-y-6 relative">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="group-hover:scale-105 transition-transform">
                        <MunshiAvatar size={52} state="explaining" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-bg text-amber-ink">
                        <Sparkles size={12} className="text-money" />
                        <span>{localize("Recommended · AI Autonomous", lang)}</span>
                      </span>
                    </div>

                    {/* Headline & Description */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-money transition font-serif">
                        {localize("Agentic Copilot Mode", lang)}
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-2 mt-2 leading-relaxed">
                        {localize("Conversational AI agent that reads your Form 16, checks AIS/26AS, optimizes deductions, and files your return step-by-step.", lang)}
                      </p>
                    </div>

                    {/* Feature Pillars */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />
                        <span><strong>{localize("Zero Data Entry:", lang)}</strong> {localize("Auto-reads PDF & DigiLocker Form 16 in seconds", lang)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />
                        <span><strong>{localize("AIS/26AS Audit:", lang)}</strong> {localize("Detects mismatches & auto-stages CBDT feedback", lang)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />
                        <span><strong>{localize("Regime Optimizer:", lang)}</strong> {localize("Computes exact rupee delta between New & Old", lang)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />
                        <span><strong>{localize("CA Collaboration:", lang)}</strong> {localize("1-click review sharing with your trusted CA", lang)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-8 pt-5 border-t border-line/70">
                    <button
                      type="button"
                      className="w-full h-[50px] px-5 rounded-[14px] ink-surface group-hover:opacity-90 font-bold text-[14.5px] flex items-center justify-between transition-all duration-200 shadow-sm cursor-pointer"
                    >
                      <span>{localize("Launch Agentic Copilot", lang)}</span>
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
                  className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-[26px] border-2 border-glass-edge hover:border-ink-2 glass hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="space-y-6 relative">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div className="size-[52px] rounded-[14px] glass-flat text-ink flex items-center justify-center group-hover:scale-105 transition-transform">
                        <LayoutDashboard size={26} aria-hidden="true" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-paper-3 text-ink-2 border border-line">
                        <Sliders size={12} className="text-ink-3" />
                        <span>{localize("Visual 5-Step · Full Control", lang)}</span>
                      </span>
                    </div>

                    {/* Headline & Description */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-money transition font-serif">
                        {localize("Manual Filing Mode", lang)}
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-2 mt-2 leading-relaxed">
                        {localize("Hands-on, visual 5-step interactive workflow with full control over each deduction and tax head.", lang)}
                      </p>
                    </div>

                    {/* Feature Pillars */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>{localize("Structured 5-Stage Form:", lang)}</strong> {localize("Guided steps from Income to Final ITR-V", lang)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>{localize("Direct Rupee Precision:", lang)}</strong> {localize("Fine-tune 80C, 80D, 80CCD, HRA & 24(b)", lang)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>{localize("Live Calculation Meter:", lang)}</strong> {localize("Real-time tax breakdown & marginal relief", lang)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-ink-2">
                        <CheckCircle2 size={15} className="text-ink-3 shrink-0 mt-0.5" />
                        <span><strong>{localize("Zero Lock-in:", lang)}</strong> {localize("Client-side storage with instant export and reset", lang)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-8 pt-5 border-t border-line/70">
                    <button
                      type="button"
                      className="w-full h-[50px] px-5 rounded-[14px] glass-flat group-hover:border-ink-2 text-ink font-bold text-[14.5px] flex items-center justify-between transition-all duration-200 shadow-xs cursor-pointer"
                    >
                      <span>{localize("Enter Manual Dashboard", lang)}</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Assurance Strip */}
              <div className="pt-2">
                <p className="text-xs text-ink-3 font-mono flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-money shrink-0" />
                  <span>{localize("Both modes use the exact same AY 2026-27 statutory calculation engine and secure Tax Vault.", lang)}</span>
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
        </div>
      </main>

      <LegalNameModal
        pan={pending?.pan || panInput}
        lang={lang}
        initialName={pending?.name || ""}
        isOpen={showNameModal}
        onConfirm={(name) => void handleConfirmLegalName(name)}
        onCancel={() => setShowNameModal(false)}
      />
    </div>
  );
}
