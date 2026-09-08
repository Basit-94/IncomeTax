"use client";

import React, { useState } from "react";
import { Plus, FileText, User, X } from "lucide-react";
import type { Persona, Lang, IncomeFact, IncomeKind, Provenance } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import type { Correction } from "../../lib/return/state";
import { localize } from "../mock-i18n";
import { TODAY } from "../../lib/personas";
import FactRow from "../fact-row";
import { Munshi } from "../brand/munshi";
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
  onSaveInitialIncome?: (data: {
    legalName?: string;
    employer: string;
    grossSalary: number;
    tds: number;
    interest: number;
  }) => void;
  onAddCustomItem?: (item: {
    label: string;
    amount: number;
    kind: IncomeKind;
  }) => void;
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
  onSaveInitialIncome,
  onAddCustomItem,
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

  const [guidedName, setGuidedName] = useState(
    persona.name && !/^Citizen\s+\d{4}$/i.test(persona.name) && !/^Real User$/i.test(persona.name)
      ? persona.name
      : ""
  );
  const [guidedEmployer, setGuidedEmployer] = useState("");
  const [guidedSalary, setGuidedSalary] = useState("");
  const [guidedTds, setGuidedTds] = useState("");
  const [guidedInterest, setGuidedInterest] = useState("");

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customKind, setCustomKind] = useState<IncomeFact["kind"]>("salary");

  const handleSaveGuided = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveInitialIncome) return;
    const salaryNum = Number(guidedSalary.replace(/[^0-9]/g, "")) || 0;
    const tdsNum = Number(guidedTds.replace(/[^0-9]/g, "")) || 0;
    const interestNum = Number(guidedInterest.replace(/[^0-9]/g, "")) || 0;
    onSaveInitialIncome({
      legalName: guidedName.trim() || undefined,
      employer: guidedEmployer.trim() || "Primary Employer",
      grossSalary: salaryNum,
      tds: tdsNum,
      interest: interestNum,
    });
  };

  const handleSaveCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(customAmount.replace(/[^0-9]/g, "")) || 0;
    if (amountNum <= 0) return;
    if (onAddCustomItem) {
      onAddCustomItem({
        label: customLabel.trim() || "Other Income",
        amount: amountNum,
        kind: customKind,
      });
      setIsAddingCustom(false);
      setCustomLabel("");
      setCustomAmount("");
    } else {
      handleAddCustomIncome();
      setIsAddingCustom(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[.08em] text-money">{t.flow.facts}</p>
        <h2 className="max-w-2xl text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] text-ink sm:text-[34px]">{t.file.checkThis}</h2>
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">{t.file.subheading}</p>
      </div>

      <div className="recovery-callout flex flex-col gap-2 px-[18px] py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-bold text-amber-ink">{t.flow.confirmedCount(done, totalFacts)}</span>
        <span className="text-sm text-amber-ink/80">{done === totalFacts ? t.flow.allConfirmed : t.file.onlyTheyCanFix(t.groups.fromWhere)}</span>
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
            <button
              onClick={() => {
                if (onAddCustomItem) {
                  setIsAddingCustom(true);
                } else {
                  handleAddCustomIncome();
                }
              }}
              className="glass-flat inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-money hover:border-money cursor-pointer"
            >
              <Plus size={14} aria-hidden="true" />
              {t.groups.addIncome}
            </button>
          )}
        </div>

        {/* Custom income row adder form */}
        {isAddingCustom && (
          <div className="p-4 rounded-2xl bg-paper border border-line shadow-sm space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">{localize("Add Income Source", lang)}</span>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-ink-3 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomItem} className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">{localize("Category", lang)}</label>
                <select
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value as IncomeKind)}
                  className="w-full h-9 px-2 text-xs rounded-xl border border-line bg-paper text-ink"
                >
                  <option value="salary">{localize("Salary", lang)}</option>
                  <option value="other">{localize("Freelance / Consulting", lang)}</option>
                  <option value="interest">{localize("Interest Income", lang)}</option>
                  <option value="dividend">{localize("Dividend Income", lang)}</option>
                  <option value="capital_gains">{localize("Capital Gains", lang)}</option>
                  <option value="rent">{localize("Rental Income", lang)}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">{localize("Description", lang)}</label>
                <input
                  type="text"
                  required
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Contract Fee"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-line bg-paper text-ink"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-2">{localize("Amount (₹)", lang)}</label>
                <input
                  type="text"
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 50,000"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-line bg-paper text-ink font-mono"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-3 py-1.5 text-xs text-ink-2 hover:text-ink cursor-pointer"
                >
                  {localize("Cancel", lang)}
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {localize("Add Fact", lang)}
                </button>
              </div>
            </form>
          </div>
        )}

        <div id="manual-income-section" className="board scroll-mt-6">
          {persona.facts.length === 0 ? (
            <div className="surface-panel rounded-2xl p-5 space-y-4 border border-line">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileText size={16} className="text-money" />
                  <span>{localize("Declare Income & Tax Figures", lang)}</span>
                </h4>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {localize("No tax figures imported yet. Enter your income details manually below to compute your tax liability and refund.", lang)}
                </p>
              </div>

              <form onSubmit={handleSaveGuided} className="grid gap-3 sm:grid-cols-2 pt-2">
                {(!persona.name || /^Citizen\s+\d{4}$/i.test(persona.name) || /^Real User$/i.test(persona.name)) && (
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-ink-2">
                      {localize("Full Legal Name (as per PAN)", lang)} *
                    </label>
                    <input
                      type="text"
                      required
                      value={guidedName}
                      onChange={(e) => setGuidedName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full h-10 px-3 rounded-xl border border-line bg-paper text-sm text-ink focus:outline-none focus:border-money"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-2">
                    {localize("Employer / Organization Name", lang)}
                  </label>
                  <input
                    type="text"
                    value={guidedEmployer}
                    onChange={(e) => setGuidedEmployer(e.target.value)}
                    placeholder="e.g. Infosys Ltd"
                    className="w-full h-10 px-3 rounded-xl border border-line bg-paper text-sm text-ink focus:outline-none focus:border-money"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-2">
                    {localize("Gross Annual Salary (₹)", lang)}
                  </label>
                  <input
                    type="text"
                    value={guidedSalary}
                    onChange={(e) => setGuidedSalary(e.target.value)}
                    placeholder="e.g. 12,00,000"
                    className="w-full h-10 px-3 rounded-xl border border-line bg-paper text-sm text-ink font-mono focus:outline-none focus:border-money"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-2">
                    {localize("TDS Deducted by Employer (₹)", lang)}
                  </label>
                  <input
                    type="text"
                    value={guidedTds}
                    onChange={(e) => setGuidedTds(e.target.value)}
                    placeholder="e.g. 85,000"
                    className="w-full h-10 px-3 rounded-xl border border-line bg-paper text-sm text-ink font-mono focus:outline-none focus:border-money"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-2">
                    {localize("Savings / Deposit Interest (₹)", lang)}
                  </label>
                  <input
                    type="text"
                    value={guidedInterest}
                    onChange={(e) => setGuidedInterest(e.target.value)}
                    placeholder="e.g. 24,000"
                    className="w-full h-10 px-3 rounded-xl border border-line bg-paper text-sm text-ink font-mono focus:outline-none focus:border-money"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="btn-primary px-5 h-10 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {localize("Save Figures & Compute Tax", lang)} →
                  </button>
                </div>
              </form>
            </div>
          ) : (
            persona.facts.map((fact, i) => {
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
            })
          )}
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
        <section aria-labelledby="signoff-heading" className="ink-surface rounded-3xl p-6 space-y-3 relative overflow-hidden">
          <div className="absolute right-6 top-4 hidden sm:block" aria-hidden="true"><Munshi size={56} /></div>
          <h3 id="signoff-heading" className="text-lg font-extrabold tracking-[-0.02em] text-on-ink">{t.signoff.title}</h3>
          {done === totalFacts ? (
            /* Signed, not crossed off: full ink, no strike-through (DESIGN SS6). */
            <p className="flex items-center gap-2 text-sm font-semibold text-[#5EE6B0]">
              <span aria-hidden="true">{"✓"}</span> {t.signoff.signed}
            </p>
          ) : (
            <>
              <p className="max-w-2xl text-sm leading-relaxed text-on-ink">{t.signoff.declaration}</p>
              <p className="max-w-2xl text-xs leading-relaxed text-on-ink/70">{t.signoff.hint}</p>
              <button
                type="button"
                onClick={onSignOffAll}
                className="btn-primary inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] transition-colors"
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
