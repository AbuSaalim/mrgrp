"use client";

import React from "react";
import { useAttendance } from "./hooks/useAttendance";
import { AttendanceHeader } from "./components/AttendanceHeader";
import { AttendanceTable } from "./components/AttendanceTable";
import { AttendanceMobileCards } from "./components/AttendanceMobileCards";
import { MapModal } from "./components/MapModal";
import { EditAttendanceModal } from "./components/EditAttendanceModal";

export default function LiveAttendancePage() {
  const {
    attendances,
    isLoading,
    selectedMap,
    setSelectedMap,
    editingRecord,
    setEditingRecord,
    selectedDate,
    setSelectedDate,
    editForm,
    setEditForm,
    todayStr,
    fetchAttendance,
    openEditModal,
    handleSaveEdit,
    getStatusTheme,
  } = useAttendance();

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* HEADER WITH PREMIUM DATE PICKER */}
      <AttendanceHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        todayStr={todayStr}
      />

      {isLoading ? (
        <div className="text-center py-10 text-blue-400/70 animate-pulse bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold tracking-widest uppercase shadow-sm font-sans">
          Syncing records...
        </div>
      ) : (
        <div className="w-full relative z-10">
          {/* DESKTOP VIEW */}
          <AttendanceTable
            attendances={attendances}
            setSelectedMap={setSelectedMap}
            openEditModal={openEditModal}
            getStatusTheme={getStatusTheme}
          />

          {/* MOBILE VIEW */}
          <AttendanceMobileCards
            attendances={attendances}
            setSelectedMap={setSelectedMap}
            openEditModal={openEditModal}
            getStatusTheme={getStatusTheme}
          />
        </div>
      )}

      {/* MAP MODAL */}
      <MapModal selectedMap={selectedMap} onClose={() => setSelectedMap(null)} />

      {/* EDIT MODAL */}
      <EditAttendanceModal
        editingRecord={editingRecord}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        onClose={() => setEditingRecord(null)}
      />
    </div>
  );
}