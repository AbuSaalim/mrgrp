"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PayrollRecord,
  PayrollSummary,
  ConfirmDialogState,
  ActionMessageState,
  RateFormState,
  AdjustmentFormState,
  Employee,
} from "../types";

export function usePayroll() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalEmployees: 0,
    totalPayrollCost: 0,
    totalHoursWorked: 0,
    lockedRecordsCount: 0,
    draftRecordsCount: 0,
    avgEnterpriseWorkingDays: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedUserForRate, setSelectedUserForRate] = useState<Employee | null>(null);
  const [allEmployeesList, setAllEmployeesList] = useState<Employee[]>([]);
  const [rateForm, setRateForm] = useState<RateFormState>({
    dailyRate: 800,
    overtimeRate: 120,
    monthlyFixedSalary: 0,
    standardShiftHours: 9,
  });

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedRecordForAdjust, setSelectedRecordForAdjust] = useState<PayrollRecord | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustmentFormState>({
    type: "BONUS",
    amount: "",
    reason: "",
  });

  const [actionMessage, setActionMessage] = useState<ActionMessageState | null>(null);

  const fetchPayrollSummary = async (month: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/hr/payroll/summary?month=${month}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setSummary(
          data.summary || {
            totalEmployees: 0,
            totalPayrollCost: 0,
            totalHoursWorked: 0,
            lockedRecordsCount: 0,
            draftRecordsCount: 0,
            avgEnterpriseWorkingDays: 0,
          }
        );
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to load payroll calculation engine." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollSummary(selectedMonth);
    fetch("/api/hr/users")
      .then((res) => (res.ok ? res.json() : { employees: [] }))
      .then((data) => setAllEmployeesList(data.employees || []))
      .catch((err) => console.error("Error loading employees for rate modal:", err));
  }, [selectedMonth]);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRate) return;

    try {
      const res = await fetch("/api/hr/payroll/salary-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserForRate._id,
          dailyRate: Number(rateForm.dailyRate),
          overtimeRate: Number(rateForm.overtimeRate),
          monthlyFixedSalary: Number(rateForm.monthlyFixedSalary),
          standardShiftHours: Number(rateForm.standardShiftHours),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRateModalOpen(false);
        setActionMessage({ type: "success", text: "Salary structure updated. Recalculating payroll..." });
        fetchPayrollSummary(selectedMonth);
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to update rates" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAdjust) return;

    const amount = parseFloat(adjustForm.amount);
    const type = adjustForm.type;

    if ((type === "BONUS" || type === "ALLOWANCE" || type === "Bonus" || type === "Allowance") && amount < 0) {
      toast.error("Bonus must be a positive value.");
      setIsLoading(false);
      return;
    }
    if ((type === "PENALTY" || type === "Penalty") && amount > 0) {
      toast.error("Penalty must be a negative value.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Applying adjustment...");
    try {
      const res = await fetch("/api/hr/payroll/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedRecordForAdjust.user?._id || selectedRecordForAdjust.userId,
          periodMonth: selectedMonth,
          type: adjustForm.type,
          amount: Number(adjustForm.amount),
          reason: adjustForm.reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdjustModalOpen(false);
        setAdjustForm({ type: "BONUS", amount: "", reason: "" });
        toast.success("Adjustment applied and net payout recalculated!", { id: toastId });
        setActionMessage({ type: "success", text: "Adjustment applied and net payout recalculated!" });
        fetchPayrollSummary(selectedMonth);
      } else {
        toast.error(data.error || "Adjustment failed", { id: toastId });
        setActionMessage({ type: "error", text: data.error || "Adjustment failed" });
      }
    } catch (err: any) {
      toast.error(err.message || "Adjustment failed", { id: toastId });
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeLockPeriod = async (userId?: string) => {
    const toastId = toast.loading("Locking payroll records...");
    try {
      const res = await fetch("/api/hr/payroll/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodMonth: selectedMonth,
          userId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Payroll locked successfully!", { id: toastId });
        setActionMessage({ type: "success", text: data.message || "Payroll locked successfully!" });
        fetchPayrollSummary(selectedMonth);
      } else {
        toast.error(data.error || "Lock operation failed", { id: toastId });
        setActionMessage({ type: "error", text: data.error || "Lock operation failed" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to lock payroll records", { id: toastId });
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleLockPeriod = (userId?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: userId ? "Lock Employee Salary" : "Lock All Payroll Records",
      message: userId
        ? "Lock salary for this employee?"
        : `Lock all payroll records for ${selectedMonth}? Once locked, they cannot be edited.`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        executeLockPeriod(userId);
      },
    });
  };

  const filteredRecords = records.filter((rec) => {
    const name = rec.user?.name || "";
    const email = rec.user?.email || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return {
    selectedMonth,
    setSelectedMonth,
    loading,
    isLoading,
    records,
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
  };
}
