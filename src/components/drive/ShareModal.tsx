"use client";

import { useState, useEffect } from "react";
import { X, Users, Check } from "lucide-react";
import { DriveItem } from "./types";
import { toast } from "sonner";

const DEPARTMENTS = ["HR", "Project", "Store", "Accounts", "Marketing", "Design"];

export default function ShareModal({ 
  item, 
  onClose,
  onSuccess
}: { 
  item: DriveItem | null;
  onClose: () => void;
  onSuccess: (updatedItem: DriveItem) => void;
}) {
  const [loadingRoles, setLoadingRoles] = useState<Record<string, boolean>>({});

  if (!item) return null;

  const handleToggleShare = async (role: string, isCurrentlyShared: boolean) => {
    setLoadingRoles(prev => ({ ...prev, [role]: true }));
    
    try {
      const action = isCurrentlyShared ? "unshare" : "share";
      const res = await fetch("/api/drive/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item._id, targetRole: role, action })
      });

      if (!res.ok) throw new Error("Failed to update sharing");
      
      const newSharedWith = isCurrentlyShared 
        ? (item.sharedWith || []).filter(r => r !== role)
        : [...(item.sharedWith || []), role];

      const updatedItem = { ...item, sharedWith: newSharedWith };
      onSuccess(updatedItem);
      toast.success(`Successfully ${action}d with ${role}`);
    } catch (error) {
      toast.error("Failed to update sharing permissions");
    } finally {
      setLoadingRoles(prev => ({ ...prev, [role]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 relative">
        <button 
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
          <Users className="text-blue-600 dark:text-blue-500" />
          Share "{item.name}"
        </h2>

        <div>
          <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
            Select departments to collaborate with. They will get access to this {item.type} and all its contents.
          </p>

          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {DEPARTMENTS.map(role => {
              // Hide the current owner role from the share list
              if (item.role === role) return null;
              
              const isShared = item.sharedWith?.includes(role) || false;
              const isLoading = loadingRoles[role] || false;

              return (
                <div 
                  key={role} 
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <span className="font-medium text-slate-800 dark:text-gray-200">{role}</span>
                  <button
                    onClick={() => handleToggleShare(role, isShared)}
                    disabled={isLoading}
                    className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isShared 
                        ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    ) : isShared ? (
                      <>
                        <Check size={16} /> Shared
                      </>
                    ) : (
                      "Share"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={onClose}
              className="cursor-pointer px-5 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
