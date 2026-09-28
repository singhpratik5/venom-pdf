import { create } from 'zustand';
import { PdfFileInfo, VenomTheme, ImageMode, BatchJob } from '../types';

export interface AppState {
  files: PdfFileInfo[];
  activeFileIndex: number | null;
  theme: VenomTheme;
  imageMode: ImageMode;
  pageRange: string;
  batchJobs: BatchJob[];
  isProcessing: boolean;
  
  addFile: (file: PdfFileInfo) => void;
  removeFile: (index: number) => void;
  setActiveFile: (index: number | null) => void;
  setTheme: (theme: VenomTheme) => void;
  setImageMode: (mode: ImageMode) => void;
  setPageRange: (range: string) => void;
  addBatchJob: (job: BatchJob) => void;
  updateBatchJob: (id: string, updates: Partial<BatchJob>) => void;
  startProcessing: () => void;
  stopProcessing: () => void;
}

const defaultTheme: VenomTheme = {
  id: 'dark-default',
  name: 'Venom Dark',
  background: '#1e1e1e',
  text: '#d4d4d4',
  accent: '#39FF14',
  description: 'Default dark theme'
};

export const useAppStore = create<AppState>((set) => ({
  files: [],
  activeFileIndex: null,
  theme: defaultTheme,
  imageMode: 'preserve',
  pageRange: '',
  batchJobs: [],
  isProcessing: false,

  addFile: (file) => set((state) => ({ 
    files: [...state.files, file],
    activeFileIndex: state.files.length 
  })),
  removeFile: (index) => set((state) => {
    const newFiles = [...state.files];
    newFiles.splice(index, 1);
    let newIndex = state.activeFileIndex;
    if (newIndex === index) {
      newIndex = newFiles.length > 0 ? 0 : null;
    } else if (newIndex !== null && newIndex > index) {
      newIndex--;
    }
    return { files: newFiles, activeFileIndex: newIndex };
  }),
  setActiveFile: (index) => set({ activeFileIndex: index }),
  setTheme: (theme) => set({ theme }),
  setImageMode: (imageMode) => set({ imageMode }),
  setPageRange: (pageRange) => set({ pageRange }),
  addBatchJob: (job) => set((state) => ({ batchJobs: [...state.batchJobs, job] })),
  updateBatchJob: (id, updates) => set((state) => ({
    batchJobs: state.batchJobs.map(job => job.id === id ? { ...job, ...updates } : job)
  })),
  startProcessing: () => set({ isProcessing: true }),
  stopProcessing: () => set({ isProcessing: false }),
}));
