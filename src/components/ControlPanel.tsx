import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { usePdfEngine } from '../hooks/usePdfEngine';
import PageRangeSelector from './PageRangeSelector';
import ColorPicker from './ColorPicker';
import BatchQueue from './BatchQueue';
import clsx from 'clsx';
import { ImageMode } from '../types';
import { CheckCircle2, AlertCircle, FileDown, Sparkles } from 'lucide-react';

const ControlPanel: React.FC = () => {
  const {
    imageMode,
    setImageMode,
    files,
    activeFileIndex,
    isProcessing,
    startProcessing,
    stopProcessing,
    pageRange,
  } = useAppStore();

  const { theme, updateCustomTheme } = useTheme();
  const { invertPdf } = usePdfEngine();

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isCustomTheme = theme.id === 'custom';
  const hasActiveFile = activeFileIndex !== null && files.length > 0;
  const activeFile = hasActiveFile ? files[activeFileIndex] : null;

  const handleConvert = async () => {
    if (!activeFile) return;

    setNotification(null);
    startProcessing();
    try {
      const outputPath = activeFile.path.endsWith('.pdf')
        ? activeFile.path.replace(
            /\.pdf$/i,
            `_${theme.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
          )
        : `${activeFile.path}_dark.pdf`;

      await invertPdf(activeFile.path, outputPath, {
        theme,
        imageMode,
        pageRange: pageRange || 'all',
      });

      setNotification({
        type: 'success',
        message: `Saved: ${outputPath.split(/[/\\]/).pop()}`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (e: unknown) {
      console.error(e);
      setNotification({
        type: 'error',
        message: e instanceof Error ? e.message : 'Conversion failed',
      });
    } finally {
      stopProcessing();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full select-none">
      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b border-background-border text-gray-400 flex items-center justify-between">
        <span>Settings & Batch</span>
        {activeFile && (
          <span className="text-[11px] text-accent-toxic font-mono lowercase truncate max-w-[130px]">
            {activeFile.name}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Notification Toast */}
        {notification && (
          <div
            className={clsx(
              'p-2.5 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in',
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                : 'bg-red-950/40 border-red-700/60 text-red-200'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-400 shrink-0" />
            )}
            <span className="truncate flex-1">{notification.message}</span>
          </div>
        )}

        {/* Image Handling */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Image Handling
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">
              {imageMode === 'preserve'
                ? 'Original'
                : imageMode === 'dim'
                ? '75% glare dim'
                : 'Invert colors'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-background-main p-1 rounded-lg border border-background-border">
            {(['preserve', 'dim', 'full_invert'] as ImageMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setImageMode(mode)}
                className={clsx(
                  'py-1.5 px-2 rounded text-xs font-medium capitalize transition-all text-center',
                  imageMode === mode
                    ? 'bg-accent-toxic text-black shadow-[0_0_10px_rgba(57,255,20,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-background-sidebar'
                )}
              >
                {mode === 'full_invert' ? 'Invert' : mode}
              </button>
            ))}
          </div>
        </section>

        <hr className="border-background-border" />

        {/* Page Range */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Page Selection
          </h3>
          <PageRangeSelector />
        </section>

        <hr className="border-background-border" />

        {/* Custom Colors (only show if custom theme is selected) */}
        {isCustomTheme && (
          <>
            <section className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-toxic uppercase tracking-wider">
                <Sparkles size={13} />
                <span>Custom Palette</span>
              </div>
              <div className="space-y-1">
                <ColorPicker
                  label="Background"
                  color={theme.background}
                  onChange={(c) => updateCustomTheme({ background: c })}
                />
                <ColorPicker
                  label="Text"
                  color={theme.text}
                  onChange={(c) => updateCustomTheme({ text: c })}
                />
                <ColorPicker
                  label="Accent"
                  color={theme.accent}
                  onChange={(c) => updateCustomTheme({ accent: c })}
                />
              </div>
            </section>
            <hr className="border-background-border" />
          </>
        )}

        {/* Batch Queue */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Batch Processor
          </h3>
          <BatchQueue />
        </section>
      </div>

      {/* Convert Active File Button */}
      <div className="p-4 border-t border-background-border bg-background-sidebar">
        <button
          onClick={handleConvert}
          disabled={!hasActiveFile || isProcessing}
          className={clsx(
            'w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex justify-center items-center gap-2 shadow-lg',
            hasActiveFile && !isProcessing
              ? 'bg-accent-toxic text-black hover:bg-[#4dff2d] hover:shadow-[0_0_15px_rgba(57,255,20,0.4)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          )}
        >
          <FileDown size={16} />
          <span>{isProcessing ? 'Converting...' : 'Convert Active PDF'}</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
