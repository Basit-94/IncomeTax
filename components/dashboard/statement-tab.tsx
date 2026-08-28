"use client";

import React from "react";
import { Plus } from "lucide-react";
import type { Persona, Lang, IncomeFact, Provenance } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import type { Correction } from "../../lib/return/state";
import { localize } from "../mock-i18n";
import { TODAY } from "../../lib/personas";
import FactRow from "../fact-row";
import { NEW_REGIME_ALLOWED_SECTIONS } from "../../lib/engine/constants";

interface StatementTabProps {
  persona: Persona;
  lang: Lang;
  t: Dict;
  activeCorrectionByFact: Record<string, Correction>;
  confirmedIds: string[];
  isCustomPersona: boolean;
  onConfirmFact: (factId: string) => void;
  onDispute: (fact: Pick<IncomeFact, "id" | "amount">) => void;
  onUndoCorrection: (correctionId: string) => void;
  handleFactAmountChange: (factId: string, val: string) => void;
  handleClaimAmountChange: (claimId: string, val: string) => void;
  handleAddCustomIncome: () => void;
  /** T5.2/T5.3: Simple = read-then-confirm gate per card; Full = one sign-off. */
  mode?: "simple" | "full";
  /** SS4B CA finding 4: claim cards must say when the regime ignores them. */
  regime?: "new" | "old";
  onSignOffAll?: () => void;
}

const selfClaimProvenance = (label: string, returnLabel: string): Provenance => ({
  reporter: label,
  reporterKind: "self",
  identifier: returnLabel,
  filedOn: TODAY,
  statement: "self",
  onlyReporterCanFix: false,
});

/**
 * Intent-led source review. Income rows use FactRow with the confirm/correct
 * gesture; tax credits and claims use the same provenance shape so no money
 * figure appears as an unexplained orphan.
 */
export default function StatementTab({
  persona,
  lang,
  t,
  activeCorrectionByFact,
  confirmedIds,
  isCustomPersona,
  onConfirmFact,
  onDispute,
  onUndoCorrection,
  handleFactAmountChange: _handleFactAmountChange,
  handleClaimAmountChange: _handleClaimAmountChange,
  handleAddCustomIncome,
  mode = "simple",
  regime = "new",
  onSignOffAll,
}: StatementTabProps) {
  const full = mode === "full";
  const allMoney = [...persona.facts, ...persona.taxPaid, ...persona.claims];
  const totalFacts = allMoney.length;
  const done = allMoney.filter(
    (fact) => confirmedIds.includes(fact.id) || activeCorrectionByFact[fact.id],
  ).length;

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-money">{t.flow.facts}</p>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.file.checkThis}</h2>
        <p className="max-w-2xl text-base leading-relaxed text-ink-2">{t.file.subheading}</p>
      </div>

      <div className="recovery-callout flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-ink">{t.flow.confirmedCount(done, totalFacts)}</span>
        <span className="text-sm text-ink-2">{done === totalFacts ? t.flow.allConfirmed : t.file.onlyTheyCanFix(t.groups.fromWhere)}</span>
      </div>

      <section aria-labelledby="money-in-heading" className="space-y-3">
        <div className="divider" aria-hidden="true">
          <div className="line" />
          <span className="label">{t.groups.moneyIn} · {persona.facts.length}</span>
          <svg width="46" height="10" viewBox="0 0 46 10" aria-hidden="true"><path d="M2 6 C 10 2, 18 9, 26 5 S 40 4, 44 6" fill="none" stroke="var(--subtle-color)" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <div className="line" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <h3 id="money-in-heading" className="sr-only">{t.groups.moneyIn}</h3>
          {isCustomPersona && (
            <button onClick={handleAddCustomIncome} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line px-3 text-sm font-semibold text-money hover:border-money">
              <Plus size={14} aria-hidden="true" />
              {t.groups.addIncome}
            </button>
          )}
        </div>
        <div className="board">
          {persona.facts.map((fact, i) => {
            const correction = activeCorrectionByFact[fact.id];
            return (
              <FactRow
                key={fact.id}
                id={fact.id}
                index={i + 1}
                label={localize(fact.label, lang)}
                amount={fact.amount}
                provenance={fact.provenance}
                lang={lang}
                t={t}
                meaning={full ? undefined : (t.file.factMeaningByKind[fact.kind] ?? t.file.factMeaning)}
                confirmed={confirmedIds.includes(fact.id)}
                correction={correction}
                onConfirm={full ? undefined : () => onConfirmFact(fact.id)}
                onCorrect={() => onDispute(fact)}
                onUndo={correction ? () => onUndoCorrection(correction.id) : undefined}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="tax-paid-heading" className="space-y-3">
        <div className="divider" aria-hidden="true">
          <div className="line" />
          <span className="label">{t.groups.taxPaid} · {persona.taxPaid.length}</span>
          <svg width="46" height="10" viewBox="0 0 46 10" aria-hidden="true"><path d="M2 6 C 10 2, 18 9, 26 5 S 40 4, 44 6" fill="none" stroke="var(--subtle-color)" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <div className="line" />
        </div>
        <div>
          <h3 id="tax-paid-heading" className="sr-only">{t.groups.taxPaid}</h3>
          <p className="text-sm text-ink-2">{t.check.explainTds}</p>
        </div>
        <div className="board">
          {persona.taxPaid.length > 0 ? persona.taxPaid.map((tax, i) => (
            (() => {
              const correction = activeCorrectionByFact[tax.id];
              return (
            <FactRow
              key={tax.id}
              id={tax.id}
              index={persona.facts.length + i + 1}
              label={localize(tax.label, lang)}
              amount={tax.amount}
              provenance={tax.provenance}
              lang={lang}
              t={t}
              meaning={full ? undefined : t.file.factMeaning}
              confirmed={confirmedIds.includes(tax.id)}
              onConfirm={full ? undefined : () => onConfirmFact(tax.id)}
              correction={correction}
              onCorrect={() => onDispute(tax)}
              onUndo={correction ? () => onUndoCorrection(correction.id) : undefined}
            />
              );
            })()
          )) : (
            <div className="surface-panel p-5 text-sm text-ink-2">{t.deductions.sub}</div>
          )}
        </div>
      </section>

      <section aria-labelledby="claims-heading" className="space-y-3">
        <div>
          <h3 id="claims-heading" className="text-lg font-bold text-ink">{t.groups.deductionsClaimed}</h3>
          <p className="mt-1 text-sm text-ink-2">{t.deductions.sub}</p>
        </div>
        <div className="board">
          {persona.claims.length > 0 ? persona.claims.map((claim, i) => (
            (() => {
              const correction = activeCorrectionByFact[claim.id];
              return (
            <FactRow
              key={claim.id}
              id={claim.id}
              index={persona.facts.length + persona.taxPaid.length + i + 1}
              label={`${localize(claim.label, lang)} (${claim.section})`}
              amount={claim.amount}
              provenance={selfClaimProvenance(t.file.selfReported, t.file.returnLabel)}
              lang={lang}
              t={t}
              // Evidence status is substance, not vocabulary - a CA needs it too.
              meaning={claim.evidenceAttached ? t.deductions.evidenceAttached : t.deductions.evidenceMissing}
              // CA-4: a claim the regime ignores says so ON ITS FACE - signing
              // "correct and complete" over silently unused figures is exactly
              // the ambiguity the sign-off exists to remove.
              notice={
                regime === "new" && !NEW_REGIME_ALLOWED_SECTIONS.has(claim.section)
                  ? t.deductions.notAllowedNewRegime
                  : undefined
              }
              confirmed={confirmedIds.includes(claim.id)}
              onConfirm={full ? undefined : () => onConfirmFact(claim.id)}
              correction={correction}
              onCorrect={() => onDispute(claim)}
              onUndo={correction ? () => onUndoCorrection(correction.id) : undefined}
            />
              );
            })()
          )) : (
            <div className="surface-panel p-5 text-sm text-ink-2">{t.deductions.sub}</div>
          )}
        </div>
      </section>
      {full && onSignOffAll && (
        <section aria-labelledby="signoff-heading" className="surface-panel p-5 space-y-3">
          <h3 id="signoff-heading" className="text-base font-bold text-ink">{t.signoff.title}</h3>
          {done === totalFacts ? (
            /* Signed, not crossed off: full ink, no strike-through (DESIGN SS6). */
            <p className="flex items-center gap-2 text-sm font-semibold text-money">
              <span aria-hidden="true">{"✓"}</span> {t.signoff.signed}
            </p>
          ) : (
            <>
              <p className="max-w-2xl text-sm leading-relaxed text-ink">{t.signoff.declaration}</p>
              <p className="max-w-2xl text-xs leading-relaxed text-ink-3">{t.signoff.hint}</p>
              <button
                type="button"
                onClick={onSignOffAll}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
              >
                {t.signoff.action}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
