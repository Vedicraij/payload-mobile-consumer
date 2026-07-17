import AsyncStorage from '@react-native-async-storage/async-storage';

import type {ContentAlert} from '../types/content';

const STORAGE_PREFIX = 'content-alert:';
const sessionSeen = new Set<string>();

export const contentAlertKey = (alert: Pick<ContentAlert, 'id' | 'revision'>) =>
  `${alert.id}:${alert.revision}`;

const storageKey = (alert: Pick<ContentAlert, 'id' | 'revision'>) =>
  `${STORAGE_PREFIX}${contentAlertKey(alert)}`;

export const shouldPresentContentAlert = async (
  alert: ContentAlert,
  now = Date.now(),
) => {
  const key = contentAlertKey(alert);
  if (alert.frequency.type === 'always') return true;
  if (alert.frequency.type === 'session') return !sessionSeen.has(key);

  try {
    const stored = await AsyncStorage.getItem(storageKey(alert));
    if (!stored) return true;
    if (alert.frequency.type === 'once') return false;

    const shownAt = Number(stored);
    const cooldownMs = Math.max(0, alert.frequency.cooldownHours || 0) * 60 * 60 * 1000;
    return !Number.isFinite(shownAt) || now - shownAt >= cooldownMs;
  } catch {
    return true;
  }
};

export const recordContentAlertPresentation = async (
  alert: ContentAlert,
  now = Date.now(),
) => {
  const key = contentAlertKey(alert);
  if (alert.frequency.type === 'session') {
    sessionSeen.add(key);
    return;
  }
  if (alert.frequency.type === 'once' || alert.frequency.type === 'cooldown') {
    try {
      await AsyncStorage.setItem(storageKey(alert), String(now));
    } catch {
      // Storage failure should not prevent the alert from being presented.
    }
  }
};

export const clearContentAlertSession = () => sessionSeen.clear();
