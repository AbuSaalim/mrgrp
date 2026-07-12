"use client";

import React from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MONTHS, YEARS } from "../types";

interface AttendanceHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayStr: string;
}

export function AttendanceHeader({ selectedDate, setSelectedDate, todayStr }: AttendanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
          <Clock className="mr-3 h-6 w-6 text-blue-500" />
          {selectedDate === todayStr ? "Real-time Site Attendance" : "Historical Attendance"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          {selectedDate === todayStr
            ? "View real-time check-in coordinates and patch shifts."
            : `Viewing records for ${selectedDate.split("-").reverse().join("/")}`}
        </p>
      </div>

      {/* Premium React DatePicker */}
      <div className="relative flex items-center bg-white/80 dark:bg-slate-900/60 p-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-[0_0_15px_rgba(0,0,0,0.2)] w-fit self-start md:self-auto hover:border-blue-500/50 transition-colors group z-40 cursor-pointer backdrop-blur-md">
        <Calendar className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
        <DatePicker
          selected={new Date(selectedDate + "T00:00:00")}
          onChange={(date: Date | null) => {
            if (date) {
              const offset = date.getTimezoneOffset();
              const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
              setSelectedDate(adjustedDate.toISOString().split("T")[0]);
            }
          }}
          maxDate={new Date()}
          dateFormat="dd/MM/yyyy"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="p-3 sm:p-4 pb-2 bg-white dark:bg-[#0B1121] border-b border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                    {MONTHS[date.getMonth()]} {date.getFullYear()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="relative">
                  <select
                    value={MONTHS[date.getMonth()]}
                    onChange={({ target: { value } }) => changeMonth(MONTHS.indexOf(value))}
                    className="appearance-none bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 sm:px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {MONTHS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="appearance-none bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 sm:px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {YEARS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
          popperPlacement="bottom-end"
          className="bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-slate-200 w-24 cursor-pointer placeholder:text-slate-550 focus:outline-none"
          calendarClassName="shadow-md dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-slate-700/50 rounded-3xl bg-white dark:bg-[#0B1121] text-slate-800 dark:text-slate-200"
        />
      </div>
    </div>
  );
}
