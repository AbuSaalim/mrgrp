"use client";

import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface LeavesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function LeavesHeader({ isLoading, onRefresh }: LeavesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 font-sans">
      <div>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Enterprise Control Center</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          HR Leave Management
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review authorizations, analyze employee attendance quotas, and audit leave logs.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          Refresh Data
        </button>
      </div>
    </div>
  );
}
