export interface VenomTheme {
  id: string;
  name: string;
  background: string;
  text: string;
  accent: string;
  description: string;
}

export type ImageMode = 'preserve' | 'dim' | 'full_invert';

export interface InvertOptions {
  theme: VenomTheme;
  imageMode: ImageMode;
  pageRange: string;
  customBg?: string;
  customText?: string;
}

export interface PdfFileInfo {
  path: string;
  name: string;
  pageCount: number;
  fileSize: number;
  hasImages: boolean;
}

export interface BatchJob {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}
