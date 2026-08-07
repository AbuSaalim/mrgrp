"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FolderPlus, UploadCloud, ChevronRight, Edit2, Share2, Trash, CloudLightning, ArrowLeft } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import FileExplorer, { DriveItem as BaseDriveItem } from "@/components/drive/FileExplorer";
import ShareModal from "@/components/drive/ShareModal";
import { useRef } from "react";

export interface DriveItem extends BaseDriveItem {
  parentId: string | null;
}

const LOCAL_STORAGE_KEY = "mini_erp_drive_data_mrgrp"; // Changed key so it's isolated

const defaultItems: DriveItem[] = [
  { _id: "f1", name: "HR Documents", type: "folder", parentId: null, updatedAt: new Date().toISOString() },
  { _id: "f2", name: "Employee Records", type: "folder", parentId: null, updatedAt: new Date().toISOString() },
];

function DrivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId") || "null";

  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  
  // Modals
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DriveItem | null>(null);
  const [newName, setNewName] = useState("");

  // Refs for native file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: "bg" | "item";
    item?: DriveItem;
  }>({ visible: false, x: 0, y: 0, type: "bg" });

  // Form State
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      setItems(defaultItems);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultItems));
    }
    setIsLoaded(true);

    const handleClick = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleGoBack = () => {
    if (breadcrumbs.length === 0) return;
    if (breadcrumbs.length === 1) {
      router.push("/dashboard/hr/documents");
    } else {
      const parentId = breadcrumbs[breadcrumbs.length - 2]._id;
      router.push(`/dashboard/hr/documents?folderId=${parentId}`);
    }
  };

  const saveItems = (newItems: DriveItem[]) => {
    setItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
  };

  const getUniqueName = (originalName: string, type: "folder" | "file", parentId: string | null, existingBatch: DriveItem[] = []) => {
    const allItems = [...items, ...existingBatch];
    const siblings = allItems.filter(i => i.parentId === parentId && i.type === type);
    
    let name = originalName;
    let counter = 1;
    
    if (type === "folder") {
      while (siblings.some(s => s.name === name)) {
        name = `${originalName} (${counter})`;
        counter++;
      }
    } else {
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
      
      while (siblings.some(s => s.name === name)) {
        name = `${baseName} (${counter})${extension}`;
        counter++;
      }
    }
    
    return name;
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    
    const parent = folderId === "null" ? null : folderId;
    const finalName = getUniqueName(newFolderName.trim(), "folder", parent);
    
    const newFolder: DriveItem = {
      _id: `f_${Date.now()}`,
      name: finalName,
      type: "folder",
      parentId: parent,
      updatedAt: new Date().toISOString()
    };
    
    saveItems([...items, newFolder]);
    setCreateFolderOpen(false);
    setNewFolderName("");
  };

  const getMimeType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') return 'image/png';
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'application/vnd.ms-excel';
    if (ext === 'doc' || ext === 'docx') return 'application/msword';
    if (ext === 'ppt' || ext === 'pptx') return 'application/vnd.ms-powerpoint';
    return 'application/octet-stream';
  };

  const processFiles = async (files: File[]) => {
    let newItemsToSave: DriveItem[] = [];
    
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip') {
        try {
          const zip = await JSZip.loadAsync(file);
          const pathMap = new Map<string, string | null>();
          pathMap.set("", folderId === "null" ? null : folderId);

          const entries = Object.values(zip.files);
          
          for (const zipEntry of entries) {
            const pathParts = zipEntry.name.split('/').filter(Boolean);
            if (pathParts.length === 0) continue;
            
            let currentPath = "";
            let currentParentId = pathMap.get("");
            
            for (let j = 0; j < pathParts.length - (zipEntry.dir ? 0 : 1); j++) {
              const part = pathParts[j];
              const nextPath = currentPath ? `${currentPath}/${part}` : part;
              
              if (!pathMap.has(nextPath)) {
                const finalName = getUniqueName(part, "folder", currentParentId!, newItemsToSave);
                const newFolderId = `f_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                newItemsToSave.push({
                  _id: newFolderId,
                  name: finalName,
                  type: "folder",
                  parentId: currentParentId!,
                  updatedAt: new Date().toISOString()
                });
                pathMap.set(nextPath, newFolderId);
              }
              currentPath = nextPath;
              currentParentId = pathMap.get(nextPath);
            }
            
            if (!zipEntry.dir) {
              const fileName = pathParts[pathParts.length - 1];
              const finalName = getUniqueName(fileName, "file", currentParentId!, newItemsToSave);
              newItemsToSave.push({
                _id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: finalName,
                type: "file",
                fileType: getMimeType(fileName),
                size: (zipEntry as any)._data?.uncompressedSize || 1024,
                parentId: currentParentId!,
                updatedAt: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error("Failed to parse ZIP:", error);
          toast.error(`Failed to extract ${file.name}`);
        }
      } else {
        const finalName = getUniqueName(file.name, "file", folderId === "null" ? null : folderId, newItemsToSave);
        newItemsToSave.push({
          _id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: finalName,
          type: "file",
          fileType: file.type || getMimeType(file.name),
          size: file.size,
          parentId: folderId === "null" ? null : folderId,
          updatedAt: new Date().toISOString()
        });
      }
    }

    if (newItemsToSave.length > 0) {
      saveItems([...items, ...newItemsToSave]);
      toast.success(`Uploaded ${newItemsToSave.filter(i => i.type === 'file').length} files`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleShare = async (item: BaseDriveItem, shareWithId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`Successfully shared "${item.name}" with ${shareWithId}!`);
        resolve();
      }, 500);
    });
  };

  const confirmDelete = () => {
    if (!deleteItem) return;
    const newItems = items.filter(i => i._id !== deleteItem._id);
    saveItems(newItems);
    toast.success(`Deleted "${deleteItem.name}"`);
    setDeleteItem(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameItem || !newName.trim()) return;

    if (renameItem.name === newName.trim()) {
      setRenameItem(null);
      setNewName("");
      return;
    }

    const finalName = getUniqueName(newName.trim(), renameItem.type, renameItem.parentId);

    const newItems = items.map(i => 
      i._id === renameItem._id ? { ...i, name: finalName, updatedAt: new Date().toISOString() } : i
    );
    saveItems(newItems);
    setRenameItem(null);
    setNewName("");
  };

  const handleMoveItem = (itemId: string, targetFolderId: string) => {
    const newItems = items.map(i => 
      i._id === itemId ? { ...i, parentId: targetFolderId, updatedAt: new Date().toISOString() } : i
    );
    saveItems(newItems);
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 200;
    const menuHeight = 120;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;

    setContextMenu({
      visible: true,
      x,
      y,
      type: "bg"
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: DriveItem) => {
    e.preventDefault();
    e.stopPropagation();

    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 200;
    const menuHeight = 160;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;

    setContextMenu({
      visible: true,
      x,
      y,
      type: "item",
      item
    });
  };

  // Global Drag and Drop Handlers for OS Files
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Only show global drop zone if files are dragged from OS (not our internal drag)
    if (!e.dataTransfer.types.includes("drive-item-id")) {
      setIsGlobalDragging(true);
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    
    if (e.dataTransfer.types.includes("drive-item-id")) return;

    const dataTransferItems = Array.from(e.dataTransfer.items);
    let newItemsToSave: DriveItem[] = [];
    const filesToProcess: File[] = [];

    const readDirectory = async (directoryEntry: any, parentId: string | null) => {
      const reader = directoryEntry.createReader();
      
      const readEntries = () => new Promise<any[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });

      let entries = await readEntries();
      while (entries.length > 0) {
        for (const entry of entries) {
          if (entry.isDirectory) {
            const finalName = getUniqueName(entry.name, "folder", parentId, newItemsToSave);
            const newFolderId = `f_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            newItemsToSave.push({
              _id: newFolderId,
              name: finalName,
              type: "folder",
              parentId: parentId,
              updatedAt: new Date().toISOString()
            });
            await readDirectory(entry, newFolderId);
          } else if (entry.isFile) {
            const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
            const finalName = getUniqueName(file.name, "file", parentId, newItemsToSave);
            newItemsToSave.push({
              _id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: finalName,
              type: "file",
              fileType: file.type || getMimeType(file.name),
              size: file.size,
              parentId: parentId,
              updatedAt: new Date().toISOString()
            });
          }
        }
        entries = await readEntries();
      }
    };

    for (let i = 0; i < dataTransferItems.length; i++) {
      const item = dataTransferItems[i];
      if (item.kind !== 'file') continue;

      const file = item.getAsFile();
      const entry = item.webkitGetAsEntry();

      if (!file) continue;

      // Regular OS folder dragged
      if (entry && entry.isDirectory) {
        const finalName = getUniqueName(entry.name, "folder", folderId === "null" ? null : folderId, newItemsToSave);
        const newFolderId = `f_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newItemsToSave.push({
          _id: newFolderId,
          name: finalName,
          type: "folder",
          parentId: folderId === "null" ? null : folderId,
          updatedAt: new Date().toISOString()
        });
        await readDirectory(entry, newFolderId);
      } else {
        filesToProcess.push(file);
      }
    }

    if (newItemsToSave.length > 0) {
      saveItems([...items, ...newItemsToSave]);
    }
    
    if (filesToProcess.length > 0) {
      processFiles(filesToProcess);
    }
  };

  const currentItems = useMemo(() => {
    const parent = folderId === "null" ? null : folderId;
    return items.filter(item => item.parentId === parent);
  }, [items, folderId]);

  const breadcrumbs = useMemo(() => {
    if (folderId === "null") return [];
    
    const crumbs = [];
    let currentId: string | null = folderId;
    
    let depth = 0;
    while (currentId && depth < 20) {
      const folder = items.find(i => i._id === currentId);
      if (folder) {
        crumbs.unshift({ _id: folder._id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
      depth++;
    }
    return crumbs;
  }, [items, folderId]);

  if (!isLoaded) return <div className="p-8 text-gray-400">Loading Documents...</div>;

  return (
    <div 
      className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-200 relative min-h-[500px]"
      onContextMenu={handleBgContextMenu}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Global Drop Zone Overlay */}
      {isGlobalDragging && (
        <div className="absolute inset-0 z-50 bg-blue-900/20 backdrop-blur-sm border-4 border-blue-500 border-dashed rounded-xl m-4 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold shadow-2xl flex items-center gap-3 animate-bounce">
            <CloudLightning size={24} />
            Drop files to upload them to Documents
          </div>
        </div>
      )}

      {/* Header & Breadcrumbs */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between relative">
        <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-slate-600 dark:text-gray-300 font-medium overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          
          {folderId !== "null" && (
            <button 
              onClick={handleGoBack}
              className="mr-1 md:mr-2 p-1.5 md:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-gray-300 transition-colors flex-shrink-0"
              aria-label="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <button onClick={() => router.push("/dashboard/hr/documents")} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            Documents
          </button>
          
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb._id} className="flex items-center space-x-1 md:space-x-2">
              <ChevronRight size={14} className="text-slate-400 dark:text-gray-500 w-3 h-3 md:w-4 md:h-4" />
              <button 
                onClick={() => router.push(`/dashboard/hr/documents?folderId=${crumb._id}`)}
                className={`transition-colors ${
                  index === breadcrumbs.length - 1 
                    ? "text-slate-900 dark:text-gray-100 font-semibold" 
                    : "hover:text-blue-500 dark:hover:text-blue-400"
                }`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
        
        <div className="hidden md:flex gap-3 flex-shrink-0 ml-4">
          <button 
            onClick={() => setCreateFolderOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <FolderPlus size={18} className="transition-transform group-hover:scale-110" /> 
            <span>New Folder</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/50 hover:border-blue-400 rounded-xl font-semibold transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <UploadCloud size={18} className="transition-transform group-hover:-translate-y-0.5" /> 
            <span>Upload File</span>
          </button>
        </div>
      </div>
      
      {/* Hidden Native File Input */}
      <input 
        type="file"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileInputChange}
      />

      <div className="flex-1">
        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-gray-500">
            <p>This folder is empty. Right click or drag files here to upload.</p>
          </div>
        ) : (
          <FileExplorer 
            items={currentItems} 
            onNavigate={(id) => router.push(`/dashboard/hr/documents?folderId=${id}`)} 
            onShare={(item) => setShareItem(item as DriveItem)}
            onRename={(item) => {
              setRenameItem(item as DriveItem);
              setNewName(item.name);
            }}
            onDelete={(item) => setDeleteItem(item as DriveItem)}
            onItemContextMenu={(e, item) => handleItemContextMenu(e, item as DriveItem)}
            onMoveItem={handleMoveItem}
          />
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setContextMenu({
              visible: true,
              x: window.innerWidth - 180,
              y: window.innerHeight - 200,
              type: "bg"
            });
          }}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-transform active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      {/* Right Click Context Menu */}
      {contextMenu.visible && (
        <div 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl z-50 py-1 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "bg" ? (
            <>
              <button 
                onClick={() => { setContextMenu({ ...contextMenu, visible: false }); setCreateFolderOpen(true); }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              >
                <FolderPlus size={14} /> New folder
              </button>
              <button 
                onClick={() => { setContextMenu({ ...contextMenu, visible: false }); fileInputRef.current?.click(); }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              >
                <UploadCloud size={14} /> File upload
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setContextMenu({ ...contextMenu, visible: false }); setRenameItem(contextMenu.item as DriveItem); setNewName(contextMenu.item!.name); }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit2 size={14} /> Rename
              </button>
              <button 
                onClick={() => { setContextMenu({ ...contextMenu, visible: false }); setShareItem(contextMenu.item as DriveItem); }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Share2 size={14} /> Share
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
              <button 
                onClick={() => { setContextMenu({ ...contextMenu, visible: false }); setDeleteItem(contextMenu.item as DriveItem); }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Modals remain mostly the same, just styled darker for consistency */}
      {createFolderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">New Folder</h2>
            <form onSubmit={handleCreateFolder}>
              <input 
                type="text" autoFocus placeholder="Folder name" required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 outline-none mb-6"
                value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCreateFolderOpen(false)} className="px-5 py-2 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renameItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Rename</h2>
            <form onSubmit={handleRenameSubmit}>
              <input 
                type="text" autoFocus placeholder="New name" required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 outline-none mb-6"
                value={newName} onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRenameItem(null)} className="px-5 py-2 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium">Rename</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full">
                <Trash size={24} />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Delete Item</h2>
            </div>
            
            <p className="text-slate-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-white">"{deleteItem.name}"</span>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setDeleteItem(null)} 
                className="px-5 py-2 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-all shadow-sm shadow-red-600/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal item={shareItem} onClose={() => setShareItem(null)} onShare={handleShare} />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading UI...</div>}>
      <DrivePageContent />
    </Suspense>
  );
}
