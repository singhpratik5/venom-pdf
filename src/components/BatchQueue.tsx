import React from 'react';
import { useAppStore } from '../stores/appStore';
import { useBatchProcessor } from '../hooks/useBatchProcessor';
import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  XCircle,
  Play,
  FolderSearch,
  PlusCircle,
  Trash2,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

const BatchQueue: React.FC = () => {
  const { batchJobs, queueAllOpenFiles, clearBatchJobs } = useAppStore();
  const { isProcessing, runBatch, selectFolder, clearCompleted } = useBatchProcessor();

  const totalCount = batchJobs.length;
  const doneCount = batchJobs.filter((j) => j.status === 'done').length;
  const pendingCount = batchJobs.filter((j) => j.status === 'pending').length;
  const errorCount = batchJobs.filter((j) => j.status === 'error').length;
  const inProgressCount = batchJobs.filter((j) => j.status === 'processing').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <CircleDashed size={14} className="text-gray-500 shrink-0" />;
      case 'processing':
        return <Loader2 size={14} className="text-accent-toxic animate-spin shrink-0" />;
      case 'done':
        return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
      case 'error':
        return <XCircle size={14} className="text-red-400 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center gap-1">
          <button
            onClick={queueAllOpenFiles}
            className="flex items-center gap-1 px-2 py-1 rounded bg-background-main hover:bg-background-border text-gray-300 hover:text-white transition-colors"
            title="Queue all files from document explorer"
          >
            <PlusCircle size={12} className="text-accent-toxic" />
            <span>Queue All</span>
          </button>
          <button
            onClick={selectFolder}
            className="flex items-center gap-1 px-2 py-1 rounded bg-background-main hover:bg-background-border text-gray-300 hover:text-white transition-colors"
            title="Scan an entire folder for PDF documents"
          >
            <FolderSearch size={12} />
            <span>Scan Folder</span>
          </button>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            {doneCount > 0 && (
              <button
                onClick={clearCompleted}
                className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-200"
                title="Remove finished items"
              >
                Clear Done
              </button>
            )}
            <button
              onClick={clearBatchJobs}
              className="p-1 hover:text-red-400 text-gray-500 transition-colors"
              title="Clear entire queue"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Queue Statistics Bar */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-background-main/70 border border-background-border text-[11px] font-mono">
          <span className="text-gray-400">Total: {totalCount}</span>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <span className="text-gray-400">{pendingCount} ready</span>}
            {inProgressCount > 0 && <span className="text-accent-toxic">{inProgressCount} active</span>}
            {doneCount > 0 && <span className="text-emerald-400">{doneCount} done</span>}
            {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
          </div>
        </div>
      )}

      {/* Jobs Scroll List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {totalCount === 0 ? (
          <div className="text-center text-gray-500 text-xs py-5 border border-dashed border-background-border/50 rounded-lg flex flex-col items-center justify-center gap-1.5">
            <Layers size={18} className="text-gray-600" />
            <p>Queue is empty</p>
            <p className="text-[10px] text-gray-600">Click &quot;Queue All&quot; or &quot;Scan Folder&quot;</p>
          </div>
        ) : (
          batchJobs.map((job) => (
            <div
              key={job.id}
              className={clsx(
                'p-2 rounded border transition-all text-xs',
                job.status === 'processing'
                  ? 'bg-background-main border-accent-toxic/50 shadow-[0_0_10px_rgba(57,255,20,0.1)]'
                  : 'bg-background-main/50 border-background-border'
              )}
            >
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="truncate font-medium text-gray-300 flex-1" title={job.fileName}>
                  {job.fileName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-gray-500">{job.progress}%</span>
                  {getStatusIcon(job.status)}
                </div>
              </div>

              {job.errorMessage && (
                <div className="text-[10px] text-red-400 truncate mb-1" title={job.errorMessage}>
                  {job.errorMessage}
                </div>
              )}

              {/* Progress Line */}
              <div className="w-full bg-background-sidebar h-1 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all duration-300',
                    job.status === 'error'
                      ? 'bg-red-500'
                      : job.status === 'done'
                      ? 'bg-emerald-400'
                      : 'bg-accent-toxic'
                  )}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Start Batch Execution Button */}
      {totalCount > 0 && (
        <button
          onClick={runBatch}
          disabled={isProcessing || pendingCount + errorCount === 0}
          className={clsx(
            'w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
            !isProcessing && pendingCount + errorCount > 0
              ? 'bg-gradient-to-r from-accent-toxic to-emerald-400 text-black hover:shadow-[0_0_15px_rgba(57,255,20,0.35)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Processing Batch...</span>
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              <span>Start Batch ({pendingCount + errorCount})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default BatchQueue;
