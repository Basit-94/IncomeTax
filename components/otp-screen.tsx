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
  /** Server-auth status line: verifying / unreachable / rejected detail. */
  authNote?: string | null;
  authBusy?: boolean;
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
  authNote,
  authBusy = false,
}: OtpScreenProps) {
  return (
    <div className="surface-panel mx-auto mt-6 max-w-md space-y-8 p-6 text-center sm:mt-12 sm:p-8">
      <div className="space-y-3">
        <div className="w-12 h-12 bg-money-soft text-money rounded-full flex items-center justify-center mx-auto mb-2">
          <UserCheck size={24} />
        </div>
        <p className="text-sm font-semibold text-money">{t.shell.productName}</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">{t.login.portalHeading}</h2>
        <p className="text-xs text-ink-2 leading-relaxed">
          {t.login.otpSentTo(persona?.mobile ?? "")}
        </p>
        <p className="text-xs leading-relaxed text-ink-2">{t.login.weWillWait}</p>
      </div>

      {/* Passcode Boxes */}
      <div className="space-y-4">
        {/* dir="ltr": a digit sequence reads left-to-right in every language, so the
            boxes must keep their order even when <html dir="rtl"> (Urdu, Kashmiri,
            Sindhi) — otherwise the code renders reversed. */}
        <div
          dir="ltr"
          role="group"
          aria-label={t.login.otpGroupLabel}
          className="flex justify-center space-x-2"
        >
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={idx === 0 ? "one-time-code" : "off"}
              aria-label={t.login.otpDigitLabel(idx + 1, otp.length)}
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

        {/* WCAG 4.1.3: both live regions stay mounted so the async auth text is
            announced when it appears, instead of arriving with the region. */}
        <div className="space-y-1">
          <div role="status" aria-live="polite">
            {authNote && !otpError && (
              <span className="block text-xs font-medium text-ink-2">{authNote}</span>
            )}
          </div>
          <div role="alert">
            {otpError && (
              <span className="block text-xs text-alarm font-medium">
                {authNote ?? t.login.incorrectCode}
              </span>
            )}
          </div>
        </div>
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
            {t.login.mockCodeLabel}:{" "}
            {/* Same reason as the boxes: a code is LTR content in an RTL locale. */}
            <strong dir="ltr" className="inline-block text-money">
              {mockCode}
            </strong>
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
          disabled={authBusy}
          className="flex-1 bg-navy hover:opacity-90 text-paper py-3 px-4 rounded-lg transition-colors text-sm font-semibold disabled:opacity-60"
        >
          {authBusy ? t.login.authVerifying : t.login.verifyEnter}
        </button>
      </div>
    </div>
  );
}
