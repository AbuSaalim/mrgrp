"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
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

  // Filter workers based on search query
  const filteredWorkers = workers.filter((worker: any) =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (worker._id && worker._id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="px-1 py-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Daily Wager Tracking</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage daily wagers, their IN/OUT times, and calculate total pay.
            </p>
          </div>
          {(userRole.includes("HR") || userRole.includes("Super") || userRole.includes("Admin")) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="sm:hidden inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Worker
            </button>
          )}
        </div>

        {(userRole.includes("HR") || userRole.includes("Super") || userRole.includes("Admin")) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors dark:focus:ring-offset-gray-900 shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Add Worker
          </button>
        )}
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
        
        <div className="flex items-center gap-2 justify-between sm:justify-start">
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
