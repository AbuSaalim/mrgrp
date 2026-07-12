"use client";

import React from "react";
import { Filter } from "lucide-react";

interface HolidaysFiltersProps {
  filterType: string;
  setFilterType: (type: string) => void;
  totalCount: number;
}

export function HolidaysFilters({ filterType, setFilterType, totalCount }: HolidaysFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-800 pb-4 font-sans">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mr-2">
          Filter:
        </span>
        {["ALL", "National", "Regional", "Religious"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              filterType === t
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm"
                : "bg-transparent text-slate-500 border-transparent hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 w-fit shadow-sm">
        Total: <span className="text-slate-900 dark:text-white ml-1 font-extrabold">{totalCount}</span>
      </div>
    </div>
  );
}
