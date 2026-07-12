"use client";

import React from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, CalendarRange } from "lucide-react";
import { EmployeeItem, DayMetric } from "../types";

interface EmployeeLogsModalProps {
  selectedUser: EmployeeItem | null;
  isModalLoading: boolean;
  monthName: string;
  currentYear: number;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  weekdays: string[];
  emptyDays: number[];
  daysInMonth: number[];
  getDayMetrics: (day: number) => DayMetric;
  handleDateClick: (day: number) => void;
  onClose: () => void;
}

export function EmployeeLogsModal({
  selectedUser,
  isModalLoading,
  monthName,
  currentYear,
  handlePrevMonth,
  handleNextMonth,
  weekdays,
  emptyDays,
  daysInMonth,
  getDayMetrics,
  handleDateClick,
  onClose,
}: EmployeeLogsModalProps) {
  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-700/50 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/20">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-wide">
              {selectedUser.name}{" "}
              <span className="text-slate-400 dark:text-slate-600 font-light hidden sm:inline-block">— Logs</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {selectedUser.email} •{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold uppercase">{selectedUser.role}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 border border-slate-200 dark:border-transparent hover:border-red-500/30 text-slate-500 dark:text-slate-400 hover:text-red-655 dark:hover:text-red-400 rounded-full transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isModalLoading ? (
          <div className="h-64 flex items-center justify-center animate-pulse text-blue-400 font-mono tracking-widest text-sm">
            FETCHING DATA...
          </div>
        ) : (
          <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar">
            {/* Month Navigator Controls */}
            <div className="flex items-center justify-between mb-5 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={handlePrevMonth}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-205 dark:border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer bg-transparent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-widest">
                {monthName} <span className="text-blue-600 dark:text-blue-400">{currentYear}</span>
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-205 dark:border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer bg-transparent"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Labels Indicators */}
            <div className="mb-6 flex flex-wrap gap-3 sm:gap-5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 justify-center uppercase tracking-wider">
              <span className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] mr-2"></div>{" "}
                Present
              </span>
              <span className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] mr-2"></div>{" "}
                Missed Out
              </span>
              <span className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] mr-2"></div>{" "}
                Approved Leave
              </span>
              <span className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] mr-2"></div>{" "}
                Pending Leave
              </span>
            </div>

            {/* Calendar Grid Weekdays */}
            <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-2 text-center text-[10px] sm:text-xs font-bold text-slate-550 uppercase tracking-widest">
              {weekdays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {emptyDays.map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="bg-transparent border border-transparent rounded-xl min-h-[48px] sm:min-h-[64px]"
                ></div>
              ))}

              {daysInMonth.map((day) => {
                const dayMetrics = getDayMetrics(day);
                let borderClass =
                  "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400";
                let indicator = null;

                if (dayMetrics.type === "present") {
                  borderClass =
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]";
                  indicator = (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 opacity-80" />
                  );
                } else if (dayMetrics.type === "missed") {
                  borderClass =
                    "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-[inset_0_0_15px_rgba(244,63,94,0.05)]";
                  indicator = (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 opacity-80" />
                  );
                } else if (dayMetrics.type === "leave") {
                  const isApproved = dayMetrics.status === "Approved";
                  borderClass = isApproved
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-[inset_0_0_15px_rgba(245,158,11,0.05)]";
                  indicator = (
                    <>
                      <span
                        className={`absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider hidden sm:inline-block ${
                          isApproved ? "text-blue-600" : "text-amber-600"
                        }`}
                      >
                        {dayMetrics.tag}
                      </span>
                      <CalendarRange className="h-3 w-3 sm:h-4 sm:w-4 absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 opacity-80" />
                    </>
                  );
                }

                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`relative p-2 sm:p-3 rounded-xl border font-bold text-center h-12 sm:h-16 flex items-start justify-start cursor-pointer hover:border-slate-405 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 ${borderClass}`}
                  >
                    <span className="text-xs sm:text-sm">{day}</span>
                    {indicator}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
