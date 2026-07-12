"use client";

import React from "react";
import { X, Layers, FileText, Check } from "lucide-react";
import { LeaveItem, EmployeeLeaveStats } from "../types";

interface LeavesDrawerProps {
  drawerLeave: LeaveItem | null;
  drawerEmployeeStats: EmployeeLeaveStats | null;
  onClose: () => void;
  handleAction: (id: string, status: "Approved" | "Rejected") => void;
  formatLeaveDateRange: (start: string, end?: string) => string;
}

export function LeavesDrawer({
  drawerLeave,
  drawerEmployeeStats,
  onClose,
  handleAction,
  formatLeaveDateRange,
}: LeavesDrawerProps) {
  if (!drawerLeave) return null;

  return (
    <div className="fixed inset-0 z-55 flex justify-end font-sans">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-base shadow-sm">
              {drawerLeave.userId?.name?.[0]?.toUpperCase() || "E"}
            </div>
            <div>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">
                Employee Smart Context
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {drawerLeave.userId?.name || "Employee Details"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {drawerLeave.userId?.role || "Staff Member"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Request Details Card */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                Selected Leave Request
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                  drawerLeave.status === "Approved"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30"
                    : drawerLeave.status === "Rejected"
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/30"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/30"
                }`}
              >
                {drawerLeave.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <p className="text-slate-500">Leave Type</p>
                <p className="font-bold text-slate-850 dark:text-white mt-0.5">{drawerLeave.type} Leave</p>
              </div>
              <div>
                <p className="text-slate-500">Date Range</p>
                <p className="font-bold text-slate-850 dark:text-white mt-0.5">
                  {formatLeaveDateRange(drawerLeave.date, drawerLeave.endDate)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-900">
              <p className="text-xs text-slate-500 mb-1">Reason provided</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 italic bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                &ldquo;{drawerLeave.reason || "No reason specified"}&rdquo;
              </p>
            </div>
          </div>

          {/* 2. Employee Leave Balances (CL, SL, EL) */}
          {drawerEmployeeStats && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Current Leave Balances (Annual Policy)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {/* CL Card */}
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Casual (CL)
                  </span>
                  <p className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                    {drawerEmployeeStats.clBalance.remaining}
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      /{drawerEmployeeStats.clBalance.quota}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used: {drawerEmployeeStats.clBalance.used}
                  </p>
                </div>

                {/* SL Card */}
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Sick (SL)
                  </span>
                  <p className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                    {drawerEmployeeStats.slBalance.remaining}
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      /{drawerEmployeeStats.slBalance.quota}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used: {drawerEmployeeStats.slBalance.used}
                  </p>
                </div>

                {/* EL Card */}
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Earned (EL)
                  </span>
                  <p className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">
                    {drawerEmployeeStats.elBalance.remaining}
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      /{drawerEmployeeStats.elBalance.quota}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used: {drawerEmployeeStats.elBalance.used}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Recent Leave History for Employee */}
          {drawerEmployeeStats && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Recent Leave Requests ({drawerEmployeeStats.empName})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {drawerEmployeeStats.history.map((item) => (
                  <div
                    key={item._id}
                    className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-sans"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{item.type} Leave</span>
                      <span className="text-slate-400 dark:text-slate-500 mx-1.5">•</span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono">
                        {formatLeaveDateRange(item.date, item.endDate)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "Approved"
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                          : item.status === "Rejected"
                          ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                          : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {drawerLeave.status === "Pending" ? (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex gap-3">
            <button
              type="button"
              onClick={() => handleAction(drawerLeave._id, "Approved")}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Approve Authorization
            </button>
            <button
              type="button"
              onClick={() => handleAction(drawerLeave._id, "Rejected")}
              className="flex-1 py-3 bg-white dark:bg-slate-950 border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[3]" />
              Reject Application
            </button>
          </div>
        ) : (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This request is currently marked as{" "}
              <span className="font-bold text-slate-850 dark:text-white uppercase">{drawerLeave.status}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
