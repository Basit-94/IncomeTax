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

import React, { useState } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
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
      className={`check ${done ?"done" : ""}`}
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
  const [nilReturnConfirmed, setNilReturnConfirmed] = useState(false);

  const items = [...persona.facts, ...persona.taxPaid, ...persona.claims];
  const isDone = (id: string) => confirmedIds.includes(id);

  const hasDeclaredIncome = persona.facts.length > 0 && persona.facts.some((f) => f.amount > 0);
  const hasLegalName = Boolean(persona.name && persona.name.trim().length > 0 && !/^Citizen\s+\d{4}$/i.test(persona.name));
  const isStatutoryValid = (hasDeclaredIncome || nilReturnConfirmed) && hasLegalName;

  const remaining = items.filter((i) => !isDone(i.id)).length;
  const ready = remaining === 0 && isStatutoryValid;

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

      {/* Statutory validation warnings */}
      {!hasDeclaredIncome && (
        <div className="mb-5 rounded-[20px] bg-amber-500/10 border border-amber-500/30 p-4 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-start">
              <h4 className="text-sm font-bold text-ink">
                {localize("No income declared for this financial year", lang)}
              </h4>
              <p className="text-xs text-ink-2 leading-relaxed">
                {localize("An Income Tax Return cannot be filed with blank figures unless you explicitly declare a statutory NIL return under Section 139.", lang)}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={nilReturnConfirmed}
                onChange={(e) => setNilReturnConfirmed(e.target.checked)}
                className="rounded border-line size-4 accent-emerald-600 cursor-pointer"
              />
              <span>{localize("Declare Statutory NIL Return (u/s 139) — Gross income below ₹3,00,000", lang)}</span>
            </label>
            <button
              type="button"
              onClick={() => onJumpToFact("salary")}
              className="text-xs font-bold text-money hover:underline cursor-pointer self-start sm:self-auto"
            >
              {localize("+ Add Income Figures", lang)} →
            </button>
          </div>
        </div>
      )}

      {!hasLegalName && (
        <div className="mb-5 rounded-[20px] bg-red-500/10 border border-red-500/30 p-4 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>{localize("Legal Name as per PAN is required before filing.", lang)}</span>
          </div>
          <button
            type="button"
            onClick={() => onJumpToFact("salary")}
            className="text-xs font-bold text-red-700 dark:text-red-300 underline cursor-pointer shrink-0"
          >
            {localize("Provide Name", lang)} →
          </button>
        </div>
      )}

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
          {/* Three states: a cleared challan lands on exactly nil, which is
              neither a refund nor a balance. */}
          <div className="k">
            {breakdown.refundOrDue === 0
              ? t.file.outcomeOwesNothing
              : outcomePositive
                ? t.check.refundDue
                : t.check.balanceDue}
          </div>
          <div className="big" style={outcomePositive ? undefined : { color: "var(--out)" }}>
            <AnimatedAmount value={Math.abs(breakdown.refundOrDue)} lang={lang} />
          </div>
          <div className="note">
            {mustPayFirst
              ? localize("A return filed with tax outstanding is defective under section 139(9). Pay the balance first; filing unlocks once nothing is due.", lang)
              : !hasLegalName
                ? localize("Enter full legal name as per PAN before filing can unlock.", lang)
                : !hasDeclaredIncome && !nilReturnConfirmed
                ? localize("Declare income or confirm statutory NIL return (u/s 139) to unlock filing.", lang)
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
            {!hasLegalName
              ? localize("Enter Legal Name to file", lang)
              : !hasDeclaredIncome && !nilReturnConfirmed
              ? localize("Declare Income / NIL Return", lang)
              : ready
              ? t.checklist.fileBtn
              : t.checklist.lockedBtn(remaining)}
            <span className="pg" />
          </button>
        )}
      </div>
      )}
    </section>
  );
}
