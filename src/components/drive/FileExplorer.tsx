"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Folder, File as FileIcon, FileText, FileSpreadsheet, Image as ImageIcon, MoreVertical, Lock } from "lucide-react";

export interface DriveItem {
  _id: string;
  name: string;
  type: "folder" | "file";
  fileType?: string;
  size?: number;
  updatedAt: string;
  ownerName?: string;
  role?: string;
  sharedWith?: string[];
  url?: string;
  isLocked?: boolean;
}

export default function FileExplorer({ 
  items, 
  onNavigate,
  onShare,
  onRename,
  onDelete,
  onItemContextMenu,
  onMoveItem,
  selectedIds,
  onToggleSelect,
  currentDepartment,
  isSelectionMode,
  onView
}: { 
  items: DriveItem[];
  onNavigate: (folderId: string) => void;
  onShare: (item: DriveItem) => void;
  onRename: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: DriveItem) => void;
  onMoveItem?: (itemId: string, targetFolderId: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (itemId: string) => void;
  currentDepartment?: string;
  isSelectionMode?: boolean;
  onView?: (item: DriveItem) => void;
}) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const getIcon = (item: DriveItem) => {
    if (item.type === "folder") return <Folder size={20} className="text-gray-400 fill-gray-400" />;
    
    if (item.fileType?.includes("image")) return <ImageIcon size={20} className="text-red-400" />;
    if (item.fileType?.includes("pdf")) return <FileText size={20} className="text-red-500" />;
    if (item.fileType?.includes("sheet") || item.fileType?.includes("excel")) return <FileSpreadsheet size={20} className="text-green-500" />;
    return <FileIcon size={20} className="text-blue-500" />;
  };

  const folders = items.filter(i => i.type === "folder");
  const files = items.filter(i => i.type === "file");

  const handleDragStart = (e: React.DragEvent, item: DriveItem) => {
    e.dataTransfer.setData("drive-item-id", item._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, folder: DriveItem) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("drive-item-id")) {
      setDragOverId(folder._id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, folder: DriveItem) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData("drive-item-id");
    if (draggedId && draggedId !== folder._id && onMoveItem) {
      onMoveItem(draggedId, folder._id);
    }
  };

  return (
    <div className="p-4 md:p-6 text-slate-800 dark:text-gray-200">
      
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-6 md:mb-8">
          <h2 className="text-xs md:text-sm font-medium text-slate-700 dark:text-gray-300 mb-3 md:mb-4 flex items-center gap-2">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {folders.map((item) => (
              <div 
                key={item._id} 
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item)}
                onContextMenu={(e) => onItemContextMenu(e, item)}
                onClick={() => {
                  if (isSelectionMode && onToggleSelect) {
                    onToggleSelect(item._id);
                  } else {
                    if (item.isLocked && currentDepartment !== "Super Admin") {
                      toast.error("This folder has been locked by Super Admin.");
                      return;
                    }
                    onNavigate(item._id);
                  }
                }}
                className={`group flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 rounded-xl p-2.5 md:p-3 cursor-pointer transition-colors relative shadow-sm ${
                  isSelectionMode && selectedIds?.has(item._id) 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" 
                    : dragOverId === item._id 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {isSelectionMode && (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <input 
                      type="checkbox" 
                      checked={selectedIds?.has(item._id) || false}
                      readOnly
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                  <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shrink-0">
                    {getIcon(item)}
                  </div>
                  <div className="flex flex-col w-full min-w-0 pr-1">
                    <div className="flex items-start gap-1">
                      {item.isLocked && <Lock size={14} className="text-emerald-500 shrink-0 mt-0.5" />}
                      <span className="text-xs md:text-sm font-medium line-clamp-2 break-all text-slate-800 dark:text-gray-200 leading-tight">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {currentDepartment && item.role && item.role !== currentDepartment ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[8px] md:text-[9px] font-semibold tracking-wide whitespace-nowrap shrink-0">
                          Shared by {item.role}
                        </span>
                      ) : (
                        item.ownerName && <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-gray-500 line-clamp-1 break-all">By {item.ownerName}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 z-10 relative">
                  {!isSelectionMode && (
                    <button 
                      className="cursor-pointer p-1.5 md:p-2 rounded-full text-slate-400 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 outline-none focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemContextMenu(e, item);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h2 className="text-xs md:text-sm font-medium text-slate-700 dark:text-gray-300 mb-3 md:mb-4 flex items-center gap-2">
            Files
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {files.map((item) => (
              <div 
                key={item._id} 
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onContextMenu={(e) => onItemContextMenu(e, item)}
                onClick={() => {
                  if (isSelectionMode && onToggleSelect) {
                    onToggleSelect(item._id);
                  } else if (onView) {
                    onView(item);
                  }
                }}
                className={`group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 rounded-xl overflow-hidden cursor-pointer transition-colors relative flex flex-col h-40 md:h-48 shadow-sm ${
                  isSelectionMode && selectedIds?.has(item._id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {isSelectionMode && (
                  <div className="absolute top-2 right-2 pointer-events-none z-20">
                    <input 
                      type="checkbox" 
                      checked={selectedIds?.has(item._id) || false}
                      readOnly
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                )}
                {/* File Preview Area */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border-b border-slate-200 dark:border-slate-700 p-2 md:p-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                    {getIcon(item)}
                  </div>
                </div>
                
                {/* File Info Area */}
                <div className="p-2 md:p-3 flex items-start justify-between">
                  <div className="flex flex-col min-w-0 flex-1 pr-1">
                    <div className="flex items-start gap-1.5 md:gap-2">
                      <div className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex items-center justify-center shrink-0">
                        {getIcon(item)}
                      </div>
                      <span className="text-xs md:text-sm font-medium line-clamp-2 break-all text-slate-800 dark:text-gray-200 leading-tight">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                      {currentDepartment && item.role && item.role !== currentDepartment ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[8px] md:text-[9px] font-semibold tracking-wide whitespace-nowrap shrink-0">
                          Shared by {item.role}
                        </span>
                      ) : (
                        <span className="text-[10px] md:text-xs text-slate-500 dark:text-gray-500 line-clamp-1 break-all">
                          {item.ownerName ? `By ${item.ownerName}` : "You edited"} • {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 z-10 relative">
                    {!isSelectionMode && (
                      <button 
                        className="cursor-pointer p-1 md:p-1.5 rounded-full text-slate-400 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 outline-none focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemContextMenu(e, item);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
