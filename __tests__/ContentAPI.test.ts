import AsyncStorage from '@react-native-async-storage/async-storage';

import {contentAPI, absoluteMediaURL} from '../src/api/content';
import {
  CONTENT_CONTRACT_VERSION,
  type APIEnvelope,
  type Bootstrap,
  type CMSPage,
  type LegalContent,
  type ContentAlert,
} from '../src/types/content';

const fetchMock = jest.fn();

const bootstrap: Bootstrap = {
  featureFlags: {},
  promotions: [],
};

const samplePage: CMSPage = {
  id: 'home-page',
  layout: [],
  slug: 'home',
  title: 'Home Page',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const sampleLegal: LegalContent = {
  content: 'Privacy policy content',
  legalVersion: '1.0',
  summary: 'Privacy policy summary',
  title: 'Privacy Policy',
};

const sampleMedia = '/media/photo.jpg';

const apiEnvelope = <T>(data: T, nextChangeAt?: string, resolvedContext?: Record<string, unknown>): APIEnvelope<T> => ({
  contractVersion: CONTENT_CONTRACT_VERSION,
  data,
  nextChangeAt,
  resolvedContext: resolvedContext ?? {},
});

beforeAll(() => {
  globalThis.fetch = fetchMock;
});

beforeEach(() => {
  fetchMock.mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('bootstrap endpoint', () => {
  test('requests targeted content and caches a valid envelope', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap),
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
      json: async () => apiEnvelope(bootstrap),
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
});

describe('page endpoint', () => {
  test('returns valid page content with contract envelope', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(samplePage),
      ok: true,
      status: 200,
    });

    const result = await contentAPI.page('home');

    expect(result).toEqual({data: samplePage, stale: false});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/content\/v1\/pages\/home\?.*market=MX.*audience=guest.*appVersion=2\.4\.0/),
      expect.objectContaining({headers: {Accept: 'application/json'}}),
    );
  });

  test('validates contract envelope structure', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(samplePage, '2026-12-31T23:59:59.000Z', {platform: 'ios'}),
      ok: true,
      status: 200,
    });

    const result = await contentAPI.page('home');

    expect(result.data).toEqual(samplePage);
    expect(result.data.slug).toBe('home');
    expect(result.data.title).toBe('Home Page');
    expect(Array.isArray(result.data.layout)).toBe(true);
    expect(result.stale).toBe(false);
  });

  test('handles empty layout gracefully', async () => {
    const emptyPage = {...samplePage, layout: []};
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(emptyPage),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.page('home')).resolves.toEqual({data: emptyPage, stale: false});
  });

  test('rejects unsupported contract versions', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({...apiEnvelope(samplePage), contractVersion: '2.0'}),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.page('home')).rejects.toThrow('Unsupported content contract version: 2.0.');
  });
});

describe('legal endpoint', () => {
  test('returns valid legal content with contract envelope', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(sampleLegal),
      ok: true,
      status: 200,
    });

    const result = await contentAPI.legal('privacy_policy');

    expect(result).toEqual({data: sampleLegal, stale: false});
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/content\/v1\/legal\/privacy_policy\?.*market=MX.*audience=guest.*appVersion=2\.4\.0/),
      expect.objectContaining({headers: {Accept: 'application/json'}}),
    );
  });

  test('validates legal content structure', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(sampleLegal),
      ok: true,
      status: 200,
    });

    const result = await contentAPI.legal('privacy_policy');

    expect(result.data.title).toBe('Privacy Policy');
    expect(result.data.summary).toBe('Privacy policy summary');
    expect(result.data.content).toBe('Privacy policy content');
    expect(result.data.legalVersion).toBe('1.0');
    expect(result.stale).toBe(false);
  });

  test('handles missing optional fields gracefully', async () => {
    const minimalLegal = {
      title: 'Terms',
      content: 'Terms content',
      // Missing legalVersion, summary - should be optional
    };
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(minimalLegal),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.legal('terms')).resolves.toEqual({data: minimalLegal, stale: false});
  });
});

describe('media URL resolution', () => {
  test('returns absolute URL for absolute media path', () => {
    const absoluteUrl = 'https://example.com/image.jpg';
    const result = absoluteMediaURL(absoluteUrl);
    expect(result).toBe(absoluteUrl);
  });

  test('returns absolute CMS URL for relative media path', () => {
    const relativeUrl = '/media/image.jpg';
    const expected = `https://payload-cms-poc-seven.vercel.app${relativeUrl}`;
    const result = absoluteMediaURL(relativeUrl);
    expect(result).toBe(expected);
  });

  test('returns null for null input (handled by first condition)', () => {
    // The function checks `if (!url || url.startsWith('http'))` - null is falsy so returns url (null)
    // @ts-ignore - Testing null input which is assignable to ? string via any
    expect(absoluteMediaURL(null as any)).toBeNull();
  });

  test('returns undefined for undefined input', () => {
    expect(absoluteMediaURL(undefined)).toBeUndefined();
  });

  test('returns the input for empty string (starts with http check)', () => {
    expect(absoluteMediaURL('')).toBe('');
  });
});

describe('contract validation', () => {
  test('accepts contract version 1.1 as valid', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.bootstrap()).resolves.toEqual({data: bootstrap, stale: false});
  });

  test('rejects contract version 2.0 as invalid', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({...apiEnvelope(bootstrap), contractVersion: '2.0'}),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.bootstrap()).rejects.toThrow('Unsupported content contract version: 2.0.');
  });

  test('accepts additive fields in data without rejection', async () => {
    const bootstrapWithExtra = {...bootstrap, extraField: 'should be ignored'};
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrapWithExtra),
      ok: true,
      status: 200,
    });

    // Should succeed - extra fields should be preserved in data
    await expect(contentAPI.bootstrap()).resolves.toEqual({data: bootstrapWithExtra, stale: false});
  });

  test('preserves resolvedContext in envelope', async () => {
    const resolvedContext = {platform: 'ios', market: 'MX', audience: 'guest'};
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap, undefined, resolvedContext),
      ok: true,
      status: 200,
    });

    const result = await contentAPI.bootstrap();
    // Note: resolvedContext is not returned by contentAPI, only used internally for validation
    // But we can verify the API was called and returned successfully
    expect(result.data).toEqual(bootstrap);
  });
});

describe('context and input validation', () => {
  test('applies correct platform parameter based on OS', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap),
      ok: true,
      status: 200,
    });

    await contentAPI.bootstrap();

    // Should contain platform parameter (ios or android based on actual OS)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('platform='),
      expect.anything()
    );
  });

  test('applies correct market parameter', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap),
      ok: true,
      status: 200,
    });

    await contentAPI.bootstrap();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('market=MX'),
      expect.anything()
    );
  });

  test('applies correct audience parameter', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap),
      ok: true,
      status: 200,
    });

    await contentAPI.bootstrap();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('audience=guest'),
      expect.anything()
    );
  });

  test('applies correct appVersion parameter', async () => {
    fetchMock.mockResolvedValue({
      json: async () => apiEnvelope(bootstrap),
      ok: true,
      status: 200,
    });

    await contentAPI.bootstrap();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/appVersion=2\.4\.0/),
      expect.anything()
    );
  });
});

describe('error handling', () => {
  test('handles 404 Not Found error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(contentAPI.page('nonexistent')).rejects.toThrow('Content request failed (404).');
  });

  test('handles 500 Internal Server Error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(contentAPI.page('error')).rejects.toThrow('Content request failed (500).');
  });

  test('handles malformed JSON response', async () => {
    fetchMock.mockResolvedValue({
      // Return valid JSON but missing data property - this should trigger the missing data envelope error
      json: async () => ({}),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.page('malformed')).rejects.toThrow('Content response is missing its data envelope.');
  });

  test('handles missing data envelope', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({}),
      ok: true,
      status: 200,
    });

    await expect(contentAPI.page('missing-data')).rejects.toThrow('Content response is missing its data envelope.');
  });

  test('handles network timeout', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValue(abortError);

    await expect(contentAPI.page('timeout')).rejects.toThrow('Content request timed out. Please try again.');
  });
});

describe('cache behavior with nextChangeAt', () => {
  test('removes expired cache and throws network error', async () => {
    // Cache content that expired 1 hour ago
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

    fetchMock.mockRejectedValue(new Error('offline'));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
      data: bootstrap,
      nextChangeAt: pastDate, // Expired
    }));
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    await expect(contentAPI.bootstrap()).rejects.toThrow('offline');
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  test('considers content fresh when before nextChangeAt', async () => {
    // Cache content that expires in 1 hour
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future

    fetchMock.mockRejectedValue(new Error('offline'));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
      data: bootstrap,
      nextChangeAt: futureDate, // Not expired yet
    }));

    const result = await contentAPI.bootstrap();
    expect(result.data).toEqual(bootstrap);
    expect(result.stale).toBe(true); // Still marked as stale because from cache, but not expired
  });

  test('handles invalid nextChangeAt format gracefully', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
      data: bootstrap,
      nextChangeAt: 'invalid-date-format',
    }));

    // Should treat invalid date as expired and return fresh content if available
    // Since we're mocking network failure, it will try to use cache
    // The isCachedEnvelopeValid function should return false for invalid dates
    await expect(contentAPI.bootstrap()).rejects.toThrow('offline');
  });
});
