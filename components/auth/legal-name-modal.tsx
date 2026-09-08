"use client";

import React, { useState } from "react";
import { ShieldCheck, UserCheck, ArrowRight } from "lucide-react";
import { MunshiAvatar } from "../brand/munshi";
import { localize } from "../mock-i18n";
import type { Lang } from "@/lib/types";

interface LegalNameModalProps {
  pan: string;
  lang: Lang;
  initialName?: string;
  isOpen: boolean;
  onConfirm: (fullName: string) => void;
  onCancel?: () => void;
}

export function LegalNameModal({
  pan,
  lang,
  initialName = "",
  isOpen,
  onConfirm,
  onCancel,
}: LegalNameModalProps) {
  const [name, setName] = useState(initialName.replace(/^Citizen\s+\d{4}$/i, "").trim());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      setError(localize("Please enter your full legal name as per your PAN card.", lang));
      return;
    }
    setError(null);
    onConfirm(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass rounded-[26px] border border-glass-edge shadow-2xl p-6 sm:p-7 space-y-5 relative">
        <div className="flex items-start gap-3.5">
          <MunshiAvatar size={40} state="explaining" />
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-bg text-amber-ink border border-money/30">
              <ShieldCheck size={12} className="text-money" />
              <span>{localize("AY 2026-27 · Identity Verification", lang)}</span>
            </span>
            <h3 className="text-lg font-bold text-ink tracking-tight font-serif">
              {localize("What should we call you?", lang)}
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              {localize(
                "Please enter your full legal name as registered on your PAN card. We will use this to address you respectfully across Wapsi and generate your official Form ITR-V.",
                lang
              )}
            </p>
          </div>
        </div>

        {/* PAN pill display */}
        <div className="px-3.5 py-2 rounded-[14px] bg-paper-2 border border-line flex items-center justify-between">
          <span className="text-xs text-ink-3 font-medium">{localize("Permanent Account Number (PAN)", lang)}</span>
          <span className="text-xs font-bold font-mono text-ink tracking-wider">{pan}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center justify-between">
              <span>{localize("Full Legal Name (as per PAN)", lang)}</span>
              <span className="text-[10px] text-ink-3 font-normal font-sans">{localize("Required", lang)}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={localize("e.g. Arjun Mehta", lang)}
                className="w-full h-11 px-3.5 rounded-[14px] border border-line bg-paper text-ink text-sm font-medium placeholder:text-ink-3 focus:outline-none focus:border-money focus:ring-2 focus:ring-money/20 transition"
              />
              <UserCheck size={16} className="absolute right-3.5 top-3 text-ink-3 pointer-events-none" />
            </div>
            {error && <p className="text-xs text-alarm font-medium mt-1">{error}</p>}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 h-10 rounded-[12px] text-xs font-semibold text-ink-2 hover:text-ink transition cursor-pointer"
              >
                {localize("Back", lang)}
              </button>
            )}
            <button
              type="submit"
              className="btn-primary flex-1 sm:flex-initial px-5 h-10 rounded-[12px] text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{localize("Save Name & Continue", lang)}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LegalNameModal;
