"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Check, PencilLine } from "lucide-react";
import type { Lang, Provenance } from "../lib/types";
import type { Dict } from "../lib/i18n";
import type { Correction } from "../lib/return/state";
import { formatDate, formatMoney } from "../lib/money";
import { AnimatedAmount } from "./ui/animated-amount";

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
  /** A face-level caveat (badge sys), e.g. "not counted under the new regime". */
  notice?: string;
  /** 1-based position on the board — the D13 "CARD 01" line and the tilt. */
  index?: number;
  onConfirm?: () => void;
  onCorrect?: () => void;
  onUndo?: () => void;
  readOnly?: boolean;
}

/** The prototype's alternating pin tilts, keyed by board position. */
const TILTS = ["-.4deg", ".35deg", "-.25deg", ".3deg", "-.35deg"];

/**
 * One Direction-13 index card, emitting the PROTOTYPE'S OWN markup
 * (.card > .pin / .no / h3 / .who / .badges / .amt / details.margin /
 * .links / .confirmline) styled by the verbatim app/d13.css.
 *
 * Simple mode carries the pencil note and the read-then-confirm gate: the
 * confirm button unlocks only after the note has been OPENED once, and
 * collapsing a read note does not re-lock the card. Full detail (no meaning)
 * gets the same single dropdown under "Where this came from" plus the mono
 * link row, and no per-card gate.
 */
export default function FactRow({
  id,
  label,
  amount,
  provenance,
  lang,
  t,
  confirmed,
  correction,
  meaning,
  notice,
  index,
  onConfirm,
  onCorrect,
  onUndo,
  readOnly = false,
}: FactRowProps) {
  const [hasRead, setHasRead] = useState(false);
  const [risen, setRisen] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRisen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const shownAmount = correction?.next as number | undefined ?? amount;
  const gated = Boolean(meaning) && !confirmed && !correction && !hasRead;
  const full = !meaning;

  const reporterBadge =
    provenance.reporterKind === "self"
      ? { cls: "badge you", text: t.check.badgeYouEntered }
      : provenance.reporterKind === "department"
        ? { cls: "badge sys", text: t.check.badgeWeApplied }
        : { cls: "badge rep", text: t.check.badgeReportedBy(provenance.reporter) };

  return (
    <article
      id={`fact-${id}`}
      tabIndex={-1}
      className={`card fact-card ${risen ? "in" : ""} ${confirmed ? "ok" : ""}`}
      data-confirmed={confirmed}
      style={{ "--tilt": TILTS[(index ?? 1) % TILTS.length] } as CSSProperties}
    >
      <div className="pin" aria-hidden="true" />
      {index !== undefined && (
        <div className="no">{t.factCard.cardNo(index, formatDate(provenance.filedOn, lang))}</div>
      )}
      <h3>{label}</h3>
      <div className="who">
        {provenance.reporter} &middot; {provenance.statement}
        {full && provenance.identifier ? <> &middot; {provenance.identifier}</> : null}
      </div>

      <div className="badges">
        <span className={reporterBadge.cls}>{reporterBadge.text}</span>
        {notice && <span className="badge sys">{notice}</span>}
        {confirmed && <span className="badge you">{t.common.yesThatsRight}</span>}
        {correction && <span className="badge dis">{t.common.noThisIsWrong}</span>}
      </div>

      <div className="amt">
        <AnimatedAmount value={shownAmount} lang={lang} />
        {correction && (
          <span className="ml-2 align-middle font-sans text-xs font-semibold text-warn">
            {t.flow.correctedTo(formatMoney(shownAmount, lang))}
          </span>
        )}
      </div>

      {/* ONE dropdown per card: the pencil note (Simple) or the provenance
          (Full) — both live here, and opening it satisfies the read-gate. */}
      <details
        className="margin"
        onToggle={(e) => {
          if ((e.target as HTMLDetailsElement).open) setHasRead(true);
        }}
      >
        <summary>
          {meaning ? (
            <span className="hand">{t.factCard.whatThisMeans}</span>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-2">
              {t.groups.fromWhere}
            </span>
          )}
        </summary>
        <div className="mbody">
          {meaning && <p className="m-0">{meaning}</p>}
          <div className={meaning ? "mt-2 border-t border-line/60 pt-2 text-[0.82rem]" : "text-[0.82rem]"}>
            <p className="m-0">{t.file.reportedBy(provenance.reporter, formatDate(provenance.filedOn, lang))}</p>
            <p className="m-0 mt-1">{t.check.statementMeaning(provenance.statement)}</p>
            {provenance.identifier && (
              <p className="m-0 mt-1 font-mono text-[0.72rem] text-ink-3">{t.check.sourceIdentifier(provenance.identifier)}</p>
            )}
            {provenance.onlyReporterCanFix && (
              <p className="m-0 mt-2 text-warn">{t.file.onlyTheyCanFix(provenance.reporter)}</p>
            )}
          </div>
        </div>
      </details>

      {/* Full detail: the D13 mono link row instead of big buttons. */}
      {full && !readOnly && onCorrect && !correction && (
        <div className="links">
          <button type="button" onClick={onCorrect}>
            {t.common.noThisIsWrong} {"↗"}
          </button>
        </div>
      )}
      {full && !readOnly && correction && (
        <div className="links">
          <span className="badge dis">Modified</span>
          {onUndo && (
            <button type="button" onClick={onUndo}>
              Undo {"↗"}
            </button>
          )}
        </div>
      )}

      {!readOnly && !full && (onConfirm || onCorrect) && (
        <>
          {onConfirm && !confirmed && !correction && (
            <div className="confirmline">{gated ? t.factCard.readFirst : t.factCard.readyToConfirm}</div>
          )}
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-xs sm:flex-row sm:items-center sm:justify-end">
            {confirmed ? (
              <div className="flex items-center gap-2">
                <span className="badge you flex items-center gap-1">
                  <Check size={12} />
                  <span>Confirmed</span>
                </span>
                {onCorrect && (
                  <button
                    onClick={onCorrect}
                    className="ml-2 cursor-pointer text-xs font-semibold text-ink-2 hover:text-navy dark:hover:text-ink hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : correction ? (
              <div className="flex items-center gap-2">
                <span className="badge dis flex items-center gap-1">
                  <Check size={12} />
                  <span>Modified</span>
                </span>
                {onUndo && (
                  <button
                    onClick={onUndo}
                    className="ml-2 cursor-pointer text-xs font-semibold text-ink-2 hover:text-navy dark:hover:text-ink hover:underline"
                  >
                    Undo Correction
                  </button>
                )}
              </div>
            ) : (
              <>
                {onCorrect && (
                  <button
                    onClick={onCorrect}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded border border-line px-4 text-sm font-semibold text-ink-2 transition hover:border-warn hover:text-warn"
                  >
                    <PencilLine size={14} aria-hidden="true" />
                    {t.common.noThisIsWrong}
                  </button>
                )}
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    disabled={gated}
                    title={gated ? t.factCard.readFirst : undefined}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded bg-navy px-5 text-sm font-bold text-paper dark:text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check size={14} aria-hidden="true" />
                    {t.common.yesThatsRight}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </article>
  );
}
