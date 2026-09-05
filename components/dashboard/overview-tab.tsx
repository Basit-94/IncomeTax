"use client";

import React from "react";
import { m } from "motion/react";
import { Building2, Check, AlertTriangle, ChevronDown } from "lucide-react";
import type { Persona, Lang, BankAccount } from "../../lib/types";
import { REFUND_SEQUENCE } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { TODAY, daysBetween } from "../../lib/personas";
import { formatMoney, formatDate, formatDayMonth } from "../../lib/money";
import { localize } from "../mock-i18n";
import { computeTax } from "../../lib/engine/tax";
import { taxInputFor } from "../../lib/return/compute";
import { AnimatedAmount } from "../ui/animated-amount";
import { ItrVReceipt } from "../ItrVReceipt";
import HeadlineChannels from "./headline-channels";
import ConfettiBurst from "../ambient/confetti";

interface OverviewTabProps {
  persona: Persona;
  lang: Lang;
  t: Dict;
  stampFired: boolean;
  /** Engine-computed refundOrDue (positive = refund). Never the narrative amount. */
  refundFigure?: number;
  handleFixBank: (bank: BankAccount) => void;
  onEditFacts?: () => void;
  regime: "new" | "old";
  /** T5.3: Full detail shows the trail open, immediately - no disclosure step. */
  mode?: "simple" | "full";
  /** Filings the SERVER holds for this signed-in account; null = no session. */
  serverFilings?: import("../../lib/auth-client").ServerFiling[] | null;
}

import type { RefundState } from "../../lib/types";

function getCurrentStepId(state: RefundState): number {
  switch (state) {
    case "not_filed":
      return 1;
    case "filed_unverified":
      return 2;
    case "verified":
      return 3;
    case "in_queue":
      return 4;
    case "under_review":
      return 4;
    case "determined":
      return 5;
    case "sent_to_bank":
      return 6;
    case "credited":
      return 7;
    default:
      return 2;
  }
}

interface TimelineStep {
  id: number;
  title: string;
  subtitle: string;
  date?: string | null;
}

function getTimelineSteps(refund: Persona["refund"], lang: Lang, t: Dict): TimelineStep[] {
  const findDateOfState = (state: RefundState) => {
    const ev = refund.timeline.find(e => e.state === state);
    return ev ? formatDate(ev.on, lang) : null;
  };

  return [
    {
      id: 1,
      title: "Return declared & submitted",
      subtitle: "Form received by department",
      date: findDateOfState("filed_unverified") || (refund.filedOn ? formatDate(refund.filedOn, lang) : null)
    },
    {
      id: 2,
      title: "Waiting for verification",
      subtitle: "Confirm your identity via OTP",
      date: findDateOfState("verified") || (refund.verifiedOn ? formatDate(refund.verifiedOn, lang) : null)
    },
    {
      id: 3,
      title: "In the queue for processing",
      subtitle: "System validation checks running",
      date: findDateOfState("in_queue")
    },
    {
      id: 4,
      title: "Review & Decision",
      subtitle: "Deductions and tax verification",
      date: findDateOfState("under_review") || findDateOfState("determined")
    },
    {
      id: 5,
      title: "Refund sent to bank",
      subtitle: "Direct deposit process started",
      date: findDateOfState("sent_to_bank")
    },
    {
      id: 6,
      title: "Refund in your account",
      subtitle: "Direct deposit credit completed",
      date: findDateOfState("credited")
    }
  ];
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
  refundFigure: _refundFigure,
  handleFixBank,
  onEditFacts,
  regime,
  mode = "simple",
  serverFilings = null,
}: OverviewTabProps) {
  const breakdown = React.useMemo(() => {
    return computeTax(taxInputFor(persona, regime));
  }, [persona, regime]);

  const refundFigure = breakdown.refundOrDue;
  const refund = persona.refund;
  const seqIndex = REFUND_SEQUENCE.indexOf(refund.state);
  const openHolds = refund.holds.filter((h) => !h.resolved);

  return (
    <div className="space-y-6">
      {/* Direction 13 SS3: the three headline figures + proportion bar sit at
          the absolute top of the money view, before any card or tracker. */}
      <HeadlineChannels breakdown={breakdown} lang={lang} t={t} mode={mode} />

      {/* D13 celebration: weight proportional to stakes - the burst fires when
          the freshly-filed stamp lands, once. */}
      {stampFired && refund.state !== "not_filed" && <ConfettiBurst />}
      {/* D13 working (DESIGN SS4): the arithmetic fills the left column, the
          rail (refund, meter, banks, holds) sits 330px on the right. */}
      <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,1fr)_330px] print:hidden">
        <div className="min-w-0 space-y-6">
      <div className="space-y-3 print:hidden">
        <details
          id="return-source-trail"
          className="disclosure text-xs text-ink-2"
          /* T5.3: a professional gets the arithmetic immediately; the summary
             toggle is Simple-mode progressive disclosure only. key remounts the
             element when the mode flips so the open state actually applies. */
          key={mode}
          open={mode === "full"}
        >
          <summary className={mode === "full" ? "hidden" : "cursor-pointer font-semibold text-ink"}>
            {t.check.showCalculationTrail}
          </summary>
          <div className="mt-3 border border-line rounded-xl overflow-hidden bg-paper pb-0 text-left">
            {/* Header: Show source and calculation trail */}
            <div className="p-4 bg-paper-2 border-b border-line">
              <span className="font-bold text-navy dark:text-ink">Tax Calculation Trail</span>
            </div>

            <div className="p-4 space-y-4">
              {/* Computed Summary */}
              <div className="space-y-2 border-b border-line pb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">{t.check.grossIncome}</span>
                  <span className="font-mono text-ink font-semibold">{formatMoney(breakdown.grossIncome, lang)}</span>
                </div>
                {breakdown.standardDeduction > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">{t.check.standardDeduction}</span>
                    <span className="font-mono text-money font-semibold">-{formatMoney(breakdown.standardDeduction, lang)}</span>
                  </div>
                )}
                {breakdown.totalDeductions > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">{t.check.deductionsLine}</span>
                    <span className="font-mono text-money font-semibold">-{formatMoney(breakdown.totalDeductions, lang)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs border-t border-dashed border-line pt-2 font-bold text-navy dark:text-ink">
                  <span>{t.check.taxableIncome}</span>
                  <span className="font-mono tabular-nums">{formatMoney(breakdown.taxableIncome, lang)}</span>
                </div>
              </div>

              {/* Slab Slices */}
              <div className="space-y-2 border-b border-line pb-3">
                <span className="block font-bold text-ink mb-1">{t.check.slabTax} ({formatMoney(breakdown.slabTax, lang)})</span>
                <div className="space-y-1.5 pl-3">
                  {breakdown.slabBreakdown.map((slice, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-1 text-ink-2">
                        <span className="tabular">
                          {formatMoney(slice.from, lang)}
                          {" to "}
                          {Number.isFinite(slice.to) ? formatMoney(slice.to, lang) : "∞"}
                        </span>
                        <span className="font-mono text-[0.65rem] bg-paper-2 border border-line rounded px-1">
                          {t.check.ratePct(slice.rate)}
                        </span>
                      </span>
                      <span className="tabular text-ink font-semibold">{formatMoney(slice.tax, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special-rate capital gains (s.111A / 112A / 112) — only when classified */}
              {breakdown.specialRate.length > 0 && (
                <div className="space-y-2 border-b border-line pb-3">
                  <span className="block font-bold text-ink mb-1">
                    Capital gains at special rates (<span className="font-mono tabular-nums">{formatMoney(breakdown.specialRate.reduce((s, i) => s + i.tax, 0), lang)}</span>)
                  </span>
                  <div className="space-y-1.5 pl-3">
                    {breakdown.specialRate.map((item) => (
                      <div key={item.section} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-1 text-ink-2">
                          <span className="tabular">
                            s.{item.section}: {formatMoney(item.taxable, lang)}
                            {item.exemptAmount > 0 && ` (after ${formatMoney(item.exemptAmount, lang)} exempt)`}
                          </span>
                          <span className="font-mono text-[0.65rem] bg-paper-2 border border-line rounded px-1">
                            {t.check.ratePct(item.rate)}
                          </span>
                        </span>
                        <span className="tabular text-ink font-semibold">{formatMoney(item.tax, lang)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rebates, Cess, & Credits */}
              <div className="space-y-2 pb-1">
                {/* SS4B CA finding 5: a Rs0 rebate is still a step that was
                    checked; omitting it reads as an omission, not a zero. */}
                {breakdown.rebate87A === 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">{t.check.rebate87A}</span>
                    <span className="font-mono font-semibold text-ink-2">{"\u2212"}{formatMoney(0, lang)}</span>
                  </div>
                )}
                {breakdown.rebate87A > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-money font-semibold">
                      {t.check.rebate87A}
                      {breakdown.marginalReliefApplied && " (Marginal Relief applied)"}
                    </span>
                    <span className="font-mono text-money font-semibold">-{formatMoney(breakdown.rebate87A, lang)}</span>
                  </div>
                )}
                {breakdown.cess > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">{t.check.cess}</span>
                    <span className="font-mono text-ink font-semibold">+{formatMoney(breakdown.cess, lang)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs border-t border-dashed border-line pt-2 font-bold text-navy dark:text-ink">
                  <span>Total Calculated Tax</span>
                  <span className="font-mono">{formatMoney(breakdown.totalTax, lang)}</span>
                </div>
                {breakdown.tdsCredits > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 text-money font-semibold">
                    <span>{t.check.tdsCredits}</span>
                    <span className="font-mono">-{formatMoney(breakdown.tdsCredits, lang)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Net Result - bottom padded row with color matching outer box */}
            <div className="flex justify-between items-center p-4 bg-money-soft border-t border-line">
              <span className="font-bold text-navy dark:text-ink">Net Refund / Due</span>
              <span className={`font-mono text-sm font-bold ${breakdown.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>
                {breakdown.refundOrDue >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(breakdown.refundOrDue), lang)}
              </span>
            </div>
          </div>
        </details>
      </div>


          {refund.state !== "not_filed" && (
            <details className="surface-panel group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-mono uppercase tracking-wider text-ink-2 font-bold [&::-webkit-details-marker]:hidden">
                {t.dashboard.refundTimeline}
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="space-y-6 border-t border-line mt-2 pt-4">

              {refund.cohortWindowDays && (
                <p className="text-[0.7rem] text-ink-2 leading-relaxed bg-paper-2 border border-line rounded-lg p-3">
                  {t.refund.cohortWindow(refund.cohortWindowDays[0], refund.cohortWindowDays[1])}
                </p>
              )}

              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[7.5px] top-2 bottom-2 w-[2px] bg-line">
                  {/* Progress fill */}
                  <span 
                    className="absolute inset-x-0 top-0 rounded-full bg-navy transition-all duration-500" 
                    style={{ 
                      height: `${Math.min(100, Math.max(0, ((getCurrentStepId(refund.state) - 1) / (6 - 1)) * 100))}%` 
                    }} 
                    aria-hidden="true" 
                  />
                </div>

                {getTimelineSteps(refund, lang, t).map((step, idx) => {
                  const currentStepId = getCurrentStepId(refund.state);
                  const isCompleted = step.id < currentStepId;
                  const isCurrent = step.id === currentStepId;
                  const isPending = step.id > currentStepId;

                  return (
                    <div key={step.id} className="relative text-xs flex items-start gap-3">
                      <span
                        className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 border-paper flex items-center justify-center transition-colors duration-300 z-10 ${
                          isCompleted
                            ? "bg-navy text-paper dark:text-white animate-none"
                            : isCurrent
                            ? "bg-warn text-paper animate-pulse"
                            : "bg-line text-ink-3"
                        }`}
                      >
                        {isCompleted && <Check size={8} />}
                      </span>
                      <div className="space-y-0.5">
                        <span className={`font-semibold leading-snug block ${
                          isCurrent ? "text-navy dark:text-ink font-bold" : isCompleted ? "text-ink" : "text-ink-3"
                        }`}>
                          {step.title}
                        </span>
                        <span className="block text-ink-3 leading-snug">{step.subtitle}</span>
                        {step.date && (
                          <span className="block text-ink-3 font-mono text-[0.65rem] mt-0.5">
                            {step.date}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </details>
          )}

        </div>
        <aside className="space-y-6">
          {/* Receipts the BACKEND holds for this account - live proof the
              filing left the browser. Rendered only on a real session. */}
          {serverFilings !== null && (
            <div className="surface-panel space-y-3 p-5 print:hidden">
              <span className="cap block">{t.dashboard.serverFilings}</span>
              {serverFilings.length === 0 ? (
                <p className="text-xs leading-relaxed text-ink-2">{t.dashboard.serverFilingsEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {serverFilings.slice(0, 5).map((filing) => (
                    <div key={filing.submissionId} className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[0.68rem] text-ink-3">
                          {filing.submissionId.slice(0, 8)}
                        </span>
                        <span
                          className={
                            filing.status === "completed"
                              ? "badge you"
                              : filing.status === "failed"
                                ? "badge dis"
                                : "badge sys"
                          }
                        >
                          {filing.status}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-ink-3">{t.check.totalTax}</span>
                        <span className="tabular font-mono font-semibold text-ink">
                          {filing.totalTaxPaise === null ? "—" : formatMoney(Math.round(filing.totalTaxPaise / 100), lang)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      {/* REFUND TICKET */}
      <div className="bg-money-soft border border-money/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm print:hidden">
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
          <h2 className="text-3xl font-extrabold text-navy dark:text-ink tracking-tight tabular flex items-baseline gap-2 flex-wrap">
            {refundFigure > 0 ? (
              <>
                <span style={{ color: "var(--flow-keep)" }}>
                  <AnimatedAmount value={Math.abs(refundFigure)} lang={lang} />
                </span>
                <span className="text-lg font-medium text-ink-2">
                  {t.file.outcomeRefund("").replace(/^\s*₹?\s*/, "")}
                </span>
              </>
            ) : refundFigure === 0 ? (
              <span>{t.file.outcomeOwesNothing}</span>
            ) : (
              <>
                <span>−</span>
                <AnimatedAmount value={Math.abs(refundFigure)} lang={lang} />
                <span className="text-lg font-medium text-alarm">
                  {t.file.outcomeOwes("").replace(/^\s*₹?\s*/, "")}
                </span>
              </>
            )}
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 rounded font-mono font-semibold text-xs ${
                openHolds.length > 0 ? "bg-warn-soft text-warn" : "bg-money-soft text-money"
              }`}
            >
              {t.refund.states[refund.state]}
            </span>
            {openHolds.length > 0 && (
              <span className="text-xs text-ink-2">{t.refund.holdsHeading(openHolds.length)}</span>
            )}
            {onEditFacts && (
              <button
                onClick={onEditFacts}
                className="text-xs text-money hover:text-money-deep font-bold underline cursor-pointer"
              >
                Edit Actual Figures
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full detail: the owed-vs-paid meter (D13 rail). Widths are the real
          shares of what was collected; no flattery. */}
      {mode === "full" && breakdown.tdsCredits > 0 && (
        <div className="surface-panel px-[18px] pb-4 pt-[15px] print:hidden">
          <span className="cap mb-2.5 block">{t.channels.meterCap}</span>
          <div className="meter" role="img" aria-label={
            `${t.channels.kept}: ${formatMoney(Math.min(breakdown.totalTax, breakdown.tdsCredits), lang)}; ` +
            `${t.channels.back}: ${formatMoney(Math.max(0, breakdown.refundOrDue), lang)}`
          }>
            <i className="a" style={{ width: `${Math.min(100, (Math.min(breakdown.totalTax, breakdown.tdsCredits) / breakdown.tdsCredits) * 100)}%` }} />
            <i className="b" style={{ width: `${Math.max(0, (Math.max(0, breakdown.refundOrDue) / breakdown.tdsCredits) * 100)}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs tabular-nums text-ink-2">
            <span>{t.channels.kept} {formatMoney(Math.min(breakdown.totalTax, breakdown.tdsCredits), lang)}</span>
            <span>{t.channels.back} {formatMoney(Math.max(0, breakdown.refundOrDue), lang)}</span>
          </div>
        </div>
      )}


          <div className="surface-panel space-y-4 p-5">
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
                      <span className="block text-[0.68rem] text-ink-3">{t.dashboard.ifscMeaning}</span>
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

        </aside>
      </div>

      {refund.state !== "not_filed" && (
        <div className="pt-4 border-t border-line">
          <ItrVReceipt filedOn={refund.filedOn ? formatDate(refund.filedOn, lang) : undefined} />
        </div>
      )}
    </div>
  );
}
