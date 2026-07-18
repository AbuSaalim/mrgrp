"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { usePayroll } from "./hooks/usePayroll";
import { PayrollHeader } from "./components/PayrollHeader";
import { PayrollKPI } from "./components/PayrollKPI";
import { PayrollTable } from "./components/PayrollTable";
import { PayrollMobileCards } from "./components/PayrollMobileCards";
import { SalaryStructureModal } from "./components/SalaryStructureModal";
import { AdjustmentsModal } from "./components/AdjustmentsModal";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Employee } from "./types";

import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function PayrollDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentUser(data);
      })
      .catch((err) => console.error("Auth check error:", err))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const {
    selectedMonth,
    setSelectedMonth,
    loading,
    isLoading,
    summary,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    setConfirmDialog,
    rateModalOpen,
    setRateModalOpen,
    selectedUserForRate,
    setSelectedUserForRate,
    allEmployeesList,
    rateForm,
    setRateForm,
    adjustModalOpen,
    setAdjustModalOpen,
    selectedRecordForAdjust,
    setSelectedRecordForAdjust,
    adjustForm,
    setAdjustForm,
    actionMessage,
    setActionMessage,
    filteredRecords,
    fetchPayrollSummary,
    handleSaveRates,
    handleApplyAdjustment,
    handleLockPeriod,
  } = usePayroll();

  const isSuperAdmin =
    currentUser?.role === "Super Admin" ||
    currentUser?.role?.includes("Super") ||
    currentUser?.role?.includes("Admin");

  if (isCheckingAuth) {
    return <div className="p-8 text-center text-slate-500">Checking permissions...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Payroll Hub is restricted exclusively to Admin personnel. You do not have permission to view or manage enterprise payroll.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12 min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/20">
      {/* HEADER & CONTROLS */}
      <PayrollHeader
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        loading={loading}
        summary={summary}
        allEmployeesList={allEmployeesList}
        selectedUserForRate={selectedUserForRate}
        setSelectedUserForRate={setSelectedUserForRate}
        setRateForm={setRateForm}
        setRateModalOpen={setRateModalOpen}
        onRecalculate={fetchPayrollSummary}
        onLockPeriod={handleLockPeriod}
      />

      {/* FEEDBACK ALERT */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/50 dark:text-emerald-400 backdrop-blur-md"
              : "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-500/50 dark:text-rose-400 backdrop-blur-md"
          }`}
        >
          <div className="flex items-center">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 mr-2.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold tracking-wide">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <PayrollKPI summary={summary} />

      {/* PAYROLL ENGINE TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
              Calculated Worker Breakdown ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium font-sans">
              Formula: (AvgWorkingDays × DailyRate) + (OvertimeHours × OTRate) − AbsentDeductions + HRAdjustments
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search worker name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Desktop View */}
        <PayrollTable
          loading={loading}
          filteredRecords={filteredRecords}
          setSelectedUserForRate={setSelectedUserForRate}
          setRateForm={setRateForm}
          setRateModalOpen={setRateModalOpen}
          setSelectedRecordForAdjust={setSelectedRecordForAdjust}
          setAdjustModalOpen={setAdjustModalOpen}
          handleLockPeriod={handleLockPeriod}
        />

        {/* Mobile View */}
        <PayrollMobileCards
          loading={loading}
          filteredRecords={filteredRecords}
          setSelectedUserForRate={setSelectedUserForRate}
          setRateForm={setRateForm}
          setRateModalOpen={setRateModalOpen}
          setSelectedRecordForAdjust={setSelectedRecordForAdjust}
          setAdjustModalOpen={setAdjustModalOpen}
          handleLockPeriod={handleLockPeriod}
        />
      </div>

      {/* SALARY STRUCTURE MODAL */}
      <SalaryStructureModal
        isOpen={rateModalOpen}
        selectedUserForRate={selectedUserForRate}
        setSelectedUserForRate={setSelectedUserForRate}
        allEmployeesList={allEmployeesList}
        rateForm={rateForm}
        setRateForm={setRateForm}
        onSubmit={handleSaveRates}
        onClose={() => setRateModalOpen(false)}
      />

      {/* ADJUSTMENT / OVERRIDE MODAL */}
      <AdjustmentsModal
        isOpen={adjustModalOpen}
        selectedRecord={selectedRecordForAdjust}
        selectedMonth={selectedMonth}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        isLoading={isLoading}
        onSubmit={handleApplyAdjustment}
        onClose={() => setAdjustModalOpen(false)}
      />

      {/* LIGHTWEIGHT ENTERPRISE CONFIRM MODAL */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
