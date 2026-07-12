"use client";

import React from "react";
import { Eye } from "lucide-react";
import { EmployeeItem, NEON_THEMES } from "../types";

interface EmployeesDesktopListProps {
  employees: EmployeeItem[];
  openProfileView: (user: EmployeeItem) => void;
}

export function EmployeesDesktopList({ employees, openProfileView }: EmployeesDesktopListProps) {
  return (
    <div className="hidden md:block bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-sm dark:shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
            <th className="px-6 py-5">Name</th>
            <th className="px-6 py-5">Corporate Email</th>
            <th className="px-6 py-5">Assigned Role</th>
            <th className="px-6 py-5 text-right">Profile Track</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-sm">
          {employees.map((emp, idx) => {
            const theme = NEON_THEMES[idx % NEON_THEMES.length];
            return (
              <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{emp.name}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{emp.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>
                    {emp.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openProfileView(emp)}
                    className={`p-2.5 border transition-all inline-flex items-center gap-2 text-xs font-bold rounded-xl bg-transparent cursor-pointer ${theme.button}`}
                  >
                    <Eye className="h-4 w-4" /> View Logs
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
