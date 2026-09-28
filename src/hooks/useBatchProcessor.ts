import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '../stores/appStore';

export const useBatchProcessor = () => {
  const { updateBatchJob } = useAppStore();

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        unlisten = await listen<{ id: string; progress: number; status: string }>('batch-progress', (event) => {
          const { id, progress, status } = event.payload;
          updateBatchJob(id, { 
            progress, 
            status: status as 'pending' | 'processing' | 'done' | 'error' 
          });
        });
      } catch (e) {
        console.error('Failed to setup batch progress listener', e);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [updateBatchJob]);
};
