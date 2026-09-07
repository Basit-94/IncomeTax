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
 *
 * Redesign 2026-09-06: a glass pill; the active segment is the ink surface and
 * the Agentic segment carries a 20 px Munshi ji avatar.
 */

import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import { MunshiAvatar } from "../brand/munshi";

export type WorkMode = "agentic" | "manual";

export interface ModeSwitchProps {
  mode: WorkMode;
  onChange: (mode: WorkMode) => void;
  s: AgenticStrings;
  /** Set while a confirmed agent action is still committing; the switch waits (plan §6). */
  busy?: boolean;
  /** The drawer's Mode section (handoff 2, M4g): the pill stretches and its segments share the width. */
  fullWidth?: boolean;
}

export default function ModeSwitch({ mode, onChange, s, busy = false, fullWidth = false }: ModeSwitchProps) {
  return (
    <div
      className={`glass-flat h-[38px] max-md:h-9 shrink-0 flex items-center p-1 rounded-full text-[13px] max-md:text-[11.5px] font-bold ${fullWidth ? "w-full h-10 max-md:h-10 text-[13px] max-md:text-[13px]" : ""}`}
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
            className={`h-[30px] min-w-[104px] max-md:min-w-0 px-3.5 max-md:px-2.5 rounded-full flex items-center justify-center gap-1.5 transition-colors disabled:cursor-wait cursor-pointer ${fullWidth ? "flex-1 h-8" : ""} ${selected ? "ink-surface" : "text-ink-3 hover:text-ink"}`}
            data-mode={m}
          >
            {m === "agentic" && <MunshiAvatar size={20} />}
            <span className="truncate">{m === "agentic" ? s.modeAgentic : s.modeManual}</span>
          </button>
        );
      })}
    </div>
  );
}
