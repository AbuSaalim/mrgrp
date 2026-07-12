"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { PublicHolidayItem, ConfirmDialogState, HolidayFormState, NotificationState } from "../types";

export function useHolidays() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<PublicHolidayItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Modal states
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHolidayItem | null>(null);
  const [formData, setFormData] = useState<HolidayFormState>({
    name: "",
    dateString: `${selectedYear}-01-01`,
    type: "National",
    isActive: true,
    description: "",
  });

  const [filterType, setFilterType] = useState<string>("ALL");

  const showNotification = (type: "success" | "error", text: string) => {
    if (type === "success") toast.success(text);
    else toast.error(text);
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchHolidays = async (year: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/holidays?year=${year}`);
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error("Error loading holidays:", err);
      showNotification("error", "Failed to load holidays");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

  // Adjust form date when selected year changes (only for new additions)
  useEffect(() => {
    if (!editingHoliday) {
      setFormData((prev) => ({
        ...prev,
        dateString: `${selectedYear}-01-01`,
      }));
    }
  }, [selectedYear, editingHoliday]);

  const handlePreSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/hr/holidays/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      });
      const data = await res.json();
      if (res.ok) {
        setHolidays(data.holidays || []);
        showNotification("success", data.message || `Standard holidays seeded for ${selectedYear}`);
      } else {
        showNotification("error", data.message || "Seeding failed");
      }
    } catch (err) {
      showNotification("error", "Network error while seeding");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormData({
      name: "",
      dateString: `${selectedYear}-01-01`,
      type: "National",
      isActive: true,
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (holiday: PublicHolidayItem) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      dateString: holiday.dateString,
      type: holiday.type,
      isActive: holiday.isActive,
      description: holiday.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        const res = await fetch("/api/hr/holidays", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingHoliday._id,
            ...formData,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showNotification("success", `Updated holiday '${formData.name}'`);
          setIsModalOpen(false);
          fetchHolidays(selectedYear);
        } else {
          showNotification("error", data.message || "Failed to update holiday");
        }
      } else {
        const res = await fetch("/api/hr/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showNotification("success", `Added holiday '${formData.name}'`);
          setIsModalOpen(false);
          fetchHolidays(selectedYear);
        } else {
          showNotification("error", data.message || "Failed to create holiday");
        }
      }
    } catch (err) {
      showNotification("error", "Error saving holiday");
    }
  };

  const handleToggleActive = async (holiday: PublicHolidayItem) => {
    try {
      const res = await fetch("/api/hr/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: holiday._id,
          isActive: !holiday.isActive,
        }),
      });
      if (res.ok) {
        setHolidays((prev) =>
          prev.map((item) =>
            item._id === holiday._id ? { ...item, isActive: !holiday.isActive } : item
          )
        );
        showNotification(
          "success",
          `${holiday.name} is now ${!holiday.isActive ? "Active" : "Inactive"}`
        );
      }
    } catch (err) {
      showNotification("error", "Failed to update status");
    }
  };

  const executeDelete = async (id: string, name: string) => {
    const toastId = toast.loading(`Deleting holiday '${name}'...`);
    try {
      const res = await fetch(`/api/hr/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHolidays((prev) => prev.filter((h) => h._id !== id));
        toast.success(`Deleted holiday '${name}'`, { id: toastId });
        setNotification({ type: "success", text: `Deleted holiday '${name}'` });
      } else {
        toast.error("Failed to delete holiday", { id: toastId });
        showNotification("error", "Failed to delete holiday");
      }
    } catch (err) {
      toast.error("Error deleting holiday", { id: toastId });
      showNotification("error", "Error deleting holiday");
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Holiday",
      message: `Are you sure you want to delete '${name}'?`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        executeDelete(id, name);
      },
    });
  };

  const getCardTheme = (type: string, isActive: boolean) => {
    if (!isActive) {
      return "border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-50 grayscale transition-all shadow-sm";
    }
    if (type === "National") {
      return "border-blue-500/40 dark:border-blue-500/30 bg-white dark:bg-slate-900/40 hover:bg-blue-50/20 dark:hover:bg-blue-500/5 hover:border-blue-500 dark:hover:border-blue-500/60 shadow-sm dark:shadow-[inset_0_0_15px_rgba(59,130,246,0.02)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]";
    }
    if (type === "Regional") {
      return "border-amber-500/40 dark:border-amber-500/30 bg-white dark:bg-slate-900/40 hover:bg-amber-50/20 dark:hover:bg-amber-500/5 hover:border-amber-500 dark:hover:border-amber-500/60 shadow-sm dark:shadow-[inset_0_0_15px_rgba(245,158,11,0.02)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]";
    }
    return "border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-slate-900/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 hover:border-emerald-500 dark:hover:border-emerald-500/60 shadow-sm dark:shadow-[inset_0_0_15px_rgba(16,185,129,0.02)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]";
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter((item) => {
      if (filterType === "ALL") return true;
      return item.type === filterType;
    });
  }, [holidays, filterType]);

  return {
    selectedYear,
    setSelectedYear,
    holidays,
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
    fetchHolidays,
    handlePreSeed,
    handleOpenAddModal,
    handleOpenEditModal,
    handleSubmit,
    handleToggleActive,
    handleDelete,
    getCardTheme,
    filteredHolidays,
  };
}
