"use client";

import { ArrowRight } from "lucide-react";
import { Munshi } from "../brand/munshi";
import type { Dict } from "../../lib/i18n";
import {
  getPersonalization,
  type DashboardDestination,
  type OnboardingIntent,
  type OnboardingProfile,
} from "../../lib/onboarding";

interface PersonalizedDashboardProps {
  profile: OnboardingProfile;
  t: Dict;
  hasFiled: boolean;
  destination: DashboardDestination;
  onPrimaryAction: () => void;
  onEdit: () => void;
  isRealMode?: boolean;
  /** T5.1: switching Simple / Full detail is one tap here, not a re-run of onboarding. */
  onModeChange?: (mode: OnboardingProfile["mode"]) => void;
  /** The year's stated intent, from the return's intake; the headline follows it. */
  intent?: OnboardingIntent;
  /** Where the regime stands for this year, from the intake's verdict. */
  regimeLean?: "new" | "old" | "open";
}

/**
 * The dashboard's first useful surface. The profile (v3, 2026-09-07) carries only what never
 * changes — identity, refund account, detail mode — so the strip below shows those; everything
 * about this year comes from the return's intake and the engine-backed screens below.
 */
export default function PersonalizedDashboard({
  profile,
  t,
  hasFiled,
  destination,
  onPrimaryAction,
  onEdit,
  isRealMode = false,
  onModeChange,
  intent = "file_return",
  regimeLean = "new",
}: PersonalizedDashboardProps) {
  const personalization = getPersonalization(profile, regimeLean);
  const refund = profile.banks.find((b) => b.id === profile.refundAccountId);

  return (
    <section
      aria-labelledby="personalized-dashboard-heading"
      className="surface-panel overflow-hidden p-5 sm:p-6 print:hidden"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4 max-w-2xl">
        <div className="shrink-0" aria-hidden="true">
          <span className="max-md:hidden"><Munshi size={72} state={hasFiled ? "chai" : "welcome"} /></span>
          <span className="md:hidden"><Munshi size={40} state={hasFiled ? "chai" : "welcome"} /></span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[.08em] text-money">
            {t.dashboard.personalized.eyebrow}
          </p>
          <h2
            id="personalized-dashboard-heading"
            className="text-[26px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[30px]"
          >
            {/* A man with two notices must not be greeted with "let us get your
                return ready" — the filed state owns the headline. */}
            {hasFiled
              ? t.dashboard.personalized.headingFiled
              : t.dashboard.personalized.heading[intent]}
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
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row lg:flex-col lg:items-stretch">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="btn-primary inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] transition-colors"
          >
            {isRealMode ? "Start Step-by-Step Return" : t.dashboard.personalized.primaryAction[destination]}
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
          <span className="block text-xs font-bold text-ink-3">PAN</span>
          <strong className="block text-sm text-ink font-mono">{profile.identity.pan || "—"}</strong>
          {profile.identity.aadhaarLast4 && <span className="block text-xs text-ink-3">Aadhaar ····{profile.identity.aadhaarLast4}</span>}
        </div>
        <div className="space-y-1">
          <span className="block text-xs font-bold text-ink-3">
            {t.onboarding.modeQuestion}
          </span>
          {onModeChange ? (
            /* A live switch, not an echo: changing modes must never require
               re-running onboarding (T5.1). */
            <div className="seg" role="group" aria-label={t.onboarding.modeQuestion}>
              {(["simple", "full"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={profile.mode === mode}
                  onClick={() => profile.mode !== mode && onModeChange(mode)}
                >
                  {t.onboarding.modeOptions[mode].label}
                </button>
              ))}
            </div>
          ) : (
            <strong className="block text-sm text-ink">
              {t.onboarding.modeOptions[profile.mode].label}
            </strong>
          )}
        </div>
        <div className="space-y-1">
          <span className="block text-xs font-bold text-ink-3">Refund account</span>
          <strong className="block text-sm text-ink font-mono">{refund ? `${refund.bank} ${refund.maskedNumber}` : "—"}</strong>
          {refund && <span className="block text-xs text-ink-3">{refund.status === "validated" ? "pre-validated" : refund.status.replace("_", " ")}</span>}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-ink">
            {profile.connections.digilocker.linked ? "DigiLocker linked" : "DigiLocker not linked"}
          </span>
          <span className="glass-flat inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-ink-2">
            {profile.residency === "resident" ? "Resident of India" : profile.residency === "nri" ? "Non-resident" : "Resident, not ordinarily resident"}
          </span>
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
