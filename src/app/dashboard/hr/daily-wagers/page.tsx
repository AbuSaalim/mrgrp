"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Calendar as CalendarIcon, RefreshCw, Users, Clock, IndianRupee, Building2, Download } from "lucide-react";
import AddWorkerModal from "@/components/employees/AddWorkerModal";
import EditWorkerModal from "@/components/employees/EditWorkerModal";
import DailyWagersTable from "@/components/employees/DailyWagersTable";
import LogActionModal from "@/components/employees/LogActionModal";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DailyWagersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedWorkerForAction, setSelectedWorkerForAction] = useState(null);
  const [selectedWorkerForEdit, setSelectedWorkerForEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => 
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Fetch current user for role-based access
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.role) setUserRole(data.role);
      })
      .catch((err) => console.error("Failed to fetch user role:", err));
  }, []);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workers/summary?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setWorkers(data.summary || []);
        } else {
          console.error("Failed to fetch workers summary");
        }
      } catch (err) {
        console.error("Error fetching workers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [selectedDate, refreshKey]);

  const handleWorkerAdded = () => {
    // Refresh the list when a new worker is added
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdateWorkerClick = (worker: any) => {
    setSelectedWorkerForEdit(worker);
    setIsEditModalOpen(true);
  };

  const handleWorkerUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditWorker = (worker: any) => {
    setSelectedWorkerForAction(worker);
    setIsLogModalOpen(true);
  };

  const handleActionLogged = () => {
    // Refresh the list when an action is logged
    setRefreshKey(prev => prev + 1);
  };

  const handleViewWorker = (worker: any) => {
    router.push(`/dashboard/hr/daily-wagers/${worker._id}`);
  };

  const handleTogglePayment = async (worker: any) => {
    if (!worker.totalPayment || worker.totalPayment <= 0) return;

    const nextStatus = worker.paymentStatus === "Paid" ? "Pending" : "Paid";
    try {
      const res = await fetch("/api/daily-wager/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker._id,
          date: selectedDate,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        setRefreshKey((prev) => prev + 1);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update payment status");
      }
    } catch (err) {
      console.error("Payment status update error:", err);
      alert("Failed to update payment status");
    }
  };

  const handleExportCSV = () => {
    if (!workers || workers.length === 0) {
      alert("No daily wager data available to export for this date.");
      return;
    }

    const headers = [
      "Worker ID",
      "Worker Name",
      "Skill",
      "Phone Number",
      "Status",
      "Current Site",
      "IN Time",
      "OUT Time",
      "Total Hours",
      "Hourly Rate (INR)",
      "Daily Wage Total (INR)",
      "Payment Status",
      "Date"
    ];

    const rows = filteredWorkers.map((w: any, idx: number) => [
      `#${idx + 1}`,
      `"${(w.name || '').replace(/"/g, '""')}"`,
      `"${(w.skill || '').replace(/"/g, '""')}"`,
      `"${w.phoneNumber || '-'}"`,
      `"${w.currentStatus || '-'}"`,
      `"${(w.currentSite || '-').replace(/"/g, '""')}"`,
      `"${w.inTime ? format(new Date(w.inTime), 'hh:mm a') : '-'}"`,
      `"${w.outTime ? format(new Date(w.outTime), 'hh:mm a') : '-'}"`,
      w.totalHours || 0,
      w.perHourRate || 0,
      w.totalPayment || 0,
      `"${w.paymentStatus || 'Pending'}"`,
      selectedDate
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daily_Wagers_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics calculations
  const totalWorkers = workers.length;
  const activeOnSite = workers.filter((w: any) => w.currentStatus === "IN" || w.currentStatus === "TRANSFER").length;
  const totalHours = workers.reduce((sum: number, w: any) => sum + (Number(w.totalHours) || 0), 0);
  const totalPayment = workers.reduce((sum: number, w: any) => sum + (Number(w.totalPayment) || 0), 0);
  const activeSites = Array.from(new Set(
    workers
      .filter((w: any) => (w.currentStatus === "IN" || w.currentStatus === "TRANSFER") && w.currentSite && w.currentSite !== "N/A")
      .map((w: any) => w.currentSite)
  )).length;

  // Filter workers based on search query
  const filteredWorkers = workers.filter((worker: any) =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (worker.phoneNumber && worker.phoneNumber.includes(searchQuery)) ||
    (worker.currentSite && worker.currentSite.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (worker._id && worker._id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="px-1 py-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Wager Tracking</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage daily wagers, their IN/OUT times, and calculate total pay.
        </p>
      </div>

      {/* KPI Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Active On Site */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-emerald-500/30 dark:bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                On Site Now
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {activeOnSite}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  / {totalWorkers} workers
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 sm:p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Total Hours Logged */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-blue-500/30 dark:bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Hours Logged
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {totalHours.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">hrs</span>
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 sm:p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Total Wage / Daily Payout */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-purple-500/30 dark:bg-purple-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Daily Wages
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                  ₹{Math.round(totalPayment).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-purple-50 p-2.5 sm:p-3 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Active Sites */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Active Sites
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {activeSites}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">locations</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 sm:p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-3 sm:p-4 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 outline-none transition-all touch-manipulation"
            placeholder="Search by name, ID or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-[150px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <DatePicker
              selected={new Date(selectedDate + "T00:00:00")}
              onChange={(date: Date | null) => {
                if (date) setSelectedDate(format(date, "yyyy-MM-dd"));
              }}
              dateFormat="dd/MM/yyyy"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 outline-none transition-all cursor-pointer"
            />
          </div>
          
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors shrink-0"
            title="Export CSV for selected date"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {Boolean(userRole && (userRole.toUpperCase().includes("HR") || userRole.toUpperCase().includes("SUPER") || userRole.toUpperCase().includes("ADMIN"))) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shrink-0"
              title="Add Worker"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Worker</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Component */}
      <DailyWagersTable 
        workers={filteredWorkers} 
        loading={loading}
        userRole={userRole} 
        onEdit={handleEditWorker}
        onUpdateWorker={handleUpdateWorkerClick}
        onView={handleViewWorker}
        onTogglePayment={handleTogglePayment}
      />

      {/* Modals */}
      <AddWorkerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onWorkerAdded={handleWorkerAdded}
      />
      <EditWorkerModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onWorkerUpdated={handleWorkerUpdated}
        worker={selectedWorkerForEdit}
      />
      <LogActionModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onActionLogged={handleActionLogged}
        worker={selectedWorkerForAction}
        selectedDate={selectedDate}
      />
    </div>
  );
}
