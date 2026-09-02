"use client";

/**
 * Section 139(9) — defective return notice, and the one-click route out of it.
 *
 * A return is "defective" when it is internally inconsistent or incomplete. The
 * most common trigger by far is this one: gross receipts reported by third
 * parties in AIS/26AS exceed the income the return actually declares. The
 * department issues the notice, and the citizen gets 15 days to respond before
 * the return is treated as never filed — which is how a filed return quietly
 * becomes a belated one, with interest running.
 *
 * The response here is a REVISED return u/s 139(5): the same return, refiled
 * with the discrepancy resolved, keeping the original filing date.
 *
 * The auto-reconcile is deliberately reversible and deliberately explicit about
 * what it does. It accepts the reporter's figure on every income row where the
 * citizen declared less — which is not always the right answer, because the AIS
 * row can genuinely be wrong. So it names each row and its amount before acting,
 * keeps the citizen's original figure in `supersededAmount`, and leaves an undo
 * on the stack. A one-click button that changes what gets filed has to be a
 * button the citizen can take back.
 */

import React, { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { AlertOctagon, ArrowRight, RotateCcw, Scale } from "lucide-react";
import { useTax } from "../context/TaxReturnContext";
import { Rupees } from "./Rupees";

const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.7 };

export function DefectiveNoticeCard() {
  const { state, incomeReported, incomeDeclared, dispatch, canUndo } = useTax();
  const [expanded, setExpanded] = useState(false);

  const shortfall = incomeReported - incomeDeclared;

  // Rows the auto-reconcile would actually touch. Listed by name so the citizen
  // sees the scope before pressing, not after.
  const affected = Object.values(state.facts).filter(
    (f) => f.category === "income" && f.declaredAmount < f.reportedAmount,
  );

  if (state.revisedReturnStaged) {
    return (
      <m.section
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Scale size={11} /> Revised return staged
            </span>
            <h3 className="text-sm font-extrabold text-emerald-950">
              Prepared u/s 139(5) — the s.139(9) defect is resolved
            </h3>
            <p className="max-w-2xl text-xs leading-relaxed text-emerald-900">
              Declared income now matches what the reporters filed, so the
              inconsistency the notice cited no longer exists. Your original figures
              were kept on each row and nothing was discarded — the revised return
              carries the original filing date.
            </p>
          </div>
          {canUndo && (
            <button
              onClick={() => dispatch({ type: "UNDO_LAST_ACTION" })}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              <RotateCcw size={13} /> Undo auto-reconcile
            </button>
          )}
        </div>

        {affected.length === 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-emerald-200 pt-4">
            {Object.values(state.facts)
              .filter((f) => f.supersededAmount !== undefined)
              .map((f) => (
                <li key={f.id} className="flex items-baseline justify-between gap-4 text-xs">
                  <span className="text-emerald-900">{f.label}</span>
                  <span className="shrink-0">
                    <Rupees
                      value={f.supersededAmount ?? 0}
                      strike
                      className="mr-2 text-emerald-700/70"
                    />
                    <Rupees value={f.declaredAmount} className="font-bold text-emerald-950" />
                  </span>
                </li>
              ))}
          </ul>
        )}
      </m.section>
    );
  }

  if (shortfall <= 0) return null;

  return (
    <m.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="overflow-hidden rounded-2xl border border-rose-300 bg-rose-50/70"
    >
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
            <AlertOctagon size={11} /> Notice u/s 139(9) — defective return
          </span>
          <h3 className="text-sm font-extrabold text-rose-950">
            Reported receipts exceed the income declared in your schedules
          </h3>
          <p className="max-w-2xl text-xs leading-relaxed text-rose-900">
            Gross receipts in Form 26AS / AIS (
            <Rupees value={incomeReported} className="font-bold" />) exceed total income
            reported in the filed schedules (
            <Rupees value={incomeDeclared} className="font-bold" />) — a difference of{" "}
            <Rupees value={shortfall} className="font-bold" />. Left unanswered for 15
            days, the return is treated as never filed.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            onClick={() => dispatch({ type: "STAGE_REVISED_RETURN" })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-rose-800"
          >
            Auto-reconcile &amp; prepare revised return u/s 139(5)
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer text-xs font-semibold text-rose-800 underline-offset-2 hover:underline"
          >
            {expanded ? "Hide" : `Show the ${affected.length} row${affected.length === 1 ? "" : "s"} this would change`}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key="affected"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden border-t border-rose-200 bg-white/60"
          >
            <div className="space-y-3 p-5">
              <p className="text-xs leading-relaxed text-rose-900">
                Auto-reconcile accepts the reporter&apos;s figure on each row below. If
                any of these AIS entries is genuinely wrong, dispute that row instead —
                accepting a figure you do not owe tax on is not the safe option, it is
                just the quiet one.
              </p>
              <ul className="space-y-2">
                {affected.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 rounded-lg bg-white px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      {f.label}
                      {f.reportedBy && (
                        <span className="ml-2 font-normal text-slate-500">
                          reported by {f.reportedBy}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap">
                      <Rupees value={f.declaredAmount} className="text-slate-500" />
                      <ArrowRight size={11} className="mx-1.5 inline text-slate-400" />
                      <Rupees value={f.reportedAmount} className="font-bold text-rose-800" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.section>
  );
}

export default DefectiveNoticeCard;
