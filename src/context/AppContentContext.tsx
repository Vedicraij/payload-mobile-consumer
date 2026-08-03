import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';

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
  const bootstrapRef = useRef<Bootstrap | null>(null);

  const refresh = useCallback(async () => {
    if (!bootstrapRef.current) setLoading(true);
    setError(null);
    try {
      const result = await contentAPI.bootstrap();
      bootstrapRef.current = result.data;
      setBootstrap(result.data);
      setStale(result.stale);
    } catch (reason) {
      if (bootstrapRef.current) setStale(true);
      setError(reason instanceof Error ? reason.message : 'Could not load content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && bootstrapRef.current) refresh();
    });
    return () => subscription.remove();
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
