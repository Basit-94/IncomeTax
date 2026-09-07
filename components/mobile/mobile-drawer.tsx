"use client";

/**
 * The Agentic mode's left drawer on phones and tablets (handoff 2, M4g): 300 px of paper sliding in from
 * the start edge in 220 ms with a scrim fade; the caller renders the sidebar inside it. Hidden from `lg`,
 * where the sidebar is a docked column.
 */

import type { ReactNode } from "react";

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}

export default function MobileDrawer({ open, onClose, closeLabel, children }: MobileDrawerProps) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[60] flex" role="dialog" aria-modal="true">
      <div className="flex h-full w-[300px] max-w-[85vw] flex-col overflow-y-auto bg-paper text-ink shadow-[20px_0_60px_rgba(0,0,0,.3)] animate-in slide-in-from-left duration-200 rtl:slide-in-from-right">
        {children}
      </div>
      <button type="button" className="flex-1 bg-[rgba(27,17,64,.5)] animate-in fade-in duration-200 cursor-default" aria-label={closeLabel} onClick={onClose} />
    </div>
  );
}
