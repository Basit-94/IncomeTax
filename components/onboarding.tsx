"use client";

/**
 * Onboarding v4 (plan task 0.7): five pages, each a few quick picks, then a summary.
 * The pages exist so the assistant never has to ask what it could have known. Nothing here
 * is an identifier or an amount; those live in the vault.
 *
 * Copy: the questions the older dictionaries already carry come from `t.onboarding`; the
 * new ones go through `localize()` (English, with hi/ta in components/mock-i18n.ts).
 */
import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { LANGS, LANG_NATIVE, type Dict } from "../lib/i18n";
import type { Lang } from "../lib/types";
import {
  AGE_BANDS,
  FILED_BY,
  FILING_HISTORY,
  HELP_LEVELS,
  HOLDINGS,
  INCOME_BANDS,
  INCOME_SOURCES,
  INTENTS,
  NOTE_MAX,
  PROFESSIONS,
  RESIDENCIES,
  createOnboardingProfile,
  getPersonalization,
  legacyProfession,
  saveOnboardingDraft,
  type OnboardingDraft,
  type OnboardingHolding,
  type OnboardingIncomeSource,
  type OnboardingProfile,
} from "../lib/onboarding";
import { localize } from "./mock-i18n";

type Screen = "language" | "who" | "money" | "have" | "today" | "ready";
const QUESTION_SCREENS: Screen[] = ["who", "money", "have", "today"];

interface OnboardingProps {
  lang: Lang;
  t: Dict;
  initialDraft: OnboardingDraft;
  onLanguageChange: (lang: Lang) => void;
  onComplete: (profile: OnboardingProfile) => void;
}

/* Copy for the answers the dictionaries do not know yet. English; hi/ta via localize(). */
const INTENT_COPY: Record<string, { label: string; detail: string }> = {
  plan_new_job: { label: "Plan taxes for a new job", detail: "New salary, new choices. See what to set up now." },
  business_benefits: { label: "Find tax benefits for my business", detail: "What a small business or freelancer can claim." },
  explore: { label: "Just exploring", detail: "Look around first; nothing is filed until you say so." },
};
const PROFESSION_COPY: Record<string, string> = { homemaker: "Homemaker" };
const AGE_COPY: Record<string, string> = {
  under_30: "Under 30",
  "30_44": "30 to 44",
  "45_59": "45 to 59",
  "60_plus": "60 or above",
  unknown: "Prefer not to say",
};
const RESIDENCY_COPY: Record<string, string> = {
  resident: "I live in India",
  nri: "I live abroad (NRI)",
  unknown: "Not sure",
};
const SOURCE_COPY: Record<OnboardingIncomeSource, string> = {
  salary: "Salary from a job",
  freelance: "Freelance or consulting",
  business: "My own business",
  rent: "Rent from property",
  interest: "Bank or deposit interest",
  dividends: "Dividends or shares",
  property_sale: "Sold property or land",
  crypto: "Crypto or virtual assets",
  foreign: "Income from abroad",
  pension: "Pension",
};
const HOLDING_COPY: Record<OnboardingHolding, { label: string; detail?: string }> = {
  form16: { label: "A salary statement from my employer", detail: "The yearly tax paper most employers hand out around June." },
  pf: { label: "A provident fund (PF) account" },
  insurance: { label: "Life or health insurance" },
  home_loan: { label: "A home loan" },
  rent_paid: { label: "I pay rent for where I live" },
  nps: { label: "A pension scheme (NPS) account" },
  education_loan: { label: "An education loan" },
  donations: { label: "Donations to a registered charity" },
  none: { label: "None of these, or not sure" },
};
const FILED_BY_COPY: Record<string, string> = {
  self: "I did it myself",
  ca: "A chartered accountant",
  family: "A family member or friend",
  not_applicable: "Not applicable",
};
const HELP_COPY: Record<string, { label: string; detail: string }> = {
  guide: { label: "Guide me step by step", detail: "Plain words, one thing at a time." },
  do_it: { label: "Just do it for me", detail: "Ask only what you must; I confirm at the end." },
  expert: { label: "I know taxes, show the details", detail: "Sections, arithmetic and the full trail." },
};

function selectedClass(selected: boolean): string {
  return selected
    ? "border-money bg-money-soft text-ink shadow-sm"
    : "border-line bg-paper-2 text-ink hover:border-money/50 hover:bg-paper-3";
}

function ChoiceButton({
  selected,
  onClick,
  children,
  detail,
  compact = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  detail?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 text-left transition-colors active:translate-y-px ${
        compact ? "min-h-11 py-2.5" : "min-h-14 py-3"
      } ${selectedClass(selected)}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-snug">{children}</span>
        {detail && <span className="mt-1 block text-xs leading-relaxed text-ink-2">{detail}</span>}
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-navy bg-navy text-white" : "border-line text-transparent"
        }`}
        aria-hidden="true"
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">{label}</legend>
      {children}
    </fieldset>
  );
}

export default function Onboarding({ lang, t, initialDraft, onLanguageChange, onComplete }: OnboardingProps) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [screen, setScreen] = useState<Screen>(initialDraft.lang ? "who" : "language");
  const L = (s: string) => localize(s, lang);

  useEffect(() => {
    if (Object.keys(initialDraft).length === 0) return;
    setDraft(initialDraft);
    setScreen(initialDraft.lang ? "who" : "language");
  }, [initialDraft]);

  // Functional updates: two picks in one tick must both land.
  const updateDraft = (change: OnboardingDraft | ((prev: OnboardingDraft) => OnboardingDraft)) => {
    setDraft((prev) => ({ ...prev, ...(typeof change === "function" ? change(prev) : change) }));
  };
  useEffect(() => {
    if (draft !== initialDraft) saveOnboardingDraft(draft);
  }, [draft, initialDraft]);

  const toggleIn = <T extends string>(list: T[] | undefined, value: T, exclusive?: T): T[] => {
    const current = list ?? [];
    if (exclusive && value === exclusive) return current.includes(exclusive) ? [] : [exclusive];
    const without = exclusive ? current.filter((v) => v !== exclusive) : current;
    return without.includes(value) ? without.filter((v) => v !== value) : [...without, value];
  };

  const previewProfile = useMemo(() => createOnboardingProfile(draft, lang), [draft, lang]);
  const personalization = previewProfile ? getPersonalization(previewProfile) : null;
  const questionNumber = QUESTION_SCREENS.indexOf(screen) + 1;

  const canContinue =
    screen === "language"
      ? Boolean(draft.lang)
      : screen === "who"
        ? Boolean(draft.profession && draft.ageBand && draft.residency)
        : screen === "money"
          ? Boolean(draft.incomeBand) &&
            ((draft.incomeSources?.length ?? 0) > 0 || draft.incomeBand === "none")
          : screen === "have"
            ? (draft.holdings?.length ?? 0) > 0 &&
              Boolean(draft.filingHistory) &&
              (draft.filingHistory === "never" || Boolean(draft.filedBy && draft.filedBy !== "not_applicable"))
            : screen === "today"
              ? Boolean(draft.intent && draft.helpLevel)
              : Boolean(previewProfile);

  const order: Screen[] = ["language", "who", "money", "have", "today", "ready"];
  const next = () => {
    if (!canContinue) return;
    if (screen === "ready") {
      if (previewProfile) onComplete(previewProfile);
      return;
    }
    setScreen(order[order.indexOf(screen) + 1]);
  };
  const back = () => {
    if (screen === "language") return;
    setScreen(order[order.indexOf(screen) - 1]);
  };

  const chooseLanguage = (nextLang: Lang) => {
    updateDraft({ lang: nextLang });
    onLanguageChange(nextLang);
  };

  const intentLabel = (intent: string): { label: string; detail: string } => {
    const known = t.onboarding.intentOptions as Record<string, { label: string; detail: string } | undefined>;
    if (known[intent]) return known[intent]!;
    const copy = INTENT_COPY[intent];
    return { label: L(copy.label), detail: L(copy.detail) };
  };

  return (
    <div className="mx-auto w-full max-w-3xl" data-testid="onboarding">
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-money">
              {t.onboarding.eyebrow}
            </span>
            {questionNumber > 0 && (
              <span className="text-xs font-mono text-ink-2">
                {t.onboarding.questionsLabel} {t.onboarding.questionsProgress(questionNumber, QUESTION_SCREENS.length)}
              </span>
            )}
          </div>
          {questionNumber > 0 && (
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {QUESTION_SCREENS.map((item, index) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-full ${index < questionNumber ? "bg-navy" : "bg-line"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          {screen === "language" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  {t.onboarding.languageQuestion}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.languageHelp}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {LANGS.map((code) => (
                  <ChoiceButton key={code} selected={draft.lang === code} onClick={() => chooseLanguage(code)} compact>
                    {LANG_NATIVE[code]}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          )}

          {screen === "who" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{L("Tell us about yourself")}</h1>
                <p className="text-sm leading-relaxed text-ink-2">
                  {L("Three quick picks. They decide which rules apply to you, so the assistant never guesses.")}
                </p>
              </div>
              <Group label={t.onboarding.professionLabel}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROFESSIONS.map((profession) => (
                    <ChoiceButton
                      key={profession}
                      selected={draft.profession === profession}
                      onClick={() => updateDraft({ profession })}
                      compact
                    >
                      {profession === "homemaker"
                        ? L(PROFESSION_COPY.homemaker)
                        : t.onboarding.professionOptions[legacyProfession(profession)]}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
              <Group label={L("Your age")}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {AGE_BANDS.map((band) => (
                    <ChoiceButton key={band} selected={draft.ageBand === band} onClick={() => updateDraft({ ageBand: band })} compact>
                      {L(AGE_COPY[band])}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
              <Group label={L("Where you live")}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {RESIDENCIES.map((residency) => (
                    <ChoiceButton
                      key={residency}
                      selected={draft.residency === residency}
                      onClick={() => updateDraft({ residency })}
                      compact
                    >
                      {L(RESIDENCY_COPY[residency])}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
            </div>
          )}

          {screen === "money" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  {L("Where did your money come from this year?")}
                </h1>
                <p className="text-sm leading-relaxed text-ink-2">
                  {L("Pick everything that applies. No amounts yet; a rough total is enough.")}
                </p>
              </div>
              <Group label={L("Sources of income")}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INCOME_SOURCES.map((source) => (
                    <ChoiceButton
                      key={source}
                      selected={draft.incomeSources?.includes(source) ?? false}
                      onClick={() => updateDraft((prev) => ({ incomeSources: toggleIn(prev.incomeSources, source) }))}
                      compact
                    >
                      {L(SOURCE_COPY[source])}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
              <Group label={t.onboarding.incomeQuestion}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {INCOME_BANDS.map((band) => (
                    <ChoiceButton key={band} selected={draft.incomeBand === band} onClick={() => updateDraft({ incomeBand: band })} compact>
                      {band === "unknown" ? L("Not sure yet") : t.onboarding.incomeOptions[band]}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
            </div>
          )}

          {screen === "have" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{L("What do you have?")}</h1>
                <p className="text-sm leading-relaxed text-ink-2">
                  {L("These decide what can lower your tax and which papers the assistant will look for.")}
                </p>
              </div>
              <Group label={L("Tick everything that applies")}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {HOLDINGS.map((holding) => (
                    <ChoiceButton
                      key={holding}
                      selected={draft.holdings?.includes(holding) ?? false}
                      onClick={() => updateDraft((prev) => ({ holdings: toggleIn(prev.holdings, holding, "none") }))}
                      detail={HOLDING_COPY[holding].detail ? L(HOLDING_COPY[holding].detail!) : undefined}
                      compact
                    >
                      {L(HOLDING_COPY[holding].label)}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
              <Group label={t.onboarding.filingHistoryLabel}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {FILING_HISTORY.map((history) => (
                    <ChoiceButton
                      key={history}
                      selected={draft.filingHistory === history}
                      onClick={() =>
                        updateDraft((prev) => ({
                          filingHistory: history,
                          filedBy: history === "never" ? "not_applicable" : prev.filedBy,
                        }))
                      }
                      compact
                    >
                      {t.onboarding.filingHistoryOptions[history]}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
              {draft.filingHistory && draft.filingHistory !== "never" && (
                <Group label={L("Who did it last time?")}>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {FILED_BY.filter((who) => who !== "not_applicable").map((who) => (
                      <ChoiceButton key={who} selected={draft.filedBy === who} onClick={() => updateDraft({ filedBy: who })} compact>
                        {L(FILED_BY_COPY[who])}
                      </ChoiceButton>
                    ))}
                  </div>
                </Group>
              )}
            </div>
          )}

          {screen === "today" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.onboarding.intentQuestion}</h1>
                <p className="text-sm leading-relaxed text-ink-2">{t.onboarding.intentHelp}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {INTENTS.map((intent) => {
                  const copy = intentLabel(intent);
                  return (
                    <ChoiceButton key={intent} selected={draft.intent === intent} onClick={() => updateDraft({ intent })} detail={copy.detail} compact>
                      {copy.label}
                    </ChoiceButton>
                  );
                })}
              </div>
              <Group label={L("How much help do you want?")}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {HELP_LEVELS.map((level) => (
                    <ChoiceButton
                      key={level}
                      selected={draft.helpLevel === level}
                      onClick={() => updateDraft({ helpLevel: level })}
                      detail={L(HELP_COPY[level].detail)}
                      compact
                    >
                      {L(HELP_COPY[level].label)}
                    </ChoiceButton>
                  ))}
                </div>
              </Group>
              <label className="block space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">
                  {L("Anything the assistant should know? (optional)")}
                </span>
                <textarea
                  value={draft.note ?? ""}
                  maxLength={NOTE_MAX}
                  rows={2}
                  onChange={(event) => updateDraft({ note: event.target.value })}
                  placeholder={L("e.g. I changed jobs in July and have two salary statements.")}
                  className="w-full rounded-xl border border-line bg-paper-2 px-3 py-2 text-sm text-ink outline-none focus:border-money"
                />
                <span className="block text-right text-[0.68rem] font-mono text-ink-3">
                  {(draft.note ?? "").length}/{NOTE_MAX}
                </span>
              </label>
            </div>
          )}

          {screen === "ready" && previewProfile && personalization && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-money">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">{t.onboarding.tailoredBadge}</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.onboarding.readyTitle}</h1>
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
                    {personalization.regimeLens === "check_claims" ? t.onboarding.claimsRegimeValue : t.onboarding.compareRegimeValue}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper-2 p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-2">{L("Papers to look for")}</p>
                  <p className="mt-2 text-sm font-bold text-ink">
                    {previewProfile.holdings.includes("form16")
                      ? L("Your salary statement, plus proofs for what you ticked")
                      : previewProfile.holdings.includes("none")
                        ? L("Nothing yet; the assistant will ask as it goes")
                        : L("Proofs for what you ticked")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-3">
            {L("Your answers stay on your account so you are never asked twice. Change them any time from the dashboard.")}
          </p>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            {screen !== "language" ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink-2 transition-colors hover:bg-paper-2"
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
              data-testid="onboarding-next"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
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
