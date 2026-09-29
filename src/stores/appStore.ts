import { create } from 'zustand';
import { PdfFileInfo, VenomTheme, ImageMode, BatchJob } from '../types';

export interface AppState {
  files: PdfFileInfo[];
  activeFileIndex: number | null;
  theme: VenomTheme;
  imageMode: ImageMode;
  pageRange: string;
  batchJobs: BatchJob[];
  batchOutputDir: string;
  isProcessing: boolean;
  currentPage: number;
  zoom: number;
  previewMode: 'dark' | 'original';
  isOsModalOpen: boolean;

  addFile: (file: PdfFileInfo) => void;
  addFiles: (files: PdfFileInfo[]) => void;
  removeFile: (index: number) => void;
  setActiveFile: (index: number | null) => void;
  setTheme: (theme: VenomTheme) => void;
  setImageMode: (mode: ImageMode) => void;
  setPageRange: (range: string) => void;
  addBatchJob: (job: BatchJob) => void;
  setBatchJobs: (jobs: BatchJob[]) => void;
  updateBatchJob: (id: string, updates: Partial<BatchJob>) => void;
  clearBatchJobs: () => void;
  setBatchOutputDir: (dir: string) => void;
  queueAllOpenFiles: () => void;
  startProcessing: () => void;
  stopProcessing: () => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setPreviewMode: (mode: 'dark' | 'original') => void;
  setIsOsModalOpen: (open: boolean) => void;
}

const defaultTheme: VenomTheme = {
  id: 'venom-dark',
  name: 'Venom Dark',
  background: '#1e1e1e',
  text: '#d4d4d4',
  accent: '#39FF14',
  description: 'Default high contrast dark mode',
};

export const useAppStore = create<AppState>((set, get) => ({
  files: [],
  activeFileIndex: null,
  theme: defaultTheme,
  imageMode: 'preserve',
  pageRange: '',
  batchJobs: [],
  batchOutputDir: '',
  isProcessing: false,
  currentPage: 1,
  zoom: 1.0,
  previewMode: 'dark',
  isOsModalOpen: false,

  setIsOsModalOpen: (open) => set({ isOsModalOpen: open }),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
      activeFileIndex: state.files.length,
      currentPage: 1,
    })),
  addFiles: (newFiles) =>
    set((state) => ({
      files: [...state.files, ...newFiles],
      activeFileIndex: state.files.length > 0 ? state.activeFileIndex ?? 0 : 0,
    })),
  removeFile: (index) =>
    set((state) => {
      const newFiles = [...state.files];
      newFiles.splice(index, 1);
      let newIndex = state.activeFileIndex;
      if (newIndex === index) {
        newIndex = newFiles.length > 0 ? 0 : null;
      } else if (newIndex !== null && newIndex > index) {
        newIndex--;
      }
      return { files: newFiles, activeFileIndex: newIndex, currentPage: 1 };
    }),
  setActiveFile: (index) => set({ activeFileIndex: index, currentPage: 1 }),
  setTheme: (theme) => set({ theme }),
  setImageMode: (imageMode) => set({ imageMode }),
  setPageRange: (pageRange) => set({ pageRange }),
  addBatchJob: (job) => set((state) => ({ batchJobs: [...state.batchJobs, job] })),
  setBatchJobs: (batchJobs) => set({ batchJobs }),
  updateBatchJob: (id, updates) =>
    set((state) => ({
      batchJobs: state.batchJobs.map((job) =>
        job.id === id || job.filePath === id ? { ...job, ...updates } : job
      ),
    })),
  clearBatchJobs: () => set({ batchJobs: [] }),
  setBatchOutputDir: (batchOutputDir) => set({ batchOutputDir }),
  queueAllOpenFiles: () => {
    const { files, batchJobs } = get();
    const existingPaths = new Set(batchJobs.map((j) => j.filePath));
    const newJobs: BatchJob[] = files
      .filter((f) => !existingPaths.has(f.path))
      .map((f, i) => ({
        id: `job_${Date.now()}_${i}`,
        filePath: f.path,
        fileName: f.name,
        status: 'pending',
        progress: 0,
      }));
    if (newJobs.length > 0) {
      set({ batchJobs: [...batchJobs, ...newJobs] });
    }
  },
  startProcessing: () => set({ isProcessing: true }),
  stopProcessing: () => set({ isProcessing: false }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setZoom: (zoom) => set({ zoom }),
  setPreviewMode: (previewMode) => set({ previewMode }),
}));
