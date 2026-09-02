"use client";

/**
 * Direction 13's "Before you file" section, emitting the PROTOTYPE'S OWN
 * markup (.divider with the brick squiggle, .checklist > .check > .box+.txt
 * with jump links, .finish with the big keep-green refund and the .file
 * button) — styled by the verbatim app/d13.css.
 *
 * The checklist is the D13 "second door to the same state": every row mirrors
 * a real fact/claim's confirmed state, and ticking a row confirms it — the
 * same `confirmedFactIds` the facts board writes. Rows already confirmed on
 * the board arrive ticked here. Confirmation is append-only in this app, so a
 * done row does not untick.
 *
 * Simple mode lists every figure; Full detail replaces the list with the ONE
 * sign-off declaration (a declaration is signed, not crossed off). The file
 * button unlocks only when the gate is met, and says exactly what is missing.
 */

import type { Dict } from "../../lib/i18n";
import type { Lang, Persona } from "../../lib/types";
import type { TaxBreakdown } from "../../lib/engine/types";
import { formatMoney } from "../../lib/money";
import { localize } from "../mock-i18n";
import { AnimatedAmount } from "../ui/animated-amount";

interface BeforeFilingProps {
  persona: Persona;
  breakdown: TaxBreakdown;
  t: Dict;
  lang: Lang;
  mode: "simple" | "full";
  confirmedIds: string[];
  onConfirmFact: (id: string) => void;
  onSignOffAll: () => void;
  /** Jump link: back to the facts board, landing on this fact's card. */
  onJumpToFact: (id: string) => void;
  /** The gate is met and the human pressed file — go to the filing step. */
  onProceed: () => void;
  /**
   * The return computes to a balance payable. A return filed with tax
   * outstanding is defective u/s 139(9), so while this is set the file button
   * becomes "Pay outstanding tax (Challan 280)" and opens the challan instead.
   */
  onPayOutstanding?: () => void;
  /** The facts page shows the checklist only; the check page shows the finish only. */
  showChecklist?: boolean;
  showFinish?: boolean;
}

function CheckRow({
  done,
  onTick,
  children,
}: {
  done: boolean;
  onTick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`check ${done ? "done" : ""}`}
      role="checkbox"
      aria-checked={done}
      tabIndex={0}
      onClick={onTick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTick();
        }
      }}
    >
      <div className="box">
        <svg viewBox="0 0 19 19" aria-hidden="true">
          <path d="M4 10 l3.6 3.6 L15.5 5.5" />
        </svg>
      </div>
      <div className="txt">{children}</div>
    </div>
  );
}

export default function BeforeFiling({
  persona,
  breakdown,
  t,
  lang,
  mode,
  confirmedIds,
  onConfirmFact,
  onSignOffAll,
  onJumpToFact,
  onProceed,
  onPayOutstanding,
  showChecklist = true,
  showFinish = true,
}: BeforeFilingProps) {
  const items = [...persona.facts, ...persona.taxPaid, ...persona.claims];
  const isDone = (id: string) => confirmedIds.includes(id);

  const remaining = items.filter((i) => !isDone(i.id)).length;
  const ready = remaining === 0;

  const outcomePositive = breakdown.refundOrDue >= 0;
  // Payable, and the caller can take a challan: the statutory route is to pay
  // first. The confirmation gate still applies to filing itself afterwards.
  const mustPayFirst = breakdown.refundOrDue < 0 && Boolean(onPayOutstanding);

  return (
    <section className="print:hidden">
      <div className="divider">
        <svg width="70" height="18" viewBox="0 0 70 18" aria-hidden="true">
          <path
            d="M0 9 C 12 9, 12 2, 24 2 S 36 16, 48 16 S 60 9, 70 9"
            fill="none"
            stroke="var(--brick)"
            strokeWidth="2"
          />
        </svg>
        <span className="label">{t.checklist.divider}</span>
        <div className="line" />
      </div>

      {showChecklist && mode === "simple" && (
        <div className="checklist">
          {items.map((item) => (
            <CheckRow
              key={item.id}
              done={isDone(item.id)}
              onTick={() => {
                if (!isDone(item.id)) onConfirmFact(item.id);
              }}
            >
              {t.checklist.itemBefore}
              <a
                className="jump"
                href="#facts"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // a jump must never tick its own row (D13 §7)
                  onJumpToFact(item.id);
                }}
              >
                <b>{localize(item.label, lang)}</b>
              </a>
              {t.checklist.itemAfter}
            </CheckRow>
          ))}
        </div>
      )}
      {showChecklist && mode === "full" && (
        <div className="checklist">
          <CheckRow
            done={ready}
            onTick={() => {
              if (!ready) onSignOffAll();
            }}
          >
            {t.signoff.declaration}
          </CheckRow>
        </div>
      )}

      {showFinish && (
      <div className="finish">
        <div>
          <div className="k">{outcomePositive ? t.check.refundDue : t.check.balanceDue}</div>
          <div className="big" style={outcomePositive ? undefined : { color: "var(--out)" }}>
            <AnimatedAmount value={Math.abs(breakdown.refundOrDue)} lang={lang} />
          </div>
          <div className="note">
            {mustPayFirst
              ? localize("A return filed with tax outstanding is defective under section 139(9). Pay the balance first; filing unlocks once nothing is due.", lang)
              : ready
                ? t.checklist.noteReady
                : t.checklist.noteLocked}
          </div>
        </div>
        {mustPayFirst ? (
          <button
            className="file"
            data-action="pay-outstanding"
            style={{ background: "var(--out)" }}
            onClick={onPayOutstanding}
          >
            {localize("Pay outstanding tax (Challan 280)", lang)}
            <span className="pg" />
          </button>
        ) : (
          <button className="file" disabled={!ready} onClick={onProceed}>
            {ready ? t.checklist.fileBtn : t.checklist.lockedBtn(remaining)}
            <span className="pg" />
          </button>
        )}
      </div>
      )}
    </section>
  );
}
