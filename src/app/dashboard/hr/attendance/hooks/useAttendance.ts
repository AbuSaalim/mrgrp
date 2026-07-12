"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AttendanceRecord, MapModalState, EditFormState } from "../types";

export function useAttendance() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<MapModalState | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Date Filter State
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [editForm, setEditForm] = useState<EditFormState>({
    date: "",
    punchInTime: "",
    punchOutTime: "",
    status: "",
    hrNotes: "",
  });

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/attendance?date=${selectedDate}`);
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const openEditModal = (att: AttendanceRecord) => {
    setEditingRecord(att);
    const inTimeStr = att.punchIn?.time
      ? new Date(att.punchIn.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      : "";
    const outTimeStr = att.punchOut?.time
      ? new Date(att.punchOut.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      : "";
    setEditForm({
      date: att.date || "",
      punchInTime: inTimeStr,
      punchOutTime: outTimeStr,
      status: att.status || "Absent",
      hrNotes: att.hrNotes || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const toastId = toast.loading("Saving attendance record...");
    try {
      const payload = {
        recordId: editingRecord._id,
        date: editForm.date,
        status: editForm.status,
        hrNotes: editForm.hrNotes,
        punchInTime: editForm.punchInTime ? new Date(`${editForm.date}T${editForm.punchInTime}`).toISOString() : "",
        punchOutTime: editForm.punchOutTime ? new Date(`${editForm.date}T${editForm.punchOutTime}`).toISOString() : "",
      };

      const res = await fetch("/api/hr/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Attendance record updated successfully.", { id: toastId });
        setEditingRecord(null);
        fetchAttendance();
      } else {
        toast.error("Failed to save attendance record.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while saving attendance record.", { id: toastId });
    }
  };

  // Status-Based Theme Generator
  const getStatusTheme = (status: string) => {
    switch (status) {
      case "Present":
        return {
          wrapper:
            "border-emerald-500/30 dark:border-emerald-500/40 hover:border-emerald-500/80 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
          badge:
            "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm dark:shadow-none",
          icon: "text-emerald-600 dark:text-emerald-400",
        };
      case "Absent":
      case "Missed Out":
        return {
          wrapper:
            "border-rose-500/30 dark:border-rose-500/40 hover:border-rose-500/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.05)]",
          badge:
            "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 shadow-sm dark:shadow-none",
          icon: "text-rose-600 dark:text-rose-400",
        };
      case "In Progress":
        return {
          wrapper:
            "border-blue-500/30 dark:border-blue-500/40 hover:border-blue-500/80 hover:bg-blue-50 dark:hover:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
          badge:
            "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm dark:shadow-none",
          icon: "text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          wrapper:
            "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50",
          badge:
            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
          icon: "text-slate-500 dark:text-slate-400",
        };
    }
  };

  return {
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
  };
}
