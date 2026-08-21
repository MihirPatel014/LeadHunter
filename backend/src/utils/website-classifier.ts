export type WebsiteType =
  | 'NONE'
  | 'CUSTOM'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'INDIAMART'
  | 'JUSTDIAL'
  | 'LINKEDIN'
  | 'TWITTER'
  | 'YOUTUBE'
  | 'DIRECTORY';

export interface WebsiteClassification {
  type: WebsiteType;
  label: string;
  isSocialOrDirectory: boolean;
  domain?: string;
}

export function classifyWebsite(url: string | null | undefined): WebsiteClassification {
  if (!url || !url.trim()) {
    return {
      type: 'NONE',
      label: 'No Website',
      isSocialOrDirectory: false,
    };
  }

  const clean = url.trim().toLowerCase();

  try {
    const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host.includes('instagram.com')) {
      return { type: 'INSTAGRAM', label: 'Instagram Profile', isSocialOrDirectory: true, domain: host };
    }
    if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.me')) {
      return { type: 'FACEBOOK', label: 'Facebook Page', isSocialOrDirectory: true, domain: host };
    }
    if (host.includes('indiamart.com')) {
      return { type: 'INDIAMART', label: 'IndiaMART Catalog', isSocialOrDirectory: true, domain: host };
    }
    if (host.includes('justdial.com')) {
      return { type: 'JUSTDIAL', label: 'Justdial Listing', isSocialOrDirectory: true, domain: host };
    }
    if (host.includes('linkedin.com')) {
      return { type: 'LINKEDIN', label: 'LinkedIn', isSocialOrDirectory: true, domain: host };
    }
    if (host.includes('twitter.com') || host.includes('x.com')) {
      return { type: 'TWITTER', label: 'X / Twitter', isSocialOrDirectory: true, domain: host };
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return { type: 'YOUTUBE', label: 'YouTube', isSocialOrDirectory: true, domain: host };
    }
    if (
      host.includes('tradeindia.com') ||
      host.includes('sulekha.com') ||
      host.includes('yellowpages') ||
      host.includes('exportersindia.com')
    ) {
      return { type: 'DIRECTORY', label: 'B2B Directory', isSocialOrDirectory: true, domain: host };
    }

    return {
      type: 'CUSTOM',
      label: 'Custom Website',
      isSocialOrDirectory: false,
      domain: host,
    };
  } catch {
    // Fallback regex detection
    if (clean.includes('instagram.com')) return { type: 'INSTAGRAM', label: 'Instagram', isSocialOrDirectory: true };
    if (clean.includes('facebook.com')) return { type: 'FACEBOOK', label: 'Facebook', isSocialOrDirectory: true };
    if (clean.includes('indiamart.com')) return { type: 'INDIAMART', label: 'IndiaMART', isSocialOrDirectory: true };
    if (clean.includes('justdial.com')) return { type: 'JUSTDIAL', label: 'Justdial', isSocialOrDirectory: true };

    return { type: 'CUSTOM', label: 'Custom Website', isSocialOrDirectory: false };
  }
}
