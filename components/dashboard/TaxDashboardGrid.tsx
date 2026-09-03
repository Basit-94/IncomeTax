"use client";

/**
 * The seven-card tactile grid (wapsi_dashboard_card_optimization.md §4). Each
 * card is an index card on the desk: hairline border, offset paper shadow, a
 * mono index number, and one live meta line whose figure comes from the
 * exact-paise engine or lib/tools — the grid itself does no arithmetic.
 *
 * Replaces the 18-tile task grid. The tile ids are new; the page maps them onto
 * the existing handlers (flow steps, tabs, the tool drawer, the challan).
 */
import type { ComponentType } from "react";
import { m } from "motion/react";
import { BookOpenCheck, CalendarDays, FileText, History, Radar, Receipt, Scale, ShieldCheck } from "lucide-react";
import type { Lang, Persona } from "@/lib/types";
import type { Regime } from "@/lib/engine/types";
import type { DashboardCardId, DashboardCardMeta, RegimeComparison } from "@/types/tax";
import { compareRegimesExact, returnFactsFromPersona, toWholeRupees } from "@/lib/taxEngine";
import { calendarWithStatus, everifyDeadline } from "@/lib/tools";
import { formatMoney } from "@/lib/money";
import { localize } from "@/components/mock-i18n";

export type { DashboardCardId };

interface CardDef {
  id: DashboardCardId;
  title: string;
  hint: string;
  icon: ComponentType<{ size?: number }>;
  /** Needs an open return (persona) on the dashboard. */
  needsReturn?: boolean;
}

export const DASHBOARD_CARDS: readonly CardDef[] = [
  { id: "file_return", title: "File or Review Return", hint: "Confirm what is known, then file", icon: FileText },
  { id: "match_records", title: "Match Official Records", hint: "AIS, TIS, 26AS and Form 16, row by row", icon: BookOpenCheck },
  { id: "regime_optimizer", title: "Tax & Regime Optimizer", hint: "Old and new side by side, live", icon: Scale },
  { id: "pay_tax", title: "Pay Tax Due", hint: "Self-assessment with a UPI QR, then the challan", icon: Receipt, needsReturn: true },
  { id: "notices", title: "Notices & Defect Resolver", hint: "What a letter says and the reply that answers it", icon: ShieldCheck, needsReturn: true },
  { id: "return_status", title: "Return Status & Past Filings", hint: "e-Verify countdown, refund pipeline, ITR-V", icon: History },
  { id: "calendar", title: "Tax Calendar & Deadlines", hint: "Advance-tax dates and every cutoff", icon: CalendarDays },
];

const spring = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.7 };

const TONE: Record<NonNullable<DashboardCardMeta["tone"]>, string> = {
  neutral: "text-ink",
  good: "text-[var(--d13-green)]",
  warn: "text-warn",
  alarm: "text-alarm",
};

const REFUND_STAGE: Record<Persona["refund"]["state"], string> = {
  not_filed: "Not filed",
  filed_unverified: "Filed, not verified",
  verified: "Verified",
  in_queue: "In the queue",
  under_review: "Under review",
  determined: "Refund determined",
  sent_to_bank: "Sent to your bank",
  credited: "Credited",
  failed: "Refund failed",
};

interface MetaContext {
  persona: Persona | null;
  comparison: RegimeComparison | null;
  regime: Regime;
  unconfirmedRows: number;
  today: string;
  lang: Lang;
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 86_400_000);
}

function shortDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-IN" : `${lang}-IN`, { day: "numeric", month: "short", numberingSystem: "latn" }).format(new Date(`${iso}T00:00:00`));
}

/** The one live line under each title. All figures come in from the engine or lib/tools. */
function metaFor(id: DashboardCardId, ctx: MetaContext): DashboardCardMeta {
  const { persona, comparison, regime, lang } = ctx;
  const L = (s: string) => localize(s, lang);
  const active = comparison ? comparison[regime] : null;

  switch (id) {
    case "file_return": {
      if (!persona || !active) return { value: "AY 2026-27", caption: L("Start with your PAN") };
      if (persona.refund.state !== "not_filed") return { value: L("Filed"), caption: L("Review what was submitted"), tone: "good" };
      const net = toWholeRupees(active.refundOrDuePaise);
      return net >= 0
        ? { value: formatMoney(net, lang), caption: L("coming back to you"), tone: "good" }
        : { value: formatMoney(-net, lang), caption: L("still to pay"), tone: "warn" };
    }
    case "match_records": {
      if (!persona) return { value: "AIS · 26AS", caption: L("Sign in to compare") };
      return ctx.unconfirmedRows > 0
        ? { value: String(ctx.unconfirmedRows), caption: L(ctx.unconfirmedRows === 1 ? "row to confirm" : "rows to confirm"), tone: "warn" }
        : { value: L("All matched"), caption: L("every row confirmed"), tone: "good" };
    }
    case "regime_optimizer": {
      if (!comparison) return { value: "u/s 115BAC", caption: L("Compare with your own figures") };
      const savings = toWholeRupees(comparison.savingsPaise);
      if (savings === 0) return { value: L("Same"), caption: L("both regimes cost the same") };
      return {
        value: formatMoney(savings, lang),
        caption: L(comparison.cheaper === "new" ? "saved on the new regime" : "saved on the old regime"),
        tone: comparison.cheaper === regime ? "good" : "warn",
      };
    }
    case "pay_tax": {
      if (!active) return { value: "ITNS 280", caption: L("Open a return first") };
      const net = toWholeRupees(active.refundOrDuePaise);
      return net < 0
        ? { value: formatMoney(-net, lang), caption: L("due before filing"), tone: "warn" }
        : { value: L("Nil"), caption: L("nothing to pay"), tone: "good" };
    }
    case "notices": {
      if (!persona) return { value: "143(1)(a) · 139(9)", caption: L("Open a return first") };
      const open = persona.notices.filter((n) => n.status === "open").length;
      return open > 0
        ? { value: String(open), caption: L(open === 1 ? "open notice" : "open notices"), tone: "alarm" }
        : { value: L("None"), caption: L("nothing to answer"), tone: "good" };
    }
    case "return_status": {
      if (!persona || persona.refund.state === "not_filed") return { value: L("Not filed"), caption: L("nothing to track yet") };
      if (persona.refund.state === "filed_unverified" && persona.refund.filedOn) {
        const left = daysBetween(ctx.today, everifyDeadline(`${persona.refund.filedOn}T00:00:00Z`));
        return left >= 0
          ? { value: L(left === 1 ? "1 day" : `${left} days`), caption: L("left to e-verify"), tone: left <= 7 ? "alarm" : "warn" }
          : { value: L("Overdue"), caption: L("e-verify window has closed"), tone: "alarm" };
      }
      return { value: L(REFUND_STAGE[persona.refund.state]), caption: formatMoney(persona.refund.amount, lang), tone: persona.refund.state === "failed" ? "alarm" : "good" };
    }
    case "calendar": {
      const next = calendarWithStatus(ctx.today).find((e) => e.status !== "past");
      if (!next) return { value: "AY 2026-27", caption: L("every date has passed") };
      return { value: shortDate(next.date, lang), caption: L(next.title), tone: next.status === "soon" ? "warn" : "neutral" };
    }
  }
}

export interface TaxDashboardGridProps {
  lang: Lang;
  persona: Persona | null;
  regime: Regime;
  /** Fact ids the citizen has confirmed; drives the "rows to confirm" count. */
  confirmedFactIds?: readonly string[];
  /** Corrections that tripped the pre-audit radar and carry a CBDT code. */
  scrutinyFlags?: number;
  /** ISO date the metas are computed against (personas live on lib/personas TODAY). */
  today?: string;
  onSelect: (id: DashboardCardId) => void;
  onScrutinyClick?: () => void;
}

export default function TaxDashboardGrid({
  lang,
  persona,
  regime,
  confirmedFactIds = [],
  scrutinyFlags = 0,
  today = new Date().toISOString().slice(0, 10),
  onSelect,
  onScrutinyClick,
}: TaxDashboardGridProps) {
  const L = (s: string) => localize(s, lang);
  const comparison = persona ? compareRegimesExact(returnFactsFromPersona(persona)) : null;
  const unconfirmedRows = persona
    ? persona.facts.filter((f) => f.provenance.statement !== "self" && !confirmedFactIds.includes(f.id)).length
    : 0;
  const ctx: MetaContext = { persona, comparison, regime, unconfirmedRows, today, lang };

  return (
    <section aria-labelledby="task-grid-heading" className="space-y-3" data-testid="task-grid">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="task-grid-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink-2">
          {L("Do a specific thing")}
        </h2>
        {scrutinyFlags > 0 ? (
          <m.button
            type="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            onClick={onScrutinyClick}
            data-testid="cass-radar-badge"
            className="inline-flex items-center gap-1.5 rounded-full border border-alarm/50 bg-alarm-soft px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-alarm"
          >
            <Radar size={12} aria-hidden="true" />
            {L("CASS scrutiny trigger warning")} · {scrutinyFlags}
          </m.button>
        ) : (
          <span className="text-xs text-ink-3">{L("Every card here works end to end in this prototype")}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_CARDS.map(({ id, title, hint, icon: Icon, needsReturn }, i) => {
          const disabled = Boolean(needsReturn && !persona);
          const meta = metaFor(id, ctx);
          return (
            <m.button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(id)}
              title={disabled ? L("Open a return first") : undefined}
              data-tile={id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={disabled ? undefined : { y: -3 }}
              whileTap={disabled ? undefined : { scale: 0.985 }}
              transition={{ ...spring, delay: i * 0.05 }}
              className="group relative flex min-h-[11rem] flex-col items-start gap-3 rounded-[var(--card-radius)] border border-line bg-paper-2 p-5 text-left shadow-[var(--shadow-d13)] transition-shadow hover:shadow-[var(--shadow-d13-hi)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[var(--shadow-d13)]"
            >
              <div className="flex w-full items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-[3px] border border-line bg-paper text-money" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold leading-tight text-ink">{L(title)}</h3>
                <p className="mt-1 text-[13px] leading-snug text-ink-2">{L(hint)}</p>
              </div>
              <div className="mt-auto flex w-full items-baseline gap-2 border-t border-dashed border-line pt-3">
                <span className={`font-mono text-sm font-semibold tabular-nums ${TONE[meta.tone ?? "neutral"]}`}>{meta.value}</span>
                <span className="truncate text-xs text-ink-3">{meta.caption}</span>
              </div>
            </m.button>
          );
        })}
      </div>
    </section>
  );
}
