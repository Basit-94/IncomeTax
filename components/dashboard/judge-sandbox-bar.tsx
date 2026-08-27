"use client";

import React from "react";
import { ShieldCheck, Edit, Settings } from "lucide-react";

export interface JudgeVector {
  id: string;
  name: string;
  description: string;
  salary: number;
  interest: number;
  tds: number;
  regime: "new" | "old";
  ageBand: "below_60" | "60_to_80" | "above_80";
  claims?: { section: string; amount: number }[];
  noticeDin?: string;
}

export const JUDGE_VECTORS: JudgeVector[] = [
  {
    id: "6.5l-zero-tax",
    name: "₹6.5L Zero-Tax (New)",
    description: "Salary ₹6.5L. Nil tax due to ₹12L exemption threshold.",
    salary: 650000,
    interest: 3200,
    tds: 0,
    regime: "new",
    ageBand: "below_60",
    claims: []
  },
  {
    id: "12.4l-marginal-relief",
    name: "₹12.4L Marginal Relief (New)",
    description: "Salary ₹12.4L. Section 87A Marginal Relief capping tax.",
    salary: 1240000,
    interest: 8400,
    tds: 66000,
    regime: "new",
    ageBand: "below_60",
    claims: []
  },
  {
    id: "24l-old-regime",
    name: "₹24L Old Regime",
    description: "Salary ₹24L, Old slabs & capped deductions.",
    salary: 2400000,
    interest: 24000,
    tds: 410000,
    regime: "old",
    ageBand: "below_60",
    claims: [
      { section: "80C", amount: 150000 },
      { section: "80D", amount: 25000 }
    ]
  },
  {
    id: "28l-high-earner",
    name: "₹28L High Earner",
    description: "Salary ₹28L. Illustrating top 30% slab rate.",
    salary: 2800000,
    interest: 15000,
    tds: 580000,
    regime: "new",
    ageBand: "below_60",
    claims: []
  },
  {
    id: "rakesh-notice",
    name: "₹94k Notice Set-Off (Rakesh)",
    description: "Rakesh Kumar: Section 143(1)(a) & 245 old-demand notices.",
    salary: 1860000,
    interest: 22400,
    tds: 286840,
    regime: "new",
    ageBand: "below_60",
    claims: []
  }
];

interface JudgeSandboxBarProps {
  onEditFacts: () => void;
  antigravityUi: boolean;
  onToggleAntigravityUi: () => void;
}

export function JudgeSandboxBar({
  onEditFacts,
  antigravityUi,
  onToggleAntigravityUi,
}: JudgeSandboxBarProps) {
  return (
    <div className="bg-navy border-b border-money/20 text-white px-4 py-3 shadow-md z-30 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-money shrink-0" />
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-money block">
              Judge Evaluation Sandbox
            </span>
            <span className="text-xs text-slate-300">
              Verify calculations, slabs, and Section 87A marginal relief on the fly.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleAntigravityUi}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              antigravityUi
                ? "bg-emerald-500 text-slate-950 border border-emerald-450 shadow-md"
                : "bg-teal-900 text-emerald-300 border border-teal-800 hover:border-teal-705"
            }`}
          >
            <span>✦ Redesigned Dashboard</span>
          </button>

          <button
            onClick={onEditFacts}
            className="text-xs bg-money/15 text-money border border-money/30 hover:bg-money/25 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Edit size={12} />
            <span>Quick Edit Facts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
