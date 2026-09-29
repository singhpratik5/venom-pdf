import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAppStore } from '../stores/appStore';
import { usePdfEngine } from '../hooks/usePdfEngine';
import { calculateColorMatrix } from '../utils/themeFilter';
import { generateSamplePdfBytes } from '../utils/samplePdf';
import {
  FileUp,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  FileCheck,
} from 'lucide-react';
import clsx from 'clsx';

// Set up pdf.js worker using ESM URL import compatible with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

const PDFPreview: React.FC = () => {
  const {
    files,
    activeFileIndex,
    theme,
    currentPage,
    zoom,
    previewMode,
    setCurrentPage,
    setZoom,
    setPreviewMode,
    addFile,
  } = useAppStore();

  const { readPdfBytes, openFileDialog, getPdfInfo } = usePdfEngine();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;

  // Load PDF Document when activeFile changes
  useEffect(() => {
    let isCancelled = false;

    const loadDocument = async () => {
      if (!activeFile) {
        setPdfDoc(null);
        setTotalPages(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const bytes = await readPdfBytes(activeFile);
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: bytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Failed to load PDF in PDF.js:', err);
          setError(err instanceof Error ? err.message : 'Failed to parse PDF');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  // Render Page onto Canvas when page, zoom, or doc changes
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: pdfjsLib.RenderTask | null = null;
    let isCancelled = false;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const pageNum = Math.min(Math.max(currentPage, 1), pdfDoc.numPages);
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const scale = zoom * 1.35;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'RenderingCancelledException'
        ) {
          // Expected when rapidly changing pages
          return;
        }
        console.error('Page render error:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeFile || totalPages <= 1) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage(Math.min(currentPage + 1, totalPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage(Math.max(currentPage - 1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, currentPage, totalPages, setCurrentPage]);

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        for (let i = 0; i < droppedFiles.length; i++) {
          const file = droppedFiles[i];
          if (file.name.toLowerCase().endsWith('.pdf')) {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            try {
              const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
              addFile({
                path: file.name,
                name: file.name,
                pageCount: doc.numPages,
                fileSize: file.size,
                hasImages: true,
                data: bytes,
              });
            } catch (err) {
              console.error('Error reading dropped PDF:', err);
            }
          }
        }
      }
    },
    [addFile]
  );

  const handleBrowseFiles = async () => {
    const selectedPath = await openFileDialog();
    if (selectedPath) {
      const info = await getPdfInfo(selectedPath);
      addFile(info);
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
        console.error('Error reading file:', err);
      }
    }
  };

  const handleLoadDemo = () => {
    const bytes = generateSamplePdfBytes();
    addFile({
      path: 'sample_venom_demo.pdf',
      name: 'sample_venom_demo.pdf',
      pageCount: 2,
      fileSize: bytes.byteLength,
      hasImages: false,
      data: bytes,
    });
  };

  const colorMatrixValues = calculateColorMatrix(theme.background, theme.text);

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#121212] overflow-hidden select-none relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden SVG Filter definition for instant GPU theme preview */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <filter id="pdf-theme-filter" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={colorMatrixValues} />
        </filter>
      </svg>

      {/* Hidden browser file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Top Preview Controls Bar (only visible when a file is open) */}
      {activeFile && (
        <div className="h-11 bg-background-sidebar border-b border-background-border flex items-center justify-between px-4 z-10 text-xs text-gray-300">
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1 hover:bg-background-main rounded text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-gray-200">
              Page <span className="text-accent-toxic font-semibold">{currentPage}</span> of{' '}
              {totalPages || activeFile.pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1 hover:bg-background-main rounded text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(zoom - 0.15, 0.5))}
              className="p-1 hover:bg-background-main rounded text-gray-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="font-mono w-12 text-center text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(zoom + 0.15, 2.5))}
              className="p-1 hover:bg-background-main rounded text-gray-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 hover:bg-background-main rounded text-gray-400 hover:text-white"
              title="Reset Zoom (100%)"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Preview Mode Toggle & Active Theme Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background-main border border-background-border text-[11px]">
              <span
                className="w-2.5 h-2.5 rounded-full border border-gray-600 inline-block"
                style={{ backgroundColor: theme.background }}
              />
              <span className="text-gray-300">{theme.name}</span>
            </div>

            <div className="flex items-center rounded-lg bg-background-main p-0.5 border border-background-border">
              <button
                onClick={() => setPreviewMode('dark')}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors',
                  previewMode === 'dark'
                    ? 'bg-accent-toxic text-black font-semibold'
                    : 'text-gray-400 hover:text-white'
                )}
                title="Preview Dark Theme Inversion"
              >
                <Moon size={12} />
                <span>Themed</span>
              </button>
              <button
                onClick={() => setPreviewMode('original')}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors',
                  previewMode === 'original'
                    ? 'bg-white text-black font-semibold'
                    : 'text-gray-400 hover:text-white'
                )}
                title="View Original Light Page"
              >
                <Sun size={12} />
                <span>Original</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Viewport or Dropzone */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative">
        {isDragOver && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm border-2 border-dashed border-accent-toxic flex flex-col items-center justify-center text-accent-toxic animate-in fade-in">
            <FileUp size={64} className="mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Drop PDF Here to Open</h2>
            <p className="text-sm text-gray-300 mt-2">Venom PDF will instantly load and preview it</p>
          </div>
        )}

        {!activeFile ? (
          <div
            className={clsx(
              'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-gray-400 w-full max-w-xl transition-all',
              isDragOver
                ? 'border-accent-toxic bg-background-main/80'
                : 'border-background-border bg-background-sidebar/40 hover:border-gray-500'
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-background-main border border-background-border flex items-center justify-center text-accent-toxic mb-4 shadow-[0_0_20px_rgba(57,255,20,0.15)]">
              <FileUp size={32} />
            </div>

            <h2 className="text-xl font-semibold text-text-heading mb-2">
              No Document Selected
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-md mb-6 leading-relaxed">
              Drag & drop any PDF here, or click below to open your document and experience real-time smart dark mode.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={handleBrowseFiles}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-toxic text-black font-semibold rounded-lg text-sm hover:bg-[#4dff2d] hover:shadow-[0_0_15px_rgba(57,255,20,0.35)] transition-all"
              >
                <FileCheck size={16} />
                <span>Open PDF Document</span>
              </button>
              <button
                onClick={handleLoadDemo}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-background-main border border-background-border text-gray-300 hover:text-accent-toxic hover:border-accent-toxic font-medium rounded-lg text-sm transition-all"
              >
                <Sparkles size={16} />
                <span>Load Demo PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center transition-all duration-200">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                <Loader2 size={36} className="animate-spin text-accent-toxic" />
                <p className="text-sm">Decoding PDF content stream...</p>
              </div>
            ) : error ? (
              <div className="bg-red-950/40 border border-red-800 rounded-xl p-6 text-red-200 text-center max-w-md">
                <p className="font-semibold mb-2">Error Loading Document</p>
                <p className="text-xs text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleLoadDemo}
                  className="px-4 py-1.5 bg-red-900/60 hover:bg-red-800 rounded text-xs"
                >
                  Load Sample PDF Instead
                </button>
              </div>
            ) : (
              <div
                className="relative rounded-lg shadow-2xl transition-all duration-300"
                style={{
                  backgroundColor: previewMode === 'dark' ? theme.background : '#ffffff',
                }}
              >
                {isRendering && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                    <Loader2 size={28} className="animate-spin text-accent-toxic" />
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="rounded-lg max-w-full h-auto shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
                  style={{
                    filter: previewMode === 'dark' ? 'url(#pdf-theme-filter)' : 'none',
                    transition: 'filter 0.2s ease',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFPreview;
