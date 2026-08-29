"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronRight, Cpu, BookOpen } from "lucide-react";
import type { Dict } from "../lib/i18n";
import type { OnboardingProfile } from "../lib/onboarding";
import { getPersonalization } from "../lib/onboarding";
import { PERSONAS } from "../lib/personas";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";

interface LandingProps {
  t: Dict;
  panInput: string;
  panInputError: string | null;
  handlePanInputChange: (val: string) => void;
  handlePanSubmit: (e: React.FormEvent) => void;
  onboardingProfile: OnboardingProfile | null;
  onEditOnboarding: () => void;
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
  panInput,
  panInputError,
  handlePanInputChange,
  handlePanSubmit,
  onboardingProfile,
  onEditOnboarding,
}: LandingProps) {
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-4 lg:py-8">
      {/* D13 cover: the headline sits directly on the graph paper, no card box. */}
      <header className="space-y-3 text-start">
        <span className="stamp-chip -rotate-[1.5deg]">{t.landing.badge}</span>
        <h1 className="font-sans text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[52px]">
          {t.landing.brandTitle}
        </h1>
        <h2 className="max-w-[34ch] font-sans text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">
          {t.landing.question}
        </h2>
        {/* The blue aside: how to read this page, in plain words. */}
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

      {/* The one thing this page asks for. Upright and stable — the tilted
          cards below are the optional detour, not the main path. */}
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

      {/* ── the reviewer detour: three people you can be ─────────────── */}
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
              onClick={() => handlePanInputChange(person.pan)}
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

      <div className="divider" aria-hidden="true">
        <div className="line" />
        <svg width="46" height="10" viewBox="0 0 46 10" aria-hidden="true">
          <path
            d="M2 6 C 10 2, 18 9, 26 5 S 40 4, 44 6"
            fill="none"
            stroke="var(--subtle-color)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <div className="line" />
      </div>

      <div className="flex flex-wrap items-center gap-x-6">
        <Link
          href="/architecture"
          className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs text-ink-2 hover:text-money hover:underline"
        >
          <Cpu size={12} aria-hidden="true" />
          <span>{t.landing.architectureLink}</span>
        </Link>
        <Link
          href="/honesty"
          className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs text-ink-2 hover:text-money hover:underline"
        >
          <BookOpen size={12} aria-hidden="true" />
          <span>{t.landing.honestyLink}</span>
        </Link>
      </div>
    </div>
  );
}
