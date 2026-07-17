import {useCallback, useEffect, useState} from 'react';

import {contentAPI} from '../api/content';
import type {CMSPage} from '../types/content';

export const useCMSPage = (slug: string) => {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await contentAPI.page(slug);
      setPage(result.data);
      setStale(result.stale);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load this page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return {page, error, loading, refreshing, reload: () => load(true), stale};
};
