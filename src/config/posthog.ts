import Config from 'react-native-config';
import PostHog from 'posthog-react-native';

const projectToken = Config.POSTHOG_PROJECT_TOKEN?.trim();
const host = Config.POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
const analyticsRequested = Config.ENABLE_ANALYTICS?.trim().toLowerCase() === 'true';

if (__DEV__ && analyticsRequested && !projectToken) {
  console.warn('Analytics is enabled, but POSTHOG_PROJECT_TOKEN is not configured.');
}

export const ANALYTICS_ENABLED = analyticsRequested && Boolean(projectToken);

export const posthog = new PostHog(projectToken || 'placeholder_key', {
  host,
  disabled: !ANALYTICS_ENABLED,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  preloadFeatureFlags: true,
});
