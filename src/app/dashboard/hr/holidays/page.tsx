"use client";

import React from "react";
import { useHolidays } from "./hooks/useHolidays";
import { ToastNotification } from "./components/ToastNotification";
import { HolidaysHeader } from "./components/HolidaysHeader";
import { HolidaysFilters } from "./components/HolidaysFilters";
import { HolidaysGrid } from "./components/HolidaysGrid";
import { EditHolidayModal } from "./components/EditHolidayModal";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";

export default function HRHolidaysPage() {
  const {
    selectedYear,
    setSelectedYear,
    isLoading,
    isSeeding,
    notification,
    confirmDialog,
    setConfirmDialog,
    isModalOpen,
    setIsModalOpen,
    editingHoliday,
    formData,
    setFormData,
    filterType,
    setFilterType,
    currentYear,
    handlePreSeed,
    handleOpenAddModal,
    handleOpenEditModal,
    handleSubmit,
    handleToggleActive,
    handleDelete,
    getCardTheme,
    filteredHolidays,
  } = useHolidays();

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 text-slate-700 dark:text-slate-100 min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 font-sans selection:bg-blue-500/20">
      {/* Toast Notification */}
      <ToastNotification notification={notification} />

      {/* Header & Actions */}
      <HolidaysHeader
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        currentYear={currentYear}
        isSeeding={isSeeding}
        handlePreSeed={handlePreSeed}
        handleOpenAddModal={handleOpenAddModal}
      />

      {/* Filter Tabs */}
      <HolidaysFilters
        filterType={filterType}
        setFilterType={setFilterType}
        totalCount={filteredHolidays.length}
      />

      {/* Holidays Display Grid */}
      <HolidaysGrid
        isLoading={isLoading}
        isSeeding={isSeeding}
        selectedYear={selectedYear}
        filteredHolidays={filteredHolidays}
        handlePreSeed={handlePreSeed}
        handleToggleActive={handleToggleActive}
        handleOpenEditModal={handleOpenEditModal}
        handleDelete={handleDelete}
        getCardTheme={getCardTheme}
      />

      {/* ADD / EDIT MODAL */}
      <EditHolidayModal
        isOpen={isModalOpen}
        editingHoliday={editingHoliday}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteDialog
        confirmDialog={confirmDialog}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}