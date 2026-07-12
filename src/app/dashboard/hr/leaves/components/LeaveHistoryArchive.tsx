"use client";

import React from "react";
import { History, Search, Calendar } from "lucide-react";
import { LeaveItem } from "../types";

interface LeaveHistoryArchiveProps {
  filteredHistory: LeaveItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: "ALL" | "Approved" | "Rejected";
  setStatusFilter: (status: "ALL" | "Approved" | "Rejected") => void;
  monthFilter: string;
  setMonthFilter: (month: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  availableMonths: string[];
  availableTypes: string[];
  setDrawerLeave: (leave: LeaveItem) => void;
  formatLeaveDateRange: (start: string, end?: string) => string;
}

export function LeaveHistoryArchive({
  filteredHistory,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  monthFilter,
  setMonthFilter,
  typeFilter,
  setTypeFilter,
  availableMonths,
  availableTypes,
  setDrawerLeave,
  formatLeaveDateRange,
}: LeaveHistoryArchiveProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* Section Title & Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-300 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Leave History Archive</h2>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer font-semibold"
          >
            <option value="ALL">All Months</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer font-semibold"
          >
            <option value="ALL">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Leave Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer font-semibold"
          >
            <option value="ALL">All Types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{t} Leave</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 border-b border-slate-300 dark:border-slate-800 uppercase tracking-wider font-bold">
                <th className="px-4 py-3.5 font-bold text-center w-12">#</th>
                <th className="px-5 py-3.5 font-bold">Employee</th>
                <th className="px-5 py-3.5 font-bold">Date Range</th>
                <th className="px-5 py-3.5 font-bold">Type</th>
                <th className="px-5 py-3.5 font-bold">Reason</th>
                <th className="px-5 py-3.5 font-bold">Pay Impact</th>
                <th className="px-5 py-3.5 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500 font-bold">
                    No leave history records matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((leave, index) => (
                  <tr
                    key={leave._id}
                    onClick={() => setDrawerLeave(leave)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/20"
                  >
                    <td className="px-4 py-3.5 text-center font-bold font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800/50">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {leave.userId?.name || "Unknown"}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {leave.userId?.role || "Staff Member"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {formatLeaveDateRange(leave.date, leave.endDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-300 font-bold border border-slate-200 dark:border-transparent">
                        {leave.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate italic font-medium">
                      {leave.reason || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          leave.isPaidLeaveQuotaUsed
                            ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-350"
                            : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-350"
                        }`}
                      >
                        {leave.payImpactText ||
                          (leave.isPaidLeaveQuotaUsed
                            ? "LWP"
                            : "Paid Leave (1 Quota)")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {leave.status === "Approved" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                          Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 inline-flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No leave history records matching your current filter criteria.
            </div>
          ) : (
            filteredHistory.map((leave) => (
              <div
                key={leave._id}
                onClick={() => setDrawerLeave(leave)}
                className="p-4 space-y-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {leave.userId?.name || "Unknown Employee"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatLeaveDateRange(leave.date, leave.endDate)} •{" "}
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{leave.type} Leave</span>
                    </p>
                  </div>
                  {leave.status === "Approved" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                      Rejected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic font-medium">
                  &ldquo;{leave.reason || "No reason specified"}&rdquo;
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
