"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, Lock, ArrowRight, Smartphone, KeyRound, FileCheck2, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { Lang } from "@/lib/types";

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentSuccess: () => Promise<void>;
  assessmentYear: string;
  lang?: Lang;
  citizenName?: string;
  citizenPan?: string;
}

type ModalStep = "auth" | "otp" | "consent" | "fetching";

export default function DigiLockerModal({
  isOpen,
  onClose,
  onConsentSuccess,
  assessmentYear,
  lang = "en",
  citizenName,
  citizenPan,
}: DigiLockerModalProps) {
  const [step, setStep] = useState<ModalStep>("auth");
  const [identifier, setIdentifier] = useState(citizenPan || "9876543210");
  const [pin, setPin] = useState("949494");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const fy = `${Number(assessmentYear.slice(0, 4)) - 1}-${String(Number(assessmentYear.slice(5)) - 1).padStart(2, "0")}`;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || identifier.length < 6) {
      setError("Please enter a valid Mobile Number, Aadhaar, or PAN");
      return;
    }
    if (!pin || pin.length < 4) {
      setError("Please enter your 4-6 digit Security PIN");
      return;
    }
    setError(null);
    setStep("otp");
    setOtp(["9", "4", "9", "4", "9", "4"]);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code !== "949494" && code.length !== 6) {
      setError("Invalid OTP. Try demo OTP: 949494");
      return;
    }
    setError(null);
    setStep("consent");
  };

  const handleAllowConsent = async () => {
    setIsBusy(true);
    setError(null);
    setStep("fetching");
    try {
      await onConsentSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents from DigiLocker");
      setStep("consent");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-paper rounded-[24px] border border-glass-edge shadow-2xl overflow-hidden text-start animate-in zoom-in-95 flex flex-col">
        {/* DigiLocker Official Government Top Ribbon */}
        <div className="bg-[#003366] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck size={20} className="text-[#00c070]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] tracking-wide">DigiLocker</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#00c070] text-black font-bold tracking-wider">Government of India</span>
              </div>
              <span className="text-[11px] text-white/70 block">Digital India · National e-Governance Division (NeGD)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1">
          {error && (
            <div role="alert" className="flex items-center gap-2.5 rounded-[14px] bg-bad-soft px-4 py-3 text-[12.5px] font-semibold text-bad">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: AUTHENTICATION */}
          {step === "auth" && (
            <form onSubmit={handleAuthSubmit} className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-[18px] font-extrabold text-ink">Sign in to your DigiLocker Account</h3>
                <p className="text-[12.5px] text-ink-2 mt-0.5">
                  Access official Form 16, AIS, and tax records securely through Government of India DigiLocker.
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-ink-2 mb-1.5 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-money" />
                  <span>Aadhaar / Mobile Number / PAN</span>
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 9876543210 or Aadhaar"
                  className="w-full h-[46px] px-4 rounded-[14px] bg-paper-2 border border-glass-edge font-mono text-[14px] text-ink focus:border-money outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-ink-2 mb-1.5 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-money" />
                  <span>6-Digit Security PIN</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••"
                  className="w-full h-[46px] px-4 rounded-[14px] bg-paper-2 border border-glass-edge font-mono text-[16px] text-ink focus:border-money outline-none"
                />
                <p className="text-[11px] font-mono text-ink-3 mt-1.5 flex items-center gap-1">
                  <span>Demo PIN: <strong>949494</strong></span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full h-[48px] rounded-[14px] bg-[#003366] hover:bg-[#002244] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <span>Continue to OTP</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-[18px] font-extrabold text-ink">Enter Security OTP</h3>
                <p className="text-[12.5px] text-ink-2 mt-0.5">
                  An authentication OTP has been dispatched to mobile ending in <strong className="font-mono text-ink">******8210</strong>.
                </p>
              </div>

              <div className="flex justify-center gap-2 py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const next = [...otp];
                      next[idx] = e.target.value.slice(-1);
                      setOtp(next);
                      setError(null);
                    }}
                    className="size-12 text-center font-mono text-lg font-bold rounded-[12px] bg-paper-2 border border-glass-edge focus:border-money outline-none text-ink"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-ink-3">Demo OTP: <strong className="font-mono text-ink">949494</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(["9", "4", "9", "4", "9", "4"])}
                  className="font-bold text-money hover:underline cursor-pointer"
                >
                  Auto-fill Demo OTP
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("auth")}
                  className="glass-flat h-[46px] px-4 rounded-[14px] text-xs font-semibold text-ink-2 hover:text-ink cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 h-[46px] rounded-[14px] bg-[#003366] hover:bg-[#002244] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <span>Verify OTP</span>
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONSENT & SCOPE */}
          {step === "consent" && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-[18px] font-extrabold text-ink flex items-center gap-2">
                  <FileCheck2 size={20} className="text-[#00c070]" />
                  <span>Provide Consent to Wapsi</span>
                </h3>
                <p className="text-[12.5px] text-ink-2 mt-0.5">
                  <strong>Income Tax Department / Wapsi</strong> is requesting permission to fetch the following documents issued in your DigiLocker account for FY {fy} (AY {assessmentYear}):
                </p>
              </div>

              <div className="space-y-2.5 bg-paper-2/70 border border-line rounded-[18px] p-4 text-[13px]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#00c070] mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-ink font-semibold">Form 16 (Part A & Part B) — FY {fy}</strong>
                    <span className="text-[11px] text-ink-3">Salary income, employer TDS u/s 192, and Chapter VI-A deductions</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-line/60">
                  <CheckCircle2 size={16} className="text-[#00c070] mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-ink font-semibold">Annual Information Statement (AIS / TIS)</strong>
                    <span className="text-[11px] text-ink-3">Savings interest, fixed deposit interest, dividends, and tax credits</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-line/60">
                  <CheckCircle2 size={16} className="text-[#00c070] mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-ink font-semibold">Form 26AS Tax Credit Statement</strong>
                    <span className="text-[11px] text-ink-3">Official verified TDS & advance tax challans paid to the Government</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-[14px] bg-ok-soft/60 border border-ok/20 text-[11.5px] text-ink-2 flex items-center gap-2 font-mono">
                <Lock size={14} className="text-ok shrink-0" />
                <span>Consent Purpose: Tax return preparation for Assessment Year {assessmentYear}. Read-only, session bound.</span>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-flat h-[46px] px-5 rounded-[14px] text-xs font-semibold text-ink-2 hover:text-ink cursor-pointer"
                >
                  Deny
                </button>
                <button
                  type="button"
                  onClick={() => void handleAllowConsent()}
                  disabled={isBusy}
                  className="flex-1 h-[46px] rounded-[14px] bg-[#00c070] hover:bg-[#00ab63] text-black font-extrabold text-[14px] flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  {isBusy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                  <span>Allow & Fetch Documents</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FETCHING IN PROGRESS */}
          {step === "fetching" && (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="size-16 rounded-full bg-[#003366]/10 border-2 border-[#003366] mx-auto flex items-center justify-center">
                <Loader2 size={32} className="text-[#003366] animate-spin" />
              </div>
              <div>
                <h4 className="text-[16px] font-extrabold text-ink">Connecting to Government DigiLocker…</h4>
                <p className="text-[12.5px] text-ink-3 mt-1">Retrieving official Form 16, AIS and 26AS records for {citizenName || citizenPan || "Taxpayer"}…</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="bg-paper-2 px-5 py-2.5 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-3 font-mono">
          <span className="flex items-center gap-1.5 text-ok">
            <Lock size={12} />
            <span>256-Bit SSL Encrypted Govt Connection</span>
          </span>
          <span>Information Technology Act, 2000</span>
        </div>
      </div>
    </div>
  );
}
