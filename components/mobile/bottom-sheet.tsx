"use client";

/**
 * A phone bottom sheet (handoff 2, M4h/M9): scrim in the darkened lilac, a 44×5 grab handle, 28 px top
 * corners, a header with a 40 px ink icon square (or Munshi ji), 17/800 title, 12 px subtitle and X; the
 * body scrolls. Slides up in 260 ms; the animation is CSS, so reduced motion settles it instantly.
 */

import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  closeLabel: string;
  /** Tailwind max-height class; the handoff uses 62 % for the inspector and 86 % for the vault and modals. */
  heightClass?: string;
  /** From which breakpoint the sheet stops rendering (the desktop layout takes over). */
  hideFrom?: "md" | "lg";
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, subtitle, icon, closeLabel, heightClass = "max-h-[62vh]", hideFrom = "lg", children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className={`${hideFrom === "md" ? "md:hidden" : "lg:hidden"} fixed inset-0 z-[70] flex flex-col justify-end`} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-[rgba(27,17,64,.55)] animate-in fade-in duration-200 cursor-default" aria-label={closeLabel} onClick={onClose} />
      <div className={`relative flex flex-col overflow-hidden rounded-t-[28px] bg-paper text-ink animate-in slide-in-from-bottom duration-[260ms] ${heightClass}`}>
        <div className="flex justify-center pt-2.5" aria-hidden="true">
          <span className="h-[5px] w-11 rounded-[3px] bg-line" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3">
          {icon && <span className="size-10 shrink-0 rounded-[13px] ink-surface flex items-center justify-center">{icon}</span>}
          <div className="flex-1 min-w-0">
            <p className="truncate text-[17px] font-extrabold leading-tight">{title}</p>
            {subtitle && <p className="truncate text-[12px] text-ink-3">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="size-9 shrink-0 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-ink cursor-pointer" aria-label={closeLabel}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-[30px] pt-1.5">{children}</div>
      </div>
    </div>
  );
}
