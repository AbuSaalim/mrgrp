"use client";

import { useEffect, useState } from "react";
import { Users, Clock, ClipboardList, LayoutDashboard, Wallet } from "lucide-react";
import Link from "next/link";
import AttendanceCard from "@/components/AttendanceCard";

export default function HROverviewDashboard() {
  const [stats, setStats] = useState({ totalStaff: 0, activeToday: 0, pendingLeaves: 0 });
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentUser(data);
      })
      .catch((err) => console.error("Auth User Error:", err));

    // Dynamic overview pipeline calculations with fail-safes
    Promise.all([
      fetch("/api/hr/users").then(res => res.ok ? res.json() : { employees: [] }),
      fetch("/api/hr/attendance").then(res => res.ok ? res.json() : { attendances: [] }),
      fetch("/api/hr/leaves").then(res => res.ok ? res.json() : { leaves: [] })
    ]).then(([usersData, attData, leavesData]) => {
      setStats({
        totalStaff: usersData.employees?.length || 0,
        activeToday: attData.attendances?.filter((a: any) => a.status === "In Progress" || a.status === "Present").length || 0,
        pendingLeaves: leavesData.leaves?.length || 0
      });
    }).catch(err => console.error("Dashboard Stats Error:", err));
  }, []);

  const isSuperAdmin = currentUser?.role === "Super Admin" || currentUser?.role?.includes("Super");

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800/40 text-slate-800 dark:text-white p-4 sm:p-6 rounded-3xl space-y-6 sm:space-y-8 shadow-sm animate-in fade-in duration-500">
      
      {/* Daily Attendance Card: Hidden for Super Admin */}
      {!isSuperAdmin && <AttendanceCard />}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-850 dark:text-white flex items-center tracking-tight">
          <LayoutDashboard className="mr-3 h-6 w-6 text-blue-500" /> HR Administration Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">High-level enterprise operation logs and resource status summaries.</p>
      </div>

      {/* QUICK STATUS METRICS (Mobile-First Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* BLUE THEME - TOTAL PERSONNEL */}
        <Link href="/dashboard/hr/employees" className="group bg-white dark:bg-blue-500/5 border border-slate-200 dark:border-blue-500/40 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(59,130,246,0.05)] dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:bg-slate-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/80 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest mb-1.5">Total Personnel</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.totalStaff} <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-normal">Workers</span></span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-300">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 dark:text-blue-400" />
          </div>
        </Link>

        {/* EMERALD THEME - ACTIVE TODAY */}
        <Link href="/dashboard/hr/attendance" className="group bg-white dark:bg-emerald-500/5 border border-slate-200 dark:border-emerald-500/40 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-slate-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/80 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest mb-1.5">Punched In Today</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.activeToday} <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-normal">Active</span></span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform duration-300">
            <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500 dark:text-emerald-400" />
          </div>
        </Link>

        {/* AMBER THEME - PENDING LEAVES */}
        <Link href="/dashboard/hr/leaves" className="group bg-white dark:bg-amber-500/5 border border-slate-200 dark:border-amber-500/40 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(245,158,11,0.05)] dark:hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:bg-slate-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/80 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest mb-1.5">Leave Filings</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.pendingLeaves} <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-normal">Pending</span></span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform duration-300">
            <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500 dark:text-amber-400" />
          </div>
        </Link>

        {/* INDIGO THEME - PAYROLL HUB (Admin only) */}
        {isSuperAdmin && (
          <Link href="/dashboard/hr/payroll" className="group bg-white dark:bg-indigo-500/5 border border-slate-200 dark:border-indigo-500/40 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.05)] dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:bg-slate-50 dark:hover:bg-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/80 transition-all duration-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest mb-1.5">Calculation Engine</span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Payroll <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-normal">Hub</span></span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform duration-300">
              <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500 dark:text-indigo-400" />
            </div>
          </Link>
        )}

        {/* PURPLE THEME - LEAVE ALLOCATION */}
        <Link href="/dashboard/hr/leave-allocation" className="group bg-white dark:bg-purple-500/5 border border-slate-200 dark:border-purple-500/40 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(168,85,247,0.05)] dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:bg-slate-50 dark:hover:bg-purple-500/10 hover:border-purple-300 dark:hover:border-purple-500/80 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest mb-1.5">Manage Quotas</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Leave <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-normal">Allocation</span></span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform duration-300">
            <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 dark:text-purple-400" />
          </div>
        </Link>

      </div>
    </div>
  );
}