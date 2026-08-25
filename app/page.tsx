"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LazyMotion, domMax, m, AnimatePresence } from "motion/react";

import { PERSONAS, TODAY } from "../lib/personas";
import type { Persona, PersonaId, Lang, IncomeFact, BankAccount, Notice, RefundState, TimelineKey } from "../lib/types";
import { REFUND_SEQUENCE } from "../lib/types";
import { dict } from "../lib/i18n";
import { mulberry32, pick } from "../lib/rng";
import { validatePan, validateIfsc } from "../lib/validate";
import {
  applyCorrection,
  revertCorrection,
  confirmFact,
  type Correction,
  type ReturnState,
} from "../lib/return/state";
import {
  load as loadPersist,
  save as savePersist,
  pushUndo,
  popUndo,
  CURRENT_VERSION,
} from "../lib/return/persist";
import { computeForPersona, DEFAULT_REGIME } from "../lib/return/compute";
import {
  loadOnboardingDraft,
  loadOnboardingProfile,
  saveOnboardingProfile,
  getDashboardDestination,
  type OnboardingDraft,
  type OnboardingProfile,
} from "../lib/onboarding";

import Landing from "../components/landing";
import OtpScreen from "../components/otp-screen";
import PortalHeader from "../components/dashboard/portal-header";
import ProfileStrip from "../components/dashboard/profile-strip";
import TabBar, { type DashboardTab } from "../components/dashboard/tab-bar";
import OverviewTab from "../components/dashboard/overview-tab";
import StatementTab from "../components/dashboard/statement-tab";
import ActionsTab from "../components/dashboard/actions-tab";
import SandboxDrawer from "../components/dashboard/sandbox-drawer";
import DisputeModal from "../components/dashboard/dispute-modal";
import { EditIncomeModal } from "../components/dashboard/edit-income-modal";
import BankIfscModal from "../components/dashboard/bank-ifsc-modal";
import NoticeModal from "../components/dashboard/notice-modal";
import PersonalizedDashboard from "../components/dashboard/personalized-dashboard";
import FlowStepper, { FLOW_STEPS, type FlowStepName } from "../components/flow/flow-stepper";
import DeductionsStep from "../components/flow/deductions-step";
import RegimeStep from "../components/flow/regime-step";
import CheckScreen from "../components/flow/check-screen";
import FilingStep from "../components/flow/filing-step";
import { generateSeededUser } from "../components/sandbox-user";
import Onboarding from "../components/onboarding";
import { JudgeSandboxBar, JUDGE_VECTORS, type JudgeVector } from "../components/dashboard/judge-sandbox-bar";
import { QuickEditModal } from "../components/dashboard/quick-edit-modal";
import RealUserTaxWizard from "../components/flow/real-user-wizard";

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
  // --- CORE UI STATES ---
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [step, setStep] = useState<"onboarding" | "landing" | "otp" | "dashboard">("onboarding");
  const [activePersonaId, setActivePersonaId] = useState<PersonaId | "custom" | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({});
  const [onboardingReturnStep, setOnboardingReturnStep] = useState<"landing" | "dashboard">("landing");
  /** Versioned return document — the single source the whole flow reads and writes. */
  const [returnState, setReturnState] = useState<ReturnState | null>(null);
  const [undoStack, setUndoStack] = useState<ReturnState[]>([]);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);

  const persona = returnState?.persona ?? null;

  // Tab control inside dashboard (filed view) + default-path flow control
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [flowStep, setFlowStep] = useState<FlowStepName>("facts");

  const t = dict(lang);
  const regime = returnState?.regime ?? DEFAULT_REGIME;
  const breakdown = useMemo(
    () => (persona ? computeForPersona(persona, regime) : null),
    [persona, regime],
  );
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
  const [autoFillCode, setAutoFillCode] = useState("949494");

  // Interaction Modals / Views
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [disputeAmount, setDisputeAmount] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState<string>("");
  
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
  const [activeVectorId, setActiveVectorId] = useState<string | null>(null);
  const [quickEditActive, setQuickEditActive] = useState(false);
  const [isRealMode, setIsRealMode] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);

  // Load saved draft (versioned ReturnState; legacy raw-Persona drafts migrate)
  useEffect(() => {
    const savedLang = localStorage.getItem("wapsi_lang");
    const savedTheme = localStorage.getItem("wapsi_theme");
    const savedOnboarding = loadOnboardingProfile();
    const savedOnboardingDraft = loadOnboardingDraft();

    setOnboardingProfile(savedOnboarding);
    setOnboardingDraft(savedOnboardingDraft);

    if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "ta")) {
      setLang(savedLang as Lang);
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
        setOnboardingReturnStep("dashboard");
        setStep("onboarding");
      }
    } else if (savedOnboarding) {
      setStep("landing");
    }
  }, []);

  // Sync document root class with theme state
  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

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

  const handleCompleteOnboarding = (profile: OnboardingProfile) => {
    setOnboardingProfile(profile);
    setOnboardingDraft({});
    saveOnboardingProfile(profile);
    setLang(profile.lang);
    localStorage.setItem("wapsi_lang", profile.lang);
    window.dispatchEvent(new Event("wapsi_lang_change"));
    if (returnState) {
      const nextState = { ...returnState, lang: profile.lang };
      saveState(nextState);
      if (onboardingReturnStep === "dashboard") {
        setPersonalizedDashboardDestination(profile, nextState);
      }
    }
    setStep(onboardingReturnStep);
  };

  const handleEditOnboarding = () => {
    if (!onboardingProfile) return;
    setOnboardingReturnStep(step === "dashboard" ? "dashboard" : "landing");
    setOnboardingDraft(onboardingProfile);
    setStep("onboarding");
  };

  // Generate deterministic Sandbox User based on name / PAN seed
  const handleCreateCustom = () => {
    const seed = customName || customPan || "DefaultSeed";
    const customUser = generateSeededUser(seed, lang);

    setActivePersonaId("custom");
    setIsRealMode(false);
    setWizardCompleted(true);
    setReturnState(freshState(customUser, lang));
    setUndoStack([]);
    setOtp(["9", "4", "9", "4", "9", "4"]); // prefill OTP
    setStep("otp");
  };

  // Select Persona
  const handleSelectPersona = (id: PersonaId) => {
    setActivePersonaId(id);
    setIsRealMode(false);
    setWizardCompleted(true);
    const pData: Persona = JSON.parse(JSON.stringify(PERSONAS[id])); // deep clone
    setReturnState(freshState(pData, pData.preferredLang));
    setUndoStack([]);
    setLang(pData.preferredLang); // Automatically switch to persona's preferred language
    localStorage.setItem("wapsi_lang", pData.preferredLang);
    window.dispatchEvent(new Event("wapsi_lang_change"));
    setOtp(["1", "2", "3", "4", "5", "6"]); // standard OTP mock
    setAutoFillCode(id === "sunita" ? "111111" : id === "rakesh" ? "222222" : "333333");
    setStep("otp");
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
    
    // Check if matches preseeded personas
    const matched = Object.keys(PERSONAS).find(k => PERSONAS[k as PersonaId].pan.toUpperCase() === cleanPan);
    if (matched) {
      handleSelectPersona(matched as PersonaId);
    } else {
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
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // auto focus next box
    if (val !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (simulatedError) {
      setOtpError(true);
      return;
    }

    const typedCode = otp.join("");
    const correctCode = activePersonaId === "custom" ? "949494" : autoFillCode;

    if ((typedCode === correctCode || typedCode === "949494" || activePersonaId === "custom") && returnState) {
      setOtpError(false);
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
    } else {
      setOtpError(true);
    }
  };

  // Log Out / Reset
  const handleLogOut = () => {
    localStorage.clear();
    setStep("onboarding");
    setActivePersonaId(null);
    setOnboardingProfile(null);
    setOnboardingDraft({});
    setOnboardingReturnStep("landing");
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

  const handleUndoCorrection = (correctionId: string) => {
    if (!returnState) return;
    commitWithUndo(revertCorrection(returnState, correctionId));
  };

  // Dispute modal open: numeric input starts empty per non-technical requirement.
  const openDispute = (fact: Pick<IncomeFact, "id" | "amount">) => {
    setActiveDisputeId(fact.id);
    setDisputeAmount(""); // Start with empty input
    const correction = activeCorrectionByFact[fact.id];
    setDisputeReason(correction?.reason || "");
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
      at: new Date().toISOString(),
      target: fact ? "fact" : tax ? "tax" : "claim",
    };

    console.log("Ledger Event [OVERRIDE_FACT]:", {
      type: "OVERRIDE_FACT",
      factId: activeDisputeId,
      reported: source.amount,
      declared: correction.next,
    });

    let next = applyCorrection(returnState, correction);

    // Rakesh AIS-mismatch hold releases when the capital-gains figure goes to zero.
    if (persona.id === "rakesh" && fact?.id === "rakesh-capital-gains") {
      if (correction.next === 0) {
        next = {
          ...next,
          baselinePersona: withHolds(next.baselinePersona),
          persona: withHolds(next.persona),
        };
      }
    }

    commitWithUndo(next);
    setActiveDisputeId(null);

    function withHolds(p: Persona): Persona {
      return {
        ...p,
        refund: {
          ...p.refund,
          holds: p.refund.holds.map((h) =>
            h.kind === "ais_mismatch" ? { ...h, resolved: true } : h,
          ),
        },
      };
    }
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
      at: new Date().toISOString(),
      target: fact ? "fact" : tax ? "tax" : "claim",
    };

    console.log("Ledger Event [OVERRIDE_FACT]:", {
      type: "OVERRIDE_FACT",
      factId,
      reported: source.amount,
      declared: correction.next,
    });

    let next = applyCorrection(returnState, correction);

    // Rakesh AIS-mismatch hold releases when the capital-gains figure goes to zero.
    if (persona.id === "rakesh" && fact?.id === "rakesh-capital-gains") {
      if (correction.next === 0) {
        next = {
          ...next,
          baselinePersona: withHolds(next.baselinePersona),
          persona: withHolds(next.persona),
        };
      }
    }

    commitWithUndo(next);
    setActiveDisputeId(null);

    function withHolds(p: Persona): Persona {
      return {
        ...p,
        refund: {
          ...p.refund,
          holds: p.refund.holds.map((h) =>
            h.kind === "ais_mismatch" ? { ...h, resolved: true } : h,
          ),
        },
      };
    }
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
  const handleFileCommit = () => {
    if (!persona || !returnState) return;

    localStorage.removeItem("wapsi_last_submission_id");
    setIsFiled(true);
    saveState({
      ...returnState,
      filedAt: new Date().toISOString(),
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

    // POST request to backend API
    const facts = persona.facts.map((f) => ({
      kind: f.kind,
      amountPaise: f.amount * 100
    }));

    const claims = persona.claims.map((c) => ({
      section: c.section,
      amountPaise: c.amount * 100
    }));

    const tdsCreditsPaise = persona.taxPaid.reduce((sum, t) => sum + t.amount, 0) * 100;
    const ruleSetVersion = regime === "old" ? "2026-27-old" : "2026-27-new";
    const idempotencyKey = `idemp-${persona.id}-${Date.now()}`;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

    fetch(`${backendUrl}/api/v1/returns/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey,
        assessmentYear: "2026-27",
        ruleSetVersion,
        facts,
        claims,
        tdsCreditsPaise,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Filing submission to Spring Boot backend failed");
        return res.json();
      })
      .then((data) => {
        console.log("Filing submission accepted by backend:", data);
        if (data && data.submissionId) {
          localStorage.setItem("wapsi_last_submission_id", data.submissionId);
          window.dispatchEvent(new CustomEvent("wapsi_submitted", { detail: data.submissionId }));
        }
      })
      .catch((err) => {
        console.error("Error submitting return to backend:", err);
      });

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

  const handleSelectJudgeVector = (vector: JudgeVector | null) => {
    if (!vector) {
      setActiveVectorId(null);
      setIsRealMode(true);
      setWizardCompleted(false);

      const customUser: Persona = {
        id: "custom",
        name: "",
        age: 29,
        city: "",
        state: "",
        occupation: "",
        pan: "",
        mobile: "",
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
      setStep("dashboard");
      return;
    }

    setActiveVectorId(vector.id);
    setIsRealMode(false);
    setWizardCompleted(true);

    if (vector.id === "rakesh-notice") {
      handleSelectPersona("rakesh");
      return;
    }

    // Otherwise, create a clean custom sandbox persona with the vector parameters
    const customUser: Persona = {
      id: "custom",
      name: vector.name,
      age: 29,
      city: "Sandbox",
      state: "Evaluation",
      occupation: "Judge Demo Profile",
      pan: "DEMPJ1234F",
      mobile: "90000 00009",
      preferredLang: lang,
      situation: vector.description,
      act: 3,
      actLabel: "Evaluation Sandbox",
      embodies: vector.description,
      assessmentYear: "2026-27",
      facts: [
        {
          id: "sandbox-salary",
          label: "Your primary contract income",
          amount: vector.salary,
          kind: "salary",
          provenance: {
            reporter: "Sandbox Employer Ltd",
            reporterKind: "employer",
            filedOn: "2026-05-18",
            statement: "26AS",
            onlyReporterCanFix: false
          }
        },
        {
          id: "sandbox-interest",
          label: "Savings interest",
          amount: vector.interest,
          kind: "interest",
          provenance: {
            reporter: "Sandbox Bank",
            reporterKind: "bank",
            filedOn: "2026-06-05",
            statement: "AIS",
            onlyReporterCanFix: false
          }
        }
      ],
      taxPaid: [
        {
          id: "sandbox-tds-192",
          label: "Tax withheld (TDS)",
          amount: vector.tds,
          section: "192",
          provenance: {
            reporter: "Sandbox Employer Ltd",
            reporterKind: "employer",
            filedOn: "2026-05-18",
            statement: "26AS",
            onlyReporterCanFix: false
          }
        }
      ],
      claims: (vector.claims || []).map((c, idx) => ({
        id: `sandbox-claim-${idx}`,
        section: c.section,
        label: c.section === "80C" ? "Provident Fund / ELSS" : "Health cover",
        amount: c.amount,
        evidenceAttached: true
      })),
      banks: [
        {
          id: "sandbox-bank-1",
          bank: "Deccan Union Bank",
          maskedNumber: "•••• •••• 9999",
          ifsc: "DECU0834471",
          status: "validated",
          nominatedForRefund: true
        }
      ],
      refund: {
        state: "under_review",
        amount: vector.tds,
        filedOn: "2026-07-20",
        verifiedOn: "2026-07-20",
        holds: [],
        timeline: [
          {
            id: "sb-tl-1",
            on: "2026-07-20",
            state: "filed_unverified",
            headline: "You sent your return in.",
            actor: "citizen"
          },
          {
            id: "sb-tl-2",
            on: "2026-07-20",
            state: "verified",
            headline: "You confirmed it was you. The return counts from here.",
            actor: "citizen"
          }
        ]
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
      regime: vector.regime
    });
    setStep("dashboard");
  };

  const handleQuickEditSave = (salary: number, interest: number, tds: number) => {
    if (!persona || !returnState) return;

    let updatedState = { ...returnState };

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

    saveState(updatedState);
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

        {/* --- JUDGE SANDBOX BAR --- */}
        <JudgeSandboxBar
          activeVectorId={activeVectorId}
          onSelectVector={handleSelectJudgeVector}
          onEditFacts={() => setQuickEditActive(true)}
        />

        {/* --- PORTAL HEADER --- */}
        <PortalHeader
          lang={lang}
          t={t}
          theme={theme}
          showConsole={showConsole}
          changeLang={changeLang}
          toggleTheme={toggleTheme}
          setShowConsole={setShowConsole}
        />

        {/* --- MAIN BODY --- */}
        <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:px-6 md:py-10 relative">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ONBOARDING */}
            {step === "onboarding" && (
              <m.div
                key="onboarding"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <Onboarding
                  lang={lang}
                  t={t}
                  initialDraft={onboardingDraft}
                  onLanguageChange={changeLang}
                  onComplete={handleCompleteOnboarding}
                />
              </m.div>
            )}

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
                  handleSelectPersona={handleSelectPersona}
                  handleCreateCustom={handleCreateCustom}
                  onboardingProfile={onboardingProfile}
                  onEditOnboarding={handleEditOnboarding}
                />
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
                  mockCode={activePersonaId === "custom" ? "949494" : autoFillCode}
                  handleOtpChange={handleOtpChange}
                  onAutoFill={() => {
                    const code = activePersonaId === "custom" ? "949494" : autoFillCode;
                    setOtp(code.split(""));
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
                <ProfileStrip persona={persona} lang={lang} t={t} onLogOut={handleLogOut} isRealMode={isRealMode} />

                {onboardingProfile && (!isRealMode || wizardCompleted) && (
                  <PersonalizedDashboard
                    profile={onboardingProfile}
                    t={t}
                    hasFiled={persona.refund.state !== "not_filed"}
                    destination={dashboardDestination}
                    onPrimaryAction={openPersonalizedDashboardDestination}
                    onEdit={handleEditOnboarding}
                    isRealMode={isRealMode}
                  />
                )}

                {/* RESTORED DRAFT BANNER — never silently resume */}
                {restoredFrom && (
                  <div className="bg-paper-2 border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-3">
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
                      setIsRealMode(false);
                      setWizardCompleted(true);
                      handleLogOut();
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
                      <button
                        onClick={handleGlobalUndo}
                        className="text-xs text-ink-2 hover:text-navy font-semibold underline underline-offset-2"
                      >
                        {t.common.undo}
                      </button>
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
                          />
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
                              <button
                                disabled={isContinueDisabled}
                                onClick={() => setFlowStep("deductions")}
                                className="w-full rounded-xl bg-money px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-money-deep disabled:bg-slate-200 disabled:text-ink-3 cursor-pointer disabled:cursor-not-allowed"
                              >
                                {t.common.continue}
                              </button>
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
                              className="flex-[2] rounded-xl bg-money px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-money-deep"
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
                          <div className="flex gap-3">
                            <button
                              onClick={() => setFlowStep("regime")}
                              className="flex-1 border border-line text-ink-2 py-3 px-4 rounded-lg hover:bg-paper-2 transition-colors text-sm font-semibold"
                            >
                              {t.common.back}
                            </button>
                            <button
                              onClick={() => setFlowStep("filing")}
                              className="flex-[2] rounded-xl bg-money px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-money-deep"
                            >
                              {t.common.continue}
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
                    <TabBar
                      t={t}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      noticeCount={persona.notices.length}
                    />

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
                        />
                      )}

                      {/* TAB 2: FACTS REVIEW (AIS/26AS provenance) */}
                      {activeTab === "statement" && (
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
                        />
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
                        />
                      )}

                    </m.div>
                  </>
                )}

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
          activePersonaId={activePersonaId}
          persona={persona}
          lang={lang}
          handleSelectPersona={(id) => handleSelectPersona(id)}
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

      </div>
    </LazyMotion>
  );
}
