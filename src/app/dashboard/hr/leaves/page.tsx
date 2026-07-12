"use client";

import React from "react";
import { useLeaves } from "./hooks/useLeaves";
import { LeavesHeader } from "./components/LeavesHeader";
import { LeavesKPI } from "./components/LeavesKPI";
import { PendingAuthorizations } from "./components/PendingAuthorizations";
import { LeaveHistoryArchive } from "./components/LeaveHistoryArchive";
import { LeavesDrawer } from "./components/LeavesDrawer";

export default function PendingLeavesPage() {
  const {
    isLoading,
    actionLoadingId,
    selectedLeaveIds,
    isProcessingBulk,
    drawerLeave,
    setDrawerLeave,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    typeFilter,
    setTypeFilter,
    fetchLeaves,
    handleAction,
    handleBulkAction,
    pendingLeaves,
    isAllSelected,
    toggleSelectAll,
    toggleSelectCard,
    kpis,
    availableMonths,
    availableTypes,
    filteredHistory,
    drawerEmployeeStats,
    formatLeaveDateRange,
  } = useLeaves();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-100 p-4 md:p-8 space-y-8 font-sans selection:bg-amber-500/20">
      {/* TOP HEADER */}
      <LeavesHeader isLoading={isLoading} onRefresh={fetchLeaves} />

      {/* TOP KPI 'CONTROL CENTER' WIDGETS */}
      <LeavesKPI kpis={kpis} />

      {/* PENDING AUTHORIZATIONS SECTION (GRID + BULK ACTIONS) */}
      <PendingAuthorizations
        isLoading={isLoading}
        pendingLeaves={pendingLeaves}
        selectedLeaveIds={selectedLeaveIds}
        isProcessingBulk={isProcessingBulk}
        isAllSelected={isAllSelected}
        actionLoadingId={actionLoadingId}
        toggleSelectAll={toggleSelectAll}
        toggleSelectCard={toggleSelectCard}
        handleBulkAction={handleBulkAction}
        handleAction={handleAction}
        setDrawerLeave={setDrawerLeave}
        formatLeaveDateRange={formatLeaveDateRange}
      />

      {/* COMPACT & FILTERABLE LEAVE HISTORY TABLE */}
      <LeaveHistoryArchive
        filteredHistory={filteredHistory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        availableMonths={availableMonths}
        availableTypes={availableTypes}
        setDrawerLeave={setDrawerLeave}
        formatLeaveDateRange={formatLeaveDateRange}
      />

      {/* INTERACTIVE 'SMART CONTEXT' RIGHT DRAWER */}
      <LeavesDrawer
        drawerLeave={drawerLeave}
        drawerEmployeeStats={drawerEmployeeStats}
        onClose={() => setDrawerLeave(null)}
        handleAction={handleAction}
        formatLeaveDateRange={formatLeaveDateRange}
      />
    </div>
  );
}