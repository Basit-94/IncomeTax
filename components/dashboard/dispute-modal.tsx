"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { AlertTriangle, Check, Sparkles, Volume2, VolumeX } from "lucide-react";
import { MunshiAvatar } from "../brand/munshi";
import type { Persona } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";
import { formatMoney } from "../../lib/money";
import { AIS_FEEDBACK_LABELS } from "../../lib/compliance/aisFeedback";
import type { AISFeedbackCode } from "../../lib/compliance/aisFeedback";

/**
 * The CBDT AIS feedback code each plain-language choice maps to. The citizen
 * picks in their own words; the code is what the department can act on, and
 * it travels with the correction into the ledger and the reconciliation
 * surface so every screen names the same reason.
 */
const CHOICE_CODE: Record<"different" | "fraud" | "joint" | "duplicate", AISFeedbackCode> = {
  different: "CODE_3",
  fraud: "CODE_5",
  joint: "CODE_4",
  duplicate: "CODE_5",
};

const TDS_REASON_CODE: Record<string, AISFeedbackCode> = {
  "Amount differs from Form 26AS/AIS": "CODE_3",
  "Deducted on wrong PAN": "CODE_4",
  "Duplicate TDS entry": "CODE_5",
};

interface DisputeModalProps {
  active: boolean;
  persona: Persona | null;
  t: Dict;
  disputeAmount: string;
  disputeReason: string;
  isSpeechListening: boolean;
  setDisputeAmount: (v: string) => void;
  setDisputeReason: (v: string) => void;
  /** The CBDT code implied by the citizen's choice; written onto the correction. */
  setDisputeFeedbackCode: (code: AISFeedbackCode) => void;
  toggleSpeechMock: () => void;
  saveDispute: () => void;
  onClose: () => void;
  isPreFilled: boolean;
  reportedAmount: number;
  reporterName: string;
  disputeTarget?: "fact" | "tax" | "claim";
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
  setDisputeFeedbackCode,
  toggleSpeechMock,
  saveDispute,
  onClose,
  isPreFilled,
  reportedAmount,
  reporterName,
  disputeTarget,
}: DisputeModalProps) {
  const [correctionChoice, setCorrectionChoice] = useState<
    "different" | "fraud" | "joint" | "duplicate"
  >("different");

  // Keep choice in sync with form state
  useEffect(() => {
    if (active) {
      setCorrectionChoice("different");
      setDisputeFeedbackCode("CODE_3");
      // Set reason default based on target type
      if (disputeTarget === "tax") {
        setDisputeReason("Amount differs from Form 26AS/AIS");
      }
    }
  }, [active, disputeTarget]);

  const handleChoiceChange = (choice: "different" | "fraud" | "joint" | "duplicate") => {
    setCorrectionChoice(choice);
    setDisputeFeedbackCode(CHOICE_CODE[choice]);
    if (choice === "fraud" || choice === "duplicate") {
      setDisputeAmount("0");
      setDisputeReason(
        choice === "fraud"
          ? "This is not my income / Fraud / Mistake"
          : "Duplicate entry in tax statement"
      );
    } else if (choice === "joint") {
      setDisputeReason("Belongs to joint account / split");
    } else {
      setDisputeReason("Amount is incorrect");
    }
  };

  const parsedAmount = Number(disputeAmount.replace(/[^0-9]/g, "")) || 0;

  return (
    <AnimatePresence>
      {active && persona && (
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
            className="sheet-m bg-paper max-w-[600px] w-full rounded-[26px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] text-left overflow-y-auto max-h-[90vh]"
          >
            <div className="ink-surface text-on-ink px-6 py-[18px] flex items-center gap-3.5">
              <span className="size-[42px] rounded-[14px] bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="text-[17px] font-extrabold leading-tight">
                  {isPreFilled
                    ? disputeTarget === "tax"
                      ? "Correct the TDS prefill"
                      : t.file.disputeSave
                    : "Edit self-declared income"}
                </h3>
                <p className="text-[12.5px] text-[#CDBDFF]">
                  {isPreFilled ? "Dispute a reported fact" : "Only what you told us — nothing a reporter filed"}
                </p>
              </div>
            </div>

            {/* PRE-FILLED INTERACTIVE MODAL */}
            {isPreFilled ? (
              <div className="space-y-4 font-sans text-sm px-6 pt-5">
                
                {/* Specific Layout for TDS/Tax */}
                {disputeTarget === "tax" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12.5px] font-bold text-ink-2 mb-1.5">
                        What was the actual TDS deducted?
                      </label>
                      <MockField>
                        <input
                        type="number"
                        placeholder="Enter actual TDS amount (e.g. 0)"
                        value={disputeAmount}
                        onChange={(e) => setDisputeAmount(e.target.value)}
                        className="w-full h-11 rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-sm text-ink focus:border-money focus:outline-none font-mono"
                      />
                        <MockFill onFill={() => setDisputeAmount(String(MOCK.savingsInterest))} />
                      </MockField>
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-bold text-ink-2 mb-1.5">
                        Reason for discrepancy
                      </label>
                      <select
                        value={disputeReason}
                        onChange={(e) => {
                          setDisputeReason(e.target.value);
                          setDisputeFeedbackCode(TDS_REASON_CODE[e.target.value] ?? "CODE_3");
                        }}
                        className="w-full h-11 rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-sm text-ink focus:border-money focus:outline-none cursor-pointer"
                      >
                        <option value="Amount differs from Form 26AS/AIS">
                          Amount differs from my Form 16 / 26AS
                        </option>
                        <option value="Deducted on wrong PAN">
                          TDS was credited to the wrong PAN
                        </option>
                        <option value="Duplicate TDS entry">
                          Duplicate TDS entry
                        </option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Standard Prefilled Income Layout */
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <MunshiAvatar size={34} />
                        <div>
                          <div className="text-[16px] font-extrabold text-ink">What&apos;s wrong with this figure?</div>
                          <p className="text-[13.5px] text-ink-2 leading-[1.55]">
                            Reported by {reporterName || "the department's source"} · {formatMoney(reportedAmount)}. Only they can
                            change what they filed, but recording the dispute tells the department who to ask.
                          </p>
                        </div>
                      </div>
                      <span className="block text-[12.5px] font-bold text-ink-2 mb-1.5">Why (CBDT feedback code)</span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { id: "different", label: "Amount is different" },
                          { id: "fraud", label: "Not my income / Fraud" },
                          { id: "joint", label: "Joint account / Split" },
                          { id: "duplicate", label: "Duplicate record" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              handleChoiceChange(
                                opt.id as "different" | "fraud" | "joint" | "duplicate"
                              )
                            }
                            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[12px] border-[1.5px] text-[13.5px] font-semibold text-left transition cursor-pointer ${
                              correctionChoice === opt.id
                                ? "bg-amber-bg border-money text-ink"
                                : "bg-white/60 dark:bg-white/10 border-glass-edge text-ink-2 hover:border-money/50"
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span
                              className={`size-[18px] rounded-full flex items-center justify-center shrink-0 ${
                                correctionChoice === opt.id ? "bg-money text-white" : "border-[1.5px] border-line"
                              }`}
                            >
                              {correctionChoice === opt.id && <Check size={11} strokeWidth={3} />}
                            </span>
                          </button>
                        ))}
                      </div>
                      {/* The department's vocabulary for the choice, so the
                          citizen sees the code that will go on their AIS
                          feedback — the same code the reconciliation matrix
                          and the copilot use. */}
                      <p className="mt-2 text-[11px] font-mono text-ink-3">
                        AIS feedback {CHOICE_CODE[correctionChoice]} —{" "}
                        {AIS_FEEDBACK_LABELS[CHOICE_CODE[correctionChoice]]}
                      </p>
                    </div>

                    {/* Amount input for different/joint choices */}
                    {(correctionChoice === "different" || correctionChoice === "joint") && (
                      <div>
                        <label className="block text-[12.5px] font-bold text-ink-2 mb-1.5">
                          The amount should be
                        </label>
                        <MockField>
                          <input
                          type="number"
                          value={disputeAmount}
                          onChange={(e) => setDisputeAmount(e.target.value)}
                          className="w-full h-12 rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-money shadow-[0_0_0_3px_rgba(255,122,26,.18)] px-4 text-[18px] font-mono font-semibold text-ink text-center focus:outline-none"
                          placeholder="e.g. 50000"
                        />
                          <MockFill onFill={() => setDisputeAmount(String(MOCK.savingsInterest))} />
                        </MockField>
                      </div>
                    )}

                    {/* Reason detail input */}
                    <div>
                      <label className="block text-[12.5px] font-bold text-ink-2 mb-1.5 flex justify-between items-center">
                        <span>Explanation for the change</span>
                        <button
                          onClick={toggleSpeechMock}
                          className={`text-xs flex items-center gap-1 font-semibold ${
 isSpeechListening ? "text-alarm animate-pulse" : "text-money hover:text-money-deep"
                          }`}
                        >
                          {isSpeechListening ? <Volume2 size={12} /> : <VolumeX size={12} />}
                          <span>{isSpeechListening ? t.file.voiceListening : t.file.dictate}</span>
                        </button>
                      </label>
                      <textarea
                        rows={2}
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Provide a brief explanation for the tax department"
                        className="w-full bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge text-[13px] p-3 rounded-[14px] focus:outline-none focus:border-money resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Plain-Language Advisory advisory mismatch card */}
                {disputeAmount.trim() !== "" && parsedAmount < reportedAmount && (
                  <div className="bg-warn-soft p-4 rounded-[14px] space-y-2">
                    <span className="text-xs font-bold text-warn uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>Heads Up: Mismatch with Department Records</span>
                    </span>
                    <div className="text-xs text-ink-2 space-y-1 font-medium leading-relaxed">
                      <p>
                        You are reporting: <strong className="font-mono tabular-nums text-ink">{formatMoney(parsedAmount)}</strong>
                      </p>
                      <p>
                        {reporterName || "Department source"} reported: <strong className="font-mono tabular-nums text-ink">{formatMoney(reportedAmount)}</strong>
                      </p>
                      <p className="mt-2 text-ink">
                        We will file your return using your corrected figure (<span className="font-mono tabular-nums">{formatMoney(parsedAmount)}</span>).
                        However, if your employer/bank filed extra TDS under your PAN, contact them to revise their quarterly return so you don't receive a tax clarification notice later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SELF-DECLARED INTERACTIVE MODAL */
              <div className="space-y-4 font-sans text-sm px-6 pt-5">
                <div>
                  <label className="block text-[12.5px] font-bold text-ink-2 mb-1.5">
                    Update your self-declared amount (₹)
                  </label>
                  <MockField>
                    <input
                    type="number"
                    value={disputeAmount}
                    onChange={(e) => setDisputeAmount(e.target.value)}
                    className="w-full h-12 rounded-[14px] bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge px-4 text-[18px] font-mono font-semibold text-ink focus:border-money focus:outline-none"
                  />
                    <MockFill onFill={() => setDisputeAmount(String(MOCK.savingsInterest))} />
                  </MockField>
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-ink-2 mb-1.5">
                    Comment (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Enter details..."
                    className="w-full bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge text-[13px] p-3 rounded-[14px] focus:outline-none focus:border-money resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 px-6 py-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[46px] px-5 rounded-[14px] bg-white/60 dark:bg-white/10 border border-glass-edge text-[14.5px] font-semibold text-ink hover:border-money/50 transition cursor-pointer"
              >
                {t.common.close}
              </button>
              <button
                type="button"
                onClick={saveDispute}
                disabled={disputeAmount.trim() === ""}
                className="flex-1 h-[46px] rounded-[14px] ink-surface hover:opacity-90 text-on-ink text-[14.5px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isPreFilled || disputeTarget === "tax" ? "Update & Recalculate" : t.file.disputeSave}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
