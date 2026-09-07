"use client";

import { AnimatePresence, m } from "motion/react";
import { Building2 } from "lucide-react";
import type { Lang } from "../../lib/types";
import { localize } from "../mock-i18n";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";

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
          className="fixed inset-0 bg-[rgba(27,17,64,.55)] backdrop-blur-sm z-50 flex items-center justify-center p-4 max-md:items-end max-md:p-0"
        >
          <m.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="sheet-m bg-paper max-w-md w-full rounded-[26px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] overflow-hidden text-left"
          >
            <div className="ink-surface text-on-ink px-6 py-[18px] flex items-center gap-3.5">
              <span className="size-[42px] rounded-[14px] bg-white/10 flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </span>
              <div>
                <h3 className="text-[17px] font-extrabold leading-tight">{localize("Update Bank IFSC", lang)}</h3>
                <p className="text-[12.5px] text-[#CDBDFF]">
                  {localize("Verify the 11-digit bank routing code (IFSC) to validate bank details.", lang)}
                </p>
              </div>
            </div>

            <div className="space-y-3 px-6 pt-5">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-2 mb-1">{localize("IFSC Code", lang)}</label>
                <MockField>
                  <input
                  type="text"
                  aria-label={localize("IFSC Code", lang)}
                  value={ifscInput}
                  onChange={(e) => handleIfscInputChange(e.target.value)}
                  maxLength={11}
                  className={`w-full bg-white/80 dark:bg-white/10 border-[1.5px] ${
 ifscError ? "border-alarm animate-shake" : "border-line focus:border-money"
                  } text-base font-mono font-semibold tracking-[.14em] px-4 h-12 rounded-[14px] focus:outline-none uppercase`}
                />
                  <MockFill onFill={() => handleIfscInputChange(MOCK.ifsc)} />
                </MockField>
                {ifscError && (
                  <span className="block text-xs text-alarm mt-1 font-medium">
                    {ifscError}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 px-6 py-5">
              <button
                onClick={onClose}
                className="flex-1 h-[46px] rounded-[14px] bg-white/60 dark:bg-white/10 border border-glass-edge text-ink text-[14.5px] font-semibold hover:border-money/50 transition-colors cursor-pointer"
              >
                {localize("Cancel", lang)}
              </button>
              <button
                onClick={saveBankFix}
                className="flex-1 h-[46px] rounded-[14px] ink-surface hover:opacity-90 text-on-ink text-[14.5px] font-bold transition-colors cursor-pointer"
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
