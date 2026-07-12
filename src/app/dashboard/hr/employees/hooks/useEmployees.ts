"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { EmployeeItem, HistoryData, DayMetric } from "../types";

export function useEmployees() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Drawer/Modal States
  const [selectedUser, setSelectedUser] = useState<EmployeeItem | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData>({ attendances: [], leaves: [] });
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Manual Edit States
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editInTime, setEditInTime] = useState("");
  const [editOutTime, setEditOutTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Month States
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hr/users");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openProfileView = async (user: EmployeeItem) => {
    setSelectedUser(user);
    setIsModalLoading(true);
    try {
      const res = await fetch(`/api/hr/users/history?userId=${user._id}`);
      const data = await res.json();
      setHistoryData({ attendances: data.attendances || [], leaves: data.leaves || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const daysInMonth = useMemo(() => {
    return Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1);
  }, [currentYear, currentMonth]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentYear, currentMonth]);

  const emptyDays = useMemo(() => {
    return Array.from({ length: startDayOfWeek }, (_, i) => i);
  }, [startDayOfWeek]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getDayMetrics = (day: number): DayMetric => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const leave = historyData.leaves.find((l) => l.date === formattedDate);
    if (leave) return { type: "leave", tag: leave.type, status: leave.status, rawData: null };

    const att = historyData.attendances.find((a) => a.date === formattedDate);
    if (att) return { type: att.status === "Present" ? "present" : "missed", tag: null, status: null, rawData: att };

    return { type: "empty", tag: null, status: null, rawData: null };
  };

  const handleDateClick = (day: number) => {
    const isAdminOrHR = true;
    if (!isAdminOrHR) return;

    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const metrics = getDayMetrics(day);

    if (metrics.rawData) {
      setEditInTime(
        metrics.rawData.punchIn?.time
          ? new Date(metrics.rawData.punchIn.time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""
      );
      setEditOutTime(
        metrics.rawData.punchOut?.time
          ? new Date(metrics.rawData.punchOut.time).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""
      );
      setEditNote(metrics.rawData.hrNotes || "");
    } else {
      setEditInTime("");
      setEditOutTime("");
      setEditNote("");
    }
    setEditingDate(formattedDate);
  };

  const saveManualEntry = async () => {
    if (!editInTime && !editOutTime) {
      toast.error("Please add In or Out time.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving attendance entry...");
    try {
      const res = await fetch("/api/hr/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser?._id,
          date: editingDate,
          inTime: editInTime,
          outTime: editOutTime,
          hrNote: editNote,
        }),
      });

      if (res.ok) {
        toast.success("Attendance record updated successfully.", { id: toastId });
        setEditingDate(null);
        if (selectedUser) {
          openProfileView(selectedUser);
        }
      } else {
        toast.error("Failed to update attendance record.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while updating attendance record.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "long" });
  }, [currentYear, currentMonth]);

  return {
    employees,
    isLoading,
    selectedUser,
    setSelectedUser,
    historyData,
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
    currentMonth,
    currentYear,
    daysInMonth,
    emptyDays,
    weekdays,
    monthName,
    fetchEmployees,
    openProfileView,
    handlePrevMonth,
    handleNextMonth,
    getDayMetrics,
    handleDateClick,
    saveManualEntry,
  };
}
