"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { Munshi } from "./brand/munshi";
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
    <div className="glass mx-auto mt-4 w-full max-w-[448px] rounded-[24px] p-6 text-center sm:mt-10 sm:p-8 flex flex-col items-center gap-5">
      <Munshi size={96} state={otpError ? "error" : authBusy ? "working" : "secure"} />
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[.08em] text-money">{t.shell.productName} · {t.shell.productNativeName}</p>
        <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-ink">{t.login.portalHeading}</h2>
        <p className="mt-1.5 text-[13.5px] text-ink-2 leading-[1.55]">
          {t.login.otpSentTo(persona?.mobile ?? "")} {t.login.weWillWait}
        </p>
      </div>

      {/* Passcode Boxes */}
      <div className="w-full space-y-3">
        {/* dir="ltr": a digit sequence reads left-to-right in every language, so the
            boxes must keep their order even when <html dir="rtl"> (Urdu, Kashmiri,
            Sindhi) — otherwise the code renders reversed. */}
        <div
          dir="ltr"
          role="group"
          aria-label={t.login.otpGroupLabel}
          className="flex justify-center gap-2 max-[380px]:gap-1.5"
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
              className={`w-[46px] h-14 sm:w-12 rounded-[14px] bg-white/85 dark:bg-white/10 border-[1.5px] text-center font-mono text-[22px] font-bold text-ink outline-none transition-[border-color,box-shadow] ${
                otpError ? "border-bad shadow-[0_0_0_3px_rgba(217,64,58,.15)]" : "border-glass-edge focus:border-money"
              }`}
            />
          ))}
        </div>

        {/* WCAG 4.1.3: both live regions stay mounted so the async auth text is
            announced when it appears, instead of arriving with the region. */}
        <div className="space-y-1">
          <div role="status" aria-live="polite">
            {authNote && !otpError && (
              <span className="block text-[13px] font-medium text-ink-2">{authNote}</span>
            )}
          </div>
          <div role="alert">
            {otpError && (
              <span className="block text-[13px] font-semibold text-bad">
                {authNote ?? t.login.incorrectCode}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full rounded-[16px] bg-white/55 dark:bg-white/[0.06] border border-glass-edge px-4 py-3.5 space-y-1.5 text-left text-[12.5px] text-ink-2">
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <Sparkles size={13} className="text-money" aria-hidden="true" />
          <span>{t.login.prototypeBox}</span>
        </div>
        <p className="leading-relaxed">
          {t.login.mockNotice}
        </p>
        <div className="pt-1 flex justify-between items-center">
          <span className="font-mono text-[13px] text-ink-3 tracking-[.02em]">
            {t.login.mockCodeLabel}:{" "}
            {/* Same reason as the boxes: a code is LTR content in an RTL locale. */}
            <strong dir="ltr" className="inline-block text-money">
              {mockCode}
            </strong>
          </span>
          <button
            onClick={onAutoFill}
            className="text-[13px] text-money hover:underline underline-offset-2 font-bold cursor-pointer"
          >
            {t.login.autoFill}
          </button>
        </div>
      </div>

      <div className="flex w-full gap-2.5">
        <button
          onClick={onBack}
          className="glass-flat flex-1 h-[46px] rounded-[14px] px-4 text-[14.5px] font-semibold text-ink-2 hover:text-ink transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{t.common.back}</span>
        </button>
        <button
          onClick={onVerify}
          disabled={authBusy}
          className="ink-surface flex-1 h-[46px] rounded-[14px] px-4 text-[14.5px] font-bold hover:opacity-90 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {authBusy ? t.login.authVerifying : t.login.verifyEnter}
        </button>
      </div>
    </div>
  );
}
