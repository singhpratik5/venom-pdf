import React from 'react';
import { useAppStore } from '../stores/appStore';
import { CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react';
import clsx from 'clsx';

const BatchQueue: React.FC = () => {
  const { batchJobs } = useAppStore();

  if (batchJobs.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        Queue is empty
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <CircleDashed size={14} className="text-gray-500" />;
      case 'processing': return <Loader2 size={14} className="text-accent-toxic animate-spin" />;
      case 'done': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'error': return <XCircle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
      {batchJobs.map(job => (
        <div key={job.id} className="bg-background-main p-2 rounded border border-background-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm truncate mr-2 flex-1" title={job.fileName}>{job.fileName}</span>
            {getStatusIcon(job.status)}
          </div>
          <div className="w-full bg-background-sidebar h-1.5 rounded-full overflow-hidden">
            <div 
              className={clsx(
                "h-full transition-all duration-300",
                job.status === 'error' ? "bg-red-500" : "bg-accent-toxic"
              )}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BatchQueue;
