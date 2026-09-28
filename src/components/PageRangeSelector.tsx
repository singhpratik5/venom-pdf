import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import clsx from 'clsx';

const PageRangeSelector: React.FC = () => {
  const { pageRange, setPageRange } = useAppStore();
  const [mode, setMode] = useState<'all' | 'custom'>(pageRange ? 'custom' : 'all');

  const handleModeChange = (newMode: 'all' | 'custom') => {
    setMode(newMode);
    if (newMode === 'all') {
      setPageRange('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex bg-background-main rounded p-1 border border-background-border">
        <button
          className={clsx(
            "flex-1 text-sm py-1 rounded transition-colors",
            mode === 'all' ? "bg-background-sidebar text-accent-toxic shadow-sm" : "text-gray-400 hover:text-gray-200"
          )}
          onClick={() => handleModeChange('all')}
        >
          All Pages
        </button>
        <button
          className={clsx(
            "flex-1 text-sm py-1 rounded transition-colors",
            mode === 'custom' ? "bg-background-sidebar text-accent-toxic shadow-sm" : "text-gray-400 hover:text-gray-200"
          )}
          onClick={() => handleModeChange('custom')}
        >
          Custom Range
        </button>
      </div>

      {mode === 'custom' && (
        <div>
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="e.g. 1-5, 8, 11-13"
            className="w-full bg-background-main border border-background-border rounded px-3 py-2 text-sm text-text-body focus:outline-none focus:border-accent-toxic"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter page numbers and/or ranges separated by commas.
          </p>
        </div>
      )}
    </div>
  );
};

export default PageRangeSelector;
