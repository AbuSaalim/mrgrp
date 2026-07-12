"use client";

import React from "react";
import { Loader2, Calendar, Edit2, Trash2 } from "lucide-react";
import { PublicHolidayItem } from "../types";

interface HolidaysGridProps {
  isLoading: boolean;
  isSeeding: boolean;
  selectedYear: number;
  filteredHolidays: PublicHolidayItem[];
  handlePreSeed: () => Promise<void>;
  handleToggleActive: (holiday: PublicHolidayItem) => Promise<void>;
  handleOpenEditModal: (holiday: PublicHolidayItem) => void;
  handleDelete: (id: string, name: string) => void;
  getCardTheme: (type: string, isActive: boolean) => string;
}

export function HolidaysGrid({
  isLoading,
  isSeeding,
  selectedYear,
  filteredHolidays,
  handlePreSeed,
  handleToggleActive,
  handleOpenEditModal,
  handleDelete,
  getCardTheme,
}: HolidaysGridProps) {
  const getTypeBadge = (type: string) => {
    if (type === "National") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm uppercase tracking-wider">
          🇮🇳 National
        </span>
      );
    }
    if (type === "Regional") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm uppercase tracking-wider">
          🏛️ Regional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-500/20 shadow-sm uppercase tracking-wider">
        🌙 Religious
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm font-sans">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <span className="text-xs font-bold tracking-widest uppercase">Fetching Records...</span>
      </div>
    );
  }

  if (filteredHolidays.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center shadow-sm font-sans">
        <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-650 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">No Holidays Found</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
          Click 'Pre-Seed Standard Holidays' to instantly populate Republic Day, Idul Fitr, Eid ul Azha, Independence Day, and more for <strong className="text-blue-605 dark:text-blue-400">{selectedYear}</strong>.
        </p>
        <button
          onClick={handlePreSeed}
          disabled={isSeeding}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-650 text-white text-xs font-bold shadow-md transition-all hover:scale-105 cursor-pointer animate-pulse border-none"
        >
          Pre-Seed Standard Holidays
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-sans">
      {filteredHolidays.map((holiday) => {
        const dateObj = new Date(holiday.dateString);
        const formattedDate = dateObj.toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={holiday._id}
            className={`group relative backdrop-blur-xl rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${getCardTheme(
              holiday.type,
              holiday.isActive
            )}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-450 mb-1">
                  {formattedDate}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                  {holiday.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">{getTypeBadge(holiday.type)}</div>
            </div>

            {holiday.description && (
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed font-medium">
                {holiday.description}
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(holiday)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                    holiday.isActive
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-white"
                  }`}
                >
                  {holiday.isActive ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(holiday)}
                  className="p-2 rounded-lg text-slate-400 dark:text-slate-500 border border-transparent hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all cursor-pointer bg-transparent"
                  title="Edit Holiday"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(holiday._id, holiday.name)}
                  className="p-2 rounded-lg text-slate-400 dark:text-slate-500 border border-transparent hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer bg-transparent"
                  title="Delete Holiday"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
