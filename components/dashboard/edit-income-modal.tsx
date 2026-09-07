"use client";

import React, { useState } from 'react';
import { MockField, MockFill, MOCK } from "@/components/dev/mock-fill";

interface EditIncomeModalProps {
  isOpen: boolean;
  factId: string;
  initialAmount: number;
  onClose: () => void;
  onSaveAndRecalculate: (factId: string, updatedAmount: number, comment?: string) => void;
}

export function EditIncomeModal({
  isOpen,
  factId,
  initialAmount,
  onClose,
  onSaveAndRecalculate,
}: EditIncomeModalProps) {
  const [amountStr, setAmountStr] = useState<string>(String(initialAmount || ''));
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = () => {
    const parsedAmount = Number(amountStr);
    if (isNaN(parsedAmount) || parsedAmount < 0) return;

    setIsSubmitting(true);

    // 1. Dispatch fact update & recompute tax liability across dashboard
    onSaveAndRecalculate(factId, parsedAmount, comment.trim());

    // 2. Close modal
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,17,64,.55)] backdrop-blur-sm p-4 max-md:items-end max-md:p-0">
      <div className="w-full max-w-md bg-paper rounded-[26px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-ink">
        {/* Header */}
        <div className="ink-surface text-on-ink px-6 py-[18px] flex items-center gap-3.5">
          <span className="size-[42px] rounded-[14px] bg-white/10 flex items-center justify-center text-[18px] font-bold shrink-0">✦</span>
          <div>
            <h3 className="text-[17px] font-extrabold leading-tight">Edit self-declared income</h3>
            <p className="text-[12.5px] text-[#CDBDFF]">Only what you told us — nothing a reporter filed</p>
          </div>
        </div>

        {/* Input: Amount */}
        <div className="space-y-1.5 px-6 pt-5">
          <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block font-mono">
            Update Your Self-Declared Amount (₹)
          </label>
          <MockField>
            <input
            type="number"
            min="0"
            step="1000"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0"
            className="w-full px-4 h-12 text-[18px] font-mono font-semibold text-ink bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge rounded-[14px] focus:border-money focus:ring-[3px] focus:ring-money/20 focus:outline-none transition"
          />
            <MockFill onFill={() => setAmountStr(String(MOCK.annualSalary))} />
          </MockField>
        </div>

        {/* Input: Comment */}
        <div className="space-y-1.5 px-6 pt-4">
          <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block font-mono">
            Comment (Optional)
          </label>
          <MockField>
            <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Revised final invoice / corrected bank deposit"
            className="w-full px-4 h-11 text-sm text-ink bg-white/80 dark:bg-white/10 border-[1.5px] border-glass-edge rounded-[14px] focus:border-money focus:ring-[3px] focus:ring-money/20 focus:outline-none transition"
          />
            <MockFill onFill={() => setComment(MOCK.note)} />
          </MockField>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[46px] rounded-[14px] bg-white/60 dark:bg-white/10 border border-glass-edge text-ink text-[14.5px] font-semibold hover:border-money/50 transition-colors cursor-pointer"
          >
            Close
          </button>
          
          <button
            type="button"
            disabled={amountStr.trim() === '' || isSubmitting}
            onClick={handleUpdate}
            className="flex-1 h-[46px] rounded-[14px] ink-surface hover:opacity-90 text-on-ink text-[14.5px] font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Update & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}
