"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { formatMoney } from "../../lib/money";
import type { Lang } from "../../lib/types";

export interface AnimatedAmountProps {
  value: number;
  lang?: Lang;
  className?: string;
}

/**
 * Antigravity Spring-Physics Counter component.
 * Uses Framer Motion's spring solver to smoothly animate numeric changes.
 * Formats values into the Indian numbering system (lakh/crore) via the formatMoney helper.
 */
export function AnimatedAmount({
  value,
  lang = "en",
  className = "",
}: AnimatedAmountProps) {
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, { stiffness: 75, damping: 14, mass: 0.8 });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = formatMoney(Math.round(latest), lang);
      }
    });
    return unsubscribe;
  }, [springVal, lang]);

  return (
    <span ref={displayRef} className={`font-mono tabular-nums tracking-tight ${className}`}>
      {formatMoney(value, lang)}
    </span>
  );
}
