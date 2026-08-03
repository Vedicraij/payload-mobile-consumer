import AsyncStorage from '@react-native-async-storage/async-storage';

import {contentAPI} from '../src/api/content';
import {CONTENT_CONTRACT_VERSION, type Bootstrap} from '../src/types/content';

const fetchMock = jest.fn();

const bootstrap: Bootstrap = {
  featureFlags: {},
  promotions: [],
};

beforeAll(() => {
  globalThis.fetch = fetchMock;
});

beforeEach(() => {
  fetchMock.mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

test('requests targeted content and caches a valid envelope', async () => {
  fetchMock.mockResolvedValue({
    json: async () => ({contractVersion: CONTENT_CONTRACT_VERSION, data: bootstrap}),
    ok: true,
    status: 200,
  });

  await expect(contentAPI.bootstrap()).resolves.toEqual({data: bootstrap, stale: false});
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/content\/v1\/bootstrap\?.*market=MX.*audience=guest.*appVersion=2\.4\.0/),
    expect.objectContaining({headers: {Accept: 'application/json'}}),
  );
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    expect.stringContaining('cms:bootstrap:'),
    JSON.stringify({data: bootstrap}),
  );
});

test('returns fresh content even when the cache cannot be written', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  fetchMock.mockResolvedValue({
    json: async () => ({contractVersion: CONTENT_CONTRACT_VERSION, data: bootstrap}),
    ok: true,
    status: 200,
  });
  (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

  await expect(contentAPI.bootstrap()).resolves.toEqual({data: bootstrap, stale: false});
  expect(warning).toHaveBeenCalledWith('Fresh CMS content could not be cached.', expect.any(Error));
  warning.mockRestore();
});

test('falls back to valid cached content after a network failure', async () => {
  fetchMock.mockRejectedValue(new Error('offline'));
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
    data: bootstrap,
    nextChangeAt: '2099-01-01T00:00:00.000Z',
  }));

  await expect(contentAPI.bootstrap()).resolves.toEqual({data: bootstrap, stale: true});
});

test('rejects unsupported contracts and removes invalid cache entries', async () => {
  fetchMock.mockResolvedValue({
    json: async () => ({contractVersion: '2.0', data: bootstrap}),
    ok: true,
    status: 200,
  });
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{invalid-json');

  await expect(contentAPI.bootstrap()).rejects.toThrow('Unsupported content contract version: 2.0.');
  expect(AsyncStorage.removeItem).toHaveBeenCalled();
});
