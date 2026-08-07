"use client";

import { useState } from "react";
import { X, Users } from "lucide-react";
import { DriveItem } from "./FileExplorer";

export default function ShareModal({ 
  item, 
  onClose,
  onShare
}: { 
  item: DriveItem | null;
  onClose: () => void;
  onShare: (item: DriveItem, shareWithId: string) => Promise<void>;
}) {
  const [shareWithId, setShareWithId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  if (!item) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareWithId.trim()) return;
    
    setIsSharing(true);
    await onShare(item, shareWithId);
    setIsSharing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
          <Users className="text-blue-600 dark:text-blue-500" />
          Share "{item.name}"
        </h2>

        {isSharing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
            <p className="text-slate-500 dark:text-gray-400">Sharing in progress...</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              Share with (Role or User ID)
            </label>
            <input 
              type="text" 
              placeholder="e.g. COUNSELOR, MANAGER, or ID"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
              value={shareWithId}
              onChange={(e) => setShareWithId(e.target.value)}
              autoFocus
            />

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleShare}
                disabled={!shareWithId.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
