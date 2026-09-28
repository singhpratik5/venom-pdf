import React from 'react';
import { FileText, X } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import clsx from 'clsx';

const FileExplorer: React.FC = () => {
  const { files, activeFileIndex, setActiveFile, removeFile } = useAppStore();

  return (
    <div className="flex-1 border-b border-background-border flex flex-col min-h-[50%]">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 ? (
          <div className="text-sm text-gray-500 p-2 text-center mt-4">
            No files open
          </div>
        ) : (
          files.map((file, idx) => (
            <div
              key={`${file.path}-${idx}`}
              className={clsx(
                "flex items-center justify-between p-2 rounded cursor-pointer group text-sm",
                activeFileIndex === idx 
                  ? "bg-background-main text-accent-toxic" 
                  : "hover:bg-background-main/50"
              )}
              onClick={() => setActiveFile(idx)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText size={16} className="shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <button 
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
