"use client";

import { AnimatePresence, m } from "motion/react";
import { Check, VolumeX, Volume2 } from "lucide-react";
import { MunshiAvatar } from "../brand/munshi";
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
          className="fixed inset-0 bg-[rgba(27,17,64,.55)] backdrop-blur-sm z-50 flex items-center justify-center p-4 max-md:items-end max-md:p-0"
        >
          <m.div 
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="sheet-m bg-paper max-w-lg w-full rounded-[26px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] overflow-hidden text-left"
          >
            <div className="ink-surface text-on-ink px-6 py-[18px] flex items-center gap-3.5">
              <span className="size-[42px] rounded-[14px] bg-white/10 flex items-center justify-center shrink-0">
                <Volume2 size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[17px] font-extrabold leading-tight">
                  {localize(persona.notices.find(n => n.id === activeNoticeId)?.headline, lang)}
                </h3>
                <span className="block text-[11px] font-mono text-[#CDBDFF] tracking-[.02em] truncate">
                  DIN &mdash; {persona.notices.find(n => n.id === activeNoticeId)?.din}
                </span>
              </div>
            </div>

            <div className="space-y-4 px-6 pt-5">
              {/* Response Toggles */}
              <div className="space-y-2">
                <span className="block text-xs font-mono uppercase text-ink-2">{localize("Response Position", lang)}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNoticeAgreed("agree")}
                    className={`flex-1 h-11 px-3 rounded-[12px] border-[1.5px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
 noticeAgreed === "agree"
                        ? "bg-amber-bg border-money text-amber-ink"
                        : "border-glass-edge bg-white/60 dark:bg-white/10 text-ink-2 hover:border-money/50"
                    }`}
                  >
                    <Check size={14} />
                    <span>{localize("I Agree with Department", lang)}</span>
                  </button>
                  
                  <button
                    onClick={() => setNoticeAgreed("disagree")}
                    className={`flex-1 h-11 px-3 rounded-[12px] border-[1.5px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
 noticeAgreed === "disagree"
                        ? "bg-bad-soft border-bad text-bad"
                        : "border-glass-edge bg-white/60 dark:bg-white/10 text-ink-2 hover:border-money/50"
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
                  className="w-full bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge text-[13px] p-3 rounded-[14px] focus:outline-none focus:border-money resize-none"
                />
              </div>
            </div>

            <p className="flex items-center gap-2.5 px-6 pt-4 text-[12.5px] text-ink-2">
              <MunshiAvatar size={26} />
              <span>{localize("Each notice says what happens if you do nothing, and by when. Nothing is sent until you approve it.", lang)}</span>
            </p>

            <div className="flex gap-2 px-6 py-5">
              <button
                onClick={onClose}
                className="flex-1 h-[46px] rounded-[14px] bg-white/60 dark:bg-white/10 border border-glass-edge text-ink text-[14.5px] font-semibold hover:border-money/50 transition-colors cursor-pointer"
              >
                {localize("Cancel", lang)}
              </button>
              <button
                onClick={saveNoticeResponse}
                disabled={!noticeAgreed || !noticeResponseText}
                className="flex-1 h-[46px] rounded-[14px] ink-surface hover:opacity-90 text-on-ink text-[14.5px] font-bold transition-colors cursor-pointer disabled:opacity-50"
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
