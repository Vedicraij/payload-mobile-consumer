import Config from 'react-native-config';
import PostHog from 'posthog-react-native';

const projectToken = Config.POSTHOG_PROJECT_TOKEN;
const host = Config.POSTHOG_HOST || 'https://us.i.posthog.com';
const isConfigured = Boolean(projectToken);

if (!isConfigured) {
  if (__DEV__) {
    throw new Error(
      'POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, ' +
        'this causes events to be silently missed. This error stops appearing once ' +
        'POSTHOG_PROJECT_TOKEN is configured',
    );
  }
}

export const posthog = new PostHog(projectToken || 'placeholder_key', {
  host,
  disabled: !isConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  preloadFeatureFlags: true,
});
