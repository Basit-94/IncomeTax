"use client";

import React from "react";
import { Plus, Info, CheckCircle2, RotateCcw } from "lucide-react";
import type { Persona, Lang, IncomeFact } from "../../lib/types";
import type { Correction } from "../../lib/return/state";
import type { Dict } from "../../lib/i18n";
import { formatMoney, formatDate } from "../../lib/money";
import { localize } from "../mock-i18n";
import ScrollScatter3D from "../scroll-scatter";

interface StatementTabProps {
  persona: Persona;
  lang: Lang;
  t: Dict;
  /** Latest non-reverted correction per fact id (from lib/return state). */
  activeCorrectionByFact: Record<string, Correction>;
  confirmedIds: string[];
  scrollProgress: number;
  isCustomPersona: boolean;
  onConfirmFact: (factId: string) => void;
  onDispute: (fact: IncomeFact) => void;
  onUndoCorrection: (correctionId: string) => void;
  handleFactAmountChange: (factId: string, val: string) => void;
  handleClaimAmountChange: (claimId: string, val: string) => void;
  handleAddCustomIncome: () => void;
}

/**
 * The facts review screen. Views are named for intent — "Money coming in",
 * "Tax already paid for you", "Deductions you claim" — never portal structure.
 * Every income fact carries exactly one citizen action pair: confirm it, or
 * correct it (with a reason); a correction can be taken back until filing.
 */
export default function StatementTab({
  persona,
  lang,
  t,
  activeCorrectionByFact,
  confirmedIds,
  scrollProgress,
  isCustomPersona,
  onConfirmFact,
  onDispute,
  onUndoCorrection,
  handleFactAmountChange,
  handleClaimAmountChange,
  handleAddCustomIncome,
}: StatementTabProps) {
  const totalFacts = persona.facts.length;
  const done = persona.facts.filter(
    (f) => confirmedIds.includes(f.id) || activeCorrectionByFact[f.id],
  ).length;

  return (
    <div className="space-y-6 relative pl-6" style={{ perspective: 1000 }}>
      {/* Scroll-bound SVG Connector Line */}
      <div className="absolute left-[7px] top-4 bottom-4 w-[3px] pointer-events-none hidden md:block">
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <line x1="1.5" y1="0" x2="1.5" y2="100%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
          <line
            x1="1.5"
            y1="0"
            x2="1.5"
            y2={`${scrollProgress * 100}%`}
            stroke="var(--color-money)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* GROUP 1: MONEY COMING IN */}
      <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-2 border-b border-line pb-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 font-bold">
            {t.groups.moneyIn}
          </h3>
          <span className={`text-xs font-mono font-semibold ${done === totalFacts ? "text-money" : "text-warn"}`}>
            {done === totalFacts ? t.flow.allConfirmed : t.flow.confirmedCount(done, totalFacts)}
          </span>
          {isCustomPersona && (
            <button
              onClick={handleAddCustomIncome}
              className="text-xs text-money hover:text-money-deep font-semibold flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>{t.groups.addIncome}</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {persona.facts.map((fact) => {
            const correction = activeCorrectionByFact[fact.id];
            const confirmed = confirmedIds.includes(fact.id);
            return (
              <div
                key={fact.id}
                className={`bg-slate-50 border rounded-xl p-4 flex flex-col justify-between gap-3 text-left ${
                  correction ? "border-warn/50 bg-warn-soft/20" : "border-line"
                }`}
              >
                <ScrollScatter3D xOffset={-100} yOffset={-20} zOffset={120} rotateXOffset={15} rotateYOffset={-20} rotateZOffset={-5}>
                  <div className="space-y-1 w-full">
                    <span className="text-sm font-semibold text-ink block">
                      {localize(fact.label, lang)}
                    </span>
                    {/* Identifier demoted into provenance detail */}
                    <div className="flex items-start gap-1 text-[0.65rem] text-ink-3 leading-snug pt-0.5">
                      <Info size={11} className="text-ink-3 mt-0.5 shrink-0" />
                      <span>
                        {t.file.reportedBy(fact.provenance.reporter, formatDate(fact.provenance.filedOn, lang))}
                        {fact.provenance.identifier ? ` · ${t.file.underIdentifier(fact.provenance.identifier)}` : ""}
                      </span>
                    </div>
                  </div>
                </ScrollScatter3D>

                <ScrollScatter3D xOffset={100} yOffset={20} zOffset={-120} rotateXOffset={-15} rotateYOffset={20} rotateZOffset={5}>
                  <div className="text-right space-y-1">
                    {isCustomPersona && !correction ? (
                      <input
                        type="text"
                        value={fact.amount}
                        onChange={(e) => handleFactAmountChange(fact.id, e.target.value)}
                        className="bg-white border border-line rounded px-2.5 py-1 max-w-[140px] text-xs font-mono font-bold text-ink text-right focus:outline-none focus:border-money tabular"
                        aria-label={localize(fact.label, lang)}
                      />
                    ) : (
                      <span className={`block text-base font-bold tabular ${correction ? "text-warn" : "text-ink"}`}>
                        {formatMoney(correction ? (correction.next as number) : fact.amount, lang)}
                      </span>
                    )}

                    {correction && (
                      <>
                        <span className="block text-[0.7rem] font-mono text-warn font-semibold">
                          {t.file.disputeHeading} → {formatMoney(correction.next as number, lang)}
                        </span>
                        <button
                          onClick={() => onUndoCorrection(correction.id)}
                          className="inline-flex items-center gap-1 text-[0.7rem] text-ink-2 hover:text-navy font-semibold transition-colors"
                        >
                          <RotateCcw size={11} />
                          {t.flow.undoOne}
                        </button>
                      </>
                    )}
                  </div>
                </ScrollScatter3D>

                {!correction && persona.refund.state === "not_filed" && (
                  <div className="border-t border-line/60 pt-2 flex items-center justify-end gap-3">
                    <button
                      onClick={() => onDispute(fact)}
                      className="text-[0.75rem] text-alarm hover:text-alarm-deep font-semibold transition-colors"
                    >
                      {t.common.noThisIsWrong}
                    </button>
                    <button
                      onClick={() => onConfirmFact(fact.id)}
                      disabled={confirmed}
                      className={`inline-flex items-center gap-1 text-[0.75rem] font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                        confirmed
                          ? "bg-money-soft text-money cursor-default"
                          : "bg-money hover:bg-money-deep text-paper"
                      }`}
                    >
                      {confirmed && <CheckCircle2 size={12} />}
                      {t.common.yesThatsRight}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* GROUP 2: TAX ALREADY PAID FOR YOU */}
      <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
          {t.groups.taxPaid}
        </h3>

        <div className="space-y-3">
          {persona.taxPaid.map((tds) => (
            <div
              key={tds.id}
              className="bg-slate-50 border border-line rounded-xl p-4 flex justify-between items-start text-left gap-3 overflow-hidden"
            >
              <ScrollScatter3D xOffset={-90} yOffset={-15} zOffset={100} rotateXOffset={10} rotateYOffset={-15} rotateZOffset={-3}>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-ink">{localize(tds.label, lang)}</span>
                  {/* Section number demoted to provenance detail */}
                  <span className="block text-[0.65rem] font-mono text-ink-3">
                    {tds.section} · {tds.provenance.reporter}
                  </span>
                </div>
              </ScrollScatter3D>

              <ScrollScatter3D xOffset={90} yOffset={15} zOffset={-100} rotateXOffset={-10} rotateYOffset={15} rotateZOffset={3}>
                <span className="text-base font-bold text-money tabular whitespace-nowrap">
                  {formatMoney(tds.amount, lang)}
                </span>
              </ScrollScatter3D>
            </div>
          ))}
        </div>
      </div>

      {/* GROUP 3: DEDUCTIONS YOU CLAIM */}
      <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
          {t.groups.deductionsClaimed}
        </h3>

        {persona.claims.length === 0 ? (
          <p className="text-xs text-ink-3 leading-relaxed py-2">{t.deductions.sub}</p>
        ) : (
          <div className="space-y-3">
            {persona.claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-slate-50 border border-line rounded-xl p-4 flex justify-between items-start text-left gap-3 overflow-hidden"
              >
                <ScrollScatter3D xOffset={-90} yOffset={-15} zOffset={100} rotateXOffset={10} rotateYOffset={-15} rotateZOffset={-3}>
                  <div className="space-y-1 max-w-full">
                    <span className="text-sm font-semibold text-ink block leading-tight">
                      {localize(claim.label, lang)}
                    </span>
                    <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                      <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-3 px-1.5 py-0.5 rounded">
                        {claim.section}
                      </span>
                      <span
                        className={`text-[0.65rem] font-mono px-1.5 py-0.5 rounded ${
                          claim.evidenceAttached
                            ? "bg-money-soft text-money"
                            : "bg-warn-soft text-warn"
                        }`}
                      >
                        {claim.evidenceAttached
                          ? t.deductions.evidenceAttached
                          : t.deductions.evidenceMissing}
                      </span>
                    </div>
                  </div>
                </ScrollScatter3D>

                <ScrollScatter3D xOffset={90} yOffset={15} zOffset={-100} rotateXOffset={-10} rotateYOffset={15} rotateZOffset={3}>
                  {isCustomPersona ? (
                    <div className="flex items-center space-x-1 bg-white border border-line rounded px-2.5 py-1 max-w-[140px]">
                      <span className="text-xs text-ink-2">₹</span>
                      <input
                        type="text"
                        value={claim.amount}
                        onChange={(e) => handleClaimAmountChange(claim.id, e.target.value)}
                        className="bg-transparent border-none text-xs font-mono font-bold text-ink w-full focus:outline-none text-right"
                      />
                    </div>
                  ) : (
                    <span className="text-base font-bold text-ink tabular whitespace-nowrap">
                      {formatMoney(claim.amount, lang)}
                    </span>
                  )}
                </ScrollScatter3D>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
