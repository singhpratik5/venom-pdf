import React from 'react';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { usePdfEngine } from '../hooks/usePdfEngine';
import PageRangeSelector from './PageRangeSelector';
import ColorPicker from './ColorPicker';
import BatchQueue from './BatchQueue';
import clsx from 'clsx';
import { ImageMode } from '../types';

const ControlPanel: React.FC = () => {
  const { imageMode, setImageMode, files, activeFileIndex, isProcessing, startProcessing, stopProcessing, pageRange } = useAppStore();
  const { theme, updateCustomTheme } = useTheme();
  const { invertPdf } = usePdfEngine();

  const isCustomTheme = theme.id === 'custom';
  const hasActiveFile = activeFileIndex !== null && files.length > 0;
  const activeFile = hasActiveFile ? files[activeFileIndex] : null;

  const handleConvert = async () => {
    if (!activeFile) return;
    
    startProcessing();
    try {
      await invertPdf(activeFile.path, activeFile.path.replace('.pdf', '_dark.pdf'), {
        theme,
        imageMode,
        pageRange
      });
      // Success notification could go here
    } catch (e) {
      console.error(e);
    } finally {
      stopProcessing();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b border-background-border text-text-heading">
        Export Settings
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Image Handling */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Image Handling</h3>
          <div className="flex flex-col space-y-2">
            {(['preserve', 'dim', 'full_invert'] as ImageMode[]).map((mode) => (
              <label key={mode} className="flex items-center space-x-3 cursor-pointer group">
                <div className={clsx(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  imageMode === mode ? "border-accent-toxic" : "border-gray-500 group-hover:border-gray-400"
                )}>
                  {imageMode === mode && <div className="w-2 h-2 rounded-full bg-accent-toxic" />}
                </div>
                <span className="text-sm text-gray-300 capitalize">{mode.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </section>

        <hr className="border-background-border" />

        {/* Page Range */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pages</h3>
          <PageRangeSelector />
        </section>

        <hr className="border-background-border" />

        {/* Custom Colors (only show if custom theme is selected) */}
        {isCustomTheme && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Custom Colors</h3>
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
        )}
        
        {isCustomTheme && <hr className="border-background-border" />}

        {/* Batch Queue */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Batch Queue</h3>
          <BatchQueue />
        </section>
      </div>

      {/* Convert Button */}
      <div className="p-4 border-t border-background-border bg-background-sidebar">
        <button
          onClick={handleConvert}
          disabled={!hasActiveFile || isProcessing}
          className={clsx(
            "w-full py-3 rounded font-semibold text-sm transition-all flex justify-center items-center gap-2",
            hasActiveFile && !isProcessing
              ? "bg-accent-toxic text-black hover:bg-[#4dff2d] hover:shadow-[0_0_15px_rgba(57,255,20,0.4)]"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
        >
          {isProcessing ? 'Processing...' : 'Convert to Dark Mode'}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
