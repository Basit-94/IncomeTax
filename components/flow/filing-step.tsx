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
import { Munshi, MunshiAvatar } from "../brand/munshi";

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
        <m.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
          <Munshi size={96} state="success" />
        </m.div>
        {/* WCAG 4.1.3: the success screen replaces the form, so the outcome is
            announced rather than left to the user to discover. */}
        <p role="status" aria-live="polite" className="sr-only">
          {t.filing.stepFiled} {t.filing.ackHeading}
        </p>
        <div className="space-y-2">
          <h2 className="text-[30px] font-extrabold tracking-[-0.03em] text-ink">{t.filing.stepFiled}</h2>
          <p className="text-base font-bold text-ink">{t.filing.ackHeading}</p>
          <p className="text-sm text-ink-2 leading-relaxed text-left">{t.filing.ackBody}</p>
          {submissionId && (
            <div className="my-4 px-4 py-3.5 bg-ok-soft rounded-[16px] text-left space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="block text-xs font-bold text-ok">
                e-Filing Receipt ID (Spring Boot)
              </span>
              <code className="block text-[12.5px] font-mono font-semibold text-ink break-all select-all">
                {submissionId}
              </code>
            </div>
          )}
          <p className="text-xs text-ink-3 leading-relaxed text-left">{t.filing.ackNext}</p>
        </div>
        <button
          onClick={onBack}
          className="ink-surface w-full hover:opacity-90 font-bold h-[46px] px-6 rounded-[14px] transition-opacity text-[14.5px] cursor-pointer"
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
        <div className="flex items-center gap-3 pb-1"><MunshiAvatar size={36} state={busy ? "working" : stage === "error" ? "error" : "reading"} /><p className="text-xs font-bold uppercase tracking-[.08em] text-money">{t.flow.file}</p></div>
        <h2 className="text-[26px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink">{t.filing.heading}</h2>
        <p className="text-sm text-ink-2 leading-relaxed">{t.filing.sub}</p>
      </div>

      {/* FINAL FIGURE — one number, engine-computed */}
      <div className="recovery-callout space-y-1 p-5">
        <span className="block text-xs text-amber-ink font-bold">
          {b.refundOrDue >= 0 ? t.check.refundDue : t.check.balanceDue}
        </span>
        <span className={`block text-[34px] leading-none font-extrabold tabular tracking-[-0.03em] ${b.refundOrDue >= 0 ? "text-ok" : "text-bad"}`}>
          {formatMoney(Math.abs(b.refundOrDue), lang)}
        </span>
        {mustPayFirst && (
          <p className="pt-1 text-xs leading-relaxed text-amber-ink/80">
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
                  <span className="w-4 h-4 rounded-full bg-bad shrink-0" />
                ) : complete ? (
                  <CheckCircle2 size={16} className="text-ok shrink-0" />
                ) : active ? (
                  <Loader2 size={16} className="text-money animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-line shrink-0" />
                )}
                <span className={complete ? "text-ink-2 line-through decoration-line" : failed ? "text-bad font-semibold" : active ? "text-ink font-semibold" : "text-ink-3"}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ERROR LADDER: cause + next action, nothing generic */}
      {stage === "error" && (
        <div className="bg-bad-soft rounded-[16px] space-y-2 px-4 py-3.5">
          <p className="text-sm font-extrabold text-bad">
            {networkError ? t.filing.errorCauseNetwork : t.filing.errorCause}
          </p>
          <p className="text-xs text-ink-2 leading-relaxed">
            {networkError ? t.filing.errorActionNetwork : t.filing.errorAction}
          </p>
          <button
            onClick={beginFiling}
            className="btn-primary mt-1 text-[13px] h-[38px] px-4 rounded-[14px] transition-opacity cursor-pointer"
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
              className="glass-flat flex-1 text-ink-2 hover:text-ink h-[46px] px-4 rounded-[14px] transition-colors text-[14.5px] font-semibold cursor-pointer"
            >
              {t.common.back}
            </button>
            {onReviewWithCA && (
              <button
                type="button"
                onClick={onReviewWithCA}
                className="glass-flat flex-1 text-ink-2 hover:text-ink h-[46px] px-4 rounded-[14px] transition-colors text-[14.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award size={15} className="text-money" />
                <span>Review with CA</span>
              </button>
            )}
            {mustPayFirst ? (
              <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)] md:flex-[2] md:flex">
                <button
                  onClick={onPayOutstanding}
                  data-action="pay-outstanding"
                  className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-bad h-[50px] md:h-[46px] px-4 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                >
                  <Banknote size={16} />
                  <span>{localize("Pay outstanding tax (Challan 280)", lang)}</span>
                </button>
              </div>
            ) : (
              <div className="md:contents max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:px-4 max-md:pb-7 max-md:pt-2.5 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)] md:flex-[2] md:flex">
                <button
                  onClick={beginFiling}
                  className="btn-primary w-full flex items-center justify-center gap-2 rounded-[14px] h-[50px] md:h-[46px] px-4 text-[14.5px] transition-opacity cursor-pointer"
                >
                  <FileCheck size={16} />
                  <span>{t.file.confirmAndFile}</span>
                </button>
              </div>
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
