"use client";

import { Check, CircleHelp, PencilLine, RotateCcw } from "lucide-react";
import type { Lang, Provenance } from "../lib/types";
import type { Dict } from "../lib/i18n";
import type { Correction } from "../lib/return/state";
import { formatDate, formatMoney } from "../lib/money";

export interface FactRowProps {
  id: string;
  label: string;
  amount: number;
  provenance: Provenance;
  lang: Lang;
  t: Dict;
  confirmed: boolean;
  correction?: Correction;
  meaning?: string;
  onConfirm?: () => void;
  onCorrect?: () => void;
  onUndo?: () => void;
  readOnly?: boolean;
}

/**
 * The one visible primitive for prefilled money. A figure, its meaning, its
 * reporter, and the two possible citizen decisions stay together everywhere.
 */
export default function FactRow({
  label,
  amount,
  provenance,
  lang,
  t,
  confirmed,
  correction,
  meaning,
  onConfirm,
  onCorrect,
  onUndo,
  readOnly = false,
}: FactRowProps) {
  const shownAmount = correction?.next as number | undefined ?? amount;

  return (
    <article className="fact-card p-4 sm:p-5" data-confirmed={confirmed}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-money" aria-hidden="true" />
            <h4 className="text-base font-bold leading-snug text-ink">{label}</h4>
          </div>
          {meaning && <p className="max-w-xl text-sm leading-relaxed text-ink-2">{meaning}</p>}
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <span className={`block text-xl font-extrabold tabular ${correction ? "text-warn" : "text-ink"}`}>
            {formatMoney(shownAmount, lang)}
          </span>
          {correction && (
            <span className="mt-1 block text-xs font-semibold text-warn">{t.flow.correctedTo(formatMoney(shownAmount, lang))}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="provenance-badge w-fit max-w-full">
          <span className="font-semibold text-ink">{provenance.reporter}</span>
          <span aria-hidden="true">•</span>
          <span>{formatDate(provenance.filedOn, lang)}</span>
          <span aria-hidden="true">•</span>
          <span>{provenance.statement}</span>
        </span>
        <details className="disclosure group">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-ink-2">
            <CircleHelp size={14} className="text-money" aria-hidden="true" />
            <span>{t.groups.fromWhere}</span>
          </summary>
          <div className="border-t border-line px-3 py-3 text-xs leading-relaxed text-ink-2">
            <p>{t.file.reportedBy(provenance.reporter, formatDate(provenance.filedOn, lang))}</p>
            <p className="mt-1">{t.check.statementMeaning(provenance.statement)}</p>
            {provenance.identifier && <p className="mt-1 font-mono text-[0.72rem] text-ink-3">{t.check.sourceIdentifier(provenance.identifier)}</p>}
            {provenance.onlyReporterCanFix && <p className="mt-2 text-warn">{t.file.onlyTheyCanFix(provenance.reporter)}</p>}
          </div>
        </details>
      </div>

      {!readOnly && (onConfirm || onCorrect) && (
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-end">
          {correction && onUndo ? (
            <button onClick={onUndo} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink-2 transition hover:border-money hover:text-money">
              <RotateCcw size={14} aria-hidden="true" />
              {t.flow.undoOne}
            </button>
          ) : onCorrect ? (
            <button onClick={onCorrect} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink-2 transition hover:border-warn hover:text-warn">
              <PencilLine size={14} aria-hidden="true" />
              {t.common.noThisIsWrong}
            </button>
          ) : null}
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={confirmed || !!correction}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-[0.98] ${
                confirmed || correction ? "bg-money-soft text-money" : "bg-money text-white hover:bg-money-deep"
              }`}
            >
              <Check size={14} aria-hidden="true" />
              {confirmed ? t.flow.allConfirmed : t.common.yesThatsRight}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
