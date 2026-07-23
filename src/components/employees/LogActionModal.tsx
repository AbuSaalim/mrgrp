"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, ArrowRightLeft, LogOut } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface LogActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionLogged: () => void;
  worker: any; // The worker object passed from the table
  selectedDate?: string; // Optional prop to default the date
}

export default function LogActionModal({ isOpen, onClose, onActionLogged, worker, selectedDate }: LogActionModalProps) {
  const [formData, setFormData] = useState({
    action: "",
    siteName: "",
    remark: "",
    time: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when worker changes or modal opens
  useEffect(() => {
    if (isOpen && worker) {
      // Adjust date to selectedDate if provided, but keep current local time
      const now = new Date();
      if (selectedDate) {
        const [year, month, day] = selectedDate.split('-');
        if (year && month && day) {
          now.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }

      setFormData({
        action: "",
        siteName: worker.currentSite && worker.currentSite !== "N/A" ? worker.currentSite : "",
        remark: "",
        time: now,
      });
      setError("");
    }
  }, [isOpen, worker]);

  if (!isOpen || !worker) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedAction = e.target.value;
    let defaultTimeForAction = formData.time;

    // Pre-fill existing time if the user is editing an already logged action
    if (selectedAction === "IN" && worker?.inTime) {
      defaultTimeForAction = new Date(worker.inTime);
    } else if (selectedAction === "OUT" && worker?.outTime) {
      defaultTimeForAction = new Date(worker.outTime);
    }

    setFormData({ 
      ...formData, 
      action: selectedAction,
      time: defaultTimeForAction
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        workerId: worker._id,
        action: formData.action,
        siteName: formData.action === "OUT" ? (worker.currentSite !== "N/A" ? worker.currentSite : "Unknown Site") : formData.siteName,
        remark: formData.remark,
        time: formData.time.toISOString(),
      };

      const response = await fetch("/api/daily-wager/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to log action");
      }

      onActionLogged();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSiteInput = formData.action === "IN" || formData.action === "TRANSFER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-0">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Action</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              For {worker.name} ({worker.skill})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Action Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${formData.action === 'IN' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                <input type="radio" name="action" value="IN" className="sr-only" onChange={handleActionChange} required />
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xs font-medium">IN</span>
              </label>
              
              <label className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${formData.action === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                <input type="radio" name="action" value="TRANSFER" className="sr-only" onChange={handleActionChange} required />
                <ArrowRightLeft className="h-5 w-5" />
                <span className="text-xs font-medium">TRANSFER</span>
              </label>

              <label className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${formData.action === 'OUT' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                <input type="radio" name="action" value="OUT" className="sr-only" onChange={handleActionChange} required />
                <LogOut className="h-5 w-5" />
                <span className="text-xs font-medium">OUT</span>
              </label>
            </div>
          </div>

          {showSiteInput && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Site Name
              </label>
              <input
                type="text"
                name="siteName"
                required={showSiteInput}
                value={formData.siteName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Building A"
              />
            </div>
          )}

          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Time
            </label>
            <div className="w-full">
              <DatePicker
                selected={formData.time}
                onChange={(date: Date | null) => date && setFormData({ ...formData, time: date })}
                showTimeSelect
                showTimeSelectOnly
                timeFormat="hh:mm aa"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="hh:mm aa"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-gray-600 dark:bg-gray-700 dark:text-white cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Remark (Optional)
            </label>
            <textarea
              name="remark"
              rows={3}
              value={formData.remark}
              onChange={handleChange}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.action || (showSiteInput && !formData.siteName)}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all dark:focus:ring-offset-gray-800"
            >
              {loading ? "Saving..." : "Save Action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
