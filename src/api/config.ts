import Config from 'react-native-config';

const PUBLIC_CMS_URL = 'https://payload-cms-poc-seven.vercel.app';
const PUBLIC_WEBSITE_URL = 'https://payload-website-consumer.vercel.app';

const normalizeBaseURL = (value?: string) =>
  (value?.trim() || PUBLIC_CMS_URL).replace(/\/+$/, '');

const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * The public CMS is the safe default on every platform and build type.
 * Developers can override it in an untracked .env file when they need a local
 * Payload instance (Android emulator example: http://10.0.2.2:3000).
 */
export const CMS_URL = normalizeBaseURL(Config.CMS_URL);
export const WEBSITE_URL = normalizeBaseURL(Config.WEBSITE_URL || PUBLIC_WEBSITE_URL);
export const CMS_REQUEST_TIMEOUT_MS = positiveInteger(
  Config.CMS_REQUEST_TIMEOUT_MS,
  10_000,
);
export const DEFAULT_MARKET = Config.DEFAULT_MARKET?.trim() || 'MX';
