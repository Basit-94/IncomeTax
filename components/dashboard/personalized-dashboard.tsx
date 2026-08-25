"use client";

import { ArrowRight } from "lucide-react";
import type { Dict } from "../../lib/i18n";
import {
  getPersonalization,
  type DashboardDestination,
  type OnboardingProfile,
} from "../../lib/onboarding";

interface PersonalizedDashboardProps {
  profile: OnboardingProfile;
  t: Dict;
  hasFiled: boolean;
  destination: DashboardDestination;
  onPrimaryAction: () => void;
  onEdit: () => void;
}

/**
 * The dashboard's first useful surface. It uses onboarding to choose the
 * destination and explanation pace, while leaving all tax outcomes to the
 * confirmed facts and engine-backed screens below.
 */
export default function PersonalizedDashboard({
  profile,
  t,
  hasFiled,
  destination,
  onPrimaryAction,
  onEdit,
}: PersonalizedDashboardProps) {
  const personalization = getPersonalization(profile);
  const focusLabels = profile.focuses
    .filter((focus) => focus !== "not_sure")
    .slice(0, 3)
    .map((focus) => t.onboarding.focusOptions[focus]);

  if (focusLabels.length === 0) {
    focusLabels.push(t.onboarding.focusOptions.not_sure);
  }

  return (
    <section
      aria-labelledby="personalized-dashboard-heading"
      className="surface-panel overflow-hidden p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-money">
            {t.dashboard.personalized.eyebrow}
          </p>
          <h2
            id="personalized-dashboard-heading"
            className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
          >
            {t.dashboard.personalized.heading[profile.intent]}
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            {hasFiled
              ? t.dashboard.personalized.filedBody
              : t.dashboard.personalized.unfiledBody}
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            {personalization.guided
              ? t.dashboard.personalized.guidedBody
              : t.dashboard.personalized.quickBody}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row lg:flex-col lg:items-stretch">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-money px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-money-deep"
          >
            {t.dashboard.personalized.primaryAction[destination]}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="min-h-9 text-sm font-semibold text-money hover:underline"
          >
            {t.onboarding.changeAnswers}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
        <div className="space-y-1">
          <span className="block text-[0.68rem] font-mono font-semibold uppercase tracking-wider text-ink-3">
            {t.dashboard.personalized.profileLabels.work}
          </span>
          <strong className="block text-sm text-ink">
            {t.onboarding.professionOptions[profile.profession]}
          </strong>
        </div>
        <div className="space-y-1">
          <span className="block text-[0.68rem] font-mono font-semibold uppercase tracking-wider text-ink-3">
            {t.dashboard.personalized.profileLabels.income}
          </span>
          <strong className="block text-sm text-ink">
            {t.onboarding.incomeOptions[profile.incomeBand]}
          </strong>
        </div>
        <div className="space-y-1">
          <span className="block text-[0.68rem] font-mono font-semibold uppercase tracking-wider text-ink-3">
            {t.dashboard.personalized.profileLabels.history}
          </span>
          <strong className="block text-sm text-ink">
            {t.onboarding.filingHistoryOptions[profile.filingHistory]}
          </strong>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-ink">
            {t.dashboard.personalized.focusLabel}
          </span>
          <div className="flex flex-wrap gap-2">
            {focusLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-2"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-ink-2 sm:text-right">
          <strong className="text-ink">{t.onboarding.regimeLabel}:</strong>{" "}
          {personalization.regimeLens === "check_claims"
            ? t.onboarding.claimsRegimeValue
            : t.onboarding.compareRegimeValue}
        </p>
      </div>
    </section>
  );
}
