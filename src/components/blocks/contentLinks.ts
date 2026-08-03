import {Linking} from 'react-native';

import {posthog} from '../../config/posthog';
import type {CMSLink} from '../../types/content';

const externalScheme = /^(https?:|mailto:|tel:)/i;

const warn = (message: string) => {
  if (__DEV__) {
    console.warn(message);
  }
};

export const openContentLink = async (
  href: string | null | undefined,
  onNavigate: (path: string) => void,
) => {
  const target = href?.trim();
  if (!target) {
    warn('CMS link has no destination.');
    return;
  }
  if (target.startsWith('/')) {
    onNavigate(target);
    return;
  }
  if (!externalScheme.test(target)) {
    warn(`CMS link uses an unsupported URL: ${target}`);
    return;
  }

  try {
    if (await Linking.canOpenURL(target)) {
      posthog.capture('external_link_opened', {url: target});
      await Linking.openURL(target);
    } else {
      warn(`No application can open CMS link: ${target}`);
    }
  } catch {
    warn(`Could not open CMS link: ${target}`);
  }
};

export const hrefForCMSLink = (link?: CMSLink) => {
  if (!link) return undefined;
  if (link.type === 'reference' && typeof link.reference?.value === 'object') {
    const slug = link.reference.value.slug;
    if (!slug) return undefined;
    if (link.reference.relationTo === 'pages') return slug === 'home' ? '/' : `/${slug}`;
    return `/posts/${slug}`;
  }
  return link.url || undefined;
};
