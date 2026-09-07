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
 *
 * ATTACHMENTS ARE MOCK. The file picker is real, so the gesture is the real
 * one, but nothing is uploaded: only the file's name is kept on the row, and
 * the surface says so.
 */

import React, { useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import { Paperclip, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { useTax } from "../context/TaxReturnContext";
import type { FactId } from "../context/TaxReturnContext";
import type { CassRowFinding } from "../lib/compliance/cass";
import {
  CASS_AGGREGATE_RUPEE_THRESHOLD,
  CASS_INQUIRY_PROBABILITY_LABEL,
  CASS_VARIANCE_THRESHOLD,
} from "../lib/compliance/cass";
import { Rupees } from "./Rupees";

const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.7 };

interface AuditRiskRadarProps {
  /** Hide the "no flags" card entirely; render only when the radar has fired. */
  quietWhenClear?: boolean;
}

/** One flagged row with its attach-proof control. */
function FindingRow({ finding }: { finding: CassRowFinding }) {
  const { dispatch } = useTax();
  const inputRef = useRef<HTMLInputElement>(null);

  const attach = (file: File | undefined): void => {
    if (!file) return;
    dispatch({
      type: "ATTACH_EVIDENCE",
      factId: finding.id as FactId,
      hasAttachment: true,
      attachmentName: file.name,
    });
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 glass-flat rounded-[14px] px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-xs font-bold text-ink">{finding.label}</p>
        <p className="text-[11px] text-ink-2">
          <Rupees value={finding.reportedAmount} className="font-semibold" /> reported
          {finding.reportedBy ? ` by ${finding.reportedBy}` : ""} ·{" "}
          <Rupees value={finding.declaredAmount} className="font-semibold" /> declared
          {" · "}
          <span className="font-mono font-bold tabular-nums text-warn">
            {Math.round(finding.variance * 100)}% lower
          </span>
        </p>
      </div>

      {finding.hasAttachment ? (
        <span className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1.5 text-[11px] font-bold text-ok-ink">
          <Paperclip size={11} />
          <span className="truncate">
            Proof attached
            {finding.attachmentName ? ` · ${finding.attachmentName}` : ""}
          </span>
        </span>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              attach(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            data-action="attach-proof"
            onClick={() => inputRef.current?.click()}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] bg-warn-soft px-3 py-1.5 text-[11px] font-bold text-warn transition hover:opacity-90"
          >
            <Paperclip size={11} /> Attach documentary proof (salary slip / Form 16 / bank statement)
          </button>
        </>
      )}
    </li>
  );
}

export function AuditRiskRadar({ quietWhenClear = false }: AuditRiskRadarProps = {}) {
  const { cass } = useTax();

  const isHigh = cass.riskLevel === "HIGH";
  if (quietWhenClear && !isHigh) return null;

  return (
    <m.section
      layout
      transition={spring}
      aria-live="polite"
      data-testid="cass-radar"
      data-risk={cass.riskLevel}
      className={`overflow-hidden rounded-[24px] border p-5 transition-colors ${
        isHigh ? "border-warn/30 bg-warn-soft" : "glass border-glass-edge"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 rounded-[12px] p-2 ${
              isHigh ? "bg-warn text-white" : "glass-flat text-ink-3"
            }`}
          >
            {isHigh ? <TriangleAlert size={16} /> : <Radar size={16} />}
          </span>
          <div className="space-y-1">
            <h3
              className={`text-sm font-extrabold ${
                isHigh ? "text-warn" : "text-ink"
              }`}
            >
              {isHigh
                ? "Scrutiny Risk Warning (CASS Algorithm Flag)"
                : "No scrutiny flags on this return"}
            </h3>
            <p
              className={`max-w-2xl text-xs leading-relaxed ${
                isHigh ? "text-ink-2" : "text-ink-3"
              }`}
            >
              {isHigh ? (
                <>
                  You have declared{" "}
                  <Rupees value={cass.aggregateShortfall} className="font-bold" /> less than
                  reported by your employer/bank in AIS. This has a{" "}
                  <strong className="font-bold">
                    {CASS_INQUIRY_PROBABILITY_LABEL} probability
                  </strong>{" "}
                  of generating an inquiry notice u/s {cass.scrutinySection}. The direction
                  is real — a downward revision of this size against third-party data is a
                  documented selection trigger — but the department publishes no selection
                  rate, so that percentage is an illustrative stand-in, not a measurement.
                </>
              ) : (
                <>
                  Nothing you have declared falls materially below what your employer,
                  banks or registrar reported. Rows are flagged past a{" "}
                  {Math.round(CASS_VARIANCE_THRESHOLD * 100)}% reduction, or a total
                  reduction over <Rupees value={CASS_AGGREGATE_RUPEE_THRESHOLD} />.
                </>
              )}
            </p>
          </div>
        </div>

        {isHigh && (
          <span className="shrink-0 rounded-full bg-warn-soft px-[11px] py-1 text-[12px] font-bold text-warn">
            High scrutiny risk
          </span>
        )}
        {!isHigh && cass.aggregateShortfall === 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-soft px-[11px] py-1 text-[12px] font-bold text-ok-ink">
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
            <ul className="mt-4 space-y-2 border-t border-line pt-4">
              {cass.findings.map((f) => (
                <FindingRow key={f.id} finding={f} />
              ))}
            </ul>

            <p className="mt-3 text-[11px] leading-relaxed text-ink-2">
              Total reduction against reported data:{" "}
              <Rupees value={cass.aggregateShortfall} className="font-bold" />.
              {cass.unsupportedFindings.length > 0 ? (
                <>
                  {" "}
                  {cass.unsupportedFindings.length} flagged row
                  {cass.unsupportedFindings.length === 1 ? " has" : "s have"} no supporting
                  document yet. Attaching it now is the difference between answering a
                  notice in a day and reconstructing a year-old transaction. Files are
                  never uploaded here — only the name is kept on the row.
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
