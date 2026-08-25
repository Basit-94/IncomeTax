"use client";

import { AnimatePresence, m } from "motion/react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import type { Persona } from "../../lib/types";
import type { Dict } from "../../lib/i18n";

interface DisputeModalProps {
  active: boolean;
  persona: Persona | null;
  t: Dict;
  disputeAmount: string;
  disputeReason: string;
  isSpeechListening: boolean;
  setDisputeAmount: (v: string) => void;
  setDisputeReason: (v: string) => void;
  toggleSpeechMock: () => void;
  saveDispute: () => void;
  onClose: () => void;
}

export default function DisputeModal({
  active,
  persona,
  t,
  disputeAmount,
  disputeReason,
  isSpeechListening,
  setDisputeAmount,
  setDisputeReason,
  toggleSpeechMock,
  saveDispute,
  onClose,
}: DisputeModalProps) {
  return (
    <AnimatePresence>
      {active && persona && (
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
            <h3 className="text-lg font-bold text-ink border-b border-line pb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-money" />
              <span>{t.file.disputeHeading}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-2 mb-1.5">
                  {t.file.disputeAmountLabel} (₹)
                </label>
                <input
                  type="number"
                  value={disputeAmount}
                  onChange={(e) => setDisputeAmount(e.target.value)}
                  className="w-full bg-paper-2 border border-line text-base font-semibold px-3 py-2 rounded focus:outline-none focus:border-money"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-2 mb-1.5 flex justify-between items-center">
                  <span>{t.file.disputeReasonLabel}</span>
                  <button
                    onClick={toggleSpeechMock}
                    className={`text-xs flex items-center gap-1 font-semibold ${isSpeechListening ? "text-alarm animate-pulse" : "text-money hover:text-money-deep"}`}
                  >
                    {isSpeechListening ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    <span>{isSpeechListening ? t.file.voiceListening : t.file.dictate}</span>
                  </button>
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder={t.file.disputePlaceholder}
                  className="w-full bg-paper-2 border border-line text-xs p-3 rounded focus:outline-none focus:border-money resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 border border-line text-ink-2 py-2 rounded hover:bg-paper-2 text-sm font-semibold transition-colors"
              >
                {t.common.close}
              </button>
              <button
                onClick={saveDispute}
                className="flex-1 bg-money hover:bg-money-deep text-paper py-2 rounded text-sm font-semibold transition-colors"
              >
                {t.file.disputeSave}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
