import React from "react";
import { Edit2, Eye, Clock, CheckCircle2, ArrowRightLeft, LogOut, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface WorkerSummary {
  _id: string;
  name: string;
  skill: string;
  perHourRate: number;
  currentStatus: string;
  currentSite: string;
  inTime: string | null;
  outTime: string | null;
  totalHours: number;
  totalPayment: number;
  updatedRole: string;
}

interface DailyWagersTableProps {
  workers: WorkerSummary[];
  loading: boolean;
  onEdit: (worker: WorkerSummary) => void;
  onView: (worker: WorkerSummary) => void;
}

export default function DailyWagersTable({ workers, loading, onEdit, onView }: DailyWagersTableProps) {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return format(new Date(isoString), "hh:mm a");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> In
          </span>
        );
      case "TRANSFER":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <ArrowRightLeft className="h-3 w-3" /> Transferred
          </span>
        );
      case "OUT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <LogOut className="h-3 w-3" /> Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <AlertCircle className="h-3 w-3" /> Not Logged In
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading workers data...</p>
        </div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">No daily wager workers found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      
      {/* Mobile view: Cards */}
      <div className="block md:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {workers.map((worker) => (
            <div key={worker._id} className="p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{worker.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{worker.skill} • ₹{worker.perHourRate}/hr</div>
                </div>
                <div>{getStatusBadge(worker.currentStatus)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Site:</span>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {worker.currentSite !== "N/A" ? worker.currentSite : "-"}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Updated By:</span>
                  <div className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{worker.updatedRole}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase text-gray-500">IN</span>
                   <span className="font-medium text-gray-800 dark:text-gray-300">{formatTime(worker.inTime)}</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-100 dark:border-gray-800">
                   <span className="text-[10px] uppercase text-gray-500">OUT</span>
                   <span className="font-medium text-gray-800 dark:text-gray-300">{formatTime(worker.outTime)}</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-100 dark:border-gray-800">
                   <span className="text-[10px] uppercase text-gray-500">Hrs</span>
                   <span className="font-medium text-gray-800 dark:text-gray-300">{worker.totalHours > 0 ? worker.totalHours : "-"}</span>
                 </div>
                 <div className="flex flex-col border-l border-gray-100 dark:border-gray-800">
                   <span className="text-[10px] uppercase text-green-600 dark:text-green-500">Pay</span>
                   <span className="font-medium text-green-600 dark:text-green-400">{worker.totalPayment > 0 ? `₹${worker.totalPayment}` : "-"}</span>
                 </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <button
                  onClick={() => onView(worker)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  <Eye className="h-4 w-4" /> View
                </button>
                <button
                  onClick={() => onEdit(worker)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <Edit2 className="h-4 w-4" /> Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-semibold">Name & Skill</th>
              <th className="px-6 py-4 font-semibold">Current Site</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-center">IN Time</th>
              <th className="px-6 py-4 font-semibold text-center">OUT Time</th>
              <th className="px-6 py-4 font-semibold text-center">Total Hrs</th>
              <th className="px-6 py-4 font-semibold text-center">Total (₹)</th>
              <th className="px-6 py-4 font-semibold text-center">Updated Role</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {workers.map((worker) => (
              <tr key={worker._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{worker.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{worker.skill} • ₹{worker.perHourRate}/hr</div>
                </td>
                <td className="px-6 py-4">
                  {worker.currentSite !== "N/A" ? (
                    <span className="font-medium text-gray-700 dark:text-gray-300">{worker.currentSite}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">{getStatusBadge(worker.currentStatus)}</td>
                <td className="px-6 py-4 text-center">{formatTime(worker.inTime)}</td>
                <td className="px-6 py-4 text-center">{formatTime(worker.outTime)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="font-medium">{worker.totalHours > 0 ? worker.totalHours : "-"}</span>
                </td>
                <td className="px-6 py-4 text-center font-medium text-green-600 dark:text-green-400">
                  {worker.totalPayment > 0 ? `₹${worker.totalPayment}` : "-"}
                </td>
                <td className="px-6 py-4 text-center text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {worker.updatedRole}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView(worker)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-blue-400 transition-colors"
                      title="View Logs"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(worker)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-green-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-green-400 transition-colors"
                      title="Edit Details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
