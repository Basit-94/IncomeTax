"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { AlertTriangle, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { Persona } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";

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
      // Set reason default based on target type
      if (disputeTarget === "tax") {
        setDisputeReason("Amount differs from Form 26AS/AIS");
      }
    }
  }, [active, disputeTarget]);

  const handleChoiceChange = (choice: "different" | "fraud" | "joint" | "duplicate") => {
    setCorrectionChoice(choice);
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
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <m.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-paper border border-line max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 text-left overflow-y-auto max-h-[90vh]"
          >
            <h3 className="text-lg font-bold text-navy border-b border-line pb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-money" />
              <span>
                {isPreFilled 
                  ? disputeTarget === "tax" 
                    ? "Correct TDS Prefill" 
                    : "Resolve Prefilled Discrepancy" 
                  : "Edit Self-Declared Income"
                }
              </span>
            </h3>

            {/* PRE-FILLED INTERACTIVE MODAL */}
            {isPreFilled ? (
              <div className="space-y-4 font-sans text-sm">
                
                {/* Specific Layout for TDS/Tax */}
                {disputeTarget === "tax" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        What was the actual TDS deducted?
                      </label>
                      <MockField>
                        <input
                        type="number"
                        placeholder="Enter actual TDS amount (e.g. 0)"
                        value={disputeAmount}
                        onChange={(e) => setDisputeAmount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                      />
                        <MockFill onFill={() => setDisputeAmount(String(MOCK.savingsInterest))} />
                      </MockField>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Reason for discrepancy
                      </label>
                      <select
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
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
                      <span className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-2">
                        What is wrong with this entry?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
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
                            className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition cursor-pointer ${
                              correctionChoice === opt.id
                                ? "border-money bg-money-soft/10 text-navy font-bold"
                                : "border-line bg-paper text-ink-2 hover:border-slate-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount input for different/joint choices */}
                    {(correctionChoice === "different" || correctionChoice === "joint") && (
                      <div>
                        <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">
                          Enter the actual amount you received (₹)
                        </label>
                        <MockField>
                          <input
                          type="number"
                          value={disputeAmount}
                          onChange={(e) => setDisputeAmount(e.target.value)}
                          className="w-full bg-paper-2 border border-line text-base font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-money"
                          placeholder="e.g. 50000"
                        />
                          <MockFill onFill={() => setDisputeAmount(String(MOCK.savingsInterest))} />
                        </MockField>
                      </div>
                    )}

                    {/* Reason detail input */}
                    <div>
                      <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5 flex justify-between items-center">
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
                        className="w-full bg-paper-2 border border-line text-xs p-3 rounded-xl focus:outline-none focus:border-money resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Plain-Language Advisory advisory mismatch card */}
                {parsedAmount < reportedAmount && (
                  <div className="bg-warn-soft/40 border border-warn/30 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-warn uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>Heads Up: Mismatch with Department Records</span>
                    </span>
                    <div className="text-xs text-ink-2 space-y-1 font-medium leading-relaxed">
                      <p>
                        You are reporting: <strong className="text-ink">₹{parsedAmount.toLocaleString("en-IN")}</strong>
                      </p>
                      <p>
                        {reporterName || "Department source"} reported: <strong className="text-ink">₹{reportedAmount.toLocaleString("en-IN")}</strong>
                      </p>
                      <p className="mt-2 text-ink">
                        We will file your return using your corrected figure (₹{parsedAmount.toLocaleString("en-IN")}).
                        However, if your employer/bank filed extra TDS under your PAN, contact them to revise their quarterly return so you don't receive a tax clarification notice later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SELF-DECLARED INTERACTIVE MODAL */
              <div className="space-y-4 font-sans text-sm">
                <div>
                  <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">
                    Update your self-declared amount (₹)
                  </label>
                  <MockField>
                    <input
                    type="number"
                    value={disputeAmount}
                    onChange={(e) => setDisputeAmount(e.target.value)}
                    className="w-full bg-paper-2 border border-line text-base font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-money"
                  />
                    <MockFill onFill={() => setDisputeAmount(String(MOCK.savingsInterest))} />
                  </MockField>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">
                    Comment (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Enter details..."
                    className="w-full bg-paper-2 border border-line text-xs p-3 rounded-xl focus:outline-none focus:border-money resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-line text-ink-2 py-2 rounded-xl hover:bg-paper-2 text-sm font-semibold transition-colors cursor-pointer"
              >
                {t.common.close}
              </button>
              <button
                type="button"
                onClick={saveDispute}
                disabled={disputeAmount.trim() === ""}
                className="flex-1 bg-navy hover:opacity-90 text-paper py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-ink-3 disabled:cursor-not-allowed"
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
