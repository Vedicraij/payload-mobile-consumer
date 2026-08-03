declare module 'react-native-config' {
  export interface NativeConfig {
    CMS_REQUEST_TIMEOUT_MS?: string;
    CMS_URL?: string;
    DEFAULT_MARKET?: string;
    ENABLE_ANALYTICS?: string;
    POSTHOG_PROJECT_TOKEN?: string;
    POSTHOG_HOST?: string;
    WEBSITE_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
