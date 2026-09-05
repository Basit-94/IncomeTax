"use client";

/**
 * The one shared Agentic / Manual control (plan.md §6: "one shared ModeSwitch
 * in a reserved header slot immediately to the right of the sidebar boundary.
 * It must have the same anchor, order, dimensions, and accessible labels in
 * Agentic and Manual").
 *
 * Fixed geometry on purpose: explicit min-width per segment and a fixed
 * height, so a longer label in one language or a different active state
 * cannot change the box. Both modes render exactly this component in exactly
 * one place — components/agentic/app-shell.tsx.
 */

import { Sparkles } from "lucide-react";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";

export type WorkMode = "agentic" | "manual";

export interface ModeSwitchProps {
  mode: WorkMode;
  onChange: (mode: WorkMode) => void;
  s: AgenticStrings;
  /** Set while a confirmed agent action is still committing; the switch waits (plan §6). */
  busy?: boolean;
}

export default function ModeSwitch({ mode, onChange, s, busy = false }: ModeSwitchProps) {
  return (
    <div
      className="seg h-[38px] shrink-0"
      role="group"
      aria-label={s.modeLabel}
      data-testid="mode-switch"
      aria-busy={busy || undefined}
    >
      {(["agentic", "manual"] as const).map((m) => {
        const selected = mode === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={selected}
            disabled={busy}
            onClick={() => !selected && onChange(m)}
            className="h-full min-w-[104px] px-3 text-xs flex items-center justify-center gap-1.5 disabled:cursor-wait"
            data-mode={m}
          >
            {m === "agentic" && <Sparkles size={12} className="text-amber-500 shrink-0" aria-hidden="true" />}
            <span className="truncate">{m === "agentic" ? s.modeAgentic : s.modeManual}</span>
          </button>
        );
      })}
    </div>
  );
}
