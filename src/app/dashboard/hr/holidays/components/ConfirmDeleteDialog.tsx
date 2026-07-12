"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { ConfirmDialogState } from "../types";

interface ConfirmDeleteDialogProps {
  confirmDialog: ConfirmDialogState;
  onClose: () => void;
}

export function ConfirmDeleteDialog({ confirmDialog, onClose }: ConfirmDeleteDialogProps) {
  if (!confirmDialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/60 p-6 shadow-xl dark:shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-205 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{confirmDialog.title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-semibold">
          {confirmDialog.message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDialog.onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-650 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer border-none"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
