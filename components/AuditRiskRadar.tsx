"use client";

/**
 * Scrutiny-risk radar (CASS).
 *
 * The point is timing. A citizen who lowers an AIS figure is entitled to do so,
 * and sometimes the AIS row really is wrong. But the consequence — an inquiry
 * under s.143(1)(a), months later, asking for proof they no longer have to hand
 * — lands long after the decision. This surfaces it at the moment of the change,
 * with the specific rows named and the specific proof requested.
 *
 * It does NOT block filing and does not tell the citizen they are wrong. It
 * tells them what this looks like from the other side of the desk, and offers
 * the one action that answers it: attach the evidence now.
 *
 * The thresholds and the probability label come from lib/compliance/cass.ts,
 * shared with the agent's predict_audit_risk tool. The probability is a fixed
 * illustrative figure and the badge says so — the department publishes no CASS
 * selection rates, so no honest number exists to put there.
 */

import React from "react";
import { m, AnimatePresence } from "motion/react";
import { Paperclip, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { useTax } from "../context/TaxReturnContext";
import { CASS_INQUIRY_PROBABILITY_LABEL, CASS_VARIANCE_THRESHOLD } from "../lib/compliance/cass";
import { Rupees } from "./Rupees";
import type { FactId } from "../context/TaxReturnContext";

const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.7 };

export function AuditRiskRadar() {
  const { cass, dispatch } = useTax();

  const isHigh = cass.riskLevel === "HIGH";

  return (
    <m.section
      layout
      transition={spring}
      aria-live="polite"
      className={`overflow-hidden rounded-2xl border p-5 transition-colors ${
        isHigh ? "border-amber-300 bg-amber-50/70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 rounded-lg p-2 ${
              isHigh ? "bg-amber-200 text-amber-800" : "bg-slate-100 text-slate-500"
            }`}
          >
            {isHigh ? <TriangleAlert size={16} /> : <Radar size={16} />}
          </span>
          <div className="space-y-1">
            <h3
              className={`text-sm font-extrabold ${
                isHigh ? "text-amber-950" : "text-slate-900"
              }`}
            >
              {isHigh
                ? "Scrutiny risk warning (CASS algorithm flag)"
                : "No scrutiny flags on this return"}
            </h3>
            <p
              className={`max-w-2xl text-xs leading-relaxed ${
                isHigh ? "text-amber-900" : "text-slate-500"
              }`}
            >
              {isHigh ? (
                <>
                  A downward revision of this size against third-party data is a
                  documented selection trigger. An illustrative{" "}
                  <strong className="font-bold">
                    {CASS_INQUIRY_PROBABILITY_LABEL} probability
                  </strong>{" "}
                  of generating an inquiry notice u/s {cass.scrutinySection} — the
                  direction is real, the exact figure is not published by the
                  department and this one is a stand-in.
                </>
              ) : (
                <>
                  Nothing you have declared falls materially below what your employer,
                  banks or registrar reported. Rows are flagged past a{" "}
                  {Math.round(CASS_VARIANCE_THRESHOLD * 100)}% reduction, or a total
                  reduction over <Rupees value={100000} />.
                </>
              )}
            </p>
          </div>
        </div>

        {isHigh && (
          <span className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
            High scrutiny risk
          </span>
        )}
        {!isHigh && cass.aggregateShortfall === 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            <ShieldCheck size={11} /> Clear
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isHigh && (
          <m.div
            key="findings"
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <ul className="mt-4 space-y-2 border-t border-amber-200 pt-4">
              {cass.findings.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-xs font-bold text-slate-900">{f.label}</p>
                    <p className="text-[11px] text-slate-600">
                      <Rupees value={f.reportedAmount} className="font-semibold" /> reported
                      {f.reportedBy ? ` by ${f.reportedBy}` : ""} ·{" "}
                      <Rupees value={f.declaredAmount} className="font-semibold" /> declared
                      {" · "}
                      <span className="font-bold text-amber-800 tabular-nums">
                        {Math.round(f.variance * 100)}% lower
                      </span>
                    </p>
                  </div>

                  {f.hasAttachment ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                      <Paperclip size={11} /> Proof attached
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        dispatch({
                          type: "ATTACH_EVIDENCE",
                          factId: f.id as FactId,
                          hasAttachment: true,
                        })
                      }
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-50"
                    >
                      <Paperclip size={11} /> Attach proof
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[11px] leading-relaxed text-amber-900">
              Total reduction against reported data:{" "}
              <Rupees value={cass.aggregateShortfall} className="font-bold" />.
              {cass.unsupportedFindings.length > 0 ? (
                <>
                  {" "}
                  {cass.unsupportedFindings.length} flagged row
                  {cass.unsupportedFindings.length === 1 ? " has" : "s have"} no supporting
                  document yet. Attaching it now is the difference between answering a
                  notice in a day and reconstructing a year-old transaction.
                </>
              ) : (
                <> Every flagged row has proof attached. That is the answer to the notice.</>
              )}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </m.section>
  );
}

export default AuditRiskRadar;
