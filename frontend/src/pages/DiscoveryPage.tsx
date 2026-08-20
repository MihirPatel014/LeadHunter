import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Search,
  MapPin,
  Tag,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bell,
  BellOff,
  Sparkles,
  Copy,
  ArrowRight,
} from 'lucide-react';

import { discoveryService, DiscoverySummary } from '../services/discoveryService';
import { useBrowserNotifications } from '../hooks/useBrowserNotifications';
import { Link } from 'react-router-dom';

const SUGGESTED_CATEGORIES = [
  'salon', 'restaurant', 'gym', 'dental clinic', 'hotel', 'pharmacy',
  'spa', 'bakery', 'tutoring center', 'car wash', 'real estate', 'photography',
];

export const DiscoveryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { permission, requestPermission, sendNotification } = useBrowserNotifications();

  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(50);
  const [result, setResult] = useState<DiscoverySummary | null>(null);

  const mutation = useMutation({
    mutationFn: () => discoveryService.search({ city: city.trim(), category: category.trim(), limit }),
    onMutate: () => {
      toast.loading(`Searching for ${category} leads in ${city}...`, { id: 'discovery' });
    },
    onSuccess: async (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      toast.dismiss('discovery');
      toast.success(
        `Discovery complete! ${data.newLeads} new leads found.`,
        { duration: 5000 }
      );

      // Browser push notification
      await sendNotification('LeadHunter AI – Discovery Complete', {
        body: `Found ${data.discovered} businesses in ${city}. ${data.newLeads} new leads saved, ${data.duplicates} duplicates skipped.`,
        tag: 'lead-discovery',
      });
    },
    onError: (err: any) => {
      toast.dismiss('discovery');
      toast.error(err.message || 'Discovery failed. Check your SerpAPI key.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !category.trim()) {
      toast.error('Please enter both a city and a business category.');
      return;
    }
    setResult(null);
    mutation.mutate();
  };

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast.success('Browser notifications enabled!');
    } else if (result === 'denied') {
      toast.error('Notifications blocked. Please enable them in your browser settings.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <Toaster position="top-right" theme="system" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Lead Discovery
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search for local businesses by city and category using SerpAPI. New leads are automatically saved and deduplicated.
          </p>
        </div>

        {/* Notification Toggle */}
        <button
          type="button"
          onClick={handleEnableNotifications}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors shrink-0 ${
            permission === 'granted'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 cursor-default'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          disabled={permission === 'granted' || permission === 'denied'}
          title={
            permission === 'denied'
              ? 'Notifications blocked in browser settings'
              : permission === 'granted'
              ? 'Browser notifications enabled'
              : 'Enable browser notifications'
          }
        >
          {permission === 'granted' ? (
            <Bell className="w-3.5 h-3.5" />
          ) : (
            <BellOff className="w-3.5 h-3.5" />
          )}
          {permission === 'granted' ? 'Notifications On' : 'Enable Notifications'}
        </button>
      </div>

      {/* Search Form Card */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-foreground font-display">Search Parameters</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* City + Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Surat, Mumbai, London"
                disabled={mutation.isPending}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" /> Business Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. salon, restaurant, gym"
                disabled={mutation.isPending}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* Suggested Categories */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">Quick pick category:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={mutation.isPending}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors capitalize ${
                    category === cat
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Results */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-primary" /> Number of Results (max 100)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={mutation.isPending}
                className="flex-1 accent-primary h-1.5 rounded cursor-pointer disabled:opacity-50"
              />
              <span className="w-10 text-center font-mono font-semibold text-sm text-foreground">{limit}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending || !city.trim() || !category.trim()}
            className="w-full py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching SerpAPI — this may take a few seconds...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Discover Leads
              </>
            )}
          </button>
        </form>
      </div>

      {/* Progress Indicator during search */}
      <AnimatePresence>
        {mutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="p-5 rounded-xl border border-border bg-card space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-border"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Discovery in progress</p>
                <p className="text-xs text-muted-foreground">
                  Querying SerpAPI for <span className="font-medium text-foreground">{category}</span> businesses in{' '}
                  <span className="font-medium text-foreground">{city}</span>...
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {['Querying SerpAPI...', 'Normalizing results...', 'Checking for duplicates...', 'Saving new leads...'].map(
                (step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ animationDelay: `${i * 0.3}s` }} />
                    {step}
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <AnimatePresence>
        {result && !mutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-5"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground font-display">Discovery Complete</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border text-center space-y-1">
                <p className="text-2xl font-bold text-foreground font-display">{result.discovered}</p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Discovered</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">{result.newLeads}</p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">New Leads</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border text-center space-y-1">
                <p className="text-2xl font-bold text-muted-foreground font-display">{result.duplicates}</p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Duplicates</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/leads"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                View All Leads <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-md border border-border bg-card text-foreground text-xs font-medium hover:bg-secondary transition-colors"
              >
                New Search
              </button>
            </div>

            {permission === 'granted' && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                A browser notification has been sent to your system tray.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not configured note */}
      {mutation.isError && (String((mutation.error as any)?.message)).includes('not configured') && (
        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-xs">
          <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> SerpAPI Key Not Configured
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Add your SerpAPI API key to <span className="font-mono bg-muted px-1 py-0.5 rounded">backend/.env</span>:
          </p>
          <div className="font-mono bg-muted text-foreground rounded-md px-3 py-2 text-[11px] flex items-center justify-between gap-2">
            <span>SERPAPI_API_KEY=your_key_here</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('SERPAPI_API_KEY=your_key_here');
                toast.success('Copied to clipboard!');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-muted-foreground">
            Get a free key at{' '}
            <a
              href="https://serpapi.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              serpapi.com
            </a>.
          </p>
        </div>
      )}
    </motion.div>
  );
};
