"use client";

import React from "react";
import { Lock, Unlock, Settings, PlusCircle } from "lucide-react";
import { PayrollRecord, Employee, RateFormState } from "../types";

interface PayrollMobileCardsProps {
  loading: boolean;
  filteredRecords: PayrollRecord[];
  setSelectedUserForRate: (emp: Employee) => void;
  setRateForm: (form: RateFormState) => void;
  setRateModalOpen: (open: boolean) => void;
  setSelectedRecordForAdjust: (rec: PayrollRecord) => void;
  setAdjustModalOpen: (open: boolean) => void;
  handleLockPeriod: (userId?: string) => void;
}

export function PayrollMobileCards({
  loading,
  filteredRecords,
  setSelectedUserForRate,
  setRateForm,
  setRateModalOpen,
  setSelectedRecordForAdjust,
  setAdjustModalOpen,
  handleLockPeriod,
}: PayrollMobileCardsProps) {
  return (
    <div className="md:hidden space-y-4 p-4">
      {loading ? (
        <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse font-sans">
          Calculating shift durations & payroll engine outputs...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-medium font-sans">
          No payroll records found for this period.
        </div>
      ) : (
        filteredRecords.map((rec) => {
          const totalAdjust = (rec.adjustments || []).reduce(
            (sum, adj) => sum + (adj.amount || 0),
            0
          );
          const isLocked = rec.status === "APPROVED_LOCKED";

          return (
            <div
              key={`mobile-${rec._id || rec.userId}`}
              className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.1)]"
            >
              {/* Personnel & Status Header */}
              <div className="flex justify-between items-start font-sans">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{rec.user?.name || "Staff Worker"}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.user?.email || ""}</p>
                </div>
                <div className="flex-shrink-0">
                  {isLocked ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider shadow-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider shadow-xs">
                      <Unlock className="h-3 w-3 mr-1" />
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Grid displaying Base Pay, OT, Deductions, and Net Pay */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 dark:border-slate-800/50 text-xs font-sans">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Working Hours / Days
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-300">
                    {rec.totalWorkingHours} hrs
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    ({rec.averageWorkingDays} days)
                  </div>
                  {((rec.approvedLeavesCount || 0) > 0) && (
                    <div className="mt-2 flex flex-col gap-1 w-fit">
                      {(rec.paidLeaveDays || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                          🌴 Paid Leave
                        </span>
                      )}
                      {(rec.lwpDays || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[9px] font-bold border border-rose-200 dark:border-rose-500/20">
                          ⚠️ {rec.lwpDays} LWP
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Rates (Daily / OT)
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-300">₹{rec.dailyRate} / day</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">₹{rec.overtimeRate} / hr OT</div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Overtime / Adjust
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-300">
                    OT: <span className={rec.overtimeHours > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500"}>{rec.overtimeHours} hrs</span>
                  </div>
                  <div className={`font-bold mt-0.5 ${totalAdjust > 0 ? "text-emerald-600 dark:text-emerald-400" : totalAdjust < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                    Adj: {totalAdjust > 0 ? `+₹${totalAdjust}` : totalAdjust === 0 ? "₹0" : `₹${totalAdjust}`}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Net Payable
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">
                    ₹{rec.netPayableAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 font-sans">
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
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer"
                  title="Configure Salary Structure"
                >
                  <Settings className="h-3.5 w-3.5 flex-shrink-0" /> Structure
                </button>

                {!isLocked && (
                  <button
                    onClick={() => {
                      setSelectedRecordForAdjust(rec);
                      setAdjustModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer"
                    title="Add Override / Bonus / Penalty"
                  >
                    <PlusCircle className="h-3.5 w-3.5 flex-shrink-0" /> Adjust
                  </button>
                )}

                {!isLocked && (
                  <button
                    onClick={() => handleLockPeriod(rec.user?._id || rec.userId)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer"
                    title="Final Approval & Lock"
                  >
                    <Lock className="h-3.5 w-3.5 flex-shrink-0" /> Lock
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
