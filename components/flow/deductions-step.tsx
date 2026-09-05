"use client";

import React, { useState } from "react";
import { Trash2, HelpCircle } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { formatMoney } from "../../lib/money";
import { fireMiniBurst } from "../ambient/mini-burst";
import { claimWorth, capFor } from "../../lib/return/compute";
import { localize } from "../mock-i18n";

interface DeductionsStepProps {
  persona: Persona;
  t: Dict;
  lang: Lang;
  regime: "new" | "old";
  onAddClaim: (section: string, amount: number) => void;
  onRemoveClaim: (claimId: string) => void;
  onClaimAmountChange: (claimId: string, amount: number) => void;
}

/**
 * Plain-language eligibility questions, asked only when nothing in the
 * reported facts already answers them. Worth figures are computed BY the
 * engine (claimWorth) or read from engine constants (caps) — never invented
 * here. Under the new regime most Chapter VI-A claims do nothing, and this
 * screen says so out loud instead of letting the citizen guess.
 */
export default function DeductionsStep({
  persona,
  t,
  lang,
  regime,
  onAddClaim,
  onRemoveClaim,
  onClaimAmountChange,
}: DeductionsStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasSection = (section: string) =>
    persona.claims.some((c) => c.section === section);

  const questions: {
    section: string;
    q: string;
    why: string;
    defaultAmount: number;
    cap?: number;
  }[] = [];
  if (!hasSection("80GG")) {
    const cap = capFor("80GG");
    questions.push({
      section: "80GG",
      q: t.deductions.askRentQ,
      why: t.deductions.askRentWhy,
      defaultAmount: cap ?? 0,
      cap,
    });
  }
  if (!hasSection("80D")) {
    questions.push({
      section: "80D",
      q: t.deductions.askHealthQ,
      why: t.deductions.askHealthWhy,
      defaultAmount: 0,
    });
  }
  if (!hasSection("80C") && !hasSection("80CCC")) {
    const cap = capFor("80C");
    questions.push({
      section: "80C",
      q: t.deductions.ask80cQ,
      why: t.deductions.ask80cWhy,
      defaultAmount: cap ?? 0,
      cap,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-navy dark:text-ink tracking-tight">{t.deductions.heading}</h2>
        <p className="text-sm text-ink-2 leading-relaxed">{t.deductions.sub}</p>
      </div>

      {/* ELIGIBILITY QUESTIONS */}
      <div className="space-y-3">
        {questions.map((question) => (
          <div
            key={question.section}
            className="fact-card space-y-3 p-4 sm:p-5"
          >
            <div className="flex items-start gap-2">
              <HelpCircle size={16} className="text-money mt-0.5 shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-ink">{question.q}</p>
                <p className="text-xs text-ink-2 leading-relaxed">{question.why}</p>
                {question.cap !== undefined && (
                  <p className="text-xs font-mono text-money font-semibold">
                    {t.deductions.worthUpTo(formatMoney(question.cap, lang))}
                  </p>
                )}
                {question.cap === undefined && (
                  <p className="text-xs font-mono text-ink-3">{t.deductions.worthWhatYouPaid}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  // a little celebration per claim - rewarding, not noisy
                  const r = e.currentTarget.getBoundingClientRect();
                  fireMiniBurst(r.x + r.width / 2, r.y + r.height / 2);
                  onAddClaim(question.section, question.defaultAmount);
                }}
                className="bg-navy hover:opacity-90 text-paper dark:text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                {t.deductions.claimIt}
              </button>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <p className="text-xs text-ink-3 font-mono">{t.flow.allConfirmed}</p>
        )}
      </div>

      {/* ALREADY-CLAIMED LIST */}
      {persona.claims.length > 0 && (
        <div className="surface-panel space-y-4 p-5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
            {t.deductions.claimedHeading}
          </h3>

          <div className="space-y-3">
            {persona.claims.map((claim) => {
              const worth = claimWorth(persona, regime, claim.id);
              const doesNothing = worth === 0;
              return (
                <div key={claim.id} className="fact-card space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
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
                      {/* SS4B F2: a figure the user never typed must say where it
                          came from and how to change it. */}
                      <p className="text-[0.7rem] leading-relaxed text-ink-3">
                        {t.deductions.startedAtCap(formatMoney(claim.amount, lang))}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveClaim(claim.id)}
                      aria-label={t.deductions.skipIt}
                      className="text-ink-3 hover:text-alarm transition-colors shrink-0 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {editingId === claim.id ? (
                      <input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        defaultValue={claim.amount}
                        onBlur={(e) => {
                          onClaimAmountChange(claim.id, Number(e.target.value.replace(/[^0-9]/g, "")) || 0);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                        className="w-32 text-sm font-mono font-bold text-ink border border-money rounded px-2 py-1 focus:outline-none tabular"
                        aria-label={t.deductions.amountLabel}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(claim.id)}
                        className="text-base font-bold text-ink tabular text-left"
                      >
                        {formatMoney(claim.amount, lang)}
                        <span className="sr-only">{t.deductions.amountLabel}</span>
                      </button>
                    )}

                    {doesNothing ? (
                      <span className="text-[0.7rem] text-warn leading-snug text-right max-w-[60%]">
                        {t.deductions.newRegimeNoEffect}
                      </span>
                    ) : (
                      <span className="text-[0.7rem] text-money font-semibold leading-snug text-right max-w-[60%]">
                        {t.deductions.oldRegimeSaves(formatMoney(worth, lang))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
