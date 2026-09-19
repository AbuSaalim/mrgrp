"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CloudLightning, FolderPlus, Trash, Lock, Unlock } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import FileExplorer from "@/components/drive/FileExplorer";
import ShareModal from "@/components/drive/ShareModal";
import CreateFolderModal from "@/components/drive/CreateFolderModal";
import RenameModal from "@/components/drive/RenameModal";
import DeleteConfirmModal from "@/components/drive/DeleteConfirmModal";
import ContextMenu from "@/components/drive/ContextMenu";
import DriveHeader from "@/components/drive/DriveHeader";
import FileViewerModal from "@/components/drive/FileViewerModal";
import { DriveItem } from "@/components/drive/types";

export interface DriveTask {
  id: string;
  name: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  status: "processing" | "success" | "error";
  type: "upload" | "delete";
}

function DrivePageContent({ department }: { department: string }) {
  const router = useRouter();
  const pathname = usePathname(); // e.g. /dashboard/hr/documents
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId") || "null";

  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DriveItem | null>(null);
  const [viewItem, setViewItem] = useState<DriveItem | null>(null);
  const [clipboard, setClipboard] = useState<{ item: DriveItem; action: "copy" | "cut" } | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Progress Panel State
  const [activeTasks, setActiveTasks] = useState<DriveTask[]>([]);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(true);

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

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/drive?department=${department}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch items", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchItems();

    const handleClick = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [department]);

  const handleGoBack = () => {
    if (breadcrumbs.length === 0) return;
    if (breadcrumbs.length === 1) {
      router.push(pathname);
    } else {
      const parentId = breadcrumbs[breadcrumbs.length - 2]._id;
      router.push(`${pathname}?folderId=${parentId}`);
    }
  };

  const getUniqueName = (
    originalName: string,
    type: "folder" | "file",
    parentId: string | null,
    existingBatch: DriveItem[] = []
  ) => {
    const allItems = [...items, ...existingBatch];
    const siblings = allItems.filter((i) => i.parentId === parentId && i.type === type);

    let name = originalName;
    let counter = 1;

    if (type === "folder") {
      while (siblings.some((s) => s.name === name)) {
        name = `${originalName} (${counter})`;
        counter++;
      }
    } else {
      const lastDotIndex = originalName.lastIndexOf(".");
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const extension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : "";

      while (siblings.some((s) => s.name === name)) {
        name = `${baseName} (${counter})${extension}`;
        counter++;
      }
    }

    return name;
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    const parent = folderId === "null" ? null : folderId;
    const finalName = getUniqueName(newFolderName.trim(), "folder", parent);

    try {
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName, type: "folder", parentId: parent, department }),
      });
      if (res.ok) {
        const newFolder = await res.json();
        setItems((prev) => [...prev, newFolder]);
        toast.success("Folder created");
      } else {
        toast.error("Failed to create folder");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
    
    setCreateFolderOpen(false);
    setNewFolderName("");
  };

  const createFolderOnServer = async (name: string, parentId: string | null) => {
    const res = await fetch("/api/drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "folder", parentId, department }),
    });
    if (!res.ok) throw new Error("Failed to create folder");
    return await res.json();
  };

  const uploadFileToServer = async (file: File, name: string, parentId: string | null, onProgress?: (progress: number, uploadedBytes: number, totalBytes: number) => void) => {
    const MAX_SIZE_MB = 50;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`"${file.name}" exceeds ${MAX_SIZE_MB}MB limit.`);
      throw new Error(`File exceeds ${MAX_SIZE_MB}MB limit.`);
    }

    // 1. Get presigned URL
    const presignRes = await fetch("/api/drive/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileType: file.type || "application/octet-stream" }),
    });
    if (!presignRes.ok) throw new Error("Failed to get presigned URL");
    const { presignedUrl, fileKey } = await presignRes.json();

    // 2. Upload file directly to R2 using XMLHttpRequest to track progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress, event.loaded, event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Failed to upload file to storage"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });

    // 3. Save metadata to DB
    const res = await fetch("/api/drive/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileKey,
        name,
        parentId: parentId || "null",
        department,
        size: file.size,
        fileType: file.type || "application/octet-stream",
      }),
    });
    
    if (!res.ok) throw new Error("Failed to save file metadata");
    return await res.json();
  };

  const getMimeType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "application/pdf";
    if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") return "image/png";
    if (ext === "xlsx" || ext === "xls" || ext === "csv") return "application/vnd.ms-excel";
    if (ext === "doc" || ext === "docx") return "application/msword";
    if (ext === "ppt" || ext === "pptx") return "application/vnd.ms-powerpoint";
    return "application/octet-stream";
  };

  const processFiles = async (files: File[]) => {
    if (files.length > 5) {
      toast.error("You cannot upload more than 5 files at a time.");
      return;
    }

    const MAX_SIZE_MB = 50;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    const oversizedFiles = files.filter(f => f.size > MAX_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      toast.error(`Upload failed: Files cannot exceed ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsTaskPanelOpen(true);
    const newItemsAdded: DriveItem[] = [];

    for (const file of files) {
      const taskId = Math.random().toString(36).substring(7);
      
      setActiveTasks((prev) => [
        ...prev,
        {
          id: taskId,
          name: file.name,
          progress: 0,
          uploadedBytes: 0,
          totalBytes: file.size,
          status: "processing",
          type: "upload",
        },
      ]);

      if (file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip") {
        try {
          const zip = await JSZip.loadAsync(file);
          
          const pathMap = new Map<string, string | null>();
          pathMap.set("", folderId === "null" ? null : folderId);

          const entries = Object.values(zip.files);
          const fileEntries = entries.filter(e => !e.dir);
          const totalFiles = fileEntries.length;
          let filesProcessed = 0;

          for (const zipEntry of entries) {
            const pathParts = zipEntry.name.split("/").filter(Boolean);
            if (pathParts.length === 0) continue;

            let currentPath = "";
            let currentParentId = pathMap.get("");

            for (let j = 0; j < pathParts.length - (zipEntry.dir ? 0 : 1); j++) {
              const part = pathParts[j];
              const nextPath = currentPath ? `${currentPath}/${part}` : part;

              if (!pathMap.has(nextPath)) {
                const finalName = getUniqueName(part, "folder", currentParentId!, newItemsAdded);
                const dbFolder = await createFolderOnServer(finalName, currentParentId!);
                newItemsAdded.push(dbFolder);
                pathMap.set(nextPath, dbFolder._id);
              }
              currentPath = nextPath;
              currentParentId = pathMap.get(nextPath);
            }

            if (!zipEntry.dir) {
              const fileName = pathParts[pathParts.length - 1];
              const finalName = getUniqueName(fileName, "file", currentParentId!, newItemsAdded);
              
              const blob = await zipEntry.async("blob");
              const extractedFile = new File([blob], fileName, { type: getMimeType(fileName) });
              const dbFile = await uploadFileToServer(extractedFile, finalName, currentParentId!);
              
              filesProcessed++;
              const progress = Math.round((filesProcessed / totalFiles) * 100);
              
              setActiveTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, progress } : t))
              );
              
              newItemsAdded.push(dbFile);
            }
          }
          setActiveTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, progress: 100, uploadedBytes: t.totalBytes, status: "success" } : t))
          );
        } catch (error) {
          console.error("Failed to parse ZIP:", error);
          setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
        }
      } else {
        try {
          const finalName = getUniqueName(file.name, "file", folderId === "null" ? null : folderId, newItemsAdded);
          const dbFile = await uploadFileToServer(file, finalName, folderId === "null" ? null : folderId, (progress, uploadedBytes, totalBytes) => {
            setActiveTasks((prev) =>
              prev.map((t) => (t.id === taskId ? { ...t, progress, uploadedBytes, totalBytes } : t))
            );
          });
          newItemsAdded.push(dbFile);
          setActiveTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, progress: 100, uploadedBytes: t.totalBytes, status: "success" } : t))
          );
        } catch (err) {
          setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
        }
      }
    }

    if (newItemsAdded.length > 0) {
      setItems((prev) => [...prev, ...newItemsAdded]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  const handleShareSuccess = (updatedItem: DriveItem) => {
    setItems(items.map(item => item._id === updatedItem._id ? updatedItem : item));
    setShareItem(updatedItem);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    const itemToDelete = deleteItem;
    
    // Immediately close modal and show progress UI
    setDeleteItem(null);
    setIsTaskPanelOpen(true);
    const taskId = Math.random().toString(36).substring(7);
    
    setActiveTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name: `Deleting ${itemToDelete.name}...`,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: 0,
        status: "processing",
        type: "delete",
      },
    ]);

    try {
      const res = await fetch(`/api/drive/${itemToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const { deletedIds } = await res.json();
        setItems(prevItems => prevItems.filter((i) => !deletedIds.includes(i._id)));
        setSelectedIds(prev => {
          const next = new Set(prev);
          deletedIds.forEach((id: string) => next.delete(id));
          return next;
        });
        setActiveTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, progress: 100, status: "success", name: `Deleted ${itemToDelete.name}` } : t))
        );
      } else {
        setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
        toast.error("Failed to delete item");
      }
    } catch (error) {
      setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
      toast.error("An error occurred during deletion");
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    // Immediately close modal and show progress UI
    setIsBulkDeleteOpen(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setIsTaskPanelOpen(true);
    
    const taskId = Math.random().toString(36).substring(7);
    
    setActiveTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name: `Deleting ${idsToDelete.length} items...`,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: 0,
        status: "processing",
        type: "delete",
      },
    ]);

    try {
      const res = await fetch(`/api/drive/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(prevItems => prevItems.filter((i) => !data.deletedIds.includes(i._id)));
        setActiveTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, progress: 100, status: "success", name: `Deleted ${idsToDelete.length} items` } : t))
        );
      } else {
        setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
        toast.error("Failed to delete items");
      }
    } catch (error) {
      setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
      toast.error("An error occurred during bulk deletion");
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameItem || !newName.trim()) return;

    if (renameItem.name === newName.trim()) {
      setRenameItem(null);
      setNewName("");
      return;
    }

    const finalName = getUniqueName(newName.trim(), renameItem.type, renameItem.parentId);

    try {
      const res = await fetch(`/api/drive/${renameItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName }),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setItems(items.map((i) => (i._id === updatedItem._id ? updatedItem : i)));
        setRenameItem(null);
        setNewName("");
        toast.success("Renamed successfully");
      } else {
        toast.error("Failed to rename item");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleCopy = (item: DriveItem) => {
    setClipboard({ item, action: "copy" });
    toast.success(`Copied "${item.name}"`);
  };

  const handleCut = (item: DriveItem) => {
    setClipboard({ item, action: "cut" });
    toast.success(`Cut "${item.name}"`);
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    const { item, action } = clipboard;

    const targetParentId = folderId === "null" ? null : folderId;
    
    // Check if pasting into itself
    if (item._id === targetParentId) {
      toast.error("Cannot paste a folder into itself");
      return;
    }

    // Prevent circular reference: Cannot paste a folder into its own subfolder
    const isPastingIntoDescendant = breadcrumbs.some(b => b._id === item._id);
    if (isPastingIntoDescendant) {
      toast.error("Cannot paste a folder into its own subfolder");
      return;
    }

    if (action === "cut") {
      await handleMoveItem(item._id, targetParentId || "null");
      setClipboard(null);
      return;
    }

    setIsTaskPanelOpen(true);
    const taskId = Math.random().toString(36).substring(7);
    
    setActiveTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name: `Copying ${item.name}...`,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: 0,
        status: "processing",
        type: "upload", // Use upload styling for copy progress
      },
    ]);

    try {
      const res = await fetch(`/api/drive/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          itemId: item._id, 
          targetParentId,
          department
        }),
      });
      
      if (res.ok) {
        const { copiedItems } = await res.json();
        // copiedItems contains all created DB records. We only need to show the ones in the current folder.
        const currentFolderItems = copiedItems.filter((i: DriveItem) => i.parentId === targetParentId);
        if (currentFolderItems.length > 0) {
          setItems(prev => [...prev, ...currentFolderItems]);
        }
        
        setActiveTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, progress: 100, status: "success", name: `Copied ${item.name}` } : t))
        );
        // Don't clear clipboard after copy, allows pasting multiple times.
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to copy item");
        setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
      }
    } catch (error) {
      toast.error("An error occurred during copy");
      setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error" } : t)));
    }
  };

  const handleMoveItem = async (itemId: string, targetFolderId: string) => {
    try {
      const res = await fetch(`/api/drive/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: targetFolderId }),
      });
      if (res.ok) {
        await fetchItems(); // Fetch fresh items to accurately reflect moves
        toast.success("Moved successfully");
      } else {
        toast.error("Failed to move item");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
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
      type: "bg",
    });
  };

  const handleDownload = async (item: DriveItem) => {
    if (item.type === "folder") {
      toast.info(`Checking folder size for ${item.name}...`);
      try {
        const checkRes = await fetch(`/api/drive/check-download?id=${item._id}`);
        const checkData = await checkRes.json();
        
        if (!checkRes.ok || !checkData.allowed) {
          toast.error(checkData.message || "Folder is too large to download at once. Please download files individually.");
          return; // Stop here, don't download
        }
      } catch (error) {
        toast.error("Error checking folder size.");
        return;
      }
      toast.info(`Preparing download for folder: ${item.name}...`);
    } else {
      toast.info(`Downloading file: ${item.name}...`);
    }

    try {
      // Use the download API
      window.location.href = `/api/drive/download?id=${item._id}`;
    } catch (error) {
      toast.error("Failed to start download");
    }
  };

  const handleLockToggle = async (item: DriveItem) => {
    try {
      const res = await fetch(`/api/drive/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !item.isLocked }),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setItems((prev) => prev.map((i) => (i._id === updatedItem._id ? updatedItem : i)));
        if (updatedItem.isLocked) {
          toast.success("Lock folder", { icon: <Lock size={16} className="text-emerald-500" /> });
        } else {
          toast.success("Unlock folder", { icon: <Unlock size={16} className="text-emerald-500" /> });
        }
      } else {
        toast.error("Failed to update lock status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
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
      item,
    });
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    let newItemsAdded: DriveItem[] = [];
    const filesToProcess: File[] = [];



    toast.info("Uploading dropped items...");

    for (let i = 0; i < dataTransferItems.length; i++) {
      const item = dataTransferItems[i];
      if (item.kind !== "file") continue;

      const file = item.getAsFile();
      const entry = item.webkitGetAsEntry();

      if (!file) continue;

      if (entry && entry.isDirectory) {
        toast.error("Folder upload via drag-and-drop is not allowed. Please upload individual files or a ZIP file.");
        continue;
      } else {
        filesToProcess.push(file);
      }
    }

    if (newItemsAdded.length > 0) {
      setItems((prev) => [...prev, ...newItemsAdded]);
      toast.success("Folders uploaded");
    }

    if (filesToProcess.length > 0) {
      processFiles(filesToProcess);
    }
  };

  const handleToggleSelect = (itemId: string) => {
    const item = items.find(i => i._id === itemId);
    if (item && department !== "Super Admin" && item.role && item.role !== department) {
      toast.error("You cannot select items from another department");
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setSelectedIds(next);
  };

  const currentItems = useMemo(() => {
    const parent = folderId === "null" ? null : folderId;
    return items.filter((item) => item.parentId === parent);
  }, [items, folderId]);

  const getBreadcrumbs = () => {
    if (folderId === "null") return [];

    const crumbs = [];
    let currentId: string | null = folderId;

    let depth = 0;
    while (currentId && depth < 20) {
      const folder = items.find((i) => i._id === currentId);
      if (folder) {
        crumbs.unshift({ _id: folder._id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
      depth++;
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (!isLoaded) return <div className="p-8 text-gray-400">Loading Documents...</div>;

  return (
    <div
      className="flex flex-col h-full bg-transparent text-slate-800 dark:text-gray-200 relative min-h-[500px]"
      onContextMenu={handleBgContextMenu}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {isGlobalDragging && (
        <div className="absolute inset-0 z-50 bg-blue-900/20 backdrop-blur-sm border-4 border-blue-500 border-dashed rounded-xl m-4 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold shadow-2xl flex items-center gap-3 animate-bounce">
            <CloudLightning size={24} />
            Drop files to upload them to Documents
          </div>
        </div>
      )}

      <DriveHeader
        folderId={folderId}
        breadcrumbs={breadcrumbs}
        onGoBack={handleGoBack}
        onNavigate={(id) => {
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            router.push(`${pathname}?folderId=${id}`);
        }}
        onNavigateRoot={() => {
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            router.push(pathname);
        }}
        onCreateFolder={() => setCreateFolderOpen(true)}
        onUploadFile={() => fileInputRef.current?.click()}
        selectedIds={selectedIds}
        onBulkDelete={() => setIsBulkDeleteOpen(true)}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          if (isSelectionMode) setSelectedIds(new Set());
        }}
      />

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
            onNavigate={(id) => {
                setSelectedIds(new Set());
                setIsSelectionMode(false);
                router.push(`${pathname}?folderId=${id}`);
            }}
            onShare={(item) => setShareItem(item as DriveItem)}
            onView={(item) => setViewItem(item as DriveItem)}
            onRename={(item) => {
              setRenameItem(item as DriveItem);
              setNewName(item.name);
            }}
            onDelete={(item) => setDeleteItem(item as DriveItem)}
            onItemContextMenu={(e, item) => handleItemContextMenu(e, item as DriveItem)}
            onMoveItem={handleMoveItem}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            currentDepartment={department}
            isSelectionMode={isSelectionMode}
          />
        )}
      </div>

      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setContextMenu({
              visible: true,
              x: window.innerWidth - 180,
              y: window.innerHeight - 200,
              type: "bg",
            });
          }}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-transform active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        onCreateFolder={() => setCreateFolderOpen(true)}
        onUploadFile={() => fileInputRef.current?.click()}
        onRename={(item) => {
          setRenameItem(item);
          setNewName(item.name);
        }}
        onShare={(item) => setShareItem(item)}
        onDelete={(item) => setDeleteItem(item)}
        onView={(item) => setViewItem(item)}
        onDownload={handleDownload}
        onLockToggle={handleLockToggle}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        hasCopiedItem={!!clipboard}
        copiedItemName={clipboard?.item.name || null}
        currentDepartment={department}
      />

      <CreateFolderModal
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        folderName={newFolderName}
        setFolderName={setNewFolderName}
        onSubmit={handleCreateFolder}
      />

      <RenameModal
        item={renameItem}
        onClose={() => setRenameItem(null)}
        newName={newName}
        setNewName={setNewName}
        onSubmit={handleRenameSubmit}
      />

      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={confirmDelete}
        />
      )}

      {isBulkDeleteOpen && (
        <DeleteConfirmModal
          item={null}
          isBulk={true}
          bulkCount={selectedIds.size}
          onClose={() => setIsBulkDeleteOpen(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      <FileViewerModal
        item={viewItem}
        onClose={() => setViewItem(null)}
        currentDepartment={department}
      />

      {/* Floating Task Progress Panel */}
      {activeTasks.length > 0 && (
        <div className={`fixed bottom-0 right-0 md:bottom-4 md:right-4 w-full md:w-96 bg-white dark:bg-slate-800 border-t md:border border-slate-200 dark:border-slate-700 md:rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isTaskPanelOpen ? 'max-h-[50vh] md:max-h-96' : 'max-h-12'}`}>
          <div 
            className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 cursor-pointer"
            onClick={() => setIsTaskPanelOpen(!isTaskPanelOpen)}
          >
            <h3 className="text-sm font-medium text-slate-800 dark:text-gray-100 flex items-center gap-2">
              {activeTasks.some(t => t.status === "processing") ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Processing {activeTasks.filter(t => t.status === "processing").length} task(s)...
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {activeTasks.filter(t => t.status === "success").length} tasks complete
                </>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTaskPanelOpen(!isTaskPanelOpen);
                }}
              >
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${isTaskPanelOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {!activeTasks.some(t => t.status === "processing") && (
                <button 
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTasks([]);
                  }}
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto p-2 flex-1">
            {activeTasks.map(task => (
              <div key={task.id} className="flex flex-col gap-1 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-gray-200 truncate pr-2 flex-1">
                    {task.name}
                  </span>
                  {task.status === "success" && (
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {task.status === "error" && (
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                {task.status === "processing" && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      {task.type === "delete" ? (
                        <div className="h-full bg-red-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }} />
                      ) : (
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full" 
                          style={{ width: `${task.progress}%` }} 
                        />
                      )}
                    </div>
                    {task.type === "upload" && (
                      <span className="text-[10px] text-slate-500 dark:text-gray-400 font-medium whitespace-nowrap">
                        {task.name.toLowerCase().endsWith('.zip') || task.name.toLowerCase().endsWith('.zip') ? (
                          `${task.progress}%`
                        ) : (
                          `${(task.uploadedBytes / (1024 * 1024)).toFixed(1)} / ${(task.totalBytes / (1024 * 1024)).toFixed(1)} MB`
                        )}
                      </span>
                    )}
                    {task.type === "delete" && (
                      <span className="text-[10px] text-slate-500 dark:text-gray-400 font-medium whitespace-nowrap">
                        Deleting...
                      </span>
                    )}
                  </div>
                )}
                {task.status === "error" && (
                  <span className="text-[10px] text-red-500 font-medium">Failed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ShareModal
        item={shareItem as DriveItem}
        onClose={() => setShareItem(null)}
        onSuccess={handleShareSuccess}
      />
    </div>
  );
}

export default function DrivePage({ department }: { department: string }) {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading UI...</div>}>
      <DrivePageContent department={department} />
    </Suspense>
  );
}
