"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronRight, UserCheck, LogOut, ArrowRight, Sparkles } from "lucide-react";
import type { Dict } from "../lib/i18n";
import type { Lang } from "../lib/types";
import type { OnboardingProfile } from "../lib/onboarding";
import { getPersonalization } from "../lib/onboarding";
import { PERSONAS } from "../lib/personas";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";
import LandingActionGrid from "./landing-action-grid";
import type { LandingActionCard } from "@/lib/landingCards";

import type { IngestedDocument } from "@/context/TaxReturnContext";
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
  onLaunchPersona?: (personaId: "sunita" | "rakesh" | "priya", directToDashboard?: boolean) => void;
  onLaunchPan?: (pan: string) => void;
  onLaunchWithForm16?: (doc: IngestedDocument) => void;
  activeCitizen?: { name: string; pan: string; salary?: number; tds?: number; totalTaxesPaid?: number } | null;
  onResumeReturn?: () => void;
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
  currentRegime?: "new" | "old";
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
  currentRegime,
}: LandingProps) {
  const isHindi = lang === "hi";
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
      {/* D13 cover: the headline sits directly on the graph paper, no card box. */}
      <header className="space-y-3 text-start">
        <span className="stamp-chip -rotate-[1.5deg]">{t.landing.badge}</span>
        <h1 className="font-sans text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[50px]">
          {t.landing.brandTitle}
        </h1>
        <h2 className="max-w-[34ch] font-sans text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">
          {t.landing.question}
        </h2>
        <p className="thread max-w-[58ch]">{t.landing.subtext}</p>
      </header>

      {onboardingProfile && personalization && (
        <div className="recovery-callout flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-start">
            <span className="cap block">{t.onboarding.tailoredBadge}</span>
            <p className="pencil m-0 text-[21px] leading-tight text-ink">
              {t.onboarding.tailoredIntent(t.onboarding.intentOptions[onboardingProfile.intent].label)}
            </p>
            <p className="m-0 text-[13.5px] leading-relaxed text-ink-2">
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
      {/* AUTHENTICATED ACTIVE SESSION BANNER vs LOGIN CARD                         */}
      {/* ========================================================================= */}
      {activeCitizen ? (
        <div className="surface-panel rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-paper to-teal-50/40 dark:from-emerald-950/30 dark:via-paper-2 dark:to-teal-950/20 p-5 sm:p-6 text-start shadow-md animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {isHindi ? "सक्रिय करदाता सत्र (लॉग इन)" : "Active Citizen Session (Logged In)"}
                </span>
              </div>
              <h3 className="font-sans text-xl font-bold text-ink">
                {isHindi ? `स्वागत है, ${activeCitizen.name}` : `Welcome back, ${activeCitizen.name}`}
              </h3>
              <p className="font-mono text-xs text-ink-2">
                PAN: <span className="font-bold text-ink">{activeCitizen.pan}</span> · {t.shell.taxYear} · {isHindi ? "ड्राफ्ट रिटर्न सक्रिय" : "Draft Return Active"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onResumeReturn}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 cursor-pointer"
              >
                <span>{isHindi ? "रिटर्न फॉर्म पर जाएं →" : "Continue Filing Return →"}</span>
                <ChevronRight size={15} />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-2.5 text-xs font-medium text-ink-3 hover:text-alarm hover:bg-alarm/10 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  title={isHindi ? "सत्र समाप्त करें" : "Clear session and sign out"}
                >
                  <LogOut size={13} />
                  <span>{isHindi ? "लॉग आउट" : "Log out"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Unauthenticated Login Card */
        <form onSubmit={handlePanSubmit} className="surface-panel max-w-md space-y-5 p-5 text-start sm:p-6">
          <div>
            <label
              htmlFor={PAN_INPUT_ID}
              className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-ink-2"
            >
              {t.landing.panLabel}
            </label>
            <MockField>
              <input
                id={PAN_INPUT_ID}
                ref={panRef}
                type="text"
                value={panInput}
                onChange={(e) => handlePanInputChange(e.target.value)}
                maxLength={10}
                placeholder={t.landing.panPlaceholder}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={panInputError ? true : undefined}
                aria-describedby={panInputError ? `${PAN_ERROR_ID} ${PAN_HELP_ID}` : PAN_HELP_ID}
                className={`min-h-12 w-full rounded-lg border bg-paper-3 px-4 py-3 text-center font-mono text-lg uppercase tracking-widest text-ink transition-colors ${
                  panInputError ? "border-alarm" : "border-line focus:border-money"
                }`}
              />
              <MockFill onFill={() => handlePanInputChange(MOCK.pan)} />
            </MockField>
            {panInputError && (
              <p id={PAN_ERROR_ID} role="alert" className="m-0 mt-1.5 text-xs font-medium text-alarm">
                {panInputError}
              </p>
            )}
            <p id={PAN_HELP_ID} className="m-0 mt-1.5 text-[0.72rem] leading-snug text-ink-3">
              {t.landing.panHelp}
            </p>
          </div>

          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-sans text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <span>{primaryAction}</span>
            <ChevronRight size={16} aria-hidden="true" className="rtl:rotate-180" />
          </button>
        </form>
      )}

      {/* ── 7-Action Capability Grid + Agentic Mode Hero Box ─────────────── */}
      <LandingActionGrid
        lang={lang}
        onActionClick={handleActionClick}
        onLaunchPersona={onLaunchPersona}
        onLaunchPan={onLaunchPan}
        onLaunchWithForm16={onLaunchWithForm16}
        activeCitizen={activeCitizen}
        onResumeReturn={onResumeReturn}
        onApplyReconciliation={onApplyReconciliation}
        onApplyOptimizer={onApplyOptimizer}
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
                stroke="var(--blue)"
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
