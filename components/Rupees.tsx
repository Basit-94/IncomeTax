"use client";

/**
 * Money on screen.
 *
 * Two rules, applied in one place so they cannot be forgotten row by row:
 *   1. Indian digit grouping — ₹4,20,000, not ₹420,000. `lib/money.ts` does this
 *      through Intl, which knows the lakh/crore system.
 *   2. `font-mono tabular-nums` — fixed-width digits, so a column of figures
 *      lines up and a number that changes under an animation does not reflow the
 *      row it sits in.
 *
 * Values are rounded to whole rupees before formatting. A raw float is never
 * shown: 10399.999999999998 on a tax screen destroys trust faster than being
 * one rupee off, and the engine works in whole rupees anyway.
 */

import { formatMoney } from "../lib/money";

export interface RupeesProps {
  value: number;
  className?: string;
  /** Struck through — used for the superseded/reported figure beside a dispute. */
  strike?: boolean;
  /** Prefix a + or − so a delta reads as a direction, not just a magnitude. */
  showSign?: boolean;
}

export function Rupees({ value, className = "", strike = false, showSign = false }: RupeesProps) {
  const rounded = Math.round(value);
  const sign = showSign && rounded > 0 ? "+" : "";
  return (
    <span
      className={`font-mono tabular-nums ${strike ? "line-through" : ""} ${className}`}
    >
      {sign}
      {formatMoney(rounded)}
    </span>
  );
}
