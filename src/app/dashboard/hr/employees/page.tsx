"use client";

import React from "react";
import { useEmployees } from "./hooks/useEmployees";
import { EmployeesHeader } from "./components/EmployeesHeader";
import { EmployeesDesktopList } from "./components/EmployeesDesktopList";
import { EmployeesMobileList } from "./components/EmployeesMobileList";
import { EmployeeLogsModal } from "./components/EmployeeLogsModal";
import { ManualUpdateModal } from "./components/ManualUpdateModal";

export default function StaffDirectoryPage() {
  const {
    employees,
    isLoading,
    selectedUser,
    setSelectedUser,
    isModalLoading,
    editingDate,
    setEditingDate,
    editInTime,
    setEditInTime,
    editOutTime,
    setEditOutTime,
    editNote,
    setEditNote,
    isSaving,
    daysInMonth,
    emptyDays,
    weekdays,
    monthName,
    currentYear,
    openProfileView,
    handlePrevMonth,
    handleNextMonth,
    getDayMetrics,
    handleDateClick,
    saveManualEntry,
  } = useEmployees();

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-200">
      {/* Header */}
      <EmployeesHeader />

      {isLoading ? (
        <div className="text-center py-10 text-blue-400/70 animate-pulse text-sm font-semibold tracking-widest uppercase font-sans">
          Syncing indexes...
        </div>
      ) : (
        <div className="w-full">
          {/* MOBILE VIEW */}
          <EmployeesMobileList employees={employees} openProfileView={openProfileView} />

          {/* DESKTOP VIEW */}
          <EmployeesDesktopList employees={employees} openProfileView={openProfileView} />
        </div>
      )}

      {/* MODAL 1: History Viewer (Calendar) */}
      <EmployeeLogsModal
        selectedUser={selectedUser}
        isModalLoading={isModalLoading}
        monthName={monthName}
        currentYear={currentYear}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        weekdays={weekdays}
        emptyDays={emptyDays}
        daysInMonth={daysInMonth}
        getDayMetrics={getDayMetrics}
        handleDateClick={handleDateClick}
        onClose={() => setSelectedUser(null)}
      />

      {/* MODAL 2: EDIT MODAL */}
      <ManualUpdateModal
        editingDate={editingDate}
        editInTime={editInTime}
        setEditInTime={setEditInTime}
        editOutTime={editOutTime}
        setEditOutTime={setEditOutTime}
        editNote={editNote}
        setEditNote={setEditNote}
        isSaving={isSaving}
        onSave={saveManualEntry}
        onClose={() => setEditingDate(null)}
      />
    </div>
  );
}