"use client";

import { AnimatePresence, m } from "motion/react";
import { Check, VolumeX, Volume2 } from "lucide-react";
import type { Persona, Lang } from "../../lib/types";
import { localize } from "../mock-i18n";

interface NoticeModalProps {
  activeNoticeId: string | null;
  persona: Persona | null;
  lang: Lang;
  noticeResponseText: string;
  noticeAgreed: "agree" | "disagree" | null;
  isSpeechListening: boolean;
  setNoticeResponseText: (v: string) => void;
  setNoticeAgreed: (v: "agree" | "disagree") => void;
  toggleSpeechMock: () => void;
  saveNoticeResponse: () => void;
  onClose: () => void;
}

export default function NoticeModal({
  activeNoticeId,
  persona,
  lang,
  noticeResponseText,
  noticeAgreed,
  isSpeechListening,
  setNoticeResponseText,
  setNoticeAgreed,
  toggleSpeechMock,
  saveNoticeResponse,
  onClose,
}: NoticeModalProps) {
  return (
    <AnimatePresence>
      {activeNoticeId && persona && (
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
            className="bg-paper border border-line max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 text-left"
          >
            <div className="space-y-2 border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink leading-tight">
                {localize(persona.notices.find(n => n.id === activeNoticeId)?.headline, lang)}
              </h3>
              <span className="block text-xs font-mono text-ink-3">
                DIN &mdash; {persona.notices.find(n => n.id === activeNoticeId)?.din}
              </span>
            </div>

            <div className="space-y-4">
              {/* Response Toggles */}
              <div className="space-y-2">
                <span className="block text-xs font-mono uppercase text-ink-2">{localize("Response Position", lang)}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNoticeAgreed("agree")}
                    className={`flex-1 py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      noticeAgreed === "agree" 
                        ? "bg-money-soft border-money text-money" 
                        : "border-line text-ink-2 hover:bg-paper-2"
                    }`}
                  >
                    <Check size={14} />
                    <span>{localize("I Agree with Department", lang)}</span>
                  </button>
                  
                  <button
                    onClick={() => setNoticeAgreed("disagree")}
                    className={`flex-1 py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      noticeAgreed === "disagree" 
                        ? "bg-alarm-soft border-alarm text-alarm" 
                        : "border-line text-ink-2 hover:bg-paper-2"
                    }`}
                  >
                    <VolumeX size={14} />
                    <span>{localize("I Disagree (Submit Proof)", lang)}</span>
                  </button>
                </div>
              </div>

              {/* Reply text statement */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-ink-2">
                  <span>{localize("Response Statement (Draft)", lang)}</span>
                  <button
                    onClick={toggleSpeechMock}
                    className={`flex items-center gap-1 font-semibold ${isSpeechListening ? "text-alarm animate-pulse" : "text-money hover:text-money-deep"}`}
                  >
                    <Volume2 size={12} />
                    <span>{isSpeechListening ? localize("Listening...", lang) : localize("Dictate Statement", lang)}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={noticeResponseText}
                  onChange={(e) => setNoticeResponseText(e.target.value)}
                  placeholder={localize("Explain your disagreement or agreement...", lang)}
                  className="w-full bg-paper-2 border border-line text-xs p-3 rounded focus:outline-none focus:border-money resize-none"
                />
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
                onClick={saveNoticeResponse}
                disabled={!noticeAgreed || !noticeResponseText}
                className="flex-1 bg-navy hover:opacity-90 text-paper dark:text-white py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {localize("Send Response", lang)}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
