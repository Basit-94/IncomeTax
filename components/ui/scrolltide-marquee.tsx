"use client";

import React from "react";

const TICKER_ITEMS = [
  "AY 2026-27 TAX ARCHITECTURE",
  "23 CONSTITUTIONAL LANGUAGES",
  "CLIENT-SIDE ZERO-KNOWLEDGE VAULT",
  "SECTION 139(1) STATUTORY ENGINE",
  "CASS AUDIT RADAR (§143(1) IMMUNITY)",
  "INSTANT CHALLAN 280 UPI QR",
  "DUAL REGIME OPTIMIZER (80C / 80D / 80CCD)",
  "ZERO SERVER LOGGING · 100% CLIENT COMPLIANT",
  "AUTOMATED ITR-V RECEIPT SIGN-OFF",
];

export default function ScrolltideMarquee() {
  return (
    <div className="relative w-full overflow-hidden border-y border-white/10 dark:border-white/10 py-3 bg-[#080d19]/90 dark:bg-[#070b14]/95 text-slate-300 backdrop-blur-md">
      {/* Edge gradient mask for smooth fade in/out */}
      <div
        className="flex w-max animate-marquee gap-8 whitespace-nowrap text-[11px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-400 select-none"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        {/* Render twice for seamless continuous loop */}
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
          <span key={idx} className="inline-flex items-center gap-8">
            <span className="hover:text-cyan-300 transition-colors cursor-default">
              {item}
            </span>
            <span className="text-cyan-400/80 font-serif text-xs">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
