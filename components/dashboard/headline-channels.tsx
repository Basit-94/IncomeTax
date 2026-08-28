"use client";

/**
 * Direction 13's cover, emitting the PROTOTYPE'S OWN markup and class names
 * (.headline > .channels > .ch / .split > .cap + .bar + .keys + .footnote),
 * styled by the verbatim app/d13.css. Only the numbers changed: every figure
 * comes from the engine breakdown, never from copy.
 *
 * The fills animate the prototype's way — widths start at 0 and are set after
 * first paint, so the CSS transitions carry them in.
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Dict } from "../../lib/i18n";
import type { Lang } from "../../lib/types";
import type { TaxBreakdown } from "../../lib/engine/types";
import { formatMoney } from "../../lib/money";
import { AnimatedAmount } from "../ui/animated-amount";

interface HeadlineChannelsProps {
  breakdown: TaxBreakdown;
  lang: Lang;
  t: Dict;
  mode?: "simple" | "full";
}

export default function HeadlineChannels({ breakdown, lang, t, mode = "simple" }: HeadlineChannelsProps) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const gross = breakdown.grossIncome;
  if (gross <= 0) return null;

  const tds = breakdown.tdsCredits;
  const totalTax = breakdown.totalTax;
  const refund = Math.max(0, breakdown.refundOrDue);
  const due = Math.max(0, -breakdown.refundOrDue);
  const c = t.channels;

  const pct = (amount: number) => (amount / gross) * 100;
  const fmtPct = (amount: number) => {
    const p = pct(amount);
    return p >= 10 ? p.toFixed(1) : p.toFixed(2);
  };

  const slices =
    due === 0
      ? [
          { key: "mine", cls: "mine", label: c.stayed, amount: gross - tds, token: "var(--in)" },
          { key: "tax", cls: "tax", label: c.kept, amount: totalTax, token: "var(--out)" },
          { key: "back", cls: "back", label: c.back, amount: refund, token: "var(--keep)" },
        ]
      : [
          { key: "mine", cls: "mine", label: c.yoursInEnd, amount: gross - totalTax, token: "var(--in)" },
          { key: "tax", cls: "tax", label: c.collected, amount: tds, token: "var(--out)" },
          { key: "back", cls: "tax", label: c.stillToPay, amount: due, token: "var(--out)" },
        ];
  const visible = slices.filter((s) => s.amount > 0);
  const hasWidenedSliver = visible.some((s) => pct(s.amount) < 1);

  const channels = [
    { key: "earned", label: c.earned, amount: gross, token: "var(--in)", fill: "100%", pctLine: c.ofYear ? `100% ${c.ofYear}` : "100%", desc: c.earnedDesc },
    { key: "toTax", label: c.toTax, amount: totalTax, token: "var(--out)", fill: `${pct(totalTax)}%`, pctLine: `${fmtPct(totalTax)}% ${c.ofYear}`, desc: c.toTaxDesc },
    due === 0
      ? { key: "back", label: c.overpaid, amount: refund, token: "var(--keep)", fill: `${pct(refund)}%`, pctLine: `${fmtPct(refund)}% ${c.ofYear}`, desc: c.backDesc }
      : { key: "due", label: c.stillToPay, amount: due, token: "var(--out)", fill: `${pct(due)}%`, pctLine: `${fmtPct(due)}% ${c.ofYear}`, desc: c.dueDesc },
  ];

  return (
    <>
      <section className="headline print:hidden" aria-label={c.sectionLabel}>
        <div className="channels">
          {channels.map((ch) => (
            <div
              key={ch.key}
              className="ch"
              style={{ "--c": ch.token, "--fill": filled ? ch.fill : "0%" } as CSSProperties}
            >
              <div className="k">{ch.label}</div>
              <div className="v">
                <AnimatedAmount value={ch.amount} lang={lang} />
              </div>
              <div className="pct">{ch.pctLine}</div>
              <div className="d">{ch.desc}</div>
            </div>
          ))}
        </div>

        <div className="split">
          <div className="cap">{c.whereItWent}</div>
          <div
            className="bar"
            role="img"
            aria-label={visible
              .map((s) => `${s.label}: ${formatMoney(s.amount, lang)} (${fmtPct(s.amount)}%)`)
              .join("; ")}
          >
            {visible.map((s) => (
              <i
                key={s.key}
                className={s.cls}
                style={{ width: filled ? `${pct(s.amount)}%` : 0, minWidth: "7px" }}
              />
            ))}
          </div>
          <div className="keys">
            {visible.map((s) => (
              <span key={s.key} className="key">
                <i style={{ background: s.token }} />
                {s.label} <span className="amt-s">{formatMoney(s.amount, lang)}</span>{" "}
                <span className="p">{fmtPct(s.amount)}%</span>
              </span>
            ))}
          </div>
          {hasWidenedSliver && <p className="footnote">{c.sliceNote}</p>}
        </div>
      </section>

      {mode === "simple" && (
        <div className="thread print:hidden">{c.howToRead}</div>
      )}
    </>
  );
}
