"use client";

import React from "react";
import { Wallet, Settings, RefreshCw, Lock } from "lucide-react";
import { PayrollSummary, Employee, RateFormState } from "../types";

interface PayrollHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  loading: boolean;
  summary: PayrollSummary;
  allEmployeesList: Employee[];
  selectedUserForRate: Employee | null;
  setSelectedUserForRate: (emp: Employee | null) => void;
  setRateForm: (form: RateFormState) => void;
  setRateModalOpen: (open: boolean) => void;
  onRecalculate: (month: string) => void;
  onLockPeriod: () => void;
}

export function PayrollHeader({
  selectedMonth,
  setSelectedMonth,
  loading,
  summary,
  allEmployeesList,
  selectedUserForRate,
  setSelectedUserForRate,
  setRateForm,
  setRateModalOpen,
  onRecalculate,
  onLockPeriod,
}: PayrollHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm">
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Payroll & Calculation Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
              Automated shift calculations, attendance formulas & HR override management.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-50 dark:bg-slate-900/60 p-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2">Period:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        <button
          onClick={() => {
            const defaultUser = selectedUserForRate || (allEmployeesList.length > 0 ? allEmployeesList[0] : null);
            setSelectedUserForRate(defaultUser);
            setRateForm({
              dailyRate: 800,
              overtimeRate: 120,
              monthlyFixedSalary: 0,
              standardShiftHours: 9,
            });
            setRateModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure Salary Structure
        </button>

        <button
          onClick={() => onRecalculate(selectedMonth)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Recalculate
        </button>

        <button
          onClick={onLockPeriod}
          disabled={summary.draftRecordsCount === 0 || loading}
          className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
        >
          <Lock className="h-4 w-4 mr-2" />
          Final Approval ({summary.draftRecordsCount} Drafts)
        </button>
      </div>
    </div>
  );
}
