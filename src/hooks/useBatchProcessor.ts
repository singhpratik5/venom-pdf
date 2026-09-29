import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../stores/appStore';
import { BatchProgressPayload, PdfFileInfo } from '../types';

export const useBatchProcessor = () => {
  const {
    batchJobs,
    batchOutputDir,
    theme,
    imageMode,
    isProcessing,
    updateBatchJob,
    setBatchJobs,
    startProcessing,
    stopProcessing,
    addFiles,
  } = useAppStore();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          unlisten = await listen<BatchProgressPayload>('batch-progress', (event) => {
            const { id, filePath, progress, status, errorMessage } = event.payload;
            updateBatchJob(id || filePath, {
              progress,
              status,
              errorMessage,
            });
          });
        }
      } catch (e) {
        console.error('Failed to setup batch progress listener', e);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [updateBatchJob]);

  const selectFolder = useCallback(async (): Promise<string | null> => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const folder = await invoke<string | null>('open_folder_dialog');
        if (folder) {
          const pdfPaths = await invoke<string[]>('scan_folder_for_pdfs', { folderPath: folder });
          const newFiles: PdfFileInfo[] = pdfPaths.map((p) => {
            const fileName = p.split(/[/\\]/).pop() || 'document.pdf';
            return {
              path: p,
              name: fileName,
              pageCount: 1,
              fileSize: 1024 * 1024,
              hasImages: true,
            };
          });
          addFiles(newFiles);
          return folder;
        }
      } catch (err) {
        console.error('Error scanning folder:', err);
      }
    }
    return null;
  }, [addFiles]);

  const runBatch = useCallback(async () => {
    const pendingJobs = batchJobs.filter((j) => j.status === 'pending' || j.status === 'error');
    if (pendingJobs.length === 0 || isProcessing) return;

    startProcessing();

    // Mark starting status
    pendingJobs.forEach((job) => {
      updateBatchJob(job.id, { status: 'processing', progress: 10 });
    });

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const inputPaths = pendingJobs.map((j) => j.filePath);
        const outputDir = batchOutputDir || (inputPaths[0] ? inputPaths[0].substring(0, inputPaths[0].lastIndexOf('\\') || inputPaths[0].lastIndexOf('/')) : '');

        await invoke('batch_invert', {
          inputPaths,
          outputDir: outputDir || '.',
          themeName: theme.name,
          imageMode,
        });
      } else {
        // Simulation for web preview mode
        for (const job of pendingJobs) {
          updateBatchJob(job.id, { status: 'processing', progress: 30 });
          await new Promise((r) => setTimeout(r, 400));
          updateBatchJob(job.id, { progress: 75 });
          await new Promise((r) => setTimeout(r, 400));
          updateBatchJob(job.id, { status: 'done', progress: 100 });
        }
      }
    } catch (e) {
      console.error('Batch processing encountered an error:', e);
    } finally {
      stopProcessing();
    }
  }, [batchJobs, batchOutputDir, theme.name, imageMode, isProcessing, startProcessing, stopProcessing, updateBatchJob]);

  const clearCompleted = useCallback(() => {
    setBatchJobs(batchJobs.filter((j) => j.status !== 'done'));
  }, [batchJobs, setBatchJobs]);

  return {
    batchJobs,
    isProcessing,
    runBatch,
    selectFolder,
    clearCompleted,
  };
};
