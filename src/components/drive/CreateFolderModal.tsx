import { FormEvent } from "react";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  setFolderName: (name: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  folderName,
  setFolderName,
  onSubmit,
}: CreateFolderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">New Folder</h2>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            autoFocus
            placeholder="Folder name"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 outline-none mb-6"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-5 py-2 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
