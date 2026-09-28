import { invoke } from '@tauri-apps/api/core';
import { InvertOptions, PdfFileInfo } from '../types';

export const usePdfEngine = () => {
  const getPdfInfo = async (path: string): Promise<PdfFileInfo> => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        return await invoke<PdfFileInfo>('get_pdf_info', { path });
      }
      return {
        path,
        name: path.split(/[/\\]/).pop() || 'document.pdf',
        pageCount: 1,
        fileSize: 1024 * 1024,
        hasImages: true,
      };
    } catch (error) {
      console.error('Failed to get PDF info:', error);
      throw error;
    }
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

  return { getPdfInfo, invertPdf };
};
