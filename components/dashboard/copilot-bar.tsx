"use client";

/**
 * The persistent copilot bar, docked under the dashboard. A conversational
 * assistant is not a grid item (wapsi_dashboard_card_optimization.md §3): this
 * is the one place to type, and the chips are the three questions people ask
 * first. Submitting hands the text to the assistant panel; the HRA chip opens
 * the rent-allowance tool directly because that answer is arithmetic, not prose.
 */
import { useState, type FormEvent } from "react";
import { m } from "motion/react";
import { Sparkles, Send } from "lucide-react";
import type { Lang } from "@/lib/types";
import type { ToolId } from "@/components/tools/tool-drawer";
import { localize } from "@/components/mock-i18n";

const spring = { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.6 };

type Chip = { label: string; ask: string } | { label: string; tool: ToolId };

const CHIPS: readonly Chip[] = [
  { label: "Check HRA limit", tool: "hra" },
  { label: "What is marginal relief?", ask: "What is marginal relief under the new regime for AY 2026-27?" },
  { label: "Old vs New for ₹15L salary", ask: "Compare the old and new regime for a ₹15,00,000 salary with no other income." },
];

export default function CopilotBar({ lang, onAsk, onTool }: { lang: Lang; onAsk: (text: string) => void; onTool: (tool: ToolId) => void }) {
  const L = (s: string) => localize(s, lang);
  const [text, setText] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAsk(trimmed);
    setText("");
  };

  return (
    <m.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      aria-label={L("Wapsi Copilot")}
      data-testid="copilot-bar"
      className="sticky bottom-4 z-30 rounded-[var(--card-radius)] border border-line bg-paper-2/95 p-3 shadow-[var(--shadow-d13)] backdrop-blur"
    >
      <form onSubmit={submit} className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-line bg-paper text-money" aria-hidden="true">
          <Sparkles size={16} />
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={L("Ask Wapsi Copilot anything about your taxes or deductions...")}
          aria-label={L("Ask Wapsi Copilot")}
          data-testid="copilot-input"
          className="min-h-10 min-w-0 flex-1 rounded-[3px] border border-line bg-paper px-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-money"
        />
        <m.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          transition={spring}
          disabled={!text.trim()}
          aria-label={L("Send")}
          data-testid="copilot-submit"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-navy text-paper disabled:opacity-40"
        >
          <Send size={16} />
        </m.button>
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <m.button
            key={chip.label}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => ("tool" in chip ? onTool(chip.tool) : onAsk(chip.ask))}
            data-testid="copilot-chip"
            className="rounded-full border border-line bg-paper px-3 py-1 font-sans text-xs font-semibold text-ink-2 hover:border-ink-3 hover:text-ink"
          >
            {L(chip.label)}
          </m.button>
        ))}
      </div>
    </m.section>
  );
}
