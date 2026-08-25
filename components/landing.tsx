"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ChevronRight, Sparkles, Cpu, BookOpen } from "lucide-react";
import type { Dict } from "../lib/i18n";
import type { OnboardingProfile } from "../lib/onboarding";
import { getPersonalization } from "../lib/onboarding";

interface LandingProps {
  t: Dict;
  panInput: string;
  panInputError: string | null;
  handlePanInputChange: (val: string) => void;
  handlePanSubmit: (e: React.FormEvent) => void;
  handleSelectPersona: (id: "sunita" | "rakesh" | "priya") => void;
  handleCreateCustom: () => void;
  onboardingProfile: OnboardingProfile | null;
  onEditOnboarding: () => void;
}

export default function Landing({
  t,
  panInput,
  panInputError,
  handlePanInputChange,
  handlePanSubmit,
  handleSelectPersona,
  handleCreateCustom,
  onboardingProfile,
  onEditOnboarding,
}: LandingProps) {
  const personalization = onboardingProfile ? getPersonalization(onboardingProfile) : null;
  const primaryAction = onboardingProfile
    ? t.onboarding.intentCta[onboardingProfile.intent]
    : t.landing.check;

  return (
    <div className="grid items-start gap-10 py-5 lg:grid-cols-12 lg:items-center lg:py-10">
      {/* LEFT COLUMN: TITLE, SUBTITLE, FORM, CITIZENS LIST */}
      <div className="z-10 space-y-8 text-left lg:col-span-7">
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-money px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-money-deep"
          >
            <span>{primaryAction}</span>
            <ChevronRight size={16} />
          </button>
        </form>

        {/* PRE-LOADED MOCK CITIZENS GRID */}
        <div className="space-y-4">
          <span className="block text-xs font-mono text-ink-2 uppercase tracking-wider">
            {t.landing.orTryAs}
          </span>

          <div className="grid max-w-2xl gap-4 md:grid-cols-2">
            {/* Sunita Devi */}
            <m.button
              type="button"
              whileHover={{ y: 2, x: 2 }}
              onClick={() => handleSelectPersona("sunita")}
              className="group flex flex-col justify-between space-y-4 rounded-card border border-line bg-paper-2 p-5 text-left transition-all hover:border-money/50 hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Sunita Devi</h3>
                  <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                    {t.personas.sunita.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.sunita.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.sunita.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.button>

            {/* Rakesh Kumar */}
            <m.button
              type="button"
              whileHover={{ y: 2, x: 2 }}
              onClick={() => handleSelectPersona("rakesh")}
              className="group flex flex-col justify-between space-y-4 rounded-card border border-line bg-paper-2 p-5 text-left transition-all hover:border-money/50 hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Rakesh Kumar</h3>
                  <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                    {t.personas.rakesh.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.rakesh.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.rakesh.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.button>

            {/* Priya Sharma */}
            <m.button
              type="button"
              whileHover={{ y: 2, x: 2 }}
              onClick={() => handleSelectPersona("priya")}
              className="group flex flex-col justify-between space-y-4 rounded-card border border-line bg-paper-2 p-5 text-left transition-all hover:border-money/50 hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Priya Sharma</h3>
                  <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                    {t.personas.priya.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.priya.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.priya.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.button>

            {/* Seeded Custom Sandbox Mode Card */}
            <m.button
              type="button"
              whileHover={{ y: 2, x: 2 }}
              onClick={handleCreateCustom}
              className="group flex flex-col justify-between space-y-4 rounded-card border border-line bg-paper-2 p-5 text-left transition-all hover:border-money hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors flex items-center gap-1.5">
                    <Sparkles size={14} className="text-money animate-pulse" />
                    <span>{t.personas.custom.blurbTitle}</span>
                  </h3>
                  <span className="text-[0.65rem] font-mono bg-money-soft border border-money/20 text-money px-1.5 py-0.5 rounded uppercase">
                    {t.personas.custom.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.custom.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.custom.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.button>
          </div>
        </div>

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

      {/* RIGHT COLUMN: a quiet preview of the evidence-led flow */}
      <div className="hidden lg:col-span-5 lg:block">
        <div className="surface-panel relative overflow-hidden p-7">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-money-soft blur-3xl" aria-hidden="true" />
          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-money">{t.shell.productName}</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{t.file.checkThis}</h2>
              </div>
              <span className="rounded-full border border-money/25 bg-money-soft px-3 py-1 text-xs font-semibold text-money">{t.flow.facts}</span>
            </div>

            <div className="space-y-3">
              {[t.groups.moneyIn, t.groups.taxPaid, t.groups.deductionsClaimed].map((label, index) => (
                <div key={label} className="fact-card flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${index === 2 ? "bg-warn" : "bg-money"}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{label}</p>
                      <p className="mt-1 text-xs text-ink-2">{t.groups.fromWhere}</p>
                    </div>
                  </div>
                  <span className="skeleton h-4 w-20 shrink-0 rounded-full" aria-hidden="true" />
                </div>
              ))}
            </div>

            <div className="recovery-callout p-4 text-sm leading-relaxed text-ink-2">
              <span className="font-bold text-ink">{t.flow.confirmedCount(2, 3)}</span>
              <span className="ml-1">{t.file.subheading}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
