import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useOsIntegration = () => {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const status = await invoke<boolean>('check_context_menu_status');
        setIsRegistered(status);
      } else {
        const stored = localStorage.getItem('venom_context_menu_mock');
        setIsRegistered(stored === 'true');
      }
    } catch (e) {
      console.warn('Failed to query context menu status:', e);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const enableContextMenu = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const result = await invoke<string>('enable_context_menu');
        setIsRegistered(true);
        setMessage(result);
      } else {
        localStorage.setItem('venom_context_menu_mock', 'true');
        setIsRegistered(true);
        setMessage('Windows context menu enabled (mocked in browser preview)');
      }
    } catch (e: any) {
      setMessage(`Failed: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const disableContextMenu = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const result = await invoke<string>('disable_context_menu');
        setIsRegistered(false);
        setMessage(result);
      } else {
        localStorage.removeItem('venom_context_menu_mock');
        setIsRegistered(false);
        setMessage('Windows context menu removed');
      }
    } catch (e: any) {
      setMessage(`Failed: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRegistered,
    isLoading,
    message,
    checkStatus,
    enableContextMenu,
    disableContextMenu,
  };
};
