"use client";

import React from "react";
import { Clock, X, Save } from "lucide-react";

interface ManualUpdateModalProps {
  editingDate: string | null;
  editInTime: string;
  setEditInTime: (time: string) => void;
  editOutTime: string;
  setEditOutTime: (time: string) => void;
  editNote: string;
  setEditNote: (note: string) => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export function ManualUpdateModal({
  editingDate,
  editInTime,
  setEditInTime,
  editOutTime,
  setEditOutTime,
  editNote,
  setEditNote,
  isSaving,
  onSave,
  onClose,
}: ManualUpdateModalProps) {
  if (!editingDate) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-200 font-sans">
      <div className="bg-white dark:bg-[#0B1121] rounded-3xl w-full max-w-sm p-6 shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700/50">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center tracking-wide">
            <Clock className="w-5 h-5 mr-2 text-blue-500" /> Manual Update
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer border-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-5 pb-5 border-b border-slate-200 dark:border-slate-800">
          <span className="uppercase tracking-widest font-semibold">Target Date</span>
          <strong className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-500/20">
            {editingDate}
          </strong>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
                Punch In
              </label>
              <input
                type="time"
                value={editInTime}
                onChange={(e) => setEditInTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 focus:bg-slate-100 dark:focus:bg-slate-900 transition-colors [color-scheme:light] dark:[color-scheme:dark] font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
                Punch Out
              </label>
              <input
                type="time"
                value={editOutTime}
                onChange={(e) => setEditOutTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 focus:bg-slate-100 dark:focus:bg-slate-900 transition-colors [color-scheme:light] dark:[color-scheme:dark] font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 font-sans">
              HR Operations Note
            </label>
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Reason for manual edit..."
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-blue-500 focus:bg-slate-100 dark:focus:bg-slate-900 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 font-semibold"
            />
          </div>

          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold mt-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center cursor-pointer border-none font-sans"
          >
            {isSaving ? (
              <span className="animate-pulse tracking-widest">SAVING...</span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> CONFIRM UPDATE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
