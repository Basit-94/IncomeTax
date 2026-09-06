"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { LANGS, LANG_NATIVE, type Dict } from "../lib/i18n";
import type { Lang } from "../lib/types";
import {
  createOnboardingProfile,
  getPersonalization,
  saveOnboardingDraft,
  type OnboardingDraft,
  type OnboardingFocus,
  type OnboardingFilingHistory,
  type OnboardingMode,
  type OnboardingIntent,
  type OnboardingProfession,
  type OnboardingProfile,
} from "../lib/onboarding";

type Screen = "language" | "intent" | "situation" | "mode" | "focus" | "ready";

interface OnboardingProps {
  lang: Lang;
  t: Dict;
  initialDraft: OnboardingDraft;
  onLanguageChange: (lang: Lang) => void;
  onComplete: (profile: OnboardingProfile) => void;
}

const LANGUAGES: Lang[] = LANGS;
const INTENTS: OnboardingIntent[] = [
  "file_return",
  "check_refund",
  "understand_notice",
  "correct_prefill",
];
const PROFESSIONS: OnboardingProfession[] = [
  "salaried",
  "self_employed",
  "business_owner",
  "student",
  "retired",
  "investor",
  "other",
];
const MODES: OnboardingMode[] = ["simple", "full"];
const FILING_HISTORY: OnboardingFilingHistory[] = ["never", "once", "every_year"];
const FOCUSES: OnboardingFocus[] = [
  "salary",
  "freelance",
  "business",
  "rent",
  "interest",
  "investments",
  "deductions",
  "not_sure",
];

function selectedClass(selected: boolean): string {
  return selected
    ? "border-money bg-amber-bg text-amber-ink"
    : "border-glass-edge bg-white/55 dark:bg-white/[0.05] text-ink hover:border-money/50";
}

function ChoiceButton({
  selected,
  onClick,
  children,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 w-full items-start justify-between gap-4 rounded-[16px] border-[1.5px] px-4 py-3.5 text-left transition-colors active:translate-y-px cursor-pointer ${selectedClass(selected)}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-snug">{children}</span>
        {detail && <span className="mt-1 block text-xs leading-relaxed text-ink-2">{detail}</span>}
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
 selected ? "border-money bg-money text-white" : "border-line text-transparent"
        }`}
        aria-hidden="true"
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </button>
  );
}

export default function Onboarding({
  lang,
  t,
  initialDraft,
  onLanguageChange,
  onComplete,
}: OnboardingProps) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [screen, setScreen] = useState<Screen>(initialDraft.lang ? "intent" : "language");

  useEffect(() => {
    if (Object.keys(initialDraft).length === 0) return;
    setDraft(initialDraft);
    setScreen(initialDraft.lang ? "intent" : "language");
  }, [initialDraft]);

  const updateDraft = (change: OnboardingDraft) => {
    const next = { ...draft, ...change };
    setDraft(next);
    saveOnboardingDraft(next);
  };

  const previewProfile = useMemo(
    () => createOnboardingProfile(draft, lang),
    [draft, lang],
  );

  const personalization = previewProfile ? getPersonalization(previewProfile) : null;
  const questionNumber =
    screen === "intent" ? 1 : screen === "situation" ? 2 : screen === "mode" ? 3 : screen === "focus" ? 4 : 0;
  const canContinue =
    screen === "language"
      ? Boolean(draft.lang)
      : screen === "intent"
      ? Boolean(draft.intent)
      : screen === "situation"
      ? Boolean(draft.profession && draft.filingHistory)
      : screen === "mode"
      ? Boolean(draft.mode)
      : screen === "focus"
      ? Boolean(draft.focuses && draft.focuses.length > 0)
      : Boolean(previewProfile);

  const next = () => {
    if (!canContinue) return;
    if (screen === "language") setScreen("intent");
    else if (screen === "intent") setScreen("situation");
    else if (screen === "situation") setScreen("mode");
    else if (screen === "mode") setScreen("focus");
    else if (screen === "focus") setScreen("ready");
    else if (previewProfile) onComplete(previewProfile);
  };

  const back = () => {
    if (screen === "intent") setScreen("language");
    else if (screen === "situation") setScreen("intent");
    else if (screen === "mode") setScreen("situation");
    else if (screen === "focus") setScreen("mode");
    else if (screen === "ready") setScreen("focus");
  };

  const chooseLanguage = (nextLang: Lang) => {
    updateDraft({ lang: nextLang });
    onLanguageChange(nextLang);
  };

  const toggleFocus = (focus: OnboardingFocus) => {
    const current = draft.focuses ?? [];
    if (focus === "not_sure") {
      updateDraft({ focuses: current.includes("not_sure") ? [] : ["not_sure"] });
      return;
    }
    const withoutNotSure = current.filter((value) => value !== "not_sure");
    updateDraft({
      focuses: withoutNotSure.includes(focus)
        ? withoutNotSure.filter((value) => value !== focus)
        : [...withoutNotSure, focus],
    });
  };

  const focusSummary = previewProfile
    ? previewProfile.focuses
        .filter((focus) => focus !== "not_sure")
        .slice(0, 3)
        .map((focus) => t.onboarding.focusOptions[focus])
        .join(", ") || t.onboarding.focusOptions.not_sure
    : "";

  return (
    <div className="mx-auto max-w-3xl py-2 sm:py-5">
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-line px-5 py-3.5 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-money">
              {t.onboarding.eyebrow}
            </span>
            {screen !== "language" && screen !== "ready" && (
              <span className="text-[11.5px] text-ink-3">
                {t.onboarding.questionsLabel} {t.onboarding.questionsProgress(questionNumber, 4)}
              </span>
            )}
          </div>
          {screen !== "language" && screen !== "ready" && (
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-[3px] ${item <= questionNumber ? "bg-money" : "bg-ink-2/15"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-7">
          {screen === "language" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[32px]">
                  {t.onboarding.languageQuestion}
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-ink-2">{t.onboarding.languageHelp}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {LANGUAGES.map((item) => (
                  <ChoiceButton
                    key={item}
                    selected={draft.lang === item}
                    onClick={() => chooseLanguage(item)}
                  >
                    {LANG_NATIVE[item]}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          )}

          {screen === "intent" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[32px]">
                  {t.onboarding.intentQuestion}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.intentHelp}</p>
              </div>
              <div className="grid gap-3">
                {INTENTS.map((intent) => (
                  <ChoiceButton
                    key={intent}
                    selected={draft.intent === intent}
                    onClick={() => updateDraft({ intent })}
                    detail={t.onboarding.intentOptions[intent].detail}
                  >
                    {t.onboarding.intentOptions[intent].label}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          )}

          {screen === "situation" && (
            <div className="space-y-7">
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[32px]">
                  {t.onboarding.situationQuestion}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.situationHelp}</p>
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink">{t.onboarding.professionLabel}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROFESSIONS.map((profession) => (
                    <ChoiceButton
                      key={profession}
                      selected={draft.profession === profession}
                      onClick={() => updateDraft({ profession })}
                    >
                      {t.onboarding.professionOptions[profession]}
                    </ChoiceButton>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-ink">{t.onboarding.filingHistoryLabel}</h2>
                <div className="grid gap-2 sm:grid-cols-3">
                  {FILING_HISTORY.map((history) => (
                    <ChoiceButton
                      key={history}
                      selected={draft.filingHistory === history}
                      onClick={() => updateDraft({ filingHistory: history })}
                    >
                      {t.onboarding.filingHistoryOptions[history]}
                    </ChoiceButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {screen === "mode" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[32px]">
                  {t.onboarding.modeQuestion}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.modeHelp}</p>
              </div>
              <div className="grid gap-3">
                {MODES.map((mode) => (
                  <ChoiceButton
                    key={mode}
                    selected={draft.mode === mode}
                    onClick={() => updateDraft({ mode })}
                    detail={t.onboarding.modeOptions[mode].detail}
                  >
                    {t.onboarding.modeOptions[mode].label}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          )}

          {screen === "focus" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[32px]">
                  {t.onboarding.focusQuestion}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.focusHelp}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {FOCUSES.map((focus) => (
                  <ChoiceButton
                    key={focus}
                    selected={draft.focuses?.includes(focus) ?? false}
                    onClick={() => toggleFocus(focus)}
                  >
                    {t.onboarding.focusOptions[focus]}
                  </ChoiceButton>
                ))}
              </div>
              {!canContinue && (
                <p className="text-xs font-semibold text-alarm">{t.onboarding.chooseAtLeastOne}</p>
              )}
            </div>
          )}

          {screen === "ready" && previewProfile && personalization && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-money">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    {t.onboarding.tailoredBadge}
                  </span>
                </div>
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[32px]">
                  {t.onboarding.readyTitle}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.readyBody}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-paper-2 p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-2">{t.onboarding.guidedLabel}</p>
                  <p className="mt-2 text-sm font-bold text-ink">
                    {personalization.guided ? t.onboarding.guidedValue : t.onboarding.quickValue}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper-2 p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-2">{t.onboarding.regimeLabel}</p>
                  <p className="mt-2 text-sm font-bold text-ink">
                    {personalization.regimeLens === "check_claims"
                      ? t.onboarding.claimsRegimeValue
                      : t.onboarding.compareRegimeValue}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper-2 p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-2">{t.onboarding.focusLabel}</p>
                  <p className="mt-2 text-sm font-bold text-ink">{focusSummary}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-3">{t.onboarding.savedLocally}</p>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            {screen !== "language" ? (
              <button
                type="button"
                onClick={back}
                className="glass-flat inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] px-4 text-[14.5px] font-semibold text-ink-2 transition-colors hover:text-ink cursor-pointer"
              >
                <ChevronLeft size={16} />
                {t.common.back}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="btn-primary inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              {screen === "ready" ? t.onboarding.startPath : t.common.continue}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
