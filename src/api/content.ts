import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

import { CMS_URL, DEFAULT_MARKET } from './config';
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

  try {
    const response = await fetch(
      `${CMS_URL}/api/content/v1/${path}?${queryString}`,
      {
        headers: { Accept: 'application/json' },
      },
    );
    if (!response.ok) {
      throw new Error(`Content request failed (${response.status}).`);
    }
    const envelope = (await response.json()) as APIEnvelope<T>;
    if (envelope.contractVersion !== CONTENT_CONTRACT_VERSION) {
      throw new Error(`Unsupported content contract version: ${envelope.contractVersion}.`);
    }
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: envelope.data,
        nextChangeAt: envelope.nextChangeAt,
      }),
    );
    return { data: envelope.data, stale: false };
  } catch (error) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const envelope = JSON.parse(cached) as CachedEnvelope<T>;
      if (isCachedEnvelopeValid(envelope)) {
        return { data: envelope.data, stale: true };
      }
      await AsyncStorage.removeItem(cacheKey);
    }
    throw error;
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
