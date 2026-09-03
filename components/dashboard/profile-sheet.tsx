"use client";

/**
 * The profile slide-over. "My documents and details" left the grid because a
 * tax platform is not a filing cabinet (wapsi_dashboard_card_optimization.md
 * §1); it lives here, behind the profile icon, with the DigiLocker link and
 * sign-out. Links only — the vault page owns the documents themselves.
 */
import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { FolderOpen, Link2, LogOut, SlidersHorizontal, X } from "lucide-react";
import type { Lang, Persona } from "@/lib/types";
import { localize } from "@/components/mock-i18n";

const spring = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 };

interface ProfileSheetProps {
  open: boolean;
  lang: Lang;
  persona: Persona | null;
  onClose: () => void;
  onSignOut?: () => void;
  onEditOnboarding?: () => void;
}

export default function ProfileSheet({ open, lang, persona, onClose, onSignOut, onEditOnboarding }: ProfileSheetProps) {
  const L = (s: string) => localize(s, lang);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const rowClass = "flex items-center gap-3 rounded-[4px] border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink no-underline hover:bg-paper-2";

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="profile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] bg-ink/30 backdrop-blur-[2px] print:hidden"
          onClick={onClose}
          role="presentation"
        >
          <m.aside
            key="profile-sheet"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-sheet-title"
            data-testid="profile-sheet"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col gap-5 overflow-y-auto border-l border-line bg-paper-2 p-6 shadow-[var(--shadow-d13-hi)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{L("Profile")}</p>
                <h2 id="profile-sheet-title" className="text-lg font-semibold text-ink">
                  {persona ? persona.name : L("Not signed in to a return")}
                </h2>
                {persona && (
                  <p className="font-mono text-xs tabular-nums text-ink-2">
                    PAN {persona.pan} · AY {persona.assessmentYear}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose} aria-label={L("Close")} className="rounded p-2 text-ink-2 hover:bg-paper">
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-2" aria-label={L("My documents and details")}>
              <Link href="/vault" className={rowClass} data-testid="profile-documents">
                <FolderOpen size={16} className="text-money" aria-hidden="true" />
                <span className="flex-1">
                  {L("My documents and details")}
                  <span className="block text-xs font-normal text-ink-3">{L("What is on file, what is missing")}</span>
                </span>
              </Link>
              <a href="/api/vault/digilocker/connect" className={rowClass} data-testid="profile-digilocker">
                <Link2 size={16} className="text-money" aria-hidden="true" />
                <span className="flex-1">
                  {L("Connect DigiLocker")}
                  <span className="block text-xs font-normal text-ink-3">{L("Pull PAN and Aadhaar (simulated)")}</span>
                </span>
              </a>
              {onEditOnboarding && (
                <button type="button" onClick={onEditOnboarding} className={`${rowClass} text-left`}>
                  <SlidersHorizontal size={16} className="text-money" aria-hidden="true" />
                  <span className="flex-1">{L("Change my answers")}</span>
                </button>
              )}
            </nav>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border border-line bg-paper px-4 text-sm font-semibold text-alarm hover:bg-paper-2"
              >
                <LogOut size={16} aria-hidden="true" /> {L("Sign out of this return")}
              </button>
            )}
          </m.aside>
        </m.div>
      )}
    </AnimatePresence>
  );
}
