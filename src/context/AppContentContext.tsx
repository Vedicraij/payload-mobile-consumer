import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';

import {contentAPI} from '../api/content';
import type {Bootstrap} from '../types/content';

type AppContentValue = {
  bootstrap: Bootstrap | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  stale: boolean;
};

const AppContentContext = createContext<AppContentValue | null>(null);

export const AppContentProvider = ({children}: {children: React.ReactNode}) => {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await contentAPI.bootstrap();
      setBootstrap(result.data);
      setStale(result.stale);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppContentContext.Provider value={{bootstrap, error, loading, refresh, stale}}>
      {children}
    </AppContentContext.Provider>
  );
};

export const useAppContent = () => {
  const value = useContext(AppContentContext);
  if (!value) {
    throw new Error('useAppContent must be used inside AppContentProvider.');
  }
  return value;
};
