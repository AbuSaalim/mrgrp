import { FolderPlus, UploadCloud, Edit2, Share2, Trash, Lock, Unlock } from "lucide-react";
import { DriveItem } from "./types";

interface ContextMenuProps {
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    type: "bg" | "item";
    item?: DriveItem;
  };
  onClose: () => void;
  onCreateFolder: () => void;
  onUploadFile: () => void;
  onRename: (item: DriveItem) => void;
  onShare: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  onView: (item: DriveItem) => void;
  onDownload: (item: DriveItem) => void;
  onLockToggle?: (item: DriveItem) => void;
  onCopy: (item: DriveItem) => void;
  onCut: (item: DriveItem) => void;
  onPaste: () => void;
  hasCopiedItem: boolean;
  copiedItemName: string | null;
  currentDepartment?: string;
}

export default function ContextMenu({
  contextMenu,
  onClose,
  onCreateFolder,
  onUploadFile,
  onRename,
  onShare,
  onDelete,
  onView,
  onDownload,
  onLockToggle,
  onCopy,
  onCut,
  onPaste,
  hasCopiedItem,
  copiedItemName,
  currentDepartment,
}: ContextMenuProps) {
  if (!contextMenu.visible) return null;

  const canEdit = 
    !contextMenu.item || 
    !currentDepartment || 
    currentDepartment === "Super Admin" || 
    !contextMenu.item.role || 
    contextMenu.item.role === currentDepartment;

  const canDownload = 
    currentDepartment === "Super Admin" || 
    (contextMenu.item && !contextMenu.item.isLocked);

  return (
    <div
      style={{ top: contextMenu.y, left: contextMenu.x }}
      className="fixed w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50 py-1 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === "bg" ? (
        <>
          <button
            onClick={() => {
              onClose();
              onCreateFolder();
            }}
            className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
          >
            <FolderPlus size={14} /> New folder
          </button>
          <button
            onClick={() => {
              onClose();
              onUploadFile();
            }}
            className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
          >
            <UploadCloud size={14} /> File upload
          </button>
          
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <button
            onClick={() => {
              if (!hasCopiedItem) return;
              onClose();
              onPaste();
            }}
            disabled={!hasCopiedItem}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              hasCopiedItem 
                ? "cursor-pointer text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            Paste {copiedItemName ? `"${copiedItemName}"` : ""}
          </button>
        </>
      ) : (
        <>
          {contextMenu.item?.type === "file" && (
            <button
              onClick={() => {
                onClose();
                if (contextMenu.item) onView(contextMenu.item);
              }}
              className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </button>
          )}
          <button
            onClick={() => {
              if (!canDownload) return;
              onClose();
              if (contextMenu.item) onDownload(contextMenu.item);
            }}
            disabled={!canDownload}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              canDownload 
                ? "cursor-pointer text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
          
          {currentDepartment === "Super Admin" && contextMenu.item?.type === "folder" && onLockToggle && (
            <button
              onClick={() => {
                onClose();
                if (contextMenu.item) onLockToggle(contextMenu.item);
              }}
              className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              {contextMenu.item.isLocked ? (
                <><Unlock size={14} className="text-emerald-500" /> Unlock Folder</>
              ) : (
                <><Lock size={14} className="text-amber-500" /> Lock Folder</>
              )}
            </button>
          )}

          <button
            onClick={() => {
              if (!canEdit) return;
              onClose();
              if (contextMenu.item) onRename(contextMenu.item);
            }}
            disabled={!canEdit}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              canEdit 
                ? "cursor-pointer text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <Edit2 size={14} /> Rename
          </button>
          
          <button
            onClick={() => {
              if (!canDownload) return;
              onClose();
              if (contextMenu.item) onCopy(contextMenu.item);
            }}
            disabled={!canDownload}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              canDownload 
                ? "cursor-pointer text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copy
          </button>
          
          <button
            onClick={() => {
              if (!canEdit) return;
              onClose();
              if (contextMenu.item) onCut(contextMenu.item);
            }}
            disabled={!canEdit}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              canEdit 
                ? "cursor-pointer text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>
            Cut
          </button>
          <button
            onClick={() => {
              if (!canEdit) return;
              onClose();
              if (contextMenu.item) onShare(contextMenu.item);
            }}
            disabled={!canEdit}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              canEdit 
                ? "cursor-pointer text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <Share2 size={14} /> Share
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <button
            onClick={() => {
              if (!canEdit) return;
              onClose();
              if (contextMenu.item) onDelete(contextMenu.item);
            }}
            disabled={!canEdit}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
              canEdit 
                ? "cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                : "cursor-not-allowed text-slate-400 dark:text-slate-600 opacity-50"
            }`}
          >
            <Trash size={14} /> Delete
          </button>
        </>
      )}
    </div>
  );
}
