"use client";

import { AnimatePresence, m } from "motion/react";
import { Building2 } from "lucide-react";
import type { Lang } from "../../lib/types";
import { localize } from "../mock-i18n";

interface BankIfscModalProps {
  active: boolean;
  lang: Lang;
  ifscInput: string;
  ifscError: string | null;
  handleIfscInputChange: (val: string) => void;
  saveBankFix: () => void;
  onClose: () => void;
}

export default function BankIfscModal({
  active,
  lang,
  ifscInput,
  ifscError,
  handleIfscInputChange,
  saveBankFix,
  onClose,
}: BankIfscModalProps) {
  return (
    <AnimatePresence>
      {active && (
        <m.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <m.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-paper border border-line max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 text-left"
          >
            <div className="space-y-2">
              <h3 className="text-base font-bold text-ink border-b border-line pb-2 flex items-center gap-1.5">
                <Building2 size={18} className="text-money" />
                <span>{localize("Update Bank IFSC", lang)}</span>
              </h3>
              <p className="text-xs text-ink-2 leading-relaxed">
                {localize("Verify the 11-digit bank routing code (IFSC) to validate bank details.", lang)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-2 mb-1">{localize("IFSC Code", lang)}</label>
                <input
                  type="text"
                  aria-label={localize("IFSC Code", lang)}
                  value={ifscInput}
                  onChange={(e) => handleIfscInputChange(e.target.value)}
                  maxLength={11}
                  className={`w-full bg-paper-2 border ${
                    ifscError ? "border-alarm animate-shake" : "border-line focus:border-money"
                  } text-base font-mono font-semibold tracking-wider px-3 py-2 rounded focus:outline-none uppercase`}
                />
                {ifscError && (
                  <span className="block text-xs text-alarm mt-1 font-medium">
                    {ifscError}
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 border border-line text-ink-2 py-2 rounded hover:bg-paper-2 text-sm font-semibold transition-colors"
              >
                {localize("Cancel", lang)}
              </button>
              <button
                onClick={saveBankFix}
                className="flex-1 bg-money hover:bg-money-deep text-paper py-2 rounded text-sm font-semibold transition-colors"
              >
                {localize("Validate Bank Code", lang)}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
