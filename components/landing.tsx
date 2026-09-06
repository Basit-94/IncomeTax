"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronRight, UserCheck, LogOut, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import type { Dict } from "../lib/i18n";
import type { Lang, Notice, BankAccount, Persona, TaxAlreadyPaid } from "../lib/types";
import type { OnboardingProfile } from "../lib/onboarding";
import { getPersonalization } from "../lib/onboarding";
import { PERSONAS } from "../lib/personas";
import LandingActionGrid from "./landing-action-grid";
import type { LandingActionCard } from "@/lib/landingCards";
import type { CitizenVaultUser } from "@/lib/vault/vault-store";
import { getPortalStrings } from "@/lib/i18n/portalTranslations";
import { Munshi } from "./brand/munshi";
import Card3D from "./ui/card-3d";

import type { IngestedDocument, SelfAssessmentPayment } from "@/context/TaxReturnContext";
import type { ReconcileRow } from "./modals/MatchRecordsModal";

interface LandingProps {
  t: Dict;
  lang?: Lang;
  panInput: string;
  panInputError: string | null;
  handlePanInputChange: (val: string) => void;
  handlePanSubmit: (e: React.FormEvent) => void;
  onboardingProfile: OnboardingProfile | null;
  onEditOnboarding: () => void;
  onLaunchPersona?: (personaId: "sunita" | "rakesh" | "priya" | "custom", directToDashboard?: boolean) => void;
  onLaunchPan?: (pan: string) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
  onNavigateToAuth?: () => void;
  activeCitizen?: {
    name: string;
    pan: string;
    salary?: number;
    tds?: number;
    totalTaxesPaid?: number;
    taxDue?: number;
    grossTax?: number;
    hasPaidChallan?: boolean;
    challanPayments?: TaxAlreadyPaid[];
    taxPaidEntries?: TaxAlreadyPaid[];
    notices?: Notice[];
    banks?: BankAccount[];
    refund?: Persona["refund"];
    hasDiscrepancies?: boolean;
  } | null;
  onResumeReturn?: () => void;
  onStartFreshFiling?: () => void;
  onLogout?: () => void;
  onApplyReconciliation?: (reconciledRows: ReconcileRow[]) => void;
  onApplyOptimizer?: (
    regime: "new" | "old",
    grossSalary: number,
    deductions: {
      section80C: number;
      section80D: number;
      hra: number;
      nps: number;
      homeLoan: number;
    }
  ) => void;
  onApplyChallan?: (payment: SelfAssessmentPayment) => void;
  onResolveNotice?: (noticeId: string, resolution: "agree" | "disagree", responseStatement?: string) => void;
  currentRegime?: "new" | "old";
  onOpenVault?: () => void;
  onSignUpComplete?: (user: CitizenVaultUser) => void;
}

/** D13 index cards are never perfectly square to the desk. */
const TILTS = ["-.4deg", ".35deg", "-.25deg"];

/** The three reviewer sign-ins, in act order. Names and PANs come from the
    persona data, so nothing here is a hard-coded English string. */
const REVIEWER_IDS = ["sunita", "rakesh", "priya"] as const;

const PAN_INPUT_ID = "landing-pan";
const PAN_HELP_ID = "landing-pan-help";
const PAN_ERROR_ID = "landing-pan-error";

export default function Landing({
  t,
  lang = "en",
  panInput,
  panInputError,
  handlePanInputChange,
  handlePanSubmit,
  onboardingProfile,
  onEditOnboarding,
  onLaunchPersona,
  onLaunchPan,
  onLaunchWithForm16,
  activeCitizen,
  onResumeReturn,
  onLogout,
  onApplyReconciliation,
  onApplyOptimizer,
  onApplyChallan,
  onResolveNotice,
  currentRegime,
  onOpenVault,
  onSignUpComplete,
  onNavigateToAuth,
  onStartFreshFiling,
}: LandingProps) {
  const ps = getPortalStrings(lang || "en");
  const personalization = onboardingProfile ? getPersonalization(onboardingProfile) : null;
  const primaryAction = onboardingProfile
    ? t.onboarding.intentCta[onboardingProfile.intent]
    : t.landing.check;

  /* Same rise the fact cards use: the class lands on the next frame so the
     card animates in instead of appearing already settled. */
  const [risen, setRisen] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRisen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* A reviewer card fills the field above it, outside the eye's landing zone.
     Same jump idiom as scrollToFactCard: bring the target into view, flash it,
     and move focus there — which also announces the new value to a screen
     reader, since the change happened nowhere near the user's cursor. */
  const panRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fillPanFromPersona = (pan: string) => {
    handlePanInputChange(pan);
    const el = panRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.focus({ preventScroll: true });
    const box = el.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    }
    if (reduced) return;
    if (flashTimer.current) clearTimeout(flashTimer.current);
    el.classList.remove("flash");
    void el.offsetWidth; /* restart the ring when a second card is clicked */
    el.classList.add("flash");
    flashTimer.current = setTimeout(() => el.classList.remove("flash"), 900);
  };

  const handleActionClick = (id: LandingActionCard["id"]) => {
    if (id === "file_return") {
      if (activeCitizen && onResumeReturn) {
        onResumeReturn();
      } else {
        fillPanFromPersona(PERSONAS.sunita.pan);
      }
    } else if (id === "match_records") {
      if (activeCitizen && onResumeReturn) {
        onResumeReturn();
      } else {
        fillPanFromPersona(PERSONAS.priya.pan);
      }
    } else if (id === "pay_tax") {
      fillPanFromPersona(PERSONAS.rakesh.pan);
    } else if (id === "notices") {
      fillPanFromPersona(PERSONAS.sunita.pan);
    } else if (id === "status_history") {
      fillPanFromPersona(PERSONAS.rakesh.pan);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-4 lg:py-6">
      {/* Hero (redesign 4h): badge pill + AY, h1 50, the question, one paragraph — and Munshi ji at 120 px. */}
      <header className="relative flex items-start justify-between gap-5 text-start pt-1">
        <div className="space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-bg px-3 py-1 text-xs font-bold text-amber-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-money" aria-hidden="true" />
              <span>{t.landing.badge}</span>
            </span>
            <span className="text-[11px] text-ink-3">{t.shell.taxYear}</span>
          </div>
          <h1 className="font-sans text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[50px]">
            {t.landing.brandTitle}
          </h1>
          <h2 className="max-w-[34ch] font-sans text-[22px] font-bold leading-tight tracking-[-0.01em] text-ink-2">
            {t.landing.question}
          </h2>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{t.landing.subtext}</p>
        </div>
        <div className="hidden md:block shrink-0 pt-2" aria-hidden="true">
          <Munshi size={120} />
        </div>
      </header>

      {onboardingProfile && personalization && (
        <div className="recovery-callout flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-start">
            <span className="cap block">{t.onboarding.tailoredBadge}</span>
            <p className="pencil m-0 text-[22px] leading-tight text-amber-ink">
              {t.onboarding.tailoredIntent(t.onboarding.intentOptions[onboardingProfile.intent].label)}
            </p>
            <p className="m-0 text-[13px] leading-relaxed text-amber-ink/80">
              {personalization.guided ? t.onboarding.tailoredGuided : t.onboarding.tailoredQuick}.{" "}
              {personalization.regimeLens === "check_claims"
                ? t.onboarding.tailoredRegimeClaims
                : t.onboarding.tailoredRegimeCompare}
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onEditOnboarding}
            className="inline-flex min-h-11 shrink-0 items-center justify-center px-2 text-sm font-semibold text-money hover:underline"
          >
            {t.onboarding.changeAnswers}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RETURNING CITIZEN WITH ACTIVE DRAFT vs GUEST PROMPT (3D ELEVATION)        */}
      {/* ========================================================================= */}
      {(() => {
        const hasActiveDraft = Boolean(
          activeCitizen &&
            ((activeCitizen.salary ?? 0) > 0 ||
              (activeCitizen.totalTaxesPaid ?? 0) > 0 ||
              (activeCitizen.taxPaidEntries && activeCitizen.taxPaidEntries.length > 0) ||
              (activeCitizen.refund && activeCitizen.refund.state !== "not_filed") ||
              (activeCitizen.refund && (activeCitizen.refund.amount ?? 0) > 0) ||
              activeCitizen.hasDiscrepancies)
        );

        if (hasActiveDraft && activeCitizen) {
          return (
            <Card3D as="div" glowColor="rgba(255, 122, 26, 0.35)" depth={20} className="ink-surface rounded-3xl p-5 sm:px-6 text-start animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#5EE6B0]">
                    <span className="size-2 rounded-full bg-[#5EE6B0]" aria-hidden="true" />
                    <span>{ps.activeSession}</span>
                  </div>
                  <h3 className="font-sans text-xl font-extrabold tracking-[-0.02em] text-on-ink">
                    {`${ps.welcome}, ${activeCitizen.name}`}
                  </h3>
                  <p className="font-mono text-[11.5px] text-on-ink/70">
                    PAN <span className="font-bold text-on-ink">{activeCitizen.pan}</span> · {t.shell.taxYear} · {ps.draftActive}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {onResumeReturn && (
                    <button
                      type="button"
                      onClick={onResumeReturn}
                      className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-[14px] h-[46px] px-5 text-[14.5px] transition cursor-pointer"
                    >
                      <span>{ps.continueFiling}</span>
                      <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </Card3D>
          );
        }

        if (!activeCitizen && onNavigateToAuth) {
          return (
            <Card3D as="div" glowColor="rgba(139, 108, 240, 0.3)" depth={20} className="glass rounded-3xl p-5 sm:p-6 text-start flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="stamp-chip -rotate-[1deg] text-[10px]">{t.shell.taxYear} · {ps.taxVault}</span>
                <h3 className="font-sans text-lg sm:text-xl font-bold text-ink">
                  {ps.guestBannerTitle}
                </h3>
                <p className="font-mono text-xs text-ink-2 max-w-[60ch]">
                  {ps.guestBannerSub}
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToAuth}
                className="btn-primary shrink-0 flex items-center gap-2 rounded-[14px] h-[46px] px-5 text-[14.5px] transition cursor-pointer"
              >
                <span>{ps.signInOrRegister}</span>
                <ChevronRight size={15} />
              </button>
            </Card3D>
          );
        }

        return null;
      })()}

      {/* ── 7-Action Capability Grid + Agentic Mode Hero Box ─────────────── */}
      <LandingActionGrid
        lang={lang}
        onActionClick={handleActionClick}
        onLaunchPersona={onLaunchPersona}
        onLaunchPan={onLaunchPan}
        onLaunchWithForm16={onLaunchWithForm16}
        activeCitizen={activeCitizen}
        onResumeReturn={onResumeReturn}
        onStartFreshFiling={onStartFreshFiling}
        onApplyReconciliation={onApplyReconciliation}
        onApplyOptimizer={onApplyOptimizer}
        onApplyChallan={onApplyChallan}
        onResolveNotice={onResolveNotice}
        currentRegime={currentRegime}
      />

      {/* ── The Reviewer Detour: only shown when unauthenticated ─────────── */}
      {!activeCitizen && (
        <>
          <div className="divider">
            <svg width="70" height="18" viewBox="0 0 70 18" aria-hidden="true">
              <path
                d="M0 15 C 10 15, 15 4, 25 4 S 40 15, 50 15 S 60 3, 70 3"
                fill="none"
                stroke="var(--primary-accent)"
                strokeWidth="2"
              />
            </svg>
            <span className="label">{t.landing.orTryAs}</span>
            <div className="line" />
          </div>

          <section aria-label={t.landing.orTryAs} className="grid gap-5 sm:grid-cols-3">
            {REVIEWER_IDS.map((id, i) => {
              const person = PERSONAS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => fillPanFromPersona(person.pan)}
                  className={`card ${risen ? "in" : ""} block w-full text-start`}
                  style={{ "--tilt": TILTS[i % TILTS.length] } as CSSProperties}
                >
                  <span className="pin" aria-hidden="true" />
                  <span className="no block">{t.personas[id].phase}</span>
                  <span className="mt-1 block font-sans text-[19px] font-bold leading-tight text-ink">
                    {person.name}
                  </span>
                  <span className="who block font-mono">{person.pan}</span>
                  <span className="pencil block text-[19px] leading-tight text-ink">
                    {t.personas[id].action}
                  </span>
                </button>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
