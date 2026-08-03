import {Platform} from 'react-native';

// Android emulators reach the host through 10.0.2.2. Override this URL for physical devices.
export const CMS_URL = __DEV__
  ? Platform.select({android: 'http://10.0.2.2:3000', ios: 'https://payload-cms-poc-seven.vercel.app/'})!
  : 'https://cms.example.com';

export const DEFAULT_MARKET = 'MX';
