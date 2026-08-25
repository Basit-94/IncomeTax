"use client";

import React from "react";
import { m } from "motion/react";
import { Building2, Check, AlertTriangle } from "lucide-react";
import type { Persona, Lang, BankAccount } from "../../lib/types";
import { REFUND_SEQUENCE } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { TODAY, daysBetween } from "../../lib/personas";
import { formatMoney, formatDate, formatDayMonth } from "../../lib/money";
import { localize } from "../mock-i18n";

interface OverviewTabProps {
  persona: Persona;
  lang: Lang;
  t: Dict;
  stampFired: boolean;
  progressPathRef: React.RefObject<SVGLineElement | null>;
  /** Engine-computed refundOrDue (positive = refund). Never the narrative amount. */
  refundFigure: number;
  handleFixBank: (bank: BankAccount) => void;
}

/**
 * The after-filing tracker: named states from canonical REFUND_SEQUENCE,
 * stored timeline headlines rendered as i18n keys, holds with their release
 * actions and clear-by windows, and cohort framing for the wait.
 */
export default function OverviewTab({
  persona,
  lang,
  t,
  stampFired,
  progressPathRef,
  refundFigure,
  handleFixBank,
}: OverviewTabProps) {
  const refund = persona.refund;
  const seqIndex = REFUND_SEQUENCE.indexOf(refund.state);
  const targetPct =
    refund.state === "credited"
      ? 100
      : seqIndex > 0
      ? Math.round((seqIndex / (REFUND_SEQUENCE.length - 1)) * 100)
      : 20;

  const openHolds = refund.holds.filter((h) => !h.resolved);

  return (
    <div className="space-y-6">
      {/* REFUND TICKET */}
      <div className="bg-money-soft border border-money/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        {refund.state !== "not_filed" && stampFired && (
          <m.div
            initial={{ scale: 2.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 0.85, rotate: -12 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            className="absolute right-10 top-2 font-mono text-[1.4rem] font-bold border-4 border-alarm text-alarm px-4 py-1.5 uppercase rounded tracking-widest pointer-events-none select-none z-10 bg-white/40 backdrop-blur-sm"
          >
            {t.refund.stampFiled} {TODAY}
          </m.div>
        )}

        <div className="space-y-2">
          <span className="text-xs font-mono text-money uppercase tracking-wider font-semibold">
            {t.dashboard.returnSummary}
          </span>
          <h2 className="text-3xl font-extrabold text-navy tracking-tight tabular">
            {refundFigure > 0
              ? t.file.outcomeRefund(formatMoney(refundFigure, lang))
              : refundFigure === 0
              ? t.file.outcomeOwesNothing
              : t.file.outcomeOwes(formatMoney(Math.abs(refundFigure), lang))}
          </h2>
          <p className="text-xs text-ink-2 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 rounded font-mono font-semibold ${
                openHolds.length > 0 ? "bg-warn-soft text-warn" : "bg-money-soft text-money"
              }`}
            >
              {t.refund.states[refund.state]}
            </span>
            {openHolds.length > 0 && (
              <span>{t.refund.holdsHeading(openHolds.length)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* LEFT: BANKS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-line rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
              {t.dashboard.verifiedBanks}
            </h3>

            <div className="space-y-3">
              {persona.banks.map((bank) => (
                <div
                  key={bank.id}
                  className={`bg-slate-50 border rounded-xl p-4 flex flex-col justify-between gap-3 text-left ${
                    bank.status === "failed" ? "border-alarm bg-alarm-soft/10" : "border-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                        <Building2 size={16} className="text-ink-2 shrink-0" />
                        <span className="truncate">{bank.bank}</span>
                      </span>
                      <span className="text-xs font-mono text-ink-2">
                        {bank.maskedNumber} &bull; IFSC: <strong className="text-ink">{bank.ifsc}</strong>
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[0.7rem] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        bank.status === "validated"
                          ? "bg-money-soft text-money"
                          : bank.status === "under_process"
                          ? "bg-warn-soft text-warn"
                          : "bg-alarm-soft text-alarm"
                      }`}>
                        {bank.status === "validated"
                          ? t.dashboard.bankValidated
                          : bank.status === "under_process"
                          ? t.dashboard.bankUnderProcess
                          : t.dashboard.bankFailed}
                      </span>
                      <span className="block text-[0.65rem] text-ink-3 font-mono mt-1">
                        {bank.nominatedForRefund ? t.dashboard.primaryRefundAccount : t.dashboard.backupAccount}
                      </span>
                    </div>
                  </div>

                  {/* Stale IFSC — cause named, fix one tap away */}
                  {bank.supersededBy && (
                    <div className="border-t border-line/65 pt-3 space-y-2">
                      <p className="text-xs text-alarm leading-normal">
                        <strong>{t.dashboard.staleIfscHold}</strong>{" "}
                        {t.refund.bankMergedInto(bank.supersededBy.bank)}
                      </p>
                      <button
                        onClick={() => handleFixBank(bank)}
                        className="text-xs bg-alarm text-paper py-1.5 px-3 rounded font-semibold hover:bg-alarm-deep transition-colors"
                      >
                        {t.dashboard.switchToNewIfsc(bank.supersededBy.ifsc)}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* HOLDS with clear-by windows */}
          {openHolds.length > 0 && (
            <div className="bg-warn-soft/40 border border-warn/30 rounded-xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-wider text-warn font-bold flex items-center gap-1.5 border-b border-warn/25 pb-2">
                <AlertTriangle size={14} />
                <span>{t.refund.holdsHeading(openHolds.length)}</span>
              </h4>
              <div className="space-y-4">
                {openHolds.map((hold) => (
                  <div key={hold.id} className="space-y-1">
                    <span className="block text-xs font-bold text-ink">{localize(hold.headline, lang)}</span>
                    <p className="text-xs text-ink-2 leading-relaxed">{localize(hold.detail, lang)}</p>
                    <span className="block text-[0.68rem] font-mono text-warn font-semibold">
                      {t.refund.clearsInDays(hold.clearsInDays)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: TIMELINE from stored keyed events over REFUND_SEQUENCE */}
        <div className="lg:col-span-2 space-y-6">
          {refund.state !== "not_filed" && (
            <div className="bg-white border border-line rounded-xl p-5 space-y-6 shadow-sm">
              <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
                {t.dashboard.refundTimeline}
              </h3>

              {refund.cohortWindowDays && (
                <p className="text-[0.7rem] text-ink-2 leading-relaxed bg-paper-2 border border-line rounded-lg p-3">
                  {t.refund.cohortWindow(refund.cohortWindowDays[0], refund.cohortWindowDays[1])}
                </p>
              )}

              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[7.5px] top-1 bottom-2 w-[2px] bg-line">
                  <svg className="absolute left-[-0.5px] top-0 bottom-0 w-[3px] h-full overflow-visible pointer-events-none">
                    <line
                      ref={progressPathRef}
                      x1="1.5"
                      y1="0"
                      x2="1.5"
                      y2={`${targetPct}%`}
                      stroke="var(--color-money)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {[...refund.timeline].reverse().map((event) => {
                  const isCurrent = event.state === refund.state;
                  const doneIdx = REFUND_SEQUENCE.indexOf(event.state);
                  const curIdx = REFUND_SEQUENCE.indexOf(refund.state);
                  const isPast = doneIdx >= 0 && doneIdx <= curIdx;
                  return (
                    <div key={event.id} className="relative text-xs">
                      <span
                        className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 border-paper flex items-center justify-center ${
                          isCurrent && refund.state !== "credited"
                            ? "bg-warn text-paper animate-pulse"
                            : isPast
                            ? "bg-money text-paper"
                            : "bg-line text-ink-3"
                        }`}
                      >
                        {isPast || isCurrent ? <Check size={8} /> : null}
                      </span>
                      <div className="space-y-0.5">
                        <span className={`font-semibold ${isCurrent ? "text-navy" : "text-ink"} leading-snug block`}>
                          {event.headlineKey
                            ? t.timeline[event.headlineKey]
                            : localize(event.headline, lang)}
                        </span>
                        {event.detail && (
                          <span className="block text-ink-3 leading-snug">{localize(event.detail, lang)}</span>
                        )}
                        <span className="block text-ink-3 font-mono text-[0.65rem]">
                          {formatDayMonth(event.on, lang)} · {t.refund.states[event.state]}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {refund.filedOn && (
                  <div className="text-[0.65rem] text-ink-3 font-mono pt-1">
                    {t.refund.filedDaysAgo(daysBetween(refund.filedOn))} · {formatDate(refund.filedOn, lang)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
