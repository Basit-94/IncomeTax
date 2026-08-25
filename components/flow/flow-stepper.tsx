"use client";

import React from "react";
import { Check } from "lucide-react";
import type { Dict } from "../../lib/i18n";

export type FlowStepName = "facts" | "deductions" | "regime" | "check" | "filing";

export const FLOW_STEPS: FlowStepName[] = ["facts", "deductions", "regime", "check", "filing"];

interface FlowStepperProps {
  t: Dict;
  current: FlowStepName;
  onJump: (step: FlowStepName) => void;
}

/** Named-step progress for the default path. Steps before the current one are revisitable. */
export default function FlowStepper({ t, current, onJump }: FlowStepperProps) {
  const labels: Record<FlowStepName, string> = {
    facts: t.flow.facts,
    deductions: t.flow.deductions,
    regime: t.flow.regime,
    check: t.flow.check,
    filing: t.flow.file,
  };
  const currentIndex = FLOW_STEPS.indexOf(current);
  const n = currentIndex + 1;

  return (
    <div className="surface-panel space-y-3 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">
          {t.flow.stepOf(n, FLOW_STEPS.length)}
        </span>
        <span className="text-right text-xs font-mono font-bold text-money">{labels[current]}</span>
      </div>
      <div className="flex gap-1.5" role="navigation" aria-label={t.flow.stepOf(n, FLOW_STEPS.length)}>
        {FLOW_STEPS.map((name, i) => (
          <button
            key={name}
            onClick={() => i <= currentIndex && onJump(name)}
            disabled={i > currentIndex}
            aria-current={name === current ? "step" : undefined}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < currentIndex
                ? "bg-money cursor-pointer"
                : i === currentIndex
                ? "bg-navy"
                : "bg-line"
            }`}
          >
            <span className="sr-only">
              {i < currentIndex ? <Check size={8} /> : null} {labels[name]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
