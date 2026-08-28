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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-teal-700 font-bold text-lg">✦</span>
          <h3 className="text-lg font-bold text-teal-950">Edit Self-Declared Income</h3>
        </div>

        {/* Input: Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
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
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
          />
            <MockFill onFill={() => setAmountStr(String(MOCK.annualSalary))} />
          </MockField>
        </div>

        {/* Input: Comment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
            Comment (Optional)
          </label>
          <MockField>
            <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Revised final invoice / corrected bank deposit"
            className="w-full px-4 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
          />
            <MockFill onFill={() => setComment(MOCK.note)} />
          </MockField>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          
          <button
            type="button"
            disabled={amountStr.trim() === '' || isSubmitting}
            onClick={handleUpdate}
            className="flex-1 py-3 px-4 bg-teal-800 hover:bg-teal-900 disabled:bg-gray-300 text-white font-semibold rounded-xl shadow-sm transition"
          >
            Update & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}
