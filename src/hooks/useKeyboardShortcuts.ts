import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { usePdfEngine } from './usePdfEngine';
import { generateSamplePdfBytes } from '../utils/samplePdf';

export const useKeyboardShortcuts = () => {
  const {
    activeFileIndex,
    files,
    theme,
    imageMode,
    pageRange,
    isProcessing,
    startProcessing,
    stopProcessing,
    addFile,
    currentPage,
    setCurrentPage,
    zoom,
    setZoom,
    setIsOsModalOpen,
  } = useAppStore();

  const { openFileDialog, getPdfInfo, invertPdf } = usePdfEngine();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + O -> Open File
      if (modKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        try {
          const selected = await openFileDialog();
          if (selected) {
            const info = await getPdfInfo(selected);
            addFile(info);
          }
        } catch (err) {
          console.error('Failed to open file via shortcut:', err);
        }
        return;
      }

      // Ctrl/Cmd + S -> Export Current Document
      if (modKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;
        if (activeFile && !isProcessing) {
          startProcessing();
          try {
            const cleanTheme = theme.name.toLowerCase().replace(/\s+/g, '_');
            const outputPath = activeFile.path.endsWith('.pdf')
              ? activeFile.path.replace(/\.pdf$/i, `_${cleanTheme}.pdf`)
              : `${activeFile.path}_dark.pdf`;

            await invertPdf(activeFile.path, outputPath, {
              theme,
              imageMode,
              pageRange,
            });
          } catch (err) {
            console.error('Failed to save via shortcut:', err);
          } finally {
            stopProcessing();
          }
        }
        return;
      }

      // Ctrl/Cmd + Shift + D -> Load Sample Demo Document
      if (modKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const bytes = generateSamplePdfBytes();
        addFile({
          path: 'venom_sample_demo.pdf',
          name: 'venom_sample_demo.pdf',
          pageCount: 2,
          fileSize: bytes.byteLength,
          hasImages: false,
          data: bytes,
        });
        return;
      }

      // F1 or Ctrl + / -> Help & CLI / OS Integration modal
      if (e.key === 'F1' || (modKey && e.key === '/')) {
        e.preventDefault();
        setIsOsModalOpen(true);
        return;
      }

      // Zoom Controls: Ctrl + Plus / Ctrl + Minus / Ctrl + 0
      if (modKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(Math.min(zoom + 0.25, 3.0));
        return;
      }
      if (modKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom(Math.max(zoom - 0.25, 0.5));
        return;
      }
      if (modKey && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
        return;
      }

      // Page Navigation: Arrow Left / Arrow Right (when no mod key)
      const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;
      if (activeFile && !modKey && !e.altKey) {
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          if (currentPage > 1) setCurrentPage(currentPage - 1);
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          if (currentPage < activeFile.pageCount) setCurrentPage(currentPage + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeFileIndex,
    files,
    theme,
    imageMode,
    pageRange,
    isProcessing,
    currentPage,
    zoom,
    addFile,
    getPdfInfo,
    invertPdf,
    openFileDialog,
    setCurrentPage,
    setIsOsModalOpen,
    setZoom,
    startProcessing,
    stopProcessing,
  ]);
};
