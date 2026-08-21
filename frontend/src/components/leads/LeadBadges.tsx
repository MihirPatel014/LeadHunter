import React from 'react';
import { TemperatureStatus, LeadStatus, WebsiteStatus } from '../../types/lead';

export const TemperatureBadge: React.FC<{ temperature: TemperatureStatus }> = ({ temperature }) => {
  const styles = {
    HOT: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    WARM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    LOW: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        styles[temperature] || styles.LOW
      }`}
    >
      {temperature}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => {
  const styles: Record<LeadStatus, string> = {
    NEW: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    RESEARCHED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    QUALIFIED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    PENDING_APPROVAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    CONTACTED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    REPLIED: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    INTERESTED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    CONVERTED: 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold',
    DISQUALIFIED: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 line-through',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
        styles[status] || 'bg-secondary text-muted-foreground border-border'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

export const WebsiteStatusBadge: React.FC<{ status: WebsiteStatus }> = ({ status }) => {
  const styles: Record<WebsiteStatus, string> = {
    ONLINE: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    OFFLINE: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    INVALID: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    UNKNOWN: 'text-muted-foreground bg-secondary border-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export const WebsiteTypeBadge: React.FC<{ url: string | null | undefined }> = ({ url }) => {
  if (!url) return null;
  const clean = url.trim().toLowerCase();

  if (clean.includes('instagram.com')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
        Instagram
      </span>
    );
  }
  if (clean.includes('facebook.com') || clean.includes('fb.com')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20">
        Facebook
      </span>
    );
  }
  if (clean.includes('indiamart.com')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-600/25">
        IndiaMART
      </span>
    );
  }
  if (clean.includes('justdial.com')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
        Justdial
      </span>
    );
  }
  if (clean.includes('linkedin.com')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-600/10 text-sky-600 dark:text-sky-400 border border-sky-600/20">
        LinkedIn
      </span>
    );
  }
  if (clean.includes('twitter.com') || clean.includes('x.com')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-600/10 text-neutral-600 dark:text-neutral-400 border border-neutral-600/20">
        X / Twitter
      </span>
    );
  }
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        YouTube
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
      Website
    </span>
  );
};

