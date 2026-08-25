"use client";

import React from "react";
import { Plus } from "lucide-react";
import type { Persona, Lang, IncomeFact, Provenance } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import type { Correction } from "../../lib/return/state";
import { localize } from "../mock-i18n";
import { TODAY } from "../../lib/personas";
import FactRow from "../fact-row";

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
}: StatementTabProps) {
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
        <div className="flex items-center justify-between gap-3">
          <h3 id="money-in-heading" className="text-lg font-bold text-ink">{t.groups.moneyIn}</h3>
          {isCustomPersona && (
            <button onClick={handleAddCustomIncome} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line px-3 text-sm font-semibold text-money hover:border-money">
              <Plus size={14} aria-hidden="true" />
              {t.groups.addIncome}
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {persona.facts.map((fact) => {
            const correction = activeCorrectionByFact[fact.id];
            return (
              <FactRow
                key={fact.id}
                id={fact.id}
                label={localize(fact.label, lang)}
                amount={fact.amount}
                provenance={fact.provenance}
                lang={lang}
                t={t}
                meaning={t.file.factMeaning}
                confirmed={confirmedIds.includes(fact.id)}
                correction={correction}
                onConfirm={() => onConfirmFact(fact.id)}
                onCorrect={() => onDispute(fact)}
                onUndo={correction ? () => onUndoCorrection(correction.id) : undefined}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="tax-paid-heading" className="space-y-3">
        <div>
          <h3 id="tax-paid-heading" className="text-lg font-bold text-ink">{t.groups.taxPaid}</h3>
          <p className="mt-1 text-sm text-ink-2">{t.check.explainTds}</p>
        </div>
        <div className="grid gap-3">
          {persona.taxPaid.length > 0 ? persona.taxPaid.map((tax) => (
            (() => {
              const correction = activeCorrectionByFact[tax.id];
              return (
            <FactRow
              key={tax.id}
              id={tax.id}
              label={localize(tax.label, lang)}
              amount={tax.amount}
              provenance={tax.provenance}
              lang={lang}
              t={t}
              meaning={t.file.factMeaning}
              confirmed={confirmedIds.includes(tax.id)}
              onConfirm={() => onConfirmFact(tax.id)}
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
        <div className="grid gap-3">
          {persona.claims.length > 0 ? persona.claims.map((claim) => (
            (() => {
              const correction = activeCorrectionByFact[claim.id];
              return (
            <FactRow
              key={claim.id}
              id={claim.id}
              label={`${localize(claim.label, lang)} (${claim.section})`}
              amount={claim.amount}
              provenance={selfClaimProvenance(t.file.selfReported, t.file.returnLabel)}
              lang={lang}
              t={t}
              meaning={claim.evidenceAttached ? t.deductions.evidenceAttached : t.deductions.evidenceMissing}
              confirmed={confirmedIds.includes(claim.id)}
              onConfirm={() => onConfirmFact(claim.id)}
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
    </div>
  );
}
