"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ChevronRight, Sparkles, Cpu, BookOpen } from "lucide-react";
import type { Dict } from "../lib/i18n";
import type { OnboardingProfile } from "../lib/onboarding";
import { getPersonalization } from "../lib/onboarding";
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

  return (
    <div className="grid items-start gap-10 py-5 lg:grid-cols-12 lg:items-center lg:py-10">
      {/* SINGLE COLUMN: TITLE, SUBTITLE, FORM, CITIZENS LIST */}
      <div className="z-10 space-y-8 text-left lg:col-span-12">
        {/* HERO BLOCK */}
        <div className="space-y-4">
          <span className="text-[11px] font-mono text-money bg-money-soft border border-money/20 px-2.5 py-0.5 rounded uppercase tracking-[0.12em] font-semibold">
            {t.landing.badge}
          </span>
          <h1 className="font-sans text-5xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
            {t.landing.brandTitle}
          </h1>
          <h2 className="max-w-2xl font-sans text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
            {t.landing.question}
          </h2>
          <p className="text-base text-ink-2 leading-relaxed max-w-xl">
            {t.landing.subtext}
          </p>
        </div>

        {onboardingProfile && personalization && (
          <div className="recovery-callout flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-money">
                {t.onboarding.tailoredBadge}
              </p>
              <p className="text-sm font-semibold text-ink">
                {t.onboarding.tailoredIntent(t.onboarding.intentOptions[onboardingProfile.intent].label)}
              </p>
              <p className="text-xs leading-relaxed text-ink-2">
                {personalization.guided ? t.onboarding.tailoredGuided : t.onboarding.tailoredQuick}. {personalization.regimeLens === "check_claims" ? t.onboarding.tailoredRegimeClaims : t.onboarding.tailoredRegimeCompare}.
              </p>
            </div>
            <button
              type="button"
              onClick={onEditOnboarding}
              className="shrink-0 text-xs font-semibold text-money hover:underline"
            >
              {t.onboarding.changeAnswers}
            </button>
          </div>
        )}

        {/* DIRECT PAN LOGIN FORM */}
        <form 
          onSubmit={handlePanSubmit}
          className="surface-panel max-w-md space-y-5 p-5 sm:p-6"
        >
          <div>
            <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">
              {t.landing.panLabel}
            </label>
            <div className="relative">
              <MockField>
                <input
                type="text"
                value={panInput}
                onChange={(e) => handlePanInputChange(e.target.value)}
                maxLength={10}
                placeholder={t.landing.panPlaceholder}
                className={`w-full bg-paper-3 border ${
                  panInputError ? "border-alarm" : "border-line focus:border-money"
                } rounded-xl px-4 py-3 text-center font-mono text-lg uppercase tracking-widest text-ink transition-colors focus:outline-none`}
              />
                <MockFill onFill={() => handlePanInputChange(MOCK.pan)} />
              </MockField>
            </div>
            {panInputError ? (
              <span className="block text-xs text-alarm mt-1.5 font-medium">
                {panInputError}
              </span>
            ) : (
              <span className="block text-[0.7rem] text-ink-3 mt-1.5">
                {t.landing.panHelp}
              </span>
            )}
          </div>

            <button
              type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <span>{primaryAction}</span>
            <ChevronRight size={16} />
          </button>

          {/* Quick Mock Login Options for Judge */}
          <div className="border-t border-line/60 pt-4 mt-2 text-left space-y-2">
            <span className="block text-[0.7rem] font-mono text-ink-3 uppercase tracking-wider">
              Reviewer Quick Mock Logins (Click to autofill):
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handlePanInputChange("DEMPS4417K")}
                className="w-full text-left text-xs bg-paper border border-line rounded px-3 py-2 hover:border-money hover:bg-paper-2 transition flex justify-between items-center cursor-pointer"
              >
                <div>
                  <span className="font-bold text-ink">Sunita Devi</span>
                </div>
                <span className="font-mono text-[11px] text-money font-semibold">DEMPS4417K</span>
              </button>
              <button
                type="button"
                onClick={() => handlePanInputChange("DEMPK8823R")}
                className="w-full text-left text-xs bg-paper border border-line rounded px-3 py-2 hover:border-money hover:bg-paper-2 transition flex justify-between items-center cursor-pointer"
              >
                <div>
                  <span className="font-bold text-ink">Rakesh Kumar</span>
                </div>
                <span className="font-mono text-[11px] text-money font-semibold">DEMPK8823R</span>
              </button>
              <button
                type="button"
                onClick={() => handlePanInputChange("DEMPS9052M")}
                className="w-full text-left text-xs bg-paper border border-line rounded px-3 py-2 hover:border-money hover:bg-paper-2 transition flex justify-between items-center cursor-pointer"
              >
                <div>
                  <span className="font-bold text-ink">Priya Sharma</span>
                </div>
                <span className="font-mono text-[11px] text-money font-semibold">DEMPS9052M</span>
              </button>
            </div>
          </div>
        </form>



        {/* Subfooter route links */}
        <div className="flex items-center space-x-6 pt-6 border-t border-line/60 max-w-md">
          <Link href="/architecture" className="flex items-center gap-1 text-xs font-mono text-ink-2 hover:text-money hover:underline">
            <Cpu size={12} />
            <span>{t.landing.architectureLink}</span>
          </Link>
          <Link href="/honesty" className="flex items-center gap-1 text-xs font-mono text-ink-2 hover:text-money hover:underline">
            <BookOpen size={12} />
            <span>{t.landing.honestyLink}</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
