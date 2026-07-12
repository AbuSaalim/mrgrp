"use client";

import React from "react";
import { CalendarDays, Loader2, Sparkles, Plus } from "lucide-react";

interface HolidaysHeaderProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  currentYear: number;
  isSeeding: boolean;
  handlePreSeed: () => Promise<void>;
  handleOpenAddModal: () => void;
}

export function HolidaysHeader({
  selectedYear,
  setSelectedYear,
  currentYear,
  isSeeding,
  handlePreSeed,
  handleOpenAddModal,
}: HolidaysHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center tracking-tight">
          <CalendarDays className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-500" />
          Company Public Holidays
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
          Manage fixed & dynamic lunar public holidays. Paid automatically by the payroll engine.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Year Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
          {[currentYear, currentYear + 1].map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                selectedYear === year
                  ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent"
              }`}
            >
              {year} <span className="hidden sm:inline">{year === currentYear ? "(Current)" : "(Upcoming)"}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={handlePreSeed}
            disabled={isSeeding}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-650/90 hover:from-indigo-600 hover:to-purple-600 border border-indigo-500/50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            <span className="hidden sm:inline">Pre-Seed Standard</span>
            <span className="sm:hidden">Pre-Seed</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/40 border border-blue-205 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add <span className="hidden sm:inline ml-1">Holiday</span>
          </button>
        </div>
      </div>
    </div>
  );
}
