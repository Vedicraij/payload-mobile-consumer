import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

import {CMS_REQUEST_TIMEOUT_MS, CMS_URL, DEFAULT_MARKET} from './config';
import { isCachedEnvelopeValid, type CachedEnvelope } from './cache';
import {
  CONTENT_CONTRACT_VERSION,
  type APIEnvelope,
  type Bootstrap,
  type CMSPage,
  type LegalContent,
} from '../types/content';

type CachedResult<T> = { data: T; stale: boolean };

const query = () =>
  new URLSearchParams({
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    market: DEFAULT_MARKET,
    audience: 'guest',
    appVersion: DeviceInfo.getVersion(),
  }).toString();

const request = async <T>(path: string): Promise<CachedResult<T>> => {
  const queryString = query();
  const cacheKey = `cms:${path}:${queryString}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CMS_URL}/api/content/v1/${path}?${queryString}`,
      {
        headers: {Accept: 'application/json'},
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(`Content request failed (${response.status}).`);
    }
    const envelope = (await response.json()) as APIEnvelope<T> | null;
    if (!envelope || typeof envelope !== 'object' || !('data' in envelope)) {
      throw new Error('Content response is missing its data envelope.');
    }
    if (envelope.contractVersion !== CONTENT_CONTRACT_VERSION) {
      throw new Error(`Unsupported content contract version: ${envelope.contractVersion}.`);
    }
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: envelope.data,
          nextChangeAt: envelope.nextChangeAt,
        }),
      );
    } catch (storageError) {
      if (__DEV__) console.warn('Fresh CMS content could not be cached.', storageError);
    }
    return { data: envelope.data, stale: false };
  } catch (error) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          const envelope = JSON.parse(cached) as CachedEnvelope<T>;
          if (isCachedEnvelopeValid(envelope)) {
            return {data: envelope.data, stale: true};
          }
        } catch {
          // Invalid cache entries are discarded below and never hide the network error.
        }
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (storageError) {
      if (__DEV__) console.warn('Cached CMS content could not be read.', storageError);
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Content request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const contentAPI = {
  bootstrap: () => request<Bootstrap>('bootstrap'),
  page: (slug: string) => request<CMSPage>(`pages/${encodeURIComponent(slug)}`),
  legal: (key: string) =>
    request<LegalContent>(`legal/${encodeURIComponent(key)}`),
};

export const absoluteMediaURL = (url?: string) => {
  if (!url || url.startsWith('http')) {
    return url;
  }
  return `${CMS_URL}${url}`;
};
