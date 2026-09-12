import { Trash } from "lucide-react";
import { DriveItem } from "./types";

interface DeleteConfirmModalProps {
  item: DriveItem | null;
  isBulk?: boolean;
  bulkCount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  item,
  isBulk,
  bulkCount,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!item && !isBulk) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full">
            <Trash size={24} />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {isBulk ? "Delete Multiple Items" : "Delete Item"}
          </h2>
        </div>
        
        <p className="text-slate-600 dark:text-gray-300 mb-6">
          {isBulk ? (
            <>Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-white">{bulkCount} selected items</span>? This action cannot be undone.</>
          ) : (
            <>Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-white">&quot;{item?.name}&quot;</span>? This action cannot be undone.</>
          )}
        </p>
        
        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="cursor-pointer px-5 py-2 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className="cursor-pointer px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-all shadow-sm shadow-red-600/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
