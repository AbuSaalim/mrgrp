"use client";

import React, { Dispatch, SetStateAction } from "react";
import { PlusCircle, X, ChevronDown } from "lucide-react";
import { PayrollRecord, AdjustmentFormState } from "../types";

interface AdjustmentsModalProps {
  isOpen: boolean;
  selectedRecord: PayrollRecord | null;
  selectedMonth: string;
  adjustForm: AdjustmentFormState;
  setAdjustForm: Dispatch<SetStateAction<AdjustmentFormState>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export function AdjustmentsModal({
  isOpen,
  selectedRecord,
  selectedMonth,
  adjustForm,
  setAdjustForm,
  isLoading,
  onSubmit,
  onClose,
}: AdjustmentsModalProps) {
  if (!isOpen || !selectedRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1121] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700/50 shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-500" />
              Add HR Override
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {selectedRecord.user?.name} ({selectedMonth})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Adjustment Type
            </label>
            <div className="relative">
              <select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                className="w-full px-4 py-2.5 appearance-none rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold cursor-pointer"
              >
                <option value="BONUS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Bonus (+)</option>
                <option value="ALLOWANCE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Allowance (+)</option>
                <option value="PENALTY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Penalty / Deduction (-)</option>
                <option value="OTHER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Other Manual Override</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Amount (₹) - Use positive or negative number
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 500 or -200"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Reason / Audit Note
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Festive performance bonus or safety gear damage penalty"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none custom-scrollbar"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
            >
              {isLoading ? "Applying..." : "Apply & Recalculate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
