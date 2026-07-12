"use client";

import React from "react";
import { Lock, Unlock, Settings, PlusCircle } from "lucide-react";
import { PayrollRecord, Employee, RateFormState } from "../types";

interface PayrollTableProps {
  loading: boolean;
  filteredRecords: PayrollRecord[];
  setSelectedUserForRate: (emp: Employee) => void;
  setRateForm: (form: RateFormState) => void;
  setRateModalOpen: (open: boolean) => void;
  setSelectedRecordForAdjust: (rec: PayrollRecord) => void;
  setAdjustModalOpen: (open: boolean) => void;
  handleLockPeriod: (userId?: string) => void;
}

export function PayrollTable({
  loading,
  filteredRecords,
  setSelectedUserForRate,
  setRateForm,
  setRateModalOpen,
  setSelectedRecordForAdjust,
  setAdjustModalOpen,
  handleLockPeriod,
}: PayrollTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
            <th className="py-5 px-6">Personnel</th>
            <th className="py-5 px-4 text-center">Working Hrs</th>
            <th className="py-5 px-4 text-center">Avg Days (Hrs/9)</th>
            <th className="py-5 px-4 text-center">Overtime</th>
            <th className="py-5 px-4 text-right">Rates (Daily / OT)</th>
            <th className="py-5 px-4 text-right">Adjustments</th>
            <th className="py-5 px-6 text-right">Net Payable</th>
            <th className="py-5 px-4 text-center">Status</th>
            <th className="py-5 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-sm">
          {loading ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs animate-pulse font-sans">
                Calculating shift durations & payroll engine outputs...
              </td>
            </tr>
          ) : filteredRecords.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-500 font-medium font-sans">
                No payroll records found for this period.
              </td>
            </tr>
          ) : (
            filteredRecords.map((rec) => {
              const totalAdjust = (rec.adjustments || []).reduce(
                (sum, adj) => sum + (adj.amount || 0),
                0
              );
              const isLocked = rec.status === "APPROVED_LOCKED";

              return (
                <tr
                  key={rec._id || rec.userId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/20"
                >
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-white font-sans">
                      {rec.user?.name || "Staff Worker"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">{rec.user?.email || ""}</div>
                  </td>

                  <td className="py-4 px-4 text-center font-sans">
                    <div className="font-semibold text-slate-800 dark:text-slate-300">
                      {rec.totalWorkingHours} hrs
                    </div>
                    {((rec.approvedLeavesCount || 0) > 0) && (
                      <div className="mt-1.5 flex flex-col items-center gap-0.5">
                        {(rec.paidLeaveDays || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
                            🌴 1 Paid Leave (+9h)
                          </span>
                        )}
                        {(rec.lwpDays || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-500/20 shadow-xs">
                            ⚠️ {rec.lwpDays} LWP Day(s)
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center font-sans">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold text-xs">
                      {rec.averageWorkingDays} days
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center font-sans">
                    <span
                      className={`font-semibold ${
                        rec.overtimeHours > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500"
                      }`}
                    >
                      {rec.overtimeHours} hrs
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right font-sans">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      ₹{rec.dailyRate} / day
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">₹{rec.overtimeRate} / hr OT</div>
                  </td>

                  <td className="py-4 px-4 text-right font-sans">
                    <span
                      className={`font-bold ${
                        totalAdjust > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : totalAdjust < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-500"
                      }`}
                    >
                      {totalAdjust > 0 ? `+₹${totalAdjust}` : totalAdjust === 0 ? "₹0" : `₹${totalAdjust}`}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right font-extrabold text-lg text-slate-900 dark:text-white font-sans">
                    ₹{rec.netPayableAmount.toLocaleString("en-IN")}
                  </td>

                  <td className="py-4 px-4 text-center font-sans">
                    {isLocked ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold shadow-xs">
                        <Unlock className="h-3 w-3 mr-1" />
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedUserForRate(rec.user || { _id: rec.userId } as Employee);
                        setRateForm({
                          dailyRate: rec.dailyRate || 800,
                          overtimeRate: rec.overtimeRate || 120,
                          monthlyFixedSalary: 0,
                          standardShiftHours: 9,
                        });
                        setRateModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                      title="Configure Salary Structure"
                    >
                      <Settings className="h-4 w-4" />
                    </button>

                    {!isLocked && (
                      <button
                        onClick={() => {
                          setSelectedRecordForAdjust(rec);
                          setAdjustModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                        title="Add Override / Bonus / Penalty"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        onClick={() => handleLockPeriod(rec.user?._id || rec.userId)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 transition-colors cursor-pointer"
                        title="Final Approval & Lock"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
