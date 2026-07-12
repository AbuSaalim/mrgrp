"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Settings, X, ChevronDown } from "lucide-react";
import { Employee, RateFormState } from "../types";

interface SalaryStructureModalProps {
  isOpen: boolean;
  selectedUserForRate: Employee | null;
  setSelectedUserForRate: (emp: Employee | null) => void;
  allEmployeesList: Employee[];
  rateForm: RateFormState;
  setRateForm: Dispatch<SetStateAction<RateFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export function SalaryStructureModal({
  isOpen,
  selectedUserForRate,
  setSelectedUserForRate,
  allEmployeesList,
  rateForm,
  setRateForm,
  onSubmit,
  onClose,
}: SalaryStructureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1121] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700/50 shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-500" />
            Configure Salary Structure
          </h3>
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
              Employee / Worker
            </label>
            <div className="relative">
              <select
                required
                value={selectedUserForRate?._id || ""}
                onChange={(e) => {
                  const found = allEmployeesList.find((emp) => emp._id === e.target.value);
                  setSelectedUserForRate(found || { _id: e.target.value } as Employee);
                }}
                className="w-full px-4 py-2.5 appearance-none rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold cursor-pointer"
              >
                <option value="" disabled className="bg-white dark:bg-[#0B1121] text-slate-900 dark:text-white">
                  -- Select Employee --
                </option>
                {allEmployeesList.map((emp) => (
                  <option key={emp._id} value={emp._id} className="bg-white dark:bg-[#0B1121] text-slate-900 dark:text-white">
                    {emp.name} ({emp.email})
                  </option>
                ))}
                {selectedUserForRate && !allEmployeesList.some((e) => e._id === selectedUserForRate._id) && (
                  <option value={selectedUserForRate._id} className="bg-white dark:bg-[#0B1121] text-slate-900 dark:text-white">{selectedUserForRate.name || selectedUserForRate._id}</option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Daily Rate (₹)
            </label>
            <input
              type="number"
              required
              value={rateForm.dailyRate}
              onChange={(e) => setRateForm({ ...rateForm, dailyRate: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-350 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Overtime Hourly Rate (₹/hr)
            </label>
            <input
              type="number"
              required
              value={rateForm.overtimeRate}
              onChange={(e) => setRateForm({ ...rateForm, overtimeRate: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-350 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Standard Shift Hours
            </label>
            <input
              type="number"
              required
              value={rateForm.standardShiftHours}
              onChange={(e) => setRateForm({ ...rateForm, standardShiftHours: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-350 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Monthly Fixed Salary (₹)
            </label>
            <input
              type="number"
              required
              value={rateForm.monthlyFixedSalary}
              onChange={(e) => setRateForm({ ...rateForm, monthlyFixedSalary: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-350 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
            >
              Save & Recalculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
