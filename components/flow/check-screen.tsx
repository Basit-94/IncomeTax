"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Info } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { formatMoney } from "../../lib/money";
import { computeForPersona } from "../../lib/return/compute";
import type { TaxBreakdown } from "../../lib/engine/types";
import { localize } from "../mock-i18n";

interface CheckScreenProps {
  persona: Persona;
  t: Dict;
  lang: Lang;
  regime: "new" | "old";
}

/**
 * The whole return on one screen — the CA audit view. Dense and complete by
 * design: income − standard deduction − claims = taxable → slab tax →
 * rebate → cess → TDS → refund/due. Every line opens to its source facts
 * and a plain-language line answering "what is this?".
 * Deliberate weight here; nothing flickers.
 */
export default function CheckScreen({ persona, t, lang, regime }: CheckScreenProps) {
  const b: TaxBreakdown = computeForPersona(persona, regime);
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => setOpen(open === id ? null : id);

  const Row = ({
    id,
    label,
    value,
    explain,
    children,
    tone = "default",
    big = false,
  }: {
    id: string;
    label: string;
    value: string;
    explain?: React.ReactNode;
    children?: React.ReactNode;
    tone?: "default" | "money" | "alarm" | "muted";
    big?: boolean;
  }) => {
    const isOpen = open === id;
    return (
      <div className={`border-b border-line last:border-b-0 ${big ? "" : ""}`}>
        <button
          onClick={() => toggle(id)}
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between gap-3 py-3 text-left group"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {isOpen ? (
              <ChevronDown size={13} className="text-ink-3 shrink-0" />
            ) : (
              <ChevronRight size={13} className="text-ink-3 shrink-0 group-hover:text-money" />
            )}
            <span
              className={`text-sm ${
                tone === "money"
                  ? "font-bold text-navy"
                  : tone === "muted"
                  ? "text-ink-2"
                  : "font-medium text-ink"
              }`}
            >
              {label}
            </span>
          </span>
          <span
            className={`tabular whitespace-nowrap ${
              big
                ? `text-lg font-extrabold ${tone === "money" ? "text-money" : tone === "alarm" ? "text-alarm" : "text-navy"}`
                : `text-sm font-semibold ${tone === "money" ? "text-money" : tone === "alarm" ? "text-alarm" : "text-ink"}`
            }`}
          >
            {value}
          </span>
        </button>
        {isOpen && (
          <div className="pb-4 pl-5 pr-1 space-y-3 animate-fade">
            {explain && (
              <p className="flex items-start gap-1.5 text-xs text-ink-2 leading-relaxed">
                <Info size={12} className="text-money mt-0.5 shrink-0" />
                <span>{explain}</span>
              </p>
            )}
            {children}
          </div>
        )}
      </div>
    );
  };

  const FactList = ({ ids }: { ids: string[] }) => {
    const rows = persona.facts.filter((f) => ids.includes(f.kind));
    if (rows.length === 0) return null;
    return (
      <div className="space-y-2">
              <span className="block text-[0.65rem] font-mono uppercase tracking-wider text-ink-3 font-bold">
          {t.check.fromFacts}
        </span>
        {rows.map((f) => (
          <div key={f.id} className="flex items-start justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="block truncate font-medium text-ink">{localize(f.label, lang)}</span>
              <span className="block text-[0.62rem] font-mono text-ink-3">
                {t.check.sourceRecord(f.provenance.reporter, f.provenance.statement, f.provenance.filedOn)}
              </span>
              <span className="block text-[0.62rem] text-ink-3">{t.check.statementMeaning(f.provenance.statement)}</span>
            </div>
            <span className="tabular text-ink font-semibold">{formatMoney(f.amount, lang)}</span>
          </div>
        ))}
      </div>
    );
  };

  const outcomePositive = b.refundOrDue >= 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.check.heading}</h2>
        <p className="text-sm text-ink-2 leading-relaxed">{t.check.sub}</p>
      </div>

      <div className="surface-panel divide-y divide-line px-4">
        <Row
          id="gross"
          label={t.check.grossIncome}
          value={formatMoney(b.grossIncome, lang)}
          explain={t.check.explainGross}
        >
          <FactList ids={["salary", "interest", "dividend", "capital_gains", "rent", "other"]} />
        </Row>

        {b.standardDeduction > 0 && (
          <Row
            id="std"
            label={t.check.standardDeduction}
            value={`− ${formatMoney(b.standardDeduction, lang)}`}
            tone="muted"
            explain={t.check.explainStd(formatMoney(b.standardDeduction, lang))}
          />
        )}

        <Row
          id="deductions"
          label={t.check.deductionsLine}
          value={`− ${formatMoney(b.totalDeductions, lang)}`}
          tone="muted"
          explain={
            regime === "new" && persona.claims.length > 0 && b.totalDeductions === 0
              ? t.check.newRegimeClaimsZero
              : t.check.explainDeductions
          }
        >
          {regime === "new" && persona.claims.length > 0 && b.totalDeductions === 0 && (
            <p className="text-xs leading-relaxed text-ink-2">{t.check.newRegimeClaimsZero}</p>
          )}
          {persona.claims.length > 0 ? (
            <div className="space-y-2">
              {persona.claims.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-ink">{localize(c.label, lang)}</span>
                    <span className="block text-[0.62rem] font-mono text-ink-3">{t.check.sectionMeaning(c.section)}</span>
                  </div>
                  <span className="tabular text-ink font-semibold">{formatMoney(c.amount, lang)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </Row>

        <Row
          id="taxable"
          label={t.check.taxableIncome}
          value={formatMoney(b.taxableIncome, lang)}
          explain={t.check.explainTaxable}
        />

        <Row
          id="slab"
          label={t.check.slabTax}
          value={formatMoney(b.taxBeforeRebate, lang)}
          explain={t.check.explainSlab}
        >
          <div className="space-y-1.5">
            {b.slabBreakdown.map((slice, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1 text-ink-2">
                  <FileText size={11} className="text-ink-3" />
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
        </Row>

        {b.rebate87A > 0 && (
          <Row
            id="rebate"
            label={
              b.marginalReliefApplied
                ? `${t.check.rebate87A} (${localize("marginal relief", lang)})`
                : t.check.rebate87A
            }
            value={`− ${formatMoney(b.rebate87A, lang)}`}
            tone="money"
            explain={t.check.explainRebate(formatMoney(b.rebate87A, lang))}
          />
        )}

        {b.cess > 0 && (
          <Row
            id="cess"
            label={t.check.cess}
            value={formatMoney(b.cess, lang)}
            explain={t.check.explainCess}
          />
        )}

        <Row
          id="total"
          label={t.check.totalTax}
          value={formatMoney(b.totalTax, lang)}
        />

        <Row
          id="tds"
          label={t.check.tdsCredits}
          value={`− ${formatMoney(b.tdsCredits, lang)}`}
          explain={t.check.explainTds}
        >
          <div className="space-y-2">
            {persona.taxPaid.map((tp) => (
              <div key={tp.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="block truncate font-medium text-ink">{localize(tp.label, lang)}</span>
                  <span className="block text-[0.62rem] font-mono text-ink-3">
                    {tp.section} · {tp.provenance.reporter}
                  </span>
                  <span className="block text-[0.62rem] text-ink-3">{t.check.statementMeaning(tp.provenance.statement)}</span>
                </div>
                <span className="tabular text-ink font-semibold">{formatMoney(tp.amount, lang)}</span>
              </div>
            ))}
          </div>
        </Row>

        <Row
          id="outcome"
          label={outcomePositive ? t.check.refundDue : t.check.balanceDue}
          value={formatMoney(Math.abs(b.refundOrDue), lang)}
          tone={outcomePositive ? "money" : "alarm"}
          big
        />
      </div>
    </div>
  );
}
