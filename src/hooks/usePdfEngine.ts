import { invoke } from '@tauri-apps/api/core';
import { InvertOptions, PdfFileInfo } from '../types';
import { generateSamplePdfBytes } from '../utils/samplePdf';

export const usePdfEngine = () => {
  const getPdfInfo = async (path: string): Promise<PdfFileInfo> => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        return await invoke<PdfFileInfo>('get_pdf_info', { path });
      }
      return {
        path,
        name: path.split(/[/\\]/).pop() || 'document.pdf',
        pageCount: 2,
        fileSize: 1024 * 50,
        hasImages: false,
      };
    } catch (error) {
      console.error('Failed to get PDF info:', error);
      throw error;
    }
  };

  const openFileDialog = async (): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        return await invoke<string | null>('open_file_dialog');
      }
      return null;
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      return null;
    }
  };

  const readPdfBytes = async (file: PdfFileInfo): Promise<Uint8Array> => {
    if (file.data) {
      return file.data;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { readFile } = await import('@tauri-apps/plugin-fs');
        return await readFile(file.path);
      } catch (e) {
        console.warn('Failed to read from filesystem, using fallback:', e);
      }
    }
    return generateSamplePdfBytes();
  };

  const invertPdf = async (inputPath: string, outputPath: string, options: InvertOptions) => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        return await invoke<string>('invert_pdf', {
          inputPath,
          outputPath,
          themeName: options.theme.name,
          imageMode: options.imageMode,
          pageRange: options.pageRange || 'all',
        });
      }
      console.log('Mock inverting PDF:', inputPath, outputPath, options);
      return new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Failed to invert PDF:', error);
      throw error;
    }
  };

  return { getPdfInfo, openFileDialog, readPdfBytes, invertPdf };
};
