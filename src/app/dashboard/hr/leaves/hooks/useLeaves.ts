"use client";

import { useState, useEffect, useMemo } from "react";
import { LeaveItem, LeaveKPIs, EmployeeLeaveStats } from "../types";

export function useLeaves() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Smart Context Right Drawer state
  const [drawerLeave, setDrawerLeave] = useState<LeaveItem | null>(null);

  // Filters for Leave History Table
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Approved" | "Rejected">("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hr/leaves");
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (leaveId: string, status: "Approved" | "Rejected") => {
    setActionLoadingId(leaveId);
    try {
      await fetch("/api/hr/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status }),
      });
      await fetchLeaves();
      // Update drawer state if the open leave was actioned
      if (drawerLeave && drawerLeave._id === leaveId) {
        setDrawerLeave((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (error) {
      console.error("Error updating leave:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkAction = async (status: "Approved" | "Rejected") => {
    if (selectedLeaveIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await Promise.all(
        selectedLeaveIds.map((leaveId) =>
          fetch("/api/hr/leaves", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leaveId, status }),
          })
        )
      );
      setSelectedLeaveIds([]);
      await fetchLeaves();
      if (drawerLeave && selectedLeaveIds.includes(drawerLeave._id)) {
        setDrawerLeave((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (error) {
      console.error("Bulk action error:", error);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === "Pending"), [leaves]);
  const historyLeaves = useMemo(() => leaves.filter((l) => l.status !== "Pending"), [leaves]);

  // Select All Checkbox logic
  const isAllSelected = pendingLeaves.length > 0 && selectedLeaveIds.length === pendingLeaves.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeaveIds([]);
    } else {
      setSelectedLeaveIds(pendingLeaves.map((l) => l._id));
    }
  };

  const toggleSelectCard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedLeaveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // KPI Metrics calculation
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const kpis = useMemo<LeaveKPIs>(() => {
    const pendingCount = pendingLeaves.length;

    const onLeaveTodayCount = leaves.filter(
      (l) => l.status === "Approved" && l.date <= todayStr && (!l.endDate || l.endDate >= todayStr)
    ).length;

    const rejectedThisMonthCount = leaves.filter(
      (l) => l.status === "Rejected" && String(l.date).startsWith(currentMonthStr)
    ).length;

    const approvedThisMonthCount = leaves.filter(
      (l) => l.status === "Approved" && String(l.date).startsWith(currentMonthStr)
    ).length;

    return {
      pendingCount,
      onLeaveTodayCount,
      rejectedThisMonthCount,
      approvedThisMonthCount,
    };
  }, [leaves, pendingLeaves, todayStr, currentMonthStr]);

  // Filtered History
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    historyLeaves.forEach((l) => {
      if (l.date) months.add(l.date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [historyLeaves]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    historyLeaves.forEach((l) => {
      if (l.type) types.add(l.type);
    });
    return Array.from(types).sort();
  }, [historyLeaves]);

  const filteredHistory = useMemo(() => {
    return historyLeaves.filter((leave) => {
      const empName = leave.userId?.name || "";
      const reasonText = leave.reason || "";
      const matchesSearch =
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reasonText.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || leave.status === statusFilter;

      const matchesMonth = monthFilter === "ALL" || String(leave.date).startsWith(monthFilter);

      const matchesType = typeFilter === "ALL" || leave.type === typeFilter;

      return matchesSearch && matchesStatus && matchesMonth && matchesType;
    });
  }, [historyLeaves, searchQuery, statusFilter, monthFilter, typeFilter]);

  // Smart Context Drawer: Compute Employee Leave Balances
  const drawerEmployeeStats = useMemo<EmployeeLeaveStats | null>(() => {
    if (!drawerLeave) return null;
    const empId = drawerLeave.userId?._id;
    const empName = drawerLeave.userId?.name || "Employee";

    const empLeaves = leaves.filter((l) => l.userId?._id === empId);
    const approvedEmpLeaves = empLeaves.filter((l) => l.status === "Approved");

    const clUsed = approvedEmpLeaves.filter((l) => l.type === "CL").length;
    const slUsed = approvedEmpLeaves.filter((l) => l.type === "SL").length;
    const elUsed = approvedEmpLeaves.filter((l) => l.type === "EL").length;

    return {
      empName,
      clBalance: { quota: 7, used: clUsed, remaining: Math.max(0, 7 - clUsed) },
      slBalance: { quota: 8, used: slUsed, remaining: Math.max(0, 8 - slUsed) },
      elBalance: { quota: 15, used: elUsed, remaining: Math.max(0, 15 - elUsed) },
      history: empLeaves.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [drawerLeave, leaves]);

  const formatLeaveDateRange = (start: string, end?: string) => {
    if (!start) return "N/A";
    const startDate = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!end || end === start) {
      return startDate;
    }
    const endDate = new Date(end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startDate} — ${endDate}`;
  };

  return {
    leaves,
    isLoading,
    actionLoadingId,
    selectedLeaveIds,
    setSelectedLeaveIds,
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
    historyLeaves,
    isAllSelected,
    toggleSelectAll,
    toggleSelectCard,
    kpis,
    availableMonths,
    availableTypes,
    filteredHistory,
    drawerEmployeeStats,
    formatLeaveDateRange,
  };
}
