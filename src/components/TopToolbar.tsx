import React, { useRef, useState } from 'react';
import { FolderOpen, Download, Sparkles, Github, Terminal } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { usePdfEngine } from '../hooks/usePdfEngine';
import { generateSamplePdfBytes } from '../utils/samplePdf';
import * as pdfjsLib from 'pdfjs-dist';
import OsIntegrationModal from './OsIntegrationModal';

const TopToolbar: React.FC = () => {
  const {
    addFile,
    files,
    activeFileIndex,
    theme,
    imageMode,
    pageRange,
    isProcessing,
    startProcessing,
    stopProcessing,
  } = useAppStore();

  const { openFileDialog, getPdfInfo, invertPdf } = usePdfEngine();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOsModalOpen, setIsOsModalOpen] = useState(false);

  const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;

  const handleOpen = async () => {
    const selectedPath = await openFileDialog();
    if (selectedPath) {
      try {
        const info = await getPdfInfo(selectedPath);
        addFile(info);
      } catch (e) {
        console.error('Failed to get PDF info:', e);
      }
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      try {
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        addFile({
          path: file.name,
          name: file.name,
          pageCount: doc.numPages,
          fileSize: file.size,
          hasImages: false,
          data: bytes,
        });
      } catch (err) {
        console.error('Error opening file:', err);
      }
    }
  };

  const handleLoadDemo = () => {
    const bytes = generateSamplePdfBytes();
    addFile({
      path: 'venom_sample_demo.pdf',
      name: 'venom_sample_demo.pdf',
      pageCount: 2,
      fileSize: bytes.byteLength,
      hasImages: false,
      data: bytes,
    });
  };

  const handleSave = async () => {
    if (!activeFile) return;
    startProcessing();
    try {
      const outputPath = activeFile.path.endsWith('.pdf')
        ? activeFile.path.replace(/\.pdf$/i, `_${theme.name.toLowerCase().replace(/\s+/g, '_')}.pdf`)
        : `${activeFile.path}_dark.pdf`;

      await invertPdf(activeFile.path, outputPath, {
        theme,
        imageMode,
        pageRange,
      });
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      stopProcessing();
    }
  };

  return (
    <div className="h-12 bg-background-sidebar border-b border-background-border flex items-center px-4 justify-between select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-accent-toxic to-emerald-400 flex items-center justify-center font-black text-black text-xs shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            V
          </div>
          <span className="text-white font-bold text-base tracking-wide flex items-center gap-1.5">
            Venom <span className="text-accent-toxic">PDF</span>
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-background-main border border-background-border text-gray-400">
            v0.1.0
          </span>
        </div>

        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-main rounded text-sm transition-colors text-text-body hover:text-accent-toxic"
          title="Open a PDF Document"
        >
          <FolderOpen size={16} /> Open
        </button>

        <button
          onClick={handleSave}
          disabled={!activeFile || isProcessing}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-background-main rounded text-sm transition-colors text-text-body hover:text-accent-toxic disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-body"
          title="Export Inverted PDF"
        >
          <Download size={16} /> {isProcessing ? 'Saving...' : 'Export'}
        </button>

        <button
          onClick={handleLoadDemo}
          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-background-main rounded text-sm transition-colors text-gray-400 hover:text-white"
          title="Load Sample Document"
        >
          <Sparkles size={15} className="text-accent-toxic" /> Demo
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsOsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-background-main border border-background-border text-gray-300 hover:text-accent-toxic hover:border-accent-toxic/40 transition-colors"
          title="Windows Context Menu & Headless CLI Settings"
        >
          <Terminal size={14} className="text-accent-toxic" />
          <span>CLI & Shell</span>
        </button>

        <a
          href="https://github.com/singhpratik5/venom-pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-background-main border border-background-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          title="View on GitHub"
        >
          <Github size={14} />
          <span>GitHub</span>
        </a>
      </div>

      <OsIntegrationModal
        isOpen={isOsModalOpen}
        onClose={() => setIsOsModalOpen(false)}
      />
    </div>
  );
};

export default TopToolbar;
