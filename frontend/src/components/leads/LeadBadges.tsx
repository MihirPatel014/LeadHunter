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
