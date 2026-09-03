"use client";

/**
 * Typed cards in the transcript (plan §3.4). The confirm card is the one place an
 * irreversible action lives, and only a human click fires it (plan D3).
 */
import { Check, FileText, Receipt, ShieldCheck } from "lucide-react";
import type { Card } from "@/lib/harness/events";
import { formatMoney } from "@/lib/money";

export default function CardView({
  cardId,
  card,
  busy,
  onConfirm,
  onCancel,
}: {
  cardId: string;
  card: Card;
  busy?: boolean;
  onConfirm?: (cardId: string, action: string) => void;
  onCancel?: (cardId: string) => void;
}) {
  switch (card.type) {
    case "review":
      return (
        <div className="my-2 rounded-lg border border-line bg-paper-2 p-4" data-testid="card-review">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-3">{card.title}</p>
          <dl className="mt-3 divide-y divide-line">
            {card.rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-sm text-ink-2">
                  {row.label}
                  {row.note && <span className="block text-xs text-ink-3">{row.note}</span>}
                </dt>
                <dd className="font-mono text-sm tabular-nums text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          {card.footer && <p className="mt-3 text-xs text-ink-3">{card.footer}</p>}
        </div>
      );
    case "comparison":
      return (
        <div className="my-2 rounded-lg border border-line bg-paper-2 p-4" data-testid="card-comparison">
          <div className="grid grid-cols-2 gap-3">
            {(["new", "old"] as const).map((regime) => (
              <div key={regime} className={`rounded-lg border p-3 ${card.recommended === regime ? "border-money bg-money-soft" : "border-line"}`}>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-3">{regime} regime</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-ink">{formatMoney(regime === "new" ? card.newRegime : card.oldRegime)}</p>
                {card.recommended === regime && <p className="mt-1 text-xs font-semibold text-money">Cheaper for you</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-2">{card.note}</p>
        </div>
      );
    case "confirm":
      return (
        <div className="my-2 rounded-lg border-2 border-navy bg-paper-2 p-4" data-testid="card-confirm" data-action={card.action}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-money" aria-hidden="true" />
            <p className="text-base font-bold text-ink">{card.title}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{card.body}</p>
          {card.rows.length > 0 && (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {card.rows.map((row) => (
                <div key={row.label} className="rounded border border-line bg-paper px-3 py-2">
                  <dt className="text-[0.68rem] font-mono uppercase tracking-wider text-ink-3">{row.label}</dt>
                  <dd className="font-mono text-sm font-bold tabular-nums text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm?.(cardId, card.action)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              data-testid="confirm-action"
            >
              <Check size={16} aria-hidden="true" /> {card.confirmLabel}
            </button>
            <button type="button" disabled={busy} onClick={() => onCancel?.(cardId)} className="min-h-11 rounded-xl border border-line bg-paper px-5 text-sm font-semibold text-ink hover:bg-paper-3 disabled:opacity-50">
              {card.cancelLabel}
            </button>
          </div>
        </div>
      );
    case "document":
      return (
        <div className="my-2 flex items-center gap-3 rounded-lg border border-line bg-paper-2 px-4 py-3" data-testid="card-document">
          <FileText size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{card.title}</p>
            <p className="truncate font-mono text-xs text-ink-3">
              {card.filename} · {card.source === "vault" ? "from your vault" : card.source === "digilocker" ? "from DigiLocker" : "just uploaded"}
            </p>
            {card.note && <p className="text-xs text-ink-2">{card.note}</p>}
          </div>
        </div>
      );
    case "itrv":
      return (
        <div className="my-2 rounded-lg border border-line bg-white p-4 text-slate-700 shadow-sm" data-testid="card-itrv">
          <div className="flex items-center gap-2">
            <Receipt size={18} aria-hidden="true" />
            <p className="text-sm font-bold uppercase tracking-wider">Acknowledgement (mock)</p>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">Number</dt>
            <dd className="font-mono">{card.ackNumber}</dd>
            <dt className="text-slate-500">Filed</dt>
            <dd className="font-mono">{new Date(card.filedAt).toLocaleString("en-IN")}</dd>
            <dt className="text-slate-500">Regime</dt>
            <dd className="font-mono uppercase">{card.regime}</dd>
            <dt className="text-slate-500">{card.refundOrDue >= 0 ? "Refund" : "Payable"}</dt>
            <dd className="font-mono tabular-nums">{formatMoney(Math.abs(card.refundOrDue))}</dd>
          </dl>
        </div>
      );
    case "challan":
      return (
        <div className="my-2 rounded-lg border border-line bg-paper-2 p-4" data-testid="card-challan">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-3">Tax paid (mock challan)</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-ink">{formatMoney(card.amount)}</p>
          <p className="font-mono text-xs text-ink-3">
            BSR {card.bsr} · serial {card.serial} · {new Date(card.paidAt).toLocaleDateString("en-IN")}
          </p>
        </div>
      );
    case "vaultStatus":
      return (
        <div className="my-2 rounded-lg border border-line bg-paper-2 p-4" data-testid="card-vault">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-3">What is already known</p>
          <ul className="mt-2 space-y-1">
            {card.items.map((item) => (
              <li key={item.slotId} className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${item.status === "filled" ? "bg-money" : item.status === "missing" ? "bg-warn" : "bg-ink-3"}`} aria-hidden="true" />
                <span className="text-ink">{item.label}</span>
                <span className="ms-auto font-mono text-xs text-ink-3">{item.masked ?? item.status}{item.source ? ` · ${item.source}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "memory":
      return (
        <div className="my-2 rounded-lg border border-line bg-paper-2 p-4" data-testid="card-memory">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-3">What Wapsi remembers about you</p>
          <ul className="mt-2 space-y-1 text-sm">
            {card.items.map((item) => (
              <li key={item.key} className="flex gap-2">
                <span className="font-mono text-xs text-ink-3">{item.key}</span>
                <span className="text-ink">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
