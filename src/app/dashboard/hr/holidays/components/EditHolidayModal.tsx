"use client";

import React, { Dispatch, SetStateAction } from "react";
import { CalendarDays, XCircle, CheckCircle2 } from "lucide-react";
import { PublicHolidayItem, HolidayFormState } from "../types";

interface EditHolidayModalProps {
  isOpen: boolean;
  editingHoliday: PublicHolidayItem | null;
  formData: HolidayFormState;
  setFormData: Dispatch<SetStateAction<HolidayFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export function EditHolidayModal({
  isOpen,
  editingHoliday,
  formData,
  setFormData,
  onSubmit,
  onClose,
}: EditHolidayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-205 font-sans">
      <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/50 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center tracking-wide">
            <CalendarDays className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-500" />
            {editingHoliday ? "Edit Public Holiday" : "Add Public Holiday"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer border-none"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Holiday Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Republic Day or Idul Fitr"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-450 dark:placeholder:text-slate-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.dateString}
              onChange={(e) => setFormData({ ...formData, dateString: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors [color-scheme:light] dark:[color-scheme:dark] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Holiday Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["National", "Regional", "Religious"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    formData.type === type
                      ? type === "National"
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50 shadow-sm"
                        : type === "Regional"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Description / Note
            </label>
            <textarea
              rows={2}
              placeholder="Optional details (e.g., Subject to moon sighting)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none font-semibold"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center cursor-pointer gap-3 group">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  formData.isActive
                    ? "bg-blue-600 border-blue-500"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                }`}
              >
                {formData.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 uppercase tracking-widest">
                Active (Applies to Payroll)
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-widest uppercase transition-colors shadow-sm hover:shadow-md cursor-pointer border-none"
            >
              {editingHoliday ? "SAVE CHANGES" : "CREATE HOLIDAY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
