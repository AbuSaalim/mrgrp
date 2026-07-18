"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Calendar, User as UserIcon, Check } from "lucide-react";

interface UserAllocation {
  _id: string;
  name: string;
  email: string;
  allocated: Record<string, number>;
}

export default function LeaveAllocationPage() {
  const [users, setUsers] = useState<UserAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAllocation | null>(null);
  const [leaveType, setLeaveType] = useState("SL");
  const [allocMode, setAllocMode] = useState<"adjust" | "set">("adjust");
  const [amountVal, setAmountVal] = useState<number | string>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveTypes = [
    { code: "CL", label: "Casual Leave" },
    { code: "SL", label: "Sick Leave" },
    { code: "EL", label: "Earned / Privilege Leave" },
    { code: "MATERNITY", label: "Maternity Leave" },
    { code: "PATERNITY", label: "Paternity Leave" },
    { code: "COMP_OFF", label: "Compensatory Off" },
    { code: "BEREAVEMENT", label: "Bereavement Leave" },
    { code: "MARRIAGE", label: "Marriage Leave" },
    { code: "LWP", label: "Leave Without Pay" },
  ];

  const fetchAllocations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/leave-allocations?year=${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.allocations || []);
      }
    } catch (error) {
      console.error("Error fetching allocations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [currentYear]);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || amountVal === "") return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/leave-allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser._id,
          year: currentYear,
          type: leaveType,
          mode: allocMode,
          amount: Number(amountVal),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchAllocations();
      } else {
        alert("Failed to allocate leave");
      }
    } catch (error) {
      console.error("Error allocating leave:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (user: UserAllocation) => {
    setSelectedUser(user);
    setLeaveType("SL");
    setAllocMode("adjust");
    setAmountVal(1);
    setIsModalOpen(true);
  };

  const currentQuota = selectedUser?.allocated?.[leaveType] || 0;

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            Leave Allocations ({currentYear})
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage custom leave balances for each employee.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading allocations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 min-w-[200px]">Employee</th>
                  {leaveTypes.filter(lt => lt.code !== "LWP").map((lt) => (
                    <th key={lt.code} className="px-3 py-4 text-center whitespace-nowrap">
                      {lt.code}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right min-w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{user.name}</div>
                          <div className="text-xs text-slate-500 whitespace-nowrap">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {leaveTypes.filter(lt => lt.code !== "LWP").map((lt) => {
                      const val = user.allocated?.[lt.code] || 0;
                      return (
                        <td key={lt.code} className="px-3 py-4 text-center">
                          {val > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                              {val}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-600">0</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Allocate / Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={leaveTypes.length + 2} className="px-6 py-8 text-center text-slate-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Manage Leave Quota</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAllocate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Employee
                </label>
                <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium">
                  {selectedUser.name} ({selectedUser.email})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white font-medium"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label} ({t.code})
                    </option>
                  ))}
                </select>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  Current Quota: <strong>{currentQuota} days</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Action Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAllocMode("adjust");
                      setAmountVal(1);
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      allocMode === "adjust"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Add / Deduct (+ / -)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAllocMode("set");
                      setAmountVal(0);
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      allocMode === "set"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Set Total Directly (=)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {allocMode === "adjust" ? "Amount to Add / Deduct (Use - for deduct)" : "New Total Quota (Set 0 to remove)"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={amountVal}
                  onChange={(e) => setAmountVal(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white font-mono"
                  placeholder={allocMode === "adjust" ? "e.g., 1 or -1" : "e.g., 0 or 5"}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  {allocMode === "adjust"
                    ? `New quota will be: ${Math.max(0, currentQuota + Number(amountVal || 0))} days.`
                    : `Setting to 0 will remove ${leaveType} from employee's available leaves.`}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Saving..." : "Save Quota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
