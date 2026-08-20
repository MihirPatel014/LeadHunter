import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Zap,
  BarChart2,
  Clock,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

// ─── Type ────────────────────────────────────────────────────────────────────

interface SerpApiStatus {
  accountStatus: string;
  planName: string;
  planId: string;
  planRenewalDate: string;
  searchesPerMonth: number;
  planSearchesLeft: number;
  extraCredits: number;
  totalSearchesLeft: number;
  thisMonthUsage: number;
  thisHourSearches: number;
  lastHourSearches: number;
  accountRateLimitPerHour: number;
}

// ─── API fetch ────────────────────────────────────────────────────────────────

async function fetchSerpApiStatus(): Promise<SerpApiStatus> {
  const res = await fetch('/api/integrations/serpapi/status');
  const json = await res.json() as { success: boolean; data: SerpApiStatus; error?: string };
  if (!json.success) throw new Error(json.error ?? 'Failed to load SerpAPI status');
  return json.data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 ${
        accent
          ? 'border-indigo-500/30 bg-indigo-500/10'
          : 'border-border/50 bg-card/60'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          accent ? 'bg-indigo-500/20 text-indigo-400' : 'bg-secondary/60 text-muted-foreground'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tabular-nums ${accent ? 'text-indigo-300' : 'text-foreground'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Monthly Usage</span>
        <span className="font-medium text-foreground">
          {used} / {total} searches
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-right text-xs text-muted-foreground">{pct}% used</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<SerpApiStatus, Error>({
    queryKey: ['serpapi-status'],
    queryFn: fetchSerpApiStatus,
    staleTime: 60_000, // cache 1 min
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 max-w-3xl"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your integrations, API usage, and preferences.
        </p>
      </div>

      {/* SerpAPI card */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">SerpAPI Integration</h2>
              <p className="text-xs text-muted-foreground">Lead discovery via Google Local</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://serpapi.com/manage-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              SerpAPI Dashboard
            </a>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-secondary/40" />
              ))}
            </div>
            <div className="h-8 rounded-lg bg-secondary/40" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300">Could not reach SerpAPI</p>
              <p className="mt-0.5 text-xs text-red-400/80">{error?.message}</p>
            </div>
          </div>
        )}

        {/* Status card */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-6"
          >
            {/* Account status badge */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {data.accountStatus === 'Active' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-sm font-medium text-foreground">{data.planName}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    data.accountStatus === 'Active'
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {data.accountStatus}
                </span>
              </div>
              <a
                href="https://serpapi.com/plan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Upgrade plan <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>

            {/* Usage progress bar */}
            <UsageBar
              used={data.thisMonthUsage}
              total={data.searchesPerMonth}
            />

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Searches Left"
                value={data.totalSearchesLeft.toLocaleString()}
                icon={Search}
                accent
              />
              <StatCard
                label="Monthly Quota"
                value={data.searchesPerMonth.toLocaleString()}
                icon={BarChart2}
              />
              <StatCard
                label="This Hour"
                value={data.thisHourSearches}
                icon={Zap}
              />
              <StatCard
                label="Renewal Date"
                value={data.planRenewalDate}
                icon={Calendar}
              />
            </div>

            {/* Rate limit info */}
            <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/30 px-4 py-2.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Rate limit: <span className="text-foreground font-medium">{data.accountRateLimitPerHour} searches / hour</span>
              {data.extraCredits > 0 && (
                <>
                  &nbsp;·&nbsp; Extra credits: <span className="text-indigo-400 font-medium">{data.extraCredits}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </section>

      {/* API Docs shortcut */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ExternalLink className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">API Documentation</h2>
            <p className="text-xs text-muted-foreground">Interactive ReDoc reference for all backend endpoints</p>
          </div>
        </div>
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 px-5 py-4 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
        >
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-indigo-300 transition-colors">
              Open ReDoc API Reference
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">http://localhost:5000/api-docs</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
        </a>
      </section>
    </motion.div>
  );
};
