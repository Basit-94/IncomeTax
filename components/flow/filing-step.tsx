"use client";

import React, { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Banknote, CheckCircle2, FileCheck, Loader2, Award, ShieldCheck } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { formatMoney } from "../../lib/money";
import { computeForPersona } from "../../lib/return/compute";
import { localize } from "../mock-i18n";
import type { CAReviewRecord } from "@/lib/ca/ca-store";

type Stage = "idle" | "checking" | "sealing" | "committing" | "done" | "error";

interface FilingStepProps {
  persona: Persona;
  t: Dict;
  lang: Lang;
  regime: "new" | "old";
  /** Parent commits the return. Resolves once the server has accepted it; rejects on a
   *  network/server failure so the error ladder can name the cause and offer retry (T1.4). */
  onFile: () => void | Promise<void>;
  onBack: () => void;
  /**
   * The return computes to a balance payable. Filing with tax outstanding is
   * defective u/s 139(9), so the confirm button gives way to the challan until
   * the balance is cleared.
   */
  onPayOutstanding?: () => void;
  onReviewWithCA?: () => void;
  activeCAReview?: CAReviewRecord | null;
  onOpenComparison?: () => void;
}

/**
 * Staged, visibly deliberate submission. Weight matched to stakes
 * (~1.2s of named steps — never an instant flicker); a rejected commit names
 * its cause and its next action.
 */
export default function FilingStep({
  persona,
  t,
  lang,
  regime,
  onFile,
  onBack,
  onPayOutstanding,
  onReviewWithCA,
  activeCAReview,
  onOpenComparison,
}: FilingStepProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [networkError, setNetworkError] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const b = computeForPersona(persona, regime);
  const mustPayFirst = b.refundOrDue < 0 && Boolean(onPayOutstanding);

  useEffect(() => {
    const handleSubmitted = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSubmissionId(customEvent.detail);
    };
    window.addEventListener("wapsi_submitted", handleSubmitted);

    const saved = localStorage.getItem("wapsi_last_submission_id");
    if (saved) setSubmissionId(saved);

    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener("wapsi_submitted", handleSubmitted);
    };
  }, []);

  const unit = 420;

  const beginFiling = () => {
    setNetworkError(false);
    setStage("checking");
    timers.current.push(
      setTimeout(() => {
        setStage("sealing");
        timers.current.push(
          setTimeout(() => {
            setStage("committing");
            timers.current.push(
              setTimeout(() => {
                // A rejected commit is a real outcome, not a console line: the error
                // ladder below names the network cause and offers a retry.
                Promise.resolve()
                  .then(() => onFile())
                  .then(() => setStage("done"))
                  .catch(() => {
                    setNetworkError(true);
                    setStage("error");
                  });
              }, unit),
            );
          }, unit),
        );
      }, unit),
    );
  };

  const busy = stage === "checking" || stage === "sealing" || stage === "committing";

  if (stage === "done") {
    return (
      <div className="max-w-md mx-auto space-y-6 py-8 text-center">
        <m.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 size={48} className="text-money mx-auto" />
        </m.div>
        {/* WCAG 4.1.3: the success screen replaces the form, so the outcome is
            announced rather than left to the user to discover. */}
        <p role="status" aria-live="polite" className="sr-only">
          {t.filing.stepFiled} {t.filing.ackHeading}
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">{t.filing.stepFiled}</h2>
          <p className="text-base font-bold text-ink">{t.filing.ackHeading}</p>
          <p className="text-sm text-ink-2 leading-relaxed text-left">{t.filing.ackBody}</p>
          {submissionId && (
            <div className="my-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl text-left space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="block text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                e-Filing Receipt ID (Spring Boot)
              </span>
              <code className="block text-xs font-mono font-semibold text-teal-950 break-all select-all">
                {submissionId}
              </code>
            </div>
          )}
          <p className="text-xs text-ink-3 leading-relaxed text-left">{t.filing.ackNext}</p>
        </div>
        <button
          onClick={onBack}
          className="w-full bg-navy hover:opacity-90 text-paper dark:text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-sm text-sm"
        >
          {t.dashboard.refundTimeline}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* WCAG 4.1.3: both regions are mounted from the idle state onwards, so each
          named stage and any failure is announced when its text arrives. sr-only
          keeps them out of the flow, so the visible layout is unchanged. */}
      <p role="status" aria-live="polite" className="sr-only">
        {stage === "checking"
          ? t.filing.stepChecking
          : stage === "sealing" || stage === "committing"
          ? t.filing.stepSealing
          : ""}
      </p>
      <p role="alert" className="sr-only">
        {stage === "error"
          ? `${networkError ? t.filing.errorCauseNetwork : t.filing.errorCause} ${
              networkError ? t.filing.errorActionNetwork : t.filing.errorAction
            }`
          : ""}
      </p>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-money">{t.flow.file}</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.filing.heading}</h2>
        <p className="text-sm text-ink-2 leading-relaxed">{t.filing.sub}</p>
      </div>

      {/* FINAL FIGURE — one number, engine-computed */}
      <div className="recovery-callout space-y-1 p-5">
        <span className="block text-xs font-mono uppercase tracking-wider text-money font-semibold">
          {b.refundOrDue >= 0 ? t.check.refundDue : t.check.balanceDue}
        </span>
        <span className={`block text-3xl font-extrabold tabular tracking-tight ${b.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>
          {formatMoney(Math.abs(b.refundOrDue), lang)}
        </span>
        {mustPayFirst && (
          <p className="pt-1 text-xs leading-relaxed text-ink-2">
            {localize("A return filed with tax outstanding is defective under section 139(9). Pay the balance first; filing unlocks once nothing is due.", lang)}
          </p>
        )}
      </div>

      {/* NAMED-STAGE PROGRESSION */}
      {stage !== "idle" && (
        <div className="surface-panel space-y-3 p-4">
          {(
            [
              ["checking", t.filing.stepChecking],
              ["sealing", t.filing.stepSealing],
            ] as const
          ).map(([key, label]) => {
            const order = ["checking", "sealing"];
            const stageIndex = order.indexOf(key);
            const currentStage =
              stage === "committing"
                ? order.length
                : stage === "error"
                ? -1
                : order.indexOf(stage);
            const complete = currentStage > stageIndex && stage !== "error";
            const active = currentStage === stageIndex;
            const failed = stage === "error" && stageIndex === 0;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                {failed ? (
                  <span className="w-4 h-4 rounded-full bg-alarm shrink-0" />
                ) : complete ? (
                  <CheckCircle2 size={16} className="text-money shrink-0" />
                ) : active ? (
                  <Loader2 size={16} className="text-navy dark:text-ink animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-line shrink-0" />
                )}
                <span className={complete ? "text-ink-2 line-through decoration-line" : failed ? "text-alarm font-semibold" : active ? "text-navy dark:text-ink font-semibold" : "text-ink-3"}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ERROR LADDER: cause + next action, nothing generic */}
      {stage === "error" && (
        <div className="error-callout space-y-2 p-4">
          <p className="text-sm font-semibold text-alarm">
            {networkError ? t.filing.errorCauseNetwork : t.filing.errorCause}
          </p>
          <p className="text-xs text-ink-2 leading-relaxed">
            {networkError ? t.filing.errorActionNetwork : t.filing.errorAction}
          </p>
          <button
            onClick={beginFiling}
            className="mt-1 bg-alarm hover:bg-alarm-deep text-paper text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {t.filing.retry}
          </button>
        </div>
      )}

      {stage === "idle" ? (
        <div className="space-y-3 pt-1">
          {/* CA Review Status Cards */}
          {activeCAReview?.status === "reviewed" ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                    CA Review Complete from {activeCAReview.caDetails?.name || "Tax Professional"}!
                  </span>
                  <span className="text-[11px] text-ink-3">
                    Recommendations and tax deltas ready for side-by-side adoption.
                  </span>
                </div>
              </div>
              {onOpenComparison && (
                <button
                  type="button"
                  onClick={onOpenComparison}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
                >
                  View Diff →
                </button>
              )}
            </div>
          ) : activeCAReview?.status === "pending" ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                <span>Shared with CA (Code: <strong className="font-mono">{activeCAReview.code}</strong>)</span>
              </div>
              {onReviewWithCA && (
                <button
                  type="button"
                  onClick={onReviewWithCA}
                  className="text-xs font-bold text-teal-800 dark:text-teal-300 hover:underline cursor-pointer"
                >
                  Share / PIN
                </button>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onBack}
              className="flex-1 border border-line text-ink-2 py-3 px-3 rounded-xl hover:bg-paper-2 transition-colors text-xs font-semibold"
            >
              {t.common.back}
            </button>
            {onReviewWithCA && (
              <button
                type="button"
                onClick={onReviewWithCA}
                className="flex-1 border border-teal-700/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-950 dark:text-teal-200 py-3 px-3 rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Award size={15} className="text-teal-600" />
                <span>Review with CA</span>
              </button>
            )}
            {mustPayFirst ? (
              <button
                onClick={onPayOutstanding}
                data-action="pay-outstanding"
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-alarm px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:opacity-90 cursor-pointer"
              >
                <Banknote size={16} />
                <span>{localize("Pay outstanding tax (Challan 280)", lang)}</span>
              </button>
            ) : (
              <button
                onClick={beginFiling}
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:opacity-90 cursor-pointer"
              >
                <FileCheck size={16} />
                <span>{t.file.confirmAndFile}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        !busy && null
      )}
      {busy && (
        <p className="text-xs text-ink-3 font-mono text-center animate-pulse">{t.common.loading}</p>
      )}
    </div>
  );
}
