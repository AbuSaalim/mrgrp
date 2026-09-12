import { ArrowLeft, ChevronRight, FolderPlus, UploadCloud } from "lucide-react";

interface Breadcrumb {
  _id: string;
  name: string;
}

interface DriveHeaderProps {
  folderId: string;
  breadcrumbs: Breadcrumb[];
  onGoBack: () => void;
  onNavigate: (id: string) => void;
  onNavigateRoot: () => void;
  onCreateFolder: () => void;
  onUploadFile: () => void;
  selectedIds?: Set<string>;
  onBulkDelete?: () => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export default function DriveHeader({
  folderId,
  breadcrumbs,
  onGoBack,
  onNavigate,
  onNavigateRoot,
  onCreateFolder,
  onUploadFile,
  selectedIds,
  onBulkDelete,
  isSelectionMode,
  onToggleSelectionMode,
}: DriveHeaderProps) {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-4 bg-transparent border-b border-slate-200 dark:border-slate-800/40 px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between relative">
      <div
        className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-slate-600 dark:text-gray-300 font-medium overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {folderId !== "null" && (
          <button
            onClick={onGoBack}
            className="cursor-pointer mr-1 md:mr-2 p-1.5 md:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-gray-300 transition-colors flex-shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <button
          onClick={onNavigateRoot}
          className="cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          Documents
        </button>

        {breadcrumbs.map((crumb, index) => (
          <div key={crumb._id} className="flex items-center space-x-1 md:space-x-2">
            <ChevronRight
              size={14}
              className="text-slate-400 dark:text-gray-500 w-3 h-3 md:w-4 md:h-4"
            />
            <button
              onClick={() => onNavigate(crumb._id)}
              className={`cursor-pointer transition-colors ${
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
        {isSelectionMode ? (
          <>
            {selectedIds && selectedIds.size > 0 && (
              <button
                onClick={onBulkDelete}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold transition-all shadow-sm"
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
            <button
              onClick={onToggleSelectionMode}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 rounded-xl font-semibold transition-all shadow-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggleSelectionMode}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800/80 backdrop-blur-sm dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Select
            </button>
            <button
              onClick={onCreateFolder}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <FolderPlus size={18} className="transition-transform group-hover:scale-110" />
              <span>New Folder</span>
            </button>
            <button
              onClick={onUploadFile}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/50 hover:border-blue-400 rounded-xl font-semibold transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <UploadCloud size={18} className="transition-transform group-hover:-translate-y-0.5" />
              <span>Upload File</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
