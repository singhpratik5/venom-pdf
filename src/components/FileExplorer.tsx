import React from 'react';
import { FileText, X, Plus } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { usePdfEngine } from '../hooks/usePdfEngine';
import clsx from 'clsx';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileExplorer: React.FC = () => {
  const { files, activeFileIndex, setActiveFile, removeFile, addFile } = useAppStore();
  const { openFileDialog, getPdfInfo } = usePdfEngine();

  const handleAddFile = async () => {
    const selected = await openFileDialog();
    if (selected) {
      try {
        const info = await getPdfInfo(selected);
        addFile(info);
      } catch (e) {
        console.error('Failed to open file:', e);
      }
    }
  };

  return (
    <div className="flex-1 border-b border-background-border flex flex-col min-h-[50%] select-none">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
        <span>Documents ({files.length})</span>
        <button
          onClick={handleAddFile}
          className="p-1 hover:bg-background-main rounded text-gray-400 hover:text-accent-toxic transition-colors"
          title="Open New Document"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 ? (
          <div className="text-xs text-gray-500 p-4 text-center mt-4 border border-dashed border-background-border/50 rounded-lg">
            <p>No documents open</p>
            <p className="text-[11px] text-gray-600 mt-1">Drop a PDF or click +</p>
          </div>
        ) : (
          files.map((file, idx) => (
            <div
              key={`${file.path}-${idx}`}
              className={clsx(
                'flex items-center justify-between p-2 rounded cursor-pointer group text-xs transition-colors',
                activeFileIndex === idx
                  ? 'bg-background-main text-white border-l-2 border-accent-toxic'
                  : 'text-gray-400 hover:bg-background-main/50 hover:text-gray-200'
              )}
              onClick={() => setActiveFile(idx)}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 pr-1">
                <FileText
                  size={15}
                  className={clsx(
                    'shrink-0',
                    activeFileIndex === idx ? 'text-accent-toxic' : 'text-gray-500'
                  )}
                />
                <div className="truncate flex-1">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-[10px] text-gray-500">
                    {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} • {formatFileSize(file.fileSize)}
                  </div>
                </div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 text-gray-500 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                title="Close file"
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
