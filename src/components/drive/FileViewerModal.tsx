import { X, ExternalLink, FileText, FileSpreadsheet, FileIcon, Image as ImageIcon } from "lucide-react";
import { DriveItem } from "./types";

interface FileViewerModalProps {
  item: DriveItem | null;
  onClose: () => void;
  currentDepartment?: string;
}

export default function FileViewerModal({ item, onClose, currentDepartment }: FileViewerModalProps) {
  if (!item || item.type !== "file") return null;

  const canEdit = !item || !currentDepartment || currentDepartment === "Super Admin" || !item.role || item.role === currentDepartment;
  const canDownload = currentDepartment === "Super Admin" || !item.isLocked;

  const getViewerContent = () => {
    const type = item.fileType || "";
    const isImage = type.startsWith("image/");
    const isPdf = type === "application/pdf";
    const isExcel = type.includes("excel") || type.includes("spreadsheetml");
    const isWord = type.includes("msword") || type.includes("wordprocessingml");
    
    if (isImage) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`/api/drive/file/${item._id}`} 
            alt={item.name} 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="w-full h-full p-2 md:p-4">
          <iframe 
            src={`/api/drive/file/${item._id}#toolbar=0`} 
            className="w-full h-full rounded-lg bg-white border-0 shadow-sm"
            title={item.name}
          />
        </div>
      );
    }

    // Fallback for unsupported formats (Office docs, etc)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 p-6 text-center">
        {isExcel ? (
          <FileSpreadsheet size={64} className="mb-4 text-emerald-500" />
        ) : isWord ? (
          <FileText size={64} className="mb-4 text-blue-500" />
        ) : (
          <FileIcon size={64} className="mb-4" />
        )}
        <h3 className="text-xl font-medium text-slate-800 dark:text-gray-200 mb-2">No preview available</h3>
        <p className="max-w-xs mb-6">
          This file format cannot be previewed in the browser. {canDownload ? "You can download the file to view it." : "You do not have permission to download this file."}
        </p>
        {canDownload && (
          <a 
            href={`/api/drive/download?id=${item._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <ExternalLink size={18} />
            Open / Download
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-2 sm:p-4 md:p-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              {item.fileType?.startsWith("image/") ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>
            <div className="flex flex-col min-w-0 pr-4">
              <h3 className="font-medium text-slate-800 dark:text-white truncate">{item.name}</h3>
              <span className="text-xs text-slate-500 dark:text-gray-400 truncate">
                {item.ownerName ? `By ${item.ownerName}` : "You"} • {((item.size || 0) / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canDownload && (
              <a 
                href={`/api/drive/download?id=${item._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={18} />
              </a>
            )}
            <button 
              onClick={onClose}
              className="cursor-pointer p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-auto relative flex items-center justify-center">
          {getViewerContent()}
        </div>
      </div>
    </div>
  );
}
