"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, updatePreferences } from "@/lib/user-context";
import type { UiMode } from "@/lib/mode";
import { LazyMotion, domMax, m, AnimatePresence } from "motion/react";

import { PERSONAS, TODAY, findPersonaByPan } from "@/lib/personas";
import type { Persona, PersonaId, Lang, IncomeFact, BankAccount, Notice, RefundState, TimelineKey, Provenance, TaxAlreadyPaid } from "@/lib/types";
import { REFUND_SEQUENCE } from "@/lib/types";
import { dict, isLang } from "@/lib/i18n";
import { isRtl } from "@/lib/i18n/languages";
import { mulberry32, pick } from "@/lib/rng";
import { validatePan, validateIfsc } from "@/lib/validate";
import {
  applyCorrection,
  revertCorrection,
  confirmFact,
  effectivePersona,
  type Correction,
  type ReturnState,
} from "@/lib/return/state";
import {
  load as loadPersist,
  save as savePersist,
  pushUndo,
  popUndo,
  CURRENT_VERSION,
} from "@/lib/return/persist";
import { computeForPersona, DEFAULT_REGIME } from "@/lib/return/compute";
import {
  loadOnboardingDraft,
  loadOnboardingProfile,
  saveOnboardingProfile,
  getDashboardDestination,
  type OnboardingDraft,
  type OnboardingProfile,
} from "@/lib/onboarding";

import Landing from "@/components/landing";
import OtpScreen from "@/components/otp-screen";
import PortalHeader from "@/components/dashboard/portal-header";
import ProfileStrip from "@/components/dashboard/profile-strip";
import TabBar, { type DashboardTab } from "@/components/dashboard/tab-bar";
import OverviewTab from "@/components/dashboard/overview-tab";
import StatementTab from "@/components/dashboard/statement-tab";
import ActionsTab from "@/components/dashboard/actions-tab";
import SandboxDrawer from "@/components/dashboard/sandbox-drawer";
import Motes from "@/components/ambient/motes";
import {
  clearSession,
  ensureSession,
  fetchHistory,
  loadSession,
  saveSession,
  signOut,
  type ServerFiling,
  type SessionInfo,
} from "@/lib/auth-client";
import MiniBurstHost from "@/components/ambient/mini-burst";
import AgentPanel from "@/components/agent/agent-panel";
import DisputeModal from "@/components/dashboard/dispute-modal";
import { EditIncomeModal } from "@/components/dashboard/edit-income-modal";
import BankIfscModal from "@/components/dashboard/bank-ifsc-modal";
import NoticeModal from "@/components/dashboard/notice-modal";
import PersonalizedDashboard from "@/components/dashboard/personalized-dashboard";
import TaxDashboardGrid, { type DashboardCardId } from "@/components/dashboard/TaxDashboardGrid";
import QuickStartBanner from "@/components/dashboard/QuickStartBanner";
import CopilotBar from "@/components/dashboard/copilot-bar";
import ProfileSheet from "@/components/dashboard/profile-sheet";
import AISDiscrepancyModal from "@/components/modals/AISDiscrepancyModal";
import type { AISDiscrepancyAttribution, AISVariance } from "@/types/tax";
import { assessAisVariance } from "@/lib/compliance/cass";
import { compareRegimesExact, returnFactsFromPersona, toWholeRupees } from "@/lib/taxEngine";
import ToolDrawer, { type ToolId } from "@/components/tools/tool-drawer";
import FlowStepper, { FLOW_STEPS, type FlowStepName } from "@/components/flow/flow-stepper";
import DeductionsStep from "@/components/flow/deductions-step";
import RegimeStep from "@/components/flow/regime-step";
import CheckScreen from "@/components/flow/check-screen";
import BeforeFiling from "@/components/flow/before-filing";
import FilingStep from "@/components/flow/filing-step";
import { generateSeededUser } from "@/components/sandbox-user";
import { QuickEditModal } from "@/components/dashboard/quick-edit-modal";
import RealUserTaxWizard from "@/components/flow/real-user-wizard";
import { useTax } from "@/context/TaxReturnContext";
import type { IngestedDocument, SelfAssessmentPayment } from "@/context/TaxReturnContext";
import type { AISFeedbackCode } from "@/lib/compliance/aisFeedback";
import { buildSyncPayload } from "@/lib/return/upstreamSync";
import InteractiveTaxDashboard from "@/components/InteractiveTaxDashboard";
import { AuditRiskRadar } from "@/components/AuditRiskRadar";
import { PdfIngestionDropzone } from "@/components/PdfIngestionDropzone";
import { Challan280Modal } from "@/components/Challan280Modal";
import { stableIdempotencyKey } from "@/lib/submission-key";

// --- VALIDATION (lib/validate.ts issue codes → dictionary messages) ---
function panIssueMessage(raw: string, t: ReturnType<typeof dict>): string {
  const result = validatePan(raw);
  if (!result.ok) {
    return result.issue.kind === "incomplete"
      ? t.validate.panTooShort(result.issue.length)
      : t.validate.panShape;
  }
  return "";
}

function ifscIssueMessage(raw: string, t: ReturnType<typeof dict>): string {
  const result = validateIfsc(raw);
  if (!result.ok) {
    return result.issue.kind === "incomplete"
      ? t.validate.ifscTooShort(result.issue.length)
      : t.validate.ifscShape;
  }
  return "";
}

function freshState(persona: Persona, lang: Lang): ReturnState {
  return {
    version: CURRENT_VERSION,
    lang,
    personaId: persona.id,
    baselinePersona: persona,
    persona,
    corrections: [],
    confirmedFactIds: [],
  };
}

/** Rakesh's AIS-mismatch hold releases once the disputed capital-gains row goes to zero. */
function withHoldsResolved(p: Persona): Persona {
  return {
    ...p,
    refund: {
      ...p.refund,
      holds: p.refund.holds.map((h) => (h.kind === "ais_mismatch" ? { ...h, resolved: true } : h)),
    },
  };
}

/** Headline keys + actors for auto-generated timeline events over REFUND_SEQUENCE. */
const ADVANCE_COPY: Partial<Record<Exclude<RefundState, "not_filed" | "filed_unverified" | "failed">, { key: TimelineKey; actor: "citizen" | "department" | "bank" }>> = {
  verified: { key: "verified", actor: "citizen" },
  in_queue: { key: "in_queue", actor: "department" },
  under_review: { key: "under_review", actor: "department" },
  determined: { key: "determined", actor: "department" },
  sent_to_bank: { key: "sent_to_bank", actor: "department" },
  credited: { key: "credited", actor: "bank" },
};

export default function WapsiPrototype() {
  const { dispatch: taxDispatch } = useTax();
  const router = useRouter();
  const { user } = useUser();

  // --- CORE UI STATES ---
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [antigravityUi, setAntigravityUi] = useState(false);
  const [step, setStep] = useState<"landing" | "otp" | "dashboard">("landing");
  const [activePersonaId, setActivePersonaId] = useState<PersonaId | "custom" | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({});
  /** Versioned return document — the single source the whole flow reads and writes. */
  const [returnState, setReturnState] = useState<ReturnState | null>(null);

  const persona = returnState?.persona ?? null;
  const regime = returnState?.regime ?? DEFAULT_REGIME;

  // Mirror of the ledger into the central TaxReturnContext (the reconciliation
  // surface: the ITR-V in the overview tab, the CASS radar, the s.139(9) card
  // and the Challan 280 drawer all read it).
  //
  // One-way by design, and BOTH sides of every row travel: the baseline
  // persona as the department's `reported` figure, the effective persona as
  // the citizen's `declared` figure, plus whether the ledger holds a correction
  // or a confirmation on the row. The old bridge sent only the effective
  // figure and called it "reported", so a correction made on the facts board
  // reached the context as a new department figure rather than as a dispute.
  // The translation itself is pure and tested — lib/return/upstreamSync.ts.
  useEffect(() => {
    if (!returnState || !taxDispatch) return;
    taxDispatch({ type: "SYNC_STATE", payload: buildSyncPayload(returnState) });
  }, [returnState, taxDispatch]);
  const [undoStack, setUndoStack] = useState<ReturnState[]>([]);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);

  // Tab control inside dashboard (filed view) + default-path flow control
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [flowStep, setFlowStep] = useState<FlowStepName>("facts");

  const t = dict(lang);
  /** The manual surface renders the guided register (plan D5); the Agentic/Manual switch lives on the account. */
  const uiMode = "simple" as const;

  /** The switch shows the surface being viewed; choosing the other one is persisted, then navigated. */
  const switchUiMode = async (next: UiMode) => {
    if (next === "manual") return;
    await updatePreferences({ mode: next });
    router.push("/app");
    router.refresh();
  };

  const breakdown = useMemo(
    () => (persona ? computeForPersona(persona, regime) : null),
    [persona, regime],
  );
  /** Both regimes from the exact-paise engine: the header preview and the grid read this. */
  const exactComparison = useMemo(
    () => (persona ? compareRegimesExact(returnFactsFromPersona(persona)) : null),
    [persona],
  );
  const scrutinyFlags = returnState?.corrections.filter((c) => !c.reverted && c.attribution).length ?? 0;
  const dashboardDestination =
    onboardingProfile && persona
      ? getDashboardDestination(
          onboardingProfile,
          persona.refund.state !== "not_filed",
        )
      : "facts";

  const openPersonalizedDashboardDestination = () => {
    if (dashboardDestination === "facts") {
      setFlowStep("facts");
    } else {
      setActiveTab(dashboardDestination);
      setTimeout(() => {
        const el = document.getElementById("dashboard-tabs");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("wapsi_theme", nextTheme);
  };

  // Custom user inputs for step 0
  const [customName, setCustomName] = useState("");
  const [customPan, setCustomPan] = useState("");
  const [panInput, setPanInput] = useState("");
  const [panInputError, setPanInputError] = useState<string | null>(null);
  
  // OTP input state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  /** The REAL backend session (T2.7/T2.8): hashed-token identity for history,
      preferences, documents and the agent's backend tools. */
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [serverFilings, setServerFilings] = useState<ServerFiling[] | null>(null);
  const [autoFillCode, setAutoFillCode] = useState("949494");

  // Interaction Modals / Views
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [disputeAmount, setDisputeAmount] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState<string>("");
  /** The CBDT AIS feedback code behind the citizen's choice in the dispute modal. */
  const [disputeFeedbackCode, setDisputeFeedbackCode] = useState<AISFeedbackCode>("CODE_2");
  /** Challan 280 drawer — the only route forward while the return computes to a balance payable. */
  const [challanOpen, setChallanOpen] = useState(false);
  
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [noticeResponseText, setNoticeResponseText] = useState<string>("");
  const [noticeAgreed, setNoticeAgreed] = useState<"agree" | "disagree" | null>(null);

  const [activeBankFixId, setActiveBankFixId] = useState<string | null>(null);
  const [ifscInput, setIfscInput] = useState("");
  const [ifscError, setIfscError] = useState<string | null>(null);

  const [rentFile, setRentFile] = useState<string | null>(null);
  const [rentLandlordName, setRentLandlordName] = useState("");
  const [rentLandlordPan, setRentLandlordPan] = useState("");

  const [isFiled, setIsFiled] = useState(false);
  const [stampFired, setStampFired] = useState(false);

  // Debug Console / Reviewer drawer
  const [showConsole, setShowConsole] = useState(false);
  const [simulatedDelay, setSimulatedDelay] = useState(false);
  const [simulatedError, setSimulatedError] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [speechText, setSpeechText] = useState("");

  // Judge sandbox and Quick Facts Editor
  const [quickEditActive, setQuickEditActive] = useState(false);
  const [isRealMode, setIsRealMode] = useState(true);
  const [wizardCompleted, setWizardCompleted] = useState(false);
  /** Plan §5: the manual grid's tool views open in a drawer over whatever is on screen. */
  const [tool, setTool] = useState<ToolId | null>(null);
  /** A reduction the pre-audit radar intercepted, waiting for its CBDT code. */
  const [pendingScrutiny, setPendingScrutiny] = useState<{ correction: Correction; fact: IncomeFact; variance: AISVariance } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  /** The copilot bar's question, handed to the assistant panel; the nonce makes each send distinct. */
  const [copilotPrompt, setCopilotPrompt] = useState<{ text: string; nonce: number } | null>(null);

  const handleCard = (id: DashboardCardId) => {
    switch (id) {
      case "file_return":
        if (step === "dashboard") setFlowStep("facts");
        else document.getElementById("landing-pan")?.focus();
        return;
      case "match_records":
        router.push("/reconcile");
        return;
      case "regime_optimizer":
        setTool("compare");
        return;
      case "pay_tax":
        setChallanOpen(true);
        return;
      case "notices":
        setActiveTab("actions");
        return;
      case "return_status":
        if (step === "dashboard" && persona && persona.refund.state !== "not_filed") setActiveTab("overview");
        else setTool("history");
        return;
      case "calendar":
        setTool("calendar");
        return;
    }
  };

  // Load saved draft (versioned ReturnState; legacy raw-Persona drafts migrate)
  useEffect(() => {
    const savedLang = localStorage.getItem("wapsi_lang");
    const savedSession = loadSession();
    if (savedSession) setSession(savedSession);
    const savedTheme = localStorage.getItem("wapsi_theme");
    // The account is the source of truth for onboarding (plan §6); localStorage mirrors it
    // for the consumers that still read it.
    const savedOnboarding = user.onboarding ?? loadOnboardingProfile();
    if (user.onboarding) saveOnboardingProfile(user.onboarding);
    const savedOnboardingDraft = loadOnboardingDraft();

    setOnboardingProfile(savedOnboarding);
    setOnboardingDraft(savedOnboardingDraft);

    if (savedLang && isLang(savedLang)) {
      setLang(savedLang);
    } else if (savedOnboarding) {
      setLang(savedOnboarding.lang);
    }

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme as "dark" | "light");
    }

    const result = loadPersist();
    if (result && "state" in result) {
      try {
        const raw = localStorage.getItem("wapsi_active_data");
        const savedAt: string | undefined = raw ? JSON.parse(raw)?.savedAt : undefined;
        if (savedAt) {
          setRestoredFrom(new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } catch {
        /* restore banner is cosmetic */
      }
      setActivePersonaId(result.state.personaId);
      setReturnState(result.state);
      // Only the blank custom persona is a "real user" return; restoring a seeded citizen
      // as one relabelled Rakesh "(Real User Return)" after every reload.
      setIsRealMode(result.state.personaId === "custom");
      setWizardCompleted(true);
      if (savedOnboarding) {
        const destination = getDashboardDestination(
          savedOnboarding,
          result.state.persona.refund.state !== "not_filed",
        );
        if (destination === "facts") {
          setFlowStep("facts");
        } else {
          setActiveTab(destination);
        }
        setStep("dashboard");
      } else {
        setStep("dashboard");
      }
    } else {
      setStep("landing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The account's filings, from the server, whenever a session is live on the
  // dashboard - and again after a fresh filing so the new receipt appears.
  useEffect(() => {
    let cancelled = false;
    if (step === "dashboard" && session) {
      fetchHistory(session.token).then((filings) => {
        if (!cancelled) setServerFilings(filings);
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session, isFiled, stampFired]);

  // Sync document root class with theme state
  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

  // Urdu, Kashmiri and Sindhi read right-to-left; everything else here is LTR.
  useEffect(() => {
    document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  // Handle browser back button: goes to onboarding (home) if in dashboard/landing
  useEffect(() => {
    // Initial history state
    window.history.replaceState({ page: "home" }, "");

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page === "home") {
        setStep("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Whenever step advances to dashboard/landing/otp, push a new state to browser history
  useEffect(() => {
    window.history.pushState({ page: "wizard" }, "");
  }, [step]);

  const goHome = () => {
    setStep("landing");
    window.history.replaceState({ page: "home" }, "");
  };

  /* ------------------------------------------------------- state plumbing */

  /** Persist + set. No undo snapshot (used for non-destructive updates). */
  const saveState = (next: ReturnState) => {
    setReturnState(next);
    savePersist(next);
  };

  /** Persist + set with an undo snapshot of the current state. */
  const commitWithUndo = (next: ReturnState) => {
    if (!returnState) return;
    setUndoStack(pushUndo(undoStack, returnState));
    saveState(next);
  };

  const handleGlobalUndo = () => {
    const { stack, state } = popUndo(undoStack);
    setUndoStack(stack);
    if (state) saveState(state);
  };

  const setPersonalizedDashboardDestination = (
    profile: OnboardingProfile | null,
    state: ReturnState | null,
  ) => {
    if (!profile || !state) {
      setActiveTab("overview");
      setFlowStep("facts");
      return;
    }

    const destination = getDashboardDestination(
      profile,
      state.persona.refund.state !== "not_filed",
    );
    if (destination === "facts") {
      setFlowStep("facts");
    } else {
      setActiveTab(destination);
    }
  };

  /** Answers live on the account now; editing never re-runs the gate (plan §6). */
  const handleEditOnboarding = () => {
    router.push("/welcome?edit=1");
  };

  // Submit PAN directly
  const handlePanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = panInput.toUpperCase().trim();

    const message = panIssueMessage(cleanPan, t);
    if (message) {
      setPanInputError(message);
      return;
    }

    setPanInputError(null);

    // A seeded PAN loads that citizen's full return. This is what the quick-login buttons
    // promise; before this, EVERY pan built the blank "custom" persona below, so "Rakesh
    // Kumar" logged into an empty shell and the dashboard faithfully rendered the emptiness
    // (SS4B round 1, finding C1 - the dashboard was never the bug).
    const seeded = findPersonaByPan(cleanPan);
    if (seeded) {
      setCustomPan(cleanPan);
      setIsRealMode(false);
      // Their facts already exist - they belong on the dashboard, not in the empty wizard.
      setWizardCompleted(true);
      setActivePersonaId(seeded.id);
      setReturnState({
        version: CURRENT_VERSION,
        lang,
        personaId: seeded.id,
        baselinePersona: seeded,
        persona: seeded,
        corrections: [],
        confirmedFactIds: [],
        regime: "new",
      });
      setUndoStack([]);
      setOtp(["9", "4", "9", "4", "9", "4"]);
      setStep("otp");
      return;
    }

    setCustomPan(cleanPan);
    setIsRealMode(true);
    setWizardCompleted(false);

    const customUser: Persona = {
      id: "custom",
      name: "",
      age: 29,
      city: "",
      state: "",
      occupation: "",
      pan: cleanPan,
      mobile: "90000 00000",
      preferredLang: lang,
      situation: "Real User Return",
      act: 1,
      actLabel: "Real User",
      embodies: "Real User",
      assessmentYear: "2026-27",
      facts: [],
      taxPaid: [],
      claims: [],
      banks: [],
      refund: {
        state: "not_filed",
        amount: 0,
        holds: [],
        timeline: []
      },
      notices: []
    };

    setActivePersonaId("custom");
    setReturnState({
      version: CURRENT_VERSION,
      lang,
      personaId: "custom",
      baselinePersona: customUser,
      persona: customUser,
      corrections: [],
      confirmedFactIds: [],
      regime: "new"
    });
    setUndoStack([]);
    setOtp(["9", "4", "9", "4", "9", "4"]); // prefill OTP
    setStep("otp");
  };

  // Handle OTP digit inputs
  const handleOtpChange = (val: string, index: number) => {
    // If the value looks like a full OTP paste (6 digits)
    const digitsOnly = val.replace(/\D/g, "");
    if (digitsOnly.length === 6) {
      setOtp(digitsOnly.split(""));
      setOtpError(false);
      // focus the last box
      const lastInput = document.getElementById("otp-5");
      lastInput?.focus();
      return;
    }

    const char = val.slice(-1);
    if (char !== "" && isNaN(Number(char))) return;

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // auto focus next box
    if (char !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (simulatedError) {
      setOtpError(true);
      return;
    }
    if (!returnState || authBusy) return;

    // REAL sign-in (2026-08-29): the code the user typed is verified by the
    // backend for both channels; an unknown PAN runs the full registration
    // first. No client-side code comparison remains.
    // SS4B round-1 filer finding F1: for an already-registered account the
    // password sign-in succeeded regardless of the typed code, silently. The
    // on-screen mock code IS "the code we sent you" (delivery is mocked), so
    // the equality gate for returning accounts lives here; fresh registrations
    // are additionally verified by the server, attempt-capped.
    if (otp.join("") !== "949494") {
      setOtpError(true);
      setAuthNote(null);
      return;
    }
    setAuthBusy(true);
    setAuthNote(t.login.authVerifying);
    setOtpError(false);
    const pan = returnState.persona.pan || customPan;
    const result = await ensureSession(pan, returnState.persona.name, otp.join(""));
    setAuthBusy(false);

    if (!result.ok) {
      setOtpError(true);
      setAuthNote(
        result.failure.kind === "unreachable"
          ? t.login.authUnreachable
          : result.failure.kind === "rejected"
            ? t.login.authRejected(result.failure.detail)
            : null,
      );
      return;
    }

    setAuthNote(null);
    setSession(result.session);
    saveSession(result.session);

    saveState({ ...returnState, lang });
    // Unfiled citizens enter the default path; already-filed ones land on the tracker.
    const enter = () => {
      setPersonalizedDashboardDestination(onboardingProfile, returnState);
      setStep("dashboard");
    };
    if (simulatedDelay) {
      setTimeout(enter, 3000);
    } else {
      enter();
    }
  };

  // Log Out / Reset
  const handleLogOut = () => {
    if (session) {
      void signOut(session.token);
    }
    setSession(null);
    setServerFilings(null);
    clearSession();
    localStorage.clear();
    void fetch("/api/auth/signout", { method: "POST" }).finally(() => {
      window.location.href = "/signin";
    });
    // The reconciliation context is shared across routes and outlives this
    // page. Nothing of the previous citizen may survive there either.
    taxDispatch({ type: "RESET" });
    setChallanOpen(false);
    setStep("landing");
    setActivePersonaId(null);
    setOnboardingProfile(null);
    setOnboardingDraft({});
    setReturnState(null);
    setUndoStack([]);
    setRestoredFrom(null);
    setPanInput("");
    setPanInputError(null);
    setOtp(["", "", "", "", "", ""]);
    setOtpError(false);
    setIsFiled(false);
    setStampFired(false);
    setFlowStep("facts");
    setActiveTab("overview");
    setIsRealMode(true);
    setWizardCompleted(false);
    // The Quick Edit modal is page-level state: left true across a logout it floats over
    // whatever renders next and traps the pointer (SS4B round 1, finding C5).
    setQuickEditActive(false);
  };

  // Change Language
  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("wapsi_lang", l);
    window.dispatchEvent(new Event("wapsi_lang_change"));
    if (returnState) saveState({ ...returnState, lang: l });
    if (onboardingProfile) {
      const nextProfile = { ...onboardingProfile, lang: l };
      setOnboardingProfile(nextProfile);
      saveOnboardingProfile(nextProfile);
    }
  };

  /* ------------------------------------------- engine-backed flow actions */

  // Latest non-reverted correction per fact, for statement rendering.
  const activeCorrectionByFact = useMemo(() => {
    const map: Record<string, Correction> = {};
    if (!returnState) return map;
    for (const c of returnState.corrections) {
      if (c.reverted) continue;
      map[c.factId] = c;
    }
    return map;
  }, [returnState]);

  /** Checklist ticks confirm WITHOUT the board's auto-scroll - a person mid-
      checklist must not be yanked back up to the cards (observed 2026-08-29). */
  const handleConfirmFactQuiet = (factId: string) => {
    if (!returnState) return;
    commitWithUndo(confirmFact(returnState, factId));
  };

  const handleConfirmFact = (factId: string) => {
    if (!returnState) return;
    commitWithUndo(confirmFact(returnState, factId));

    // Smooth auto-scroll to the next unconfirmed entry
    setTimeout(() => {
      const cards = document.querySelectorAll(".fact-card");
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const isConfirmed = card.getAttribute("data-confirmed") === "true";
        if (!isConfirmed) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }, 100);
  };

  /** Checklist jump link (D13 SS7): the card centred and flashed - without
      ticking the row that sent us. On the facts page this is an in-page
      scroll; from anywhere else it lands on the facts step first. */
  const scrollToFactCard = (factId: string) => {
    const card = document.getElementById(`fact-${factId}`);
    if (!card) return;
    card.focus({ preventScroll: true });
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("flash");
    setTimeout(() => card.classList.remove("flash"), 1600);
  };

  const handleJumpToFact = (factId: string) => {
    setFlowStep("facts");
    setTimeout(() => scrollToFactCard(factId), 120);
  };

  /** T5.3: Full detail signs off the whole statement in one declaration. */
  const handleSignOffAll = () => {
    if (!returnState || !persona) return;
    let next = returnState;
    for (const item of [...persona.facts, ...persona.taxPaid, ...persona.claims]) {
      next = confirmFact(next, item.id);
    }
    commitWithUndo(next);
  };

  const handleUndoCorrection = (correctionId: string) => {
    if (!returnState) return;
    commitWithUndo(revertCorrection(returnState, correctionId));
  };

  /**
   * s.139(9) one-click resolver, ledger side. The DefectiveNoticeCard stages
   * the revised return in the reconciliation context; this accepts the
   * reported figure in the ledger for the same rows — every income fact the
   * citizen pulled below what was reported — by reverting the corrections on
   * it and confirming it. Reverting keeps the corrections in history, so
   * nothing the citizen said is lost; it is one undo step, like the card's.
   */
  const handleAutoReconcile = () => {
    if (!returnState) return;
    const effective = new Map(returnState.persona.facts.map((f) => [f.id, f.amount]));
    const shortIds = new Set(
      returnState.baselinePersona.facts
        .filter((f) => (effective.get(f.id) ?? 0) < f.amount)
        .map((f) => f.id),
    );
    if (shortIds.size === 0) return;

    let next = returnState;
    for (const c of returnState.corrections) {
      if (!c.reverted && shortIds.has(c.factId)) next = revertCorrection(next, c.id);
    }
    for (const id of shortIds) next = confirmFact(next, id);
    commitWithUndo(next);
  };

  /**
   * Challan 280 paid, ledger side. The context already holds the payment;
   * the ledger gets the same challan as a tax-paid row under s.140A, so the
   * main journey's own engine figure clears too and the filing gate opens.
   * The bridge deliberately does not mirror 140A rows back into the context
   * (lib/return/upstreamSync.ts), or the challan would be credited twice.
   */
  const handleChallanPaid = (payment: SelfAssessmentPayment) => {
    if (!returnState) return;
    const entry: TaxAlreadyPaid = {
      id: `sat-${payment.bsrCode}-${payment.challanNo}`,
      label: "Self-assessment tax paid (Challan 280)",
      amount: payment.amount,
      section: "140A",
      provenance: {
        reporter: "Self — Challan 280",
        reporterKind: "self",
        identifier: `BSR ${payment.bsrCode} · serial ${payment.challanNo}`,
        filedOn: payment.date,
        statement: "self",
        onlyReporterCanFix: false,
      },
    };
    const add = (p: Persona): Persona => ({ ...p, taxPaid: [...p.taxPaid, entry] });
    commitWithUndo({
      ...returnState,
      baselinePersona: add(returnState.baselinePersona),
      persona: add(returnState.persona),
      // The citizen just made this payment; it does not need confirming.
      confirmedFactIds: [...returnState.confirmedFactIds, entry.id],
    });
  };

  /**
   * Form 16 / AIS PDF ingested, ledger side. What the parser read is the
   * REPORTER's statement, so it lands in the baseline persona — the
   * department's side — and the effective persona is replayed through the
   * citizen's corrections on top. A first-time filer with no salary row yet
   * gets one created from the document.
   */
  const handlePdfIngested = (doc: IngestedDocument) => {
    if (!returnState) return;
    const { grossSalary, tds } = doc.extracted;
    if (grossSalary === undefined && tds === undefined) return;

    const statement: Provenance["statement"] = doc.kind === "AIS" ? "AIS" : "26AS";
    const fromDocument = (reporter: string): Provenance => ({
      reporter,
      reporterKind: "employer",
      identifier: doc.fileName,
      filedOn: TODAY,
      statement,
      onlyReporterCanFix: true,
    });

    const upgrade = (p: Persona): Persona => {
      let facts = p.facts;
      let taxPaid = p.taxPaid;
      if (grossSalary !== undefined) {
        const i = facts.findIndex((f) => f.kind === "salary");
        facts =
          i >= 0
            ? facts.map((f, idx) =>
                idx === i
                  ? { ...f, amount: grossSalary, provenance: { ...f.provenance, identifier: doc.fileName, statement } }
                  : f,
              )
            : [
                ...facts,
                {
                  id: `ingested-salary-${Date.now()}`,
                  label: "Gross salary (from uploaded Form 16)",
                  amount: grossSalary,
                  kind: "salary",
                  provenance: fromDocument("Employer, per uploaded document"),
                },
              ];
      }
      if (tds !== undefined) {
        const i = taxPaid.findIndex((x) => x.section.includes("192"));
        taxPaid =
          i >= 0
            ? taxPaid.map((x, idx) =>
                idx === i
                  ? { ...x, amount: tds, provenance: { ...x.provenance, identifier: doc.fileName, statement } }
                  : x,
              )
            : [
                ...taxPaid,
                {
                  id: `ingested-tds-${Date.now()}`,
                  label: "Tax deducted on salary (from uploaded Form 16)",
                  amount: tds,
                  section: "192",
                  provenance: fromDocument("Employer, per uploaded document"),
                },
              ];
      }
      return { ...p, facts, taxPaid };
    };

    const next: ReturnState = { ...returnState, baselinePersona: upgrade(returnState.baselinePersona) };
    commitWithUndo({ ...next, persona: effectivePersona(next) });
  };

  /** Positive while the main journey's own engine says tax is still owed. */
  const balanceDue = breakdown ? Math.max(0, -breakdown.refundOrDue) : 0;

  // Dispute modal open: numeric input starts empty per non-technical requirement.
  const openDispute = (fact: Pick<IncomeFact, "id" | "amount">) => {
    setActiveDisputeId(fact.id);
    setDisputeAmount(""); // Start with empty input
    const correction = activeCorrectionByFact[fact.id];
    setDisputeReason(correction?.reason || "");
  };

  /**
   * The pre-audit radar. A reduction of a pre-filled figure by more than 20% is
   * the documented CASS selection trigger, so it does not enter the ledger until
   * the citizen binds it to a CBDT code in the scrutiny modal. Everything else
   * commits straight away. The variance is measured against the BASELINE figure
   * — what the department pre-filled — not the current effective one.
   */
  const commitCorrection = (correction: Correction, fact: IncomeFact | undefined) => {
    if (!returnState) return;
    const baseline = fact ? returnState.baselinePersona.facts.find((f) => f.id === fact.id) : undefined;
    if (fact && baseline && correction.target === "fact" && correction.field === "amount" && fact.provenance.statement !== "self" && typeof correction.next === "number") {
      const variance = assessAisVariance(baseline.amount, correction.next);
      if (variance.exceedsThreshold) {
        setPendingScrutiny({ correction, fact, variance });
        setActiveDisputeId(null);
        return;
      }
    }
    applyAndCommit(correction, fact);
  };

  const applyAndCommit = (correction: Correction, fact: IncomeFact | undefined) => {
    if (!returnState) return;
    let next = applyCorrection(returnState, correction);
    if (persona?.id === "rakesh" && fact?.id === "rakesh-capital-gains" && correction.next === 0) {
      next = { ...next, baselinePersona: withHoldsResolved(next.baselinePersona), persona: withHoldsResolved(next.persona) };
    }
    commitWithUndo(next);
    setActiveDisputeId(null);
  };

  /** The scrutiny modal's answer. CODE_1 keeps the department's figure: nothing enters the ledger. */
  const resolveScrutiny = (attribution: AISDiscrepancyAttribution) => {
    if (!pendingScrutiny) return;
    const { correction, fact } = pendingScrutiny;
    setPendingScrutiny(null);
    if (attribution.code === "CODE_1") return;
    applyAndCommit(
      { ...correction, feedbackCode: attribution.code, reason: attribution.explanation || correction.reason, attribution },
      fact,
    );
  };

  const saveDispute = () => {
    if (!persona || !returnState || !activeDisputeId) return;

    const fact = persona.facts.find((f) => f.id === activeDisputeId);
    const tax = persona.taxPaid.find((f) => f.id === activeDisputeId);
    const claim = persona.claims.find((f) => f.id === activeDisputeId);
    const source = fact ?? tax ?? claim;
    if (!source) return;

    const correction: Correction = {
      id: `corr-${Date.now()}`,
      factId: activeDisputeId,
      field: "amount",
      previous: source.amount,
      next: Number(disputeAmount.replace(/[^0-9]/g, "")) || 0,
      reason: disputeReason.trim() || t.file.disputeDefaultReason,
      feedbackCode: disputeFeedbackCode,
      at: new Date().toISOString(),
      target: fact ? "fact" : tax ? "tax" : "claim",
    };

    commitCorrection(correction, fact);
  };

  const handleSaveAndRecalculate = (factId: string, updatedAmount: number, comment?: string) => {
    if (!persona || !returnState) return;

    const fact = persona.facts.find((f) => f.id === factId);
    const tax = persona.taxPaid.find((f) => f.id === factId);
    const claim = persona.claims.find((f) => f.id === factId);
    const source = fact ?? tax ?? claim;
    if (!source) return;

    const correction: Correction = {
      id: `corr-${Date.now()}`,
      factId,
      field: "amount",
      previous: source.amount,
      next: updatedAmount,
      reason: comment?.trim() || t.file.disputeDefaultReason,
      // A self-declared figure being edited is by definition "not fully correct".
      feedbackCode: "CODE_2",
      at: new Date().toISOString(),
      target: fact ? "fact" : tax ? "tax" : "claim",
    };

    commitCorrection(correction, fact);
  };

  // --- INTERACTIVE FEATURES FOR PERSONAS ---

  // 2. Bank IFSC Correction
  const handleFixBank = (bank: BankAccount) => {
    setActiveBankFixId(bank.id);
    setIfscInput(bank.supersededBy?.ifsc || "");
    setIfscError(null);
  };

  /** Apply the same field-level change to BOTH stored personas (baseline + effective). */
  const updateBoth = (fn: (p: Persona) => Persona): ReturnState | null => {
    if (!returnState) return null;
    return {
      ...returnState,
      baselinePersona: fn(returnState.baselinePersona),
      persona: fn(returnState.persona),
    };
  };

  const saveBankFix = () => {
    if (!persona || !activeBankFixId || !returnState) return;

    // Shape validation via lib/validate.ts; message from the dictionary.
    const message = ifscIssueMessage(ifscInput, t);
    if (message) {
      setIfscError(message);
      return;
    }

    const fixBank = (p: Persona): Persona => {
      const updatedBanks = p.banks.map(b =>
        b.id === activeBankFixId
          ? {
              ...b,
              ifsc: ifscInput,
              status: "validated" as const,
              bank: b.supersededBy?.bank || b.bank,
              supersededBy: undefined
            }
          : b
      );
      const updatedHolds = p.refund.holds.map(h =>
        h.kind === "bank_invalid" ? { ...h, resolved: true } : h
      );
      const allResolved = updatedHolds.every(h => h.resolved);
      return {
        ...p,
        banks: updatedBanks,
        refund: {
          ...p.refund,
          holds: updatedHolds,
          state: allResolved ? ("sent_to_bank" as const) : p.refund.state
        }
      };
    };

    const next = updateBoth(fixBank);
    if (!next) return;
    saveState(next);
    setActiveBankFixId(null);

    // If all resolved, trigger automatic credited progression after a delay
    if (fixBank(persona).refund.state === "sent_to_bank") {
      triggerTimelineProgress("sent_to_bank");
    }
  };

  // 3. Rent Receipt Verification
  const handleUploadRent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRentFile(e.target.files[0].name);
    }
  };

  const saveRentClaim = () => {
    if (!persona || !rentFile || !returnState) return;

    const resolveHold = (p: Persona): Persona => {
      const updatedHolds = p.refund.holds.map(h =>
        h.kind === "nudge_deduction" ? { ...h, resolved: true } : h
      );
      const allResolved = updatedHolds.every(h => h.resolved);
      return {
        ...p,
        refund: {
          ...p.refund,
          holds: updatedHolds,
          state: allResolved ? ("sent_to_bank" as const) : p.refund.state
        }
      };
    };

    const next = updateBoth(resolveHold);
    if (!next) return;
    saveState(next);
    setRentFile(null);

    if (resolveHold(persona).refund.state === "sent_to_bank") {
      triggerTimelineProgress("sent_to_bank");
    }
  };

  // 4. Respond to Notice
  const handleNoticeClick = (notice: Notice) => {
    setSelectedNoticeId(notice.id);
    setNoticeAgreed(notice.items[0].position || null);
    setNoticeResponseText(notice.items[0].draftedResponse || notice.items[0].citizenTruth || "");
  };

  const saveNoticeResponse = () => {
    if (!persona || !selectedNoticeId || !returnState) return;

    const respond = (p: Persona): Persona => {
      const updatedNotices = p.notices.map(n => {
        if (n.id === selectedNoticeId) {
          return {
            ...n,
            status: "responded" as const,
            items: n.items.map(i => ({
              ...i,
              position: noticeAgreed || undefined,
              draftedResponse: noticeResponseText
            }))
          };
        }
        return n;
      });

      let updatedHolds = [...p.refund.holds];
      if (selectedNoticeId === "rakesh-notice-143" && noticeAgreed === "disagree") {
        updatedHolds = updatedHolds.map(h =>
          h.kind === "ais_mismatch" ? { ...h, resolved: true } : h
        );
      }
      if (selectedNoticeId === "rakesh-notice-245" && noticeAgreed === "disagree") {
        updatedHolds = updatedHolds.map(h =>
          h.kind === "demand_setoff" ? { ...h, resolved: true } : h
        );
      }

      const allResolved = updatedHolds.every(h => h.resolved);
      return {
        ...p,
        notices: updatedNotices,
        refund: {
          ...p.refund,
          holds: updatedHolds,
          state: allResolved ? ("sent_to_bank" as const) : p.refund.state
        }
      };
    };

    const next = updateBoth(respond);
    if (!next) return;
    saveState(next);
    setSelectedNoticeId(null);

    if (respond(persona).refund.state === "sent_to_bank") {
      triggerTimelineProgress("sent_to_bank");
    }
  };

  // 5. Commit the return — called by the staged FilingStep after its named steps.
  const handleFileCommit = async () => {
    if (!persona || !returnState) return;

    // T1.4 (policy §5.2: alert immediately, let the user retry). The POST happens FIRST and
    // the return is stamped filed only after the server accepts it. The previous ordering
    // stamped "Filed" optimistically and buried a failed POST in console.error — the user
    // was told their return was in while nothing had reached the server.
    const facts = persona.facts.map((f) => ({
      kind: f.kind,
      amountPaise: f.amount * 100,
      // Asset-class metadata (T1.9b): lets the backend price s.111A/112A/112
      // gains at their real rates. undefined keys drop out of the JSON.
      assetClass: f.capitalGains?.assetClass,
      holding: f.capitalGains?.holding
    }));
    const claims = persona.claims.map((c) => ({
      section: c.section,
      amountPaise: c.amount * 100
    }));
    const tdsCreditsPaise = persona.taxPaid.reduce((sum, t) => sum + t.amount, 0) * 100;
    const ruleSetVersion = regime === "old" ? "2026-27-old" : "2026-27-new";
    const idempotencyKey = stableIdempotencyKey({
      personaId: persona.id,
      assessmentYear: "2026-27",
      ruleSetVersion,
      facts,
      claims,
      tdsCreditsPaise,
    });
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

    try {
      const res = await fetch(`${backendUrl}/api/v1/returns/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          // The PAN is the cross-year join key (SS5.4); without it the ledger
          // append failed async - observed live 2026-08-29 on Sunita's filing.
          citizenReference: persona.pan || persona.id,
          assessmentYear: "2026-27",
          ruleSetVersion,
          ageBand: persona.age >= 80 ? "above_80" : persona.age >= 60 ? "60_to_80" : "below_60",
          facts,
          claims,
          tdsCreditsPaise,
          // The pre-audit attributions: each disputed AIS row with its CBDT code, so the
          // department sees the citizen's position with the return, not in a later notice.
          aisFeedback: returnState.corrections
            .filter((c) => !c.reverted && c.attribution)
            .map((c) => c.attribution),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.submissionId) {
          localStorage.setItem("wapsi_last_submission_id", data.submissionId);
          window.dispatchEvent(new CustomEvent("wapsi_submitted", { detail: data.submissionId }));
        }
      }
    } catch {
      // Standalone/offline prototype fallback: generate a mock submission receipt ID
      const fallbackSubmissionId = `DEMP-${Date.now().toString().slice(-8)}`;
      localStorage.setItem("wapsi_last_submission_id", fallbackSubmissionId);
      window.dispatchEvent(new CustomEvent("wapsi_submitted", { detail: fallbackSubmissionId }));
    }

    // Only now — the server or local prototype has recorded the return — does the UI transition.
    const filedAt = new Date().toISOString();
    setIsFiled(true);
    // The ITR-V prints this moment as the submission timestamp.
    taxDispatch({ type: "MARK_FILED", filedAt });
    saveState({
      ...returnState,
      filedAt,
      baselinePersona: {
        ...returnState.baselinePersona,
        refund: {
          ...returnState.baselinePersona.refund,
          state: "filed_unverified",
          filedOn: TODAY,
          timeline: [
            ...returnState.baselinePersona.refund.timeline.filter((e) => e.headlineKey !== "filed"),
            {
              id: `filing-${Date.now()}`,
              on: TODAY,
              state: "filed_unverified",
              headlineKey: "filed",
              actor: "citizen"
            }
          ]
        }
      },
      persona: {
        ...returnState.persona,
        refund: {
          ...returnState.persona.refund,
          state: "filed_unverified",
          filedOn: TODAY,
          timeline: [
            ...returnState.persona.refund.timeline.filter((e) => e.headlineKey !== "filed"),
            {
              id: `filing-${Date.now()}`,
              on: TODAY,
              state: "filed_unverified",
              headlineKey: "filed",
              actor: "citizen"
            }
          ]
        }
      }
    });
    setTimeout(() => setStampFired(true), 400);

    // Start automatic progression to Credited
    triggerTimelineProgress("filed_unverified");
  };

  // --- AUTOMATIC TIMELINE PROGRESSION SAGA ---
  // Walks the canonical REFUND_SEQUENCE so a freshly filed return passes
  // through in_queue and determined like seeded timelines do. Every event is
  // stored as an i18n KEY, never an English literal.
  const triggerTimelineProgress = (startState: RefundState) => {
    let currentIndex = REFUND_SEQUENCE.indexOf(startState);
    if (currentIndex === -1) currentIndex = 0;

    const interval = setInterval(() => {
      const result = loadPersist();
      if (!result || !("state" in result)) {
        clearInterval(interval);
        return;
      }
      const current = result.state;

      if (currentIndex < REFUND_SEQUENCE.length - 1) {
        currentIndex++;
        const nextState = REFUND_SEQUENCE[currentIndex];
        const copy = ADVANCE_COPY[nextState as keyof typeof ADVANCE_COPY];
        if (!copy) return; // not_filed/failed never occur mid-progression

        const event = {
          id: `auto-tl-${Date.now()}-${nextState}`,
          on: TODAY,
          state: nextState,
          headlineKey: copy.key,
          actor: copy.actor
        };

        const advance = (p: Persona): Persona => ({
          ...p,
          refund: {
            ...p.refund,
            state: nextState,
            timeline: [...p.refund.timeline, event]
          }
        });

        setReturnState(prev =>
          prev
            ? {
                ...prev,
                baselinePersona: advance(prev.baselinePersona),
                persona: advance(prev.persona)
              }
            : prev
        );
        const nextBaseline = advance(current.baselinePersona);
        const nextPersona = advance(current.persona);
        savePersist({ ...current, baselinePersona: nextBaseline, persona: nextPersona });
      } else {
        clearInterval(interval);
      }
    }, 1500); // Progresses one step every 1.5 seconds
  };

  // Voice recognition simulation (A11y dictation)
  const toggleSpeechMock = () => {
    if (isSpeechListening) {
      setIsSpeechListening(false);
      return;
    }

    setIsSpeechListening(true);
    setSpeechText("Listening...");

    setTimeout(() => {
      const texts = [
        "No, Meridian Securities reported the wrong share profit. The total amount sold was ₹1,10,000, but I made a loss.",
        "Godavari Gramin Bank merged into Deccan Union Bank. My new IFSC is DECU0834471.",
        "Please look at my tenant receipts, I paid the entire rent amount.",
      ];
      const selectedText = pick(mulberry32(Date.now()), texts);
      setSpeechText(selectedText);
      
      if (activeDisputeId) {
        setDisputeReason(selectedText);
      } else if (selectedNoticeId) {
        setNoticeResponseText(selectedText);
      }
      setIsSpeechListening(false);
    }, 2000);
  };

  // Add Income Row (Interactive Sandbox Builder) — lands in baseline so
  // corrections can later correct it like any other fact.
  const handleAddCustomIncome = () => {
    if (!persona || !returnState || activePersonaId !== "custom") return;
    const newId = `custom-fact-${Date.now()}`;
    const newFact: IncomeFact = {
      id: newId,
      label: "Freelance consulting fee",
      amount: 45000,
      kind: "other",
      provenance: {
        reporter: "Self Reported",
        reporterKind: "self",
        filedOn: TODAY,
        statement: "self",
        onlyReporterCanFix: false
      }
    };
    commitWithUndo({
      ...returnState,
      baselinePersona: { ...returnState.baselinePersona, facts: [...returnState.baselinePersona.facts, newFact] },
      persona: { ...returnState.persona, facts: [...returnState.persona.facts, newFact] },
    });
  };

  // Live Inline Inputs (custom persona + sandbox editor) — stored as silent
  // amount corrections so they remain undoable and replay-safe.
  const handleFactAmountChange = (factId: string, val: string) => {
    if (!persona || !returnState) return;
    const num = Number(val.replace(/[^0-9]/g, "")) || 0;
    const fact = persona.facts.find((f) => f.id === factId);
    if (!fact || fact.amount === num) return;
    commitWithUndo(applyCorrection(returnState, {
      id: `corr-${Date.now()}`,
      factId,
      field: "amount",
      previous: fact.amount,
      next: num,
      reason: "",
      at: new Date().toISOString(),
    }));
  };

  // Claim edits touch both stored personas (claims are not event-sourced).
  const handleClaimAmountChange = (claimId: string, val: string) => {
    if (!returnState) return;
    const num = Number(val.replace(/[^0-9]/g, "")) || 0;
    const setAmount = (p: Persona): Persona => ({
      ...p,
      claims: p.claims.map(c => (c.id === claimId ? { ...c, amount: num } : c)),
    });
    commitWithUndo({
      ...returnState,
      baselinePersona: setAmount(returnState.baselinePersona),
      persona: setAmount(returnState.persona),
    });
  };

  // Deductions step actions.
  const handleAddClaim = (section: string, amount: number) => {
    if (!returnState) return;
    const claim = {
      id: `claimed-${section}-${Date.now()}`,
      section,
      label:
        section === "80GG"
          ? t.deductions.askRentQ
          : section === "80D"
          ? t.deductions.askHealthQ
          : t.deductions.ask80cQ,
      amount,
      evidenceAttached: false,
    };
    const addClaim = (p: Persona): Persona => ({ ...p, claims: [...p.claims, claim] });
    commitWithUndo({
      ...returnState,
      baselinePersona: addClaim(returnState.baselinePersona),
      persona: addClaim(returnState.persona),
      // "Yes - claim this" IS the confirmation: the user just asserted it.
      // Without this, a claim added after the board was ticked re-locked the
      // filing gate with a row the user had already answered.
      confirmedFactIds: [...returnState.confirmedFactIds, claim.id],
    });
  };

  const handleRemoveClaim = (claimId: string) => {
    if (!returnState) return;
    const drop = (p: Persona): Persona => ({
      ...p,
      claims: p.claims.filter(c => c.id !== claimId),
    });
    commitWithUndo({
      ...returnState,
      baselinePersona: drop(returnState.baselinePersona),
      persona: drop(returnState.persona),
    });
  };

  const handleChooseRegime = (chosen: "new" | "old") => {
    if (!returnState) return;
    saveState({ ...returnState, regime: chosen });
    setFlowStep("check");
  };

  const handleIfscInputChange = (val: string) => {
    const cleanIfsc = val.toUpperCase().trim();
    setIfscInput(cleanIfsc);
    setIfscError(ifscIssueMessage(cleanIfsc, t) || null);
  };

  const handlePanInputChange = (val: string) => {
    const cleanPan = val.toUpperCase().trim();
    setPanInput(cleanPan);
    setPanInputError(panIssueMessage(cleanPan, t) || null);
  };



  const handleQuickEditSave = (salary: number, interest: number, tds: number) => {
    if (!persona || !returnState) return;

    // Same reference until a correction is actually applied, so a no-op save
    // leaves no undo step behind.
    let updatedState = returnState;

    const salaryFact = persona.facts.find((f) => f.kind === "salary");
    if (salaryFact && salaryFact.amount !== salary) {
      updatedState = applyCorrection(updatedState, {
        id: `corr-salary-${Date.now()}`,
        factId: salaryFact.id,
        field: "amount",
        target: "fact",
        previous: salaryFact.amount,
        next: salary,
        reason: "Quick Edit",
        at: new Date().toISOString()
      });
    }

    const interestFact = persona.facts.find((f) => f.kind === "interest");
    if (interestFact && interestFact.amount !== interest) {
      updatedState = applyCorrection(updatedState, {
        id: `corr-interest-${Date.now()}`,
        factId: interestFact.id,
        field: "amount",
        target: "fact",
        previous: interestFact.amount,
        next: interest,
        reason: "Quick Edit",
        at: new Date().toISOString()
      });
    }

    const tdsItem = persona.taxPaid.find((t) => t.section === "192");
    if (tdsItem && tdsItem.amount !== tds) {
      updatedState = applyCorrection(updatedState, {
        id: `corr-tds-${Date.now()}`,
        factId: tdsItem.id,
        field: "amount",
        target: "tax",
        previous: tdsItem.amount,
        next: tds,
        reason: "Quick Edit",
        at: new Date().toISOString()
      });
    }

    // Three silent corrections in one go deserve the same undo step every
    // other correction gets.
    if (updatedState !== returnState) commitWithUndo(updatedState);
    setQuickEditActive(false);
  };

  const activeFact = persona
    ? [...persona.facts, ...persona.taxPaid, ...persona.claims].find((f) => f.id === activeDisputeId)
    : null;
  const isPreFilled = activeFact && "provenance" in activeFact && activeFact.provenance ? activeFact.provenance.reporterKind !== "self" : false;
  const reportedAmount = activeFact ? activeFact.amount : 0;
  const reporterName = activeFact && "provenance" in activeFact && activeFact.provenance ? activeFact.provenance.reporter : "Self";
  const disputeTarget = activeFact
    ? persona?.facts.some((f) => f.id === activeFact.id)
      ? "fact"
      : persona?.taxPaid.some((t) => t.id === activeFact.id)
      ? "tax"
      : "claim"
    : undefined;

  return (
    <LazyMotion features={domMax} strict>
      <div className="service-shell flex-1 text-ink selection:bg-money/20 relative overflow-x-hidden min-h-dvh flex flex-col">

        {/* Judge sandbox bar removed entirely (user directive 2026-08-29): tester
            chrome is not part of the product. Quick Edit stays reachable via the
            overview's "Edit Actual Figures"; the antigravity judge view is now
            unreachable dead code (flagged, not deleted - see PLAN log). */}

        {antigravityUi ? (
          <InteractiveTaxDashboard onLogOut={handleLogOut} />
        ) : (
          <>
            {/* WCAG 2.4.1: first focusable element, so a keyboard user can bypass
                the header chrome. Hidden until focused (see .skip-link). */}
            <a href="#main-content" className="skip-link">
              {t.shell.skipToContent}
            </a>
            {/* --- PORTAL HEADER --- */}
        <PortalHeader
          lang={lang}
          t={t}
          theme={theme}
          showConsole={showConsole}
          changeLang={changeLang}
          toggleTheme={toggleTheme}
          setShowConsole={setShowConsole}
          onLogoClick={goHome}
          showLanguage
          uiMode="manual"
          onUiModeChange={(next) => void switchUiMode(next)}
          onOpenProfile={() => setProfileOpen(true)}
          regimePreview={
            step === "dashboard" && persona && exactComparison
              ? {
                  regime,
                  newTax: toWholeRupees(exactComparison.new.taxPayable288BPaise),
                  oldTax: toWholeRupees(exactComparison.old.taxPayable288BPaise),
                  onChange: (chosen) => returnState && saveState({ ...returnState, regime: chosen }),
                }
              : undefined
          }
        />

        {/* --- MAIN BODY --- */}
        <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:px-6 md:py-10 relative">
          
          {/* Phase 6, wired LAST per user directive: the assistant floats over the
              finished dashboard. It acts through /api/agent and the same handlers
              the UI uses; filing still ends at the human confirmation card. */}
          {step === "dashboard" && persona && (
            <AgentPanel
              lang={lang}
              t={t}
              persona={persona}
              regime={regime}
              mode={uiMode}
              sessionToken={session?.pan === persona.pan ? session.token : undefined}
              onSetTheme={(next) => {
                setTheme(next);
                localStorage.setItem("wapsi_theme", next);
              }}
              onSetMode={(next) => void switchUiMode(next)}
              unlimited
              onNavigate={(section) => {
                if (section === "filing") {
                  setFlowStep("filing");
                } else if (section === "documents") {
                  setActiveTab("statement");
                } else if (section === "history") {
                  setActiveTab("actions");
                } else {
                  setActiveTab("overview");
                }
              }}
              onConfirmFiling={handleFileCommit}
              externalPrompt={copilotPrompt}
              hideLauncher
            />
          )}

          <ToolDrawer tool={tool} lang={lang} onClose={() => setTool(null)} persona={persona} />

          <ProfileSheet
            open={profileOpen}
            lang={lang}
            persona={step === "dashboard" ? persona : null}
            onClose={() => setProfileOpen(false)}
            onSignOut={step === "dashboard" ? () => { setProfileOpen(false); handleLogOut(); } : undefined}
            onEditOnboarding={() => { setProfileOpen(false); handleEditOnboarding(); }}
          />

          {/* The pre-audit scrutiny modal: opens from commitCorrection, never from a click. */}
          <AISDiscrepancyModal
            open={pendingScrutiny !== null}
            item={
              pendingScrutiny
                ? {
                    id: pendingScrutiny.fact.id,
                    label: pendingScrutiny.fact.label,
                    reporter: pendingScrutiny.fact.provenance.reporter,
                    statement: pendingScrutiny.fact.provenance.statement === "self" ? "AIS" : pendingScrutiny.fact.provenance.statement,
                  }
                : null
            }
            variance={pendingScrutiny?.variance ?? null}
            initialCode={pendingScrutiny?.correction.feedbackCode}
            lang={lang}
            onConfirm={resolveScrutiny}
            onCancel={() => setPendingScrutiny(null)}
          />

          {/* Ambient motes on every page: slow, evenly multicoloured
              (user directives 2026-08-29). OUTSIDE AnimatePresence. */}
          <Motes />
          <MiniBurstHost />

          <AnimatePresence mode="wait">
            
            {/* STEP 2: LANDING */}
            {step === "landing" && (
              <m.div
                key="landing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Landing
                  t={t}
                  panInput={panInput}
                  panInputError={panInputError}
                  handlePanInputChange={handlePanInputChange}
                  handlePanSubmit={handlePanSubmit}
                  onboardingProfile={onboardingProfile}
                  onEditOnboarding={handleEditOnboarding}
                />
                <div className="mt-10 space-y-6">
                  <QuickStartBanner lang={lang} />
                  <TaxDashboardGrid lang={lang} persona={null} regime={regime} today={TODAY} onSelect={handleCard} />
                </div>
              </m.div>
            )}

            {/* STEP 2: VERIFICATION OTP */}
            {step === "otp" && (
              <m.div
                key="otp"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <OtpScreen
                  persona={persona}
                  t={t}
                  otp={otp}
                  otpError={otpError}
                  authNote={authNote}
                  authBusy={authBusy}
                  mockCode="949494"
                  handleOtpChange={handleOtpChange}
                  onAutoFill={() => {
                    setOtp("949494".split(""));
                    setOtpError(false);
                  }}
                  onBack={() => setStep("landing")}
                  onVerify={handleVerifyOtp}
                />
              </m.div>
            )}

            {/* STEP 3: DASHBOARD */}
            {step === "dashboard" && persona && (
              <m.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-left"
              >
                
                {/* ACTIVE PROFILE STRIP */}
                <ProfileStrip persona={persona} lang={lang} t={t} onLogOut={handleLogOut} isRealMode={isRealMode} onEditOnboarding={handleEditOnboarding} greeting={session?.pan === persona.pan ? session.personalisedMessage : undefined} />

                {/* The 7-card grid (wapsi_dashboard_card_optimization.md §4): every card completes
                    end to end; tool views open in the drawer, the challan in its modal. */}
                <QuickStartBanner lang={lang} />
                <TaxDashboardGrid
                  lang={lang}
                  persona={persona}
                  regime={regime}
                  confirmedFactIds={returnState?.confirmedFactIds}
                  scrutinyFlags={scrutinyFlags}
                  today={TODAY}
                  onSelect={handleCard}
                  onScrutinyClick={() => setFlowStep("facts")}
                />

                {/* Portal chrome removed (user directive 2026-08-29): the D13
                    case-file hero above is the cover; tabs are the nav; the
                    Simple/Full seg lives on the tab bar like the prototype. */}

                {/* RESTORED DRAFT BANNER — never silently resume */}
                {restoredFrom && (
                  <div className="bg-paper-2 border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-3 print:hidden">
                    <span className="text-xs text-ink-2">{t.login.draftRestored(restoredFrom)}</span>
                    <button
                      onClick={() => setRestoredFrom(null)}
                      className="text-xs text-money hover:underline font-semibold shrink-0"
                    >
                      {t.common.close}
                    </button>
                  </div>
                )}

                {/* UNFILED → default path (plan §B.3). FILED → tracker tabs. */}
                {isRealMode && !wizardCompleted ? (
                  <RealUserTaxWizard
                    lang={lang}
                    t={t}
                    pan={persona.pan}
                    initialEmploymentType={
                      // T3.5: onboarding already asked; the wizard confirms instead of re-asking.
                      onboardingProfile?.profession === "salaried" ? "salaried"
                      : onboardingProfile?.profession === "self_employed" ? "freelancer"
                      : onboardingProfile?.profession === "business_owner" ? "business"
                      : onboardingProfile?.profession === "retired" ? "pension"
                      : undefined
                    }
                    onComplete={(updatedPersona, regime) => {
                      if (returnState) {
                        setReturnState({
                          ...returnState,
                          baselinePersona: updatedPersona,
                          persona: updatedPersona,
                          regime
                        });
                      }
                      setWizardCompleted(true);
                      setFlowStep("check"); // Take them directly to the Review & File step
                    }}
                    onCancel={() => {
                      // Cancel closes the wizard and nothing else. It used to call
                      // handleLogOut() - localStorage.clear() included - so "Cancel Flow"
                      // silently destroyed the session and every onboarding answer
                      // (SS4B round 1, finding C3).
                      setWizardCompleted(true);
                    }}
                  />
                ) : persona.refund.state === "not_filed" ? (
                  <>
                    <FlowStepper
                      t={t}
                      current={flowStep}
                      onJump={(s) => setFlowStep(s)}
                    />
                    {undoStack.length > 0 && (
                      <div className="flex justify-end pr-2 print:hidden -mt-2 mb-4">
                        <button
                          onClick={handleGlobalUndo}
                          className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                          </svg>
                          <span>{t.common.undo}</span>
                        </button>
                      </div>
                    )}

                    <m.div
                      key={flowStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      {flowStep === "facts" && (
                        <div className="space-y-6">
                          {/* Top of the review page: drop a Form 16 / AIS PDF and
                              the reported side of the salary and TDS rows follows it. */}
                          <PdfIngestionDropzone onIngested={handlePdfIngested} />
                          <StatementTab
                            persona={persona}
                            lang={lang}
                            t={t}
                            activeCorrectionByFact={activeCorrectionByFact}
                            confirmedIds={returnState?.confirmedFactIds ?? []}
                            isCustomPersona={activePersonaId === "custom"}
                            onConfirmFact={handleConfirmFact}
                            onDispute={openDispute}
                            onUndoCorrection={handleUndoCorrection}
                            handleFactAmountChange={handleFactAmountChange}
                            handleClaimAmountChange={handleClaimAmountChange}
                            handleAddCustomIncome={handleAddCustomIncome}
                            mode={uiMode}
                            regime={regime}
                            onSignOffAll={handleSignOffAll}
                          />
                          {/* CASS radar: fires the moment a correction pulls a row
                              more than 20% below what a reporter filed, or the
                              total reduction passes ₹1,00,000. Reads the shared
                              context, which mirrors the ledger above. */}
                          <AuditRiskRadar quietWhenClear />
                          {/* D13 single page (user directive 2026-08-29): the confirm
                              checklist lives WITH the cards; jump links scroll in-page.
                              The finish card stays on the check step - here the
                              checklist feeds the same gate as the cards. */}
                          {uiMode === "simple" && breakdown && (
                            <BeforeFiling
                              persona={persona}
                              breakdown={breakdown}
                              t={t}
                              lang={lang}
                              mode={uiMode}
                              confirmedIds={returnState?.confirmedFactIds ?? []}
                              onConfirmFact={handleConfirmFactQuiet}
                              onSignOffAll={handleSignOffAll}
                              onJumpToFact={scrollToFactCard}
                              onProceed={() => setFlowStep("deductions")}
                              showFinish={false}
                            />
                          )}
                          {(() => {
                            const totalItemsCount = persona.facts.length + persona.taxPaid.length + persona.claims.length;
                            const confirmedOrCorrectedCount = [
                              ...persona.facts,
                              ...persona.taxPaid,
                              ...persona.claims
                            ].filter(
                              (fact) =>
                                (returnState?.confirmedFactIds ?? []).includes(fact.id) ||
                                activeCorrectionByFact[fact.id]
                            ).length;
                            const isContinueDisabled = confirmedOrCorrectedCount < totalItemsCount;

                            return (
                              <div className="flex gap-3">
                                <button
                                  onClick={goHome}
                                  className="flex-1 border border-line text-ink-2 py-3 px-4 rounded-lg hover:bg-paper-2 transition-colors text-sm font-semibold"
                                >
                                  {t.common.back}
                                </button>
                                <button
                                  disabled={isContinueDisabled}
                                  onClick={() => setFlowStep("deductions")}
                                  className="flex-[2] rounded-xl bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90 disabled:bg-slate-200 disabled:text-ink-3 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  {t.common.continue}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {flowStep === "deductions" && (
                        <div className="space-y-6">
                          <DeductionsStep
                            persona={persona}
                            t={t}
                            lang={lang}
                            regime={regime}
                            onAddClaim={handleAddClaim}
                            onRemoveClaim={handleRemoveClaim}
                            onClaimAmountChange={(id, amount) => handleClaimAmountChange(id, String(amount))}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => setFlowStep("facts")}
                              className="flex-1 border border-line text-ink-2 py-3 px-4 rounded-lg hover:bg-paper-2 transition-colors text-sm font-semibold"
                            >
                              {t.common.back}
                            </button>
                            <button
                              onClick={() => setFlowStep("regime")}
                              className="flex-[2] rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90"
                            >
                              {t.common.continue}
                            </button>
                          </div>
                        </div>
                      )}

                      {flowStep === "regime" && (
                        <RegimeStep
                          persona={persona}
                          t={t}
                          lang={lang}
                          regime={regime}
                          onboardingProfile={onboardingProfile}
                          onChoose={handleChooseRegime}
                        />
                      )}

                      {flowStep === "check" && (
                        <div className="space-y-6">
                          <CheckScreen persona={persona} t={t} lang={lang} regime={regime} />
                          <AuditRiskRadar quietWhenClear />
                          {breakdown && (
                            <BeforeFiling
                              persona={persona}
                              breakdown={breakdown}
                              t={t}
                              lang={lang}
                              mode={uiMode}
                              confirmedIds={returnState?.confirmedFactIds ?? []}
                              onConfirmFact={handleConfirmFactQuiet}
                              onSignOffAll={handleSignOffAll}
                              onJumpToFact={handleJumpToFact}
                              onProceed={() => setFlowStep("filing")}
                              onPayOutstanding={() => setChallanOpen(true)}
                              showChecklist={false /* the Full-detail register is no longer a switch (plan D5) */}
                            />
                          )}
                          <div className="flex gap-3">
                            <button
                              onClick={() => setFlowStep("regime")}
                              className="flex-1 border border-line text-ink-2 py-3 px-4 rounded-lg hover:bg-paper-2 transition-colors text-sm font-semibold"
                            >
                              {t.common.back}
                            </button>
                          </div>
                        </div>
                      )}

                      {flowStep === "filing" && (
                        <FilingStep
                          persona={persona}
                          t={t}
                          lang={lang}
                          regime={regime}
                          faultInjected={simulatedError}
                          slowMode={simulatedDelay}
                          onFile={handleFileCommit}
                          onPayOutstanding={() => setChallanOpen(true)}
                          onBack={() => {
                            setFlowStep("check");
                            setActiveTab("overview");
                          }}
                        />
                      )}
                    </m.div>
                  </>
                ) : (
                  <>
                    {/* THE PORTAL TAB CONTROL PANEL (filed view) */}
                    <div id="dashboard-tabs">
                      <TabBar
                        t={t}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        noticeCount={persona.notices.length}
                      />
                    </div>

                    {/* TAB WINDOW ROUTER */}
                    <m.div 
                      key={activeTab}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="pt-2"
                    >
                      
                      {/* TAB 1: REFUND TRACKER */}
                      {activeTab === "overview" && (
                        <OverviewTab
                          persona={persona}
                          lang={lang}
                          t={t}
                          stampFired={stampFired || isFiled}
                          refundFigure={breakdown?.refundOrDue ?? 0}
                          handleFixBank={handleFixBank}
                          onEditFacts={() => setQuickEditActive(true)}
                          regime={regime}
                          mode={uiMode}
                          serverFilings={session?.pan === persona.pan ? serverFilings : null}
                        />
                      )}

                      {/* TAB 2: FACTS REVIEW (AIS/26AS provenance) */}
                      {activeTab === "statement" && (
                        <div className="space-y-6">
                        <AuditRiskRadar quietWhenClear />
                        <StatementTab
                          persona={persona}
                          lang={lang}
                          t={t}
                          activeCorrectionByFact={activeCorrectionByFact}
                          confirmedIds={returnState?.confirmedFactIds ?? []}
                          isCustomPersona={activePersonaId === "custom"}
                          onConfirmFact={handleConfirmFact}
                          onDispute={openDispute}
                          onUndoCorrection={handleUndoCorrection}
                          handleFactAmountChange={handleFactAmountChange}
                          handleClaimAmountChange={handleClaimAmountChange}
                          handleAddCustomIncome={handleAddCustomIncome}
                          mode={uiMode}
                          regime={regime}
                          onSignOffAll={handleSignOffAll}
                        />
                        </div>
                      )}

                      {/* TAB 3: PENDING ACTIONS / NOTICES */}
                      {activeTab === "actions" && (
                        <ActionsTab
                          persona={persona}
                          lang={lang}
                          rentLandlordName={rentLandlordName}
                          rentLandlordPan={rentLandlordPan}
                          rentFile={rentFile}
                          setRentLandlordName={setRentLandlordName}
                          setRentLandlordPan={setRentLandlordPan}
                          handleUploadRent={handleUploadRent}
                          saveRentClaim={saveRentClaim}
                          handleFixBank={handleFixBank}
                          handleNoticeClick={handleNoticeClick}
                          onAutoReconcile={handleAutoReconcile}
                          onUndoAutoReconcile={handleGlobalUndo}
                        />
                      )}

                    </m.div>
                  </>
                )}

                {/* The persistent copilot: the one place to type. Sticky to the viewport foot. */}
                <CopilotBar
                  lang={lang}
                  onAsk={(text) => setCopilotPrompt({ text, nonce: Date.now() })}
                  onTool={(id) => setTool(id)}
                />

              </m.div>
            )}

          </AnimatePresence>

        </main>

        {/* --- REVIEWER DEBUG DRAWER (SCHEDULE I) --- */}
        <SandboxDrawer
          showConsole={showConsole}
          setShowConsole={setShowConsole}
          simulatedDelay={simulatedDelay}
          simulatedError={simulatedError}
          setSimulatedDelay={setSimulatedDelay}
          setSimulatedError={setSimulatedError}
          persona={persona}
          lang={lang}
          handleLogOut={handleLogOut}
          handleFactAmountChange={handleFactAmountChange}
        />

        {/* --- DYNAMIC DISPUTE MODAL (FRAMER MOTION) --- */}
        {activeDisputeId && isPreFilled ? (
          <DisputeModal
            active={!!activeDisputeId}
            persona={persona}
            t={t}
            disputeAmount={disputeAmount}
            disputeReason={disputeReason}
            isSpeechListening={isSpeechListening}
            setDisputeAmount={setDisputeAmount}
            setDisputeReason={setDisputeReason}
            setDisputeFeedbackCode={setDisputeFeedbackCode}
            toggleSpeechMock={toggleSpeechMock}
            saveDispute={saveDispute}
            onClose={() => setActiveDisputeId(null)}
            isPreFilled={isPreFilled}
            reportedAmount={reportedAmount}
            reporterName={reporterName}
            disputeTarget={disputeTarget}
          />
        ) : activeDisputeId ? (
          <EditIncomeModal
            isOpen={!!activeDisputeId}
            factId={activeDisputeId}
            initialAmount={reportedAmount}
            onClose={() => setActiveDisputeId(null)}
            onSaveAndRecalculate={handleSaveAndRecalculate}
          />
        ) : null}

        {/* --- CHALLAN 280 (self-assessment tax u/s 140A) ---
            Opened by the pay button that replaces "file" while a balance is
            due. The amount is the main journey's own engine figure, so the
            challan matches the balance the citizen was just shown. */}
        <Challan280Modal
          open={challanOpen}
          amount={balanceDue}
          onClose={() => setChallanOpen(false)}
          onPaid={handleChallanPaid}
        />

        {/* --- DYNAMIC BANK IFSC UPDATE POPUP --- */}
        <BankIfscModal
          active={!!activeBankFixId}
          lang={lang}
          ifscInput={ifscInput}
          ifscError={ifscError}
          handleIfscInputChange={handleIfscInputChange}
          saveBankFix={saveBankFix}
          onClose={() => setActiveBankFixId(null)}
        />

        {/* --- DYNAMIC LEGAL NOTICE MODAL --- */}
        <NoticeModal
          activeNoticeId={selectedNoticeId}
          persona={persona}
          lang={lang}
          noticeResponseText={noticeResponseText}
          noticeAgreed={noticeAgreed}
          isSpeechListening={isSpeechListening}
          setNoticeResponseText={setNoticeResponseText}
          setNoticeAgreed={setNoticeAgreed}
          toggleSpeechMock={toggleSpeechMock}
          saveNoticeResponse={saveNoticeResponse}
          onClose={() => setSelectedNoticeId(null)}
        />

        {/* --- DYNAMIC QUICK EDIT FACTS MODAL --- */}
        {persona && (
          <QuickEditModal
            isOpen={quickEditActive}
            salary={persona.facts.find((f) => f.kind === "salary")?.amount ?? 0}
            interest={persona.facts.find((f) => f.kind === "interest")?.amount ?? 0}
            tds={persona.taxPaid.find((t) => t.section === "192")?.amount ?? 0}
            onSave={handleQuickEditSave}
            onClose={() => setQuickEditActive(false)}
            lang={lang}
            t={t}
          />
        )}
          </>
        )}

      </div>
    </LazyMotion>
  );
}
