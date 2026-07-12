"use client";

import React from "react";
import { Clock, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { LeaveKPIs } from "../types";

interface LeavesKPIProps {
  kpis: LeaveKPIs;
}

export function LeavesKPI({ kpis }: LeavesKPIProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {/* 1. Pending Approvals */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md border border-amber-500/40 dark:border-amber-500/30 p-5 shadow-sm dark:shadow-[0_0_20px_rgba(245,158,11,0.08)] transition-all duration-300 hover:border-amber-500/60">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Pending Approvals
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-sm dark:shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {kpis.pendingCount}
          </span>
          {kpis.pendingCount > 0 && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
              Action Required
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          Requests waiting for HR authorization
        </p>
      </div>

      {/* 2. On Leave Today */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md border border-emerald-500/40 dark:border-emerald-500/30 p-5 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all duration-300 hover:border-emerald-500/60">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            On Leave Today
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {kpis.onLeaveTodayCount}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          Employees out of office today
        </p>
      </div>

      {/* 3. Rejected This Month */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md border border-rose-500/40 dark:border-rose-500/30 p-5 shadow-sm dark:shadow-[0_0_20px_rgba(244,63,94,0.08)] transition-all duration-300 hover:border-rose-500/60">
        <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Rejected This Month
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-400 shadow-sm dark:shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {kpis.rejectedThisMonthCount}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          Declined applications this month
        </p>
      </div>

      {/* 4. Approved This Month */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md border border-blue-500/40 dark:border-blue-500/30 p-5 shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all duration-300 hover:border-blue-500/60">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Approved This Month
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400 shadow-sm dark:shadow-[0_0_12px_rgba(59,130,246,0.25)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {kpis.approvedThisMonthCount}
          </span>
        </div>
        <p className="text-xs text-slate-650 dark:text-slate-400 mt-2">
          Authorized applications this month
        </p>
      </div>
    </div>
  );
}
