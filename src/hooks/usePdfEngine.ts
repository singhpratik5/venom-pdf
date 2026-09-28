import { invoke } from '@tauri-apps/api/core';
import { InvertOptions, PdfFileInfo } from '../types';

export const usePdfEngine = () => {
  const getPdfInfo = async (path: string): Promise<PdfFileInfo> => {
    try {
      // return await invoke('get_pdf_info', { path });
      // Placeholder for now
      return {
        path,
        name: path.split(/[/\\]/).pop() || 'document.pdf',
        pageCount: 10,
        fileSize: 1024 * 1024 * 2.5, // 2.5 MB
        hasImages: true
      };
    } catch (error) {
      console.error('Failed to get PDF info:', error);
      throw error;
    }
  };

  const invertPdf = async (inputPath: string, outputPath: string, options: InvertOptions) => {
    try {
      // await invoke('invert_pdf', { inputPath, outputPath, options });
      console.log('Inverting PDF:', inputPath, outputPath, options);
      return new Promise(resolve => setTimeout(resolve, 2000)); // mock delay
    } catch (error) {
      console.error('Failed to invert PDF:', error);
      throw error;
    }
  };

  return { getPdfInfo, invertPdf };
};
