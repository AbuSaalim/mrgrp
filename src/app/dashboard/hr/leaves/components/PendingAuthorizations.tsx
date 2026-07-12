"use client";

import React from "react";
import { CheckSquare, Square, CheckCircle2, Calendar, Check, X, ArrowUpRight } from "lucide-react";
import { LeaveItem } from "../types";

interface PendingAuthorizationsProps {
  isLoading: boolean;
  pendingLeaves: LeaveItem[];
  selectedLeaveIds: string[];
  isProcessingBulk: boolean;
  isAllSelected: boolean;
  actionLoadingId: string | null;
  toggleSelectAll: () => void;
  toggleSelectCard: (e: React.MouseEvent, id: string) => void;
  handleBulkAction: (status: "Approved" | "Rejected") => void;
  handleAction: (id: string, status: "Approved" | "Rejected") => void;
  setDrawerLeave: (leave: LeaveItem) => void;
  formatLeaveDateRange: (start: string, end?: string) => string;
}

export function PendingAuthorizations({
  isLoading,
  pendingLeaves,
  selectedLeaveIds,
  isProcessingBulk,
  isAllSelected,
  actionLoadingId,
  toggleSelectAll,
  toggleSelectCard,
  handleBulkAction,
  handleAction,
  setDrawerLeave,
  formatLeaveDateRange,
}: PendingAuthorizationsProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* Bulk Action Header Bar */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-300 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={pendingLeaves.length === 0}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            )}
            <span>Select All</span>
          </button>
          <span className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pending Authorizations</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30">
              {pendingLeaves.length}
            </span>
          </h2>
        </div>

        {/* Bulk Action Controls */}
        {selectedLeaveIds.length > 0 && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-950 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs text-amber-650 dark:text-amber-300 font-medium font-mono">
              {selectedLeaveIds.length} selected
            </span>
            <button
              type="button"
              disabled={isProcessingBulk}
              onClick={(e) => { e.stopPropagation(); handleBulkAction("Approved"); }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isProcessingBulk ? "Processing..." : "Bulk Approve"}
            </button>
            <button
              type="button"
              disabled={isProcessingBulk}
              onClick={(e) => { e.stopPropagation(); handleBulkAction("Rejected"); }}
              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-rose-500/40 text-rose-650 dark:text-rose-400 hover:bg-rose-55 dark:hover:bg-rose-500/10 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              Bulk Reject
            </button>
          </div>
        )}
      </div>

      {/* 3-Column Responsive Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 animate-pulse" />
          ))}
        </div>
      ) : pendingLeaves.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-10 text-center shadow-sm w-full">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">All Clear</h3>
          <p className="text-xs text-slate-650 dark:text-slate-400 mt-1">
            No pending leave authorization requests right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingLeaves.map((leave) => {
            const isSelected = selectedLeaveIds.includes(leave._id);
            const isActioning = actionLoadingId === leave._id;

            return (
              <div
                key={leave._id}
                onClick={() => setDrawerLeave(leave)}
                className={`group relative bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-md dark:hover:shadow-lg ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/[0.01] dark:bg-amber-500/[0.03] shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                    : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Top Card Row: Checkbox, Name, Pending Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectCard(e, leave._id)}
                        className="text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                          {leave.userId?.name || "Unknown Employee"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {leave.userId?.role || "Staff Member"}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.15)] inline-flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                      Pending
                    </span>
                  </div>

                  {/* Date Range & Leave Type Pill */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {formatLeaveDateRange(leave.date, leave.endDate)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold">
                      {leave.type} Leave
                    </span>
                  </div>

                  {/* Quota Status */}
                  <div className="mt-2.5">
                    {leave.isPaidLeaveQuotaUsed ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-705 dark:text-rose-300 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Quota Used ({leave.approvedLeavesThisMonth || 1}/1) → LWP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-705 dark:text-emerald-300 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Quota Available (0/1) → Paid Leave
                      </span>
                    )}
                  </div>

                  {/* Reason Box */}
                  <div className="mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800/80 rounded-xl p-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
                      &ldquo;{leave.reason || "No reason specified"}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Actions & Drawer Hint */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(leave._id, "Approved");
                      }}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(leave._id, "Rejected");
                      }}
                      className="flex-1 py-2.5 bg-white dark:bg-slate-950 border border-rose-500/40 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      Reject
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors pt-0.5">
                    <span>Click card for Smart Context</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
