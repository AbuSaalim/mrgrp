"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { ConfirmDialogState } from "../types";

interface ConfirmDialogProps {
  dialog: ConfirmDialogState;
  onClose: () => void;
}

export function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  if (!dialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/60 p-6 shadow-xl dark:shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dialog.title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {dialog.message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={dialog.onConfirm}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
