"use client";

import React from "react";
import { IndianRupee, Clock, UserCheck, ShieldCheck } from "lucide-react";
import { PayrollSummary } from "../types";

interface PayrollKPIProps {
  summary: PayrollSummary;
}

export function PayrollKPI({ summary }: PayrollKPIProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Enterprise Payout */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
          Total Enterprise Payout
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            ₹{summary.totalPayrollCost.toLocaleString("en-IN")}
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
            <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 block font-medium">
          Aggregated for {summary.totalEmployees} personnel
        </span>
      </div>

      {/* Total Logged Hours */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-blue-500/40 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
          Total Logged Hours
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            {summary.totalHoursWorked} hrs
          </span>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 shadow-xs">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 block font-medium">
          Avg Shift Formula: Hours / 9 Standard
        </span>
      </div>

      {/* Avg Working Days */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
          Avg Working Days
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            {summary.avgEnterpriseWorkingDays} days
          </span>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 shadow-xs">
            <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 block font-medium">Enterprise worker mean</span>
      </div>

      {/* Period Lock Status */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
          Period Lock Status
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            {summary.lockedRecordsCount} / {summary.totalEmployees}
          </span>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 block font-medium">
          {summary.draftRecordsCount} remaining draft records
        </span>
      </div>
    </div>
  );
}
