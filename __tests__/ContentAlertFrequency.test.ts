import AsyncStorage from '@react-native-async-storage/async-storage';

import type {ContentAlert} from '../src/types/content';
import {
  clearContentAlertSession,
  recordContentAlertPresentation,
  shouldPresentContentAlert,
} from '../src/utils/contentAlertFrequency';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const alert = (frequency: ContentAlert['frequency']): ContentAlert => ({
  actions: [],
  dismissible: true,
  frequency,
  id: 'alert',
  message: 'Message',
  pageSlugs: [],
  placement: 'topBar',
  priority: 1,
  revision: 2,
  title: 'Title',
  trigger: {type: 'load'},
});

beforeEach(() => {
  clearContentAlertSession();
  jest.clearAllMocks();
});

test('session alerts present once per app session', async () => {
  const contentAlert = alert({type: 'session'});
  expect(await shouldPresentContentAlert(contentAlert)).toBe(true);
  await recordContentAlertPresentation(contentAlert);
  expect(await shouldPresentContentAlert(contentAlert)).toBe(false);
});

test('once alerts persist their presentation by id and revision', async () => {
  const contentAlert = alert({type: 'once'});
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1000');

  expect(await shouldPresentContentAlert(contentAlert)).toBe(false);
  await recordContentAlertPresentation(contentAlert, 2000);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('content-alert:alert:2', '2000');
});

test('cooldown alerts become eligible after the configured hours', async () => {
  const contentAlert = alert({cooldownHours: 2, type: 'cooldown'});
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(1_000));

  expect(await shouldPresentContentAlert(contentAlert, 1_000 + 60 * 60 * 1000)).toBe(false);
  expect(await shouldPresentContentAlert(contentAlert, 1_000 + 2 * 60 * 60 * 1000)).toBe(true);
});
