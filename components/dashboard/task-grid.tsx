"use client";

/**
 * The manual-mode grid (plan §5): only tiles the site can complete end to end. Each tile
 * says what it does in plain words; the icon colour groups them the way the department's
 * portal does, but nothing here is a stub.
 */
import type { ComponentType } from "react";
import { BadgeCheck, BookOpenCheck, Calculator, CalendarDays, Clock, FileText, History, Landmark, Link2, MessageSquare, Receipt, Scale, Search, ShieldCheck, TrendingUp, Vault, Wallet } from "lucide-react";
import type { Lang } from "@/lib/types";
import { localize } from "@/components/mock-i18n";

export type TileId =
  | "file_return"
  | "reconcile"
  | "pay_tax"
  | "notices"
  | "calculator"
  | "compare"
  | "advance_tax"
  | "hra"
  | "capital_gains"
  | "calendar"
  | "tds_check"
  | "everify"
  | "itrv"
  | "history"
  | "vault"
  | "digilocker"
  | "refund"
  | "chat";

interface Tile {
  id: TileId;
  label: string;
  hint: string;
  icon: ComponentType<{ size?: number }>;
  tone: "blue" | "green" | "orange" | "purple";
  /** Needs an open return (persona) on the dashboard. */
  needsReturn?: boolean;
}

const TILES: Tile[] = [
  { id: "file_return", label: "File or check my return", hint: "Confirm what is known, then file", icon: FileText, tone: "blue" },
  { id: "refund", label: "Where is my refund?", hint: "Stage by stage", icon: Wallet, tone: "green", needsReturn: true },
  { id: "reconcile", label: "Match with the department's records", hint: "AIS and 26AS, row by row", icon: BookOpenCheck, tone: "green" },
  { id: "pay_tax", label: "Pay tax that is due", hint: "Challan 280, with a receipt", icon: Receipt, tone: "orange", needsReturn: true },
  { id: "notices", label: "Respond to a letter", hint: "What it says and what to do", icon: ShieldCheck, tone: "purple", needsReturn: true },
  { id: "calculator", label: "Tax calculator", hint: "Type a few figures, see the tax", icon: Calculator, tone: "blue" },
  { id: "compare", label: "Old regime or new?", hint: "Both, side by side", icon: Scale, tone: "blue" },
  { id: "advance_tax", label: "Advance-tax dates", hint: "How much by when", icon: TrendingUp, tone: "orange" },
  { id: "hra", label: "Rent allowance check", hint: "How much of your HRA is tax-free", icon: Landmark, tone: "green" },
  { id: "capital_gains", label: "Shares or property sold?", hint: "The tax on the gain", icon: TrendingUp, tone: "purple" },
  { id: "calendar", label: "Tax calendar", hint: "Every date that matters this year", icon: CalendarDays, tone: "blue" },
  { id: "tds_check", label: "Does my TDS match?", hint: "Form 16 against the department", icon: Search, tone: "green" },
  { id: "everify", label: "e-Verify my return", hint: "Within 30 days of filing", icon: BadgeCheck, tone: "green" },
  { id: "itrv", label: "Download my acknowledgement", hint: "The ITR-V receipt", icon: Receipt, tone: "purple", needsReturn: true },
  { id: "history", label: "Filing history", hint: "What was filed, and when", icon: History, tone: "blue" },
  { id: "vault", label: "My documents and details", hint: "What is on file, what is missing", icon: Vault, tone: "purple" },
  { id: "digilocker", label: "Connect DigiLocker", hint: "Pull PAN and Aadhaar (simulated)", icon: Link2, tone: "orange" },
  { id: "chat", label: "Ask the assistant", hint: "Explain your situation instead", icon: MessageSquare, tone: "purple" },
];

const TONES: Record<Tile["tone"], string> = {
  blue: "bg-[#1a56db] text-white",
  green: "bg-[#0e9f6e] text-white",
  orange: "bg-[#ff5a1f] text-white",
  purple: "bg-[#7e3af2] text-white",
};

export default function TaskGrid({ lang, hasReturn, onSelect }: { lang: Lang; hasReturn: boolean; onSelect: (id: TileId) => void }) {
  const L = (s: string) => localize(s, lang);
  return (
    <section aria-labelledby="task-grid-heading" className="space-y-3" data-testid="task-grid">
      <div className="flex items-baseline justify-between">
        <h2 id="task-grid-heading" className="text-sm font-mono font-semibold uppercase tracking-wider text-ink-2">
          {L("Do a specific thing")}
        </h2>
        <span className="text-xs text-ink-3">{L("Everything here works end to end in this prototype")}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map(({ id, label, hint, icon: Icon, tone, needsReturn }) => {
          const disabled = Boolean(needsReturn && !hasReturn);
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(id)}
              title={disabled ? L("Open a return first") : undefined}
              className="surface-panel flex min-h-[8.5rem] flex-col items-center gap-2 px-3 py-4 text-center transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
              data-tile={id}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${TONES[tone]}`}>
                <Icon size={22} />
              </span>
              <span className="text-sm font-semibold leading-tight text-ink">{L(label)}</span>
              <span className="text-[0.7rem] leading-tight text-ink-3">{L(hint)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
