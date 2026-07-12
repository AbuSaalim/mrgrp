"use client";

import React from "react";
import { Mail, Briefcase, Eye } from "lucide-react";
import { EmployeeItem, NEON_THEMES } from "../types";

interface EmployeesMobileListProps {
  employees: EmployeeItem[];
  openProfileView: (user: EmployeeItem) => void;
}

export function EmployeesMobileList({ employees, openProfileView }: EmployeesMobileListProps) {
  return (
    <div className="md:hidden space-y-4 font-sans">
      {employees.map((emp, idx) => {
        const theme = NEON_THEMES[idx % NEON_THEMES.length];
        return (
          <div
            key={emp._id}
            className={`backdrop-blur-xl rounded-2xl border p-5 transition-all duration-300 ${theme.wrapper}`}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg tracking-wide leading-tight">
                  {emp.name}
                </h3>
                <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium">
                  <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" /> {emp.email}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border flex items-center w-fit max-w-full ${theme.badge}`}
              >
                <Briefcase className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="truncate block">{emp.role}</span>
              </span>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50">
              <button
                onClick={() => openProfileView(emp)}
                className={`w-full py-2.5 border transition-all flex items-center justify-center gap-2 text-sm font-bold rounded-xl cursor-pointer ${theme.button}`}
              >
                <Eye className="h-4 w-4" /> View History & Logs
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
