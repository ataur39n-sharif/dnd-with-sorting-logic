'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DB } from '@/lib/types';
import { getDBFromClientCookies, saveDBToClientCookies } from '@/lib/client-cookies';

export function useLocalDB() {
  const [db, setDB] = useState<DB>({ lists: [], items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from cookies and sync with server
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from cookies first
      const cookieData = getDBFromClientCookies();
      if (cookieData.lists.length > 0 || cookieData.items.length > 0) {
        setDB(cookieData);
      }

      // Fetch latest data from server
      const response = await fetch('/api/db');
      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const serverData = await response.json();
      console.log('🔄 Loading fresh data from server:', serverData);
      setDB(serverData);
      
      // Update cookies with server data
      saveDBToClientCookies(serverData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to cookies
  const saveToCookies = useCallback((data: DB) => {
    saveDBToClientCookies(data);
  }, []);

  const updateLocalData = useCallback((newDB: DB) => {
    console.log('📝 Updating local data:', newDB);
    setDB(newDB);
    saveDBToClientCookies(newDB);
  }, []);

  // Sync with server after optimistic update
  const syncWithServer = useCallback(async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const serverData = await response.json();
        setDB(serverData);
        saveToCookies(serverData);
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  }, [saveToCookies]);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    db,
    isLoading,
    error,
    loadData,
    updateLocalData,
    syncWithServer,
    saveToCookies
  };
}