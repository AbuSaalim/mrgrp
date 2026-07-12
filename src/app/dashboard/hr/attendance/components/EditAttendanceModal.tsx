"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Edit2, X } from "lucide-react";
import { AttendanceRecord, EditFormState } from "../types";

interface EditAttendanceModalProps {
  editingRecord: AttendanceRecord | null;
  editForm: EditFormState;
  setEditForm: Dispatch<SetStateAction<EditFormState>>;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export function EditAttendanceModal({
  editingRecord,
  editForm,
  setEditForm,
  onSave,
  onClose,
}: EditAttendanceModalProps) {
  if (!editingRecord) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-in zoom-in-95 duration-200 font-sans">
      <div className="bg-white dark:bg-[#0B1121] rounded-3xl w-full max-w-sm p-6 shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-wide">
            <Edit2 className="w-5 h-5 mr-2 text-blue-500" /> Override Shift
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors cursor-pointer border-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 mb-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Date Target
            </label>
            <input
              type="date"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark] transition-colors font-semibold"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Punch In
              </label>
              <input
                type="time"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark] transition-colors font-semibold"
                value={editForm.punchInTime}
                onChange={(e) => setEditForm({ ...editForm, punchInTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Punch Out
              </label>
              <input
                type="time"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark] transition-colors font-semibold"
                value={editForm.punchOutTime}
                onChange={(e) => setEditForm({ ...editForm, punchOutTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Attendance Status
            </label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold cursor-pointer"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Weekly Off">Weekly Off</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Audit Note
            </label>
            <input
              type="text"
              placeholder="Reason for override..."
              value={editForm.hrNotes}
              onChange={(e) => setEditForm({ ...editForm, hrNotes: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55 dark:bg-slate-900/50 placeholder:text-slate-400 dark:placeholder:text-slate-650 text-slate-800 dark:text-slate-200 outline-none text-sm focus:border-blue-500 transition-colors font-semibold"
            />
          </div>
        </div>

        <button
          onClick={onSave}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center cursor-pointer border-none font-sans"
        >
          CONFIRM OVERRIDE
        </button>
      </div>
    </div>
  );
}
