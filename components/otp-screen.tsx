"use client";

import { UserCheck, ArrowLeft, Sparkles } from "lucide-react";
import type { Persona } from "../lib/types";
import type { Dict } from "../lib/i18n";

interface OtpScreenProps {
  persona: Persona | null;
  t: Dict;
  otp: string[];
  otpError: boolean;
  mockCode: string;
  handleOtpChange: (val: string, index: number) => void;
  onAutoFill: () => void;
  onBack: () => void;
  onVerify: () => void;
}

export default function OtpScreen({
  persona,
  t,
  otp,
  otpError,
  mockCode,
  handleOtpChange,
  onAutoFill,
  onBack,
  onVerify,
}: OtpScreenProps) {
  return (
    <div className="max-w-md mx-auto space-y-8 mt-12 text-center">
      <div className="space-y-3">
        <div className="w-12 h-12 bg-money-soft text-money rounded-full flex items-center justify-center mx-auto mb-2">
          <UserCheck size={24} />
        </div>
        <h2 className="text-xl font-bold text-ink">{t.login.portalHeading}</h2>
        <p className="text-xs text-ink-2 leading-relaxed">
          {t.login.otpSentTo(persona?.mobile || "90000 00000")}
        </p>
      </div>

      {/* Passcode Boxes */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, idx)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && otp[idx] === "" && idx > 0) {
                  const prevInput = document.getElementById(`otp-${idx - 1}`);
                  prevInput?.focus();
                }
              }}
              className={`w-12 h-14 bg-paper-2 border ${
                otpError ? "border-alarm" : "border-line focus:border-money"
              } text-xl font-semibold text-center rounded-lg focus:outline-none transition-colors`}
            />
          ))}
        </div>

        {otpError && (
          <span className="block text-xs text-alarm font-medium">
            {t.login.incorrectCode}
          </span>
        )}
      </div>

      <div className="bg-paper-2 border border-line rounded-lg p-4 space-y-2 text-left">
        <div className="flex items-center space-x-2 text-xs font-semibold text-ink">
          <Sparkles size={12} className="text-money" />
          <span>{t.login.prototypeBox}</span>
        </div>
        <p className="text-[0.7rem] text-ink-2 leading-relaxed">
          {t.login.mockNotice}
        </p>
        <div className="pt-2 flex justify-between items-center">
          <span className="text-[0.75rem] font-mono text-ink-3">
            {t.login.mockCodeLabel}: <strong className="text-money">{mockCode}</strong>
          </span>
          <button
            onClick={onAutoFill}
            className="text-xs text-money hover:underline underline-offset-2 font-semibold"
          >
            {t.login.autoFill}
          </button>
        </div>
      </div>

      <div className="flex space-x-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 border border-line text-ink-2 py-3 px-4 rounded-lg hover:bg-paper-2 transition-colors text-sm font-semibold flex items-center justify-center space-x-1"
        >
          <ArrowLeft size={16} />
          <span>{t.common.back}</span>
        </button>
        <button
          onClick={onVerify}
          className="flex-1 bg-money hover:bg-money-deep text-paper py-3 px-4 rounded-lg transition-colors text-sm font-semibold"
        >
          {t.login.verifyEnter}
        </button>
      </div>
    </div>
  );
}
