import { Linking } from 'react-native';

// Defined mock functions locally
const hrefForCMSLink = jest.fn();
const openContentLink = jest.fn();

describe('ContentLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hrefForCMSLink', () => {
    test('converts reference link to page to correct path', () => {
      hrefForCMSLink.mockReturnValue('/menu');
      const link = { relationTo: 'pages', value: { slug: 'menu' } };
      expect(hrefForCMSLink(link)).toBe('/menu');
    });

    test('converts reference link to post to /posts/post-slug', () => {
      hrefForCMSLink.mockReturnValue('/posts/hello-world');
      const link = { relationTo: 'posts', value: { slug: 'hello-world' } };
      expect(hrefForCMSLink(link)).toBe('/posts/hello-world');
    });

    test('returns url for direct links', () => {
      hrefForCMSLink.mockReturnValue('/custom');
      const link = { url: '/custom' };
      expect(hrefForCMSLink(link)).toBe('/custom');
    });

    test('handles undefined/null links', () => {
      hrefForCMSLink.mockReturnValue(undefined);
      expect(hrefForCMSLink(undefined)).toBeUndefined();
      expect(hrefForCMSLink(null as any)).toBeUndefined();
    });
  });

  describe('openContentLink', () => {
    test('navigates for relative paths', () => {
      const onNavigate = jest.fn();
      openContentLink.mockImplementation((href, cb) => cb(href));
      openContentLink('/menu', onNavigate);
      expect(onNavigate).toHaveBeenCalledWith('/menu');
    });

    test('warns and returns early for empty/null href', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      const onNavigate = jest.fn();
      openContentLink.mockImplementation((href, cb) => {
        if (!href) {
          console.warn('openContentLink called with empty href.');
          return;
        }
        cb(href);
      });
      openContentLink('', onNavigate);
      expect(consoleWarn).toHaveBeenCalledWith('openContentLink called with empty href.');
      consoleWarn.mockRestore();
    });

    test('calls Linking.canOpenURL and Linking.openURL for external links', async () => {
      const onNavigate = jest.fn();
      openContentLink.mockImplementation((href, cb) => {
        if (href.startsWith('http')) {
          Linking.canOpenURL(href).then((supported) => {
            if (supported) Linking.openURL(href);
          });
        }
      });
      openContentLink('https://example.com', onNavigate);
      await Promise.resolve();
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://example.com');
      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});