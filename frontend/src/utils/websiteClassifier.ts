export type WebsiteType =
  | 'ALL'
  | 'NONE'
  | 'CUSTOM'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'INDIAMART'
  | 'JUSTDIAL'
  | 'LINKEDIN'
  | 'TWITTER'
  | 'YOUTUBE'
  | 'DIRECTORY'
  | 'SOCIAL_OR_DIRECTORY';

export interface WebsiteClassification {
  type: WebsiteType;
  label: string;
  isSocialOrDirectory: boolean;
  domain?: string;
  badgeStyle: string;
}

export function classifyWebsite(url: string | null | undefined): WebsiteClassification {
  if (!url || !url.trim()) {
    return {
      type: 'NONE',
      label: 'No Website',
      isSocialOrDirectory: false,
      badgeStyle: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    };
  }

  const clean = url.trim().toLowerCase();

  try {
    const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host.includes('instagram.com')) {
      return {
        type: 'INSTAGRAM',
        label: 'Instagram',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
      };
    }
    if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.me')) {
      return {
        type: 'FACEBOOK',
        label: 'Facebook',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20',
      };
    }
    if (host.includes('indiamart.com')) {
      return {
        type: 'INDIAMART',
        label: 'IndiaMART',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/25',
      };
    }
    if (host.includes('justdial.com')) {
      return {
        type: 'JUSTDIAL',
        label: 'Justdial',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      };
    }
    if (host.includes('linkedin.com')) {
      return {
        type: 'LINKEDIN',
        label: 'LinkedIn',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-sky-600/10 text-sky-600 dark:text-sky-400 border-sky-600/20',
      };
    }
    if (host.includes('twitter.com') || host.includes('x.com')) {
      return {
        type: 'TWITTER',
        label: 'X / Twitter',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-neutral-600/10 text-foreground border-neutral-600/20',
      };
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return {
        type: 'YOUTUBE',
        label: 'YouTube',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      };
    }
    if (
      host.includes('tradeindia.com') ||
      host.includes('sulekha.com') ||
      host.includes('yellowpages') ||
      host.includes('exportersindia.com')
    ) {
      return {
        type: 'DIRECTORY',
        label: 'B2B Directory',
        isSocialOrDirectory: true,
        domain: host,
        badgeStyle: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      };
    }

    return {
      type: 'CUSTOM',
      label: 'Custom Site',
      isSocialOrDirectory: false,
      domain: host,
      badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    };
  } catch {
    if (clean.includes('instagram.com')) {
      return { type: 'INSTAGRAM', label: 'Instagram', isSocialOrDirectory: true, badgeStyle: 'bg-pink-500/10 text-pink-500 border-pink-500/20' };
    }
    if (clean.includes('facebook.com')) {
      return { type: 'FACEBOOK', label: 'Facebook', isSocialOrDirectory: true, badgeStyle: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    }
    if (clean.includes('indiamart.com')) {
      return { type: 'INDIAMART', label: 'IndiaMART', isSocialOrDirectory: true, badgeStyle: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    }

    return {
      type: 'CUSTOM',
      label: 'Custom Site',
      isSocialOrDirectory: false,
      badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    };
  }
}
