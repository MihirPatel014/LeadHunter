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
  ExternalLink,
  Phone,
  Star,
  Globe,
  Code,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { discoveryService, DiscoverySummary, DiscoveryItem } from '../services/discoveryService';
import { useBrowserNotifications } from '../hooks/useBrowserNotifications';

const SUGGESTED_CATEGORIES = [
  'salon', 'saree shop', 'restaurant', 'gym', 'dental clinic', 'hotel', 'pharmacy',
  'spa', 'bakery', 'tutoring center', 'car wash', 'real estate', 'photography',
];

export const DiscoveryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { permission, requestPermission, sendNotification } = useBrowserNotifications();

  const [city, setCity] = useState('Surat');
  const [category, setCategory] = useState('saree shop');
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState<DiscoverySummary | null>(null);

  // Inspector & Filter state
  const [rawInspectorId, setRawInspectorId] = useState<number | null>(null);
  const [itemFilter, setItemFilter] = useState<'ALL' | 'HAS_WEBSITE' | 'NO_WEBSITE' | 'HAS_PHONE'>('ALL');

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
        `Discovery complete! ${data.newLeads} new leads saved, ${data.duplicates} duplicates skipped.`,
        { duration: 5000 }
      );

      // Browser push notification
      await sendNotification('LeadHunter AI – Discovery Complete', {
        body: `Found ${data.discovered} businesses in ${city}. ${data.newLeads} new leads saved.`,
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
    const res = await requestPermission();
    if (res === 'granted') {
      toast.success('Browser notifications enabled!');
    } else if (res === 'denied') {
      toast.error('Notifications blocked in browser settings.');
    }
  };

  const filteredItems = (result?.items || []).filter((item) => {
    if (itemFilter === 'HAS_WEBSITE') return !!item.website;
    if (itemFilter === 'NO_WEBSITE') return !item.website;
    if (itemFilter === 'HAS_PHONE') return !!item.phone;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <Toaster position="top-right" theme="system" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            SerpAPI Lead Discovery
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Query SerpAPI Google Local results, inspect raw response fields, and save deduplicated leads to your pipeline.
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
          disabled={permission === 'granted'}
        >
          {permission === 'granted' ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          {permission === 'granted' ? 'Notifications On' : 'Enable Notifications'}
        </button>
      </div>

      {/* Search Parameters Form */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-foreground font-display">Search Parameters</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="e.g. saree shop, salon, restaurant"
                disabled={mutation.isPending}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick Pick Category Chips */}
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

          {/* Results Count Slider */}
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

          <button
            type="submit"
            disabled={mutation.isPending || !city.trim() || !category.trim()}
            className="w-full py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Querying SerpAPI Google Local engine...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Discover & Fetch SerpAPI Data
              </>
            )}
          </button>
        </form>
      </div>

      {/* Discovery Summary Header */}
      {result && !mutation.isPending && (
        <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground font-display">
                SerpAPI Response Received
              </h3>
            </div>
            <Link
              to="/leads"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-sm"
            >
              View in Leads Table <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-card border border-border text-center space-y-1">
              <p className="text-2xl font-bold text-foreground font-display">{result.discovered}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Discovered</p>
            </div>
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">{result.newLeads}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">New Saved</p>
            </div>
            <div className="p-3.5 rounded-lg bg-card border border-border text-center space-y-1">
              <p className="text-2xl font-bold text-muted-foreground font-display">{result.duplicates}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Duplicates</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Discovered Results & Raw Field Inspector Table */}
      {result && result.items && result.items.length > 0 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground font-display flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Discovered SerpAPI Payload Items ({result.items.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspect extracted fields and raw JSON returned by SerpAPI for each business.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(['ALL', 'HAS_WEBSITE', 'NO_WEBSITE', 'HAS_PHONE'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setItemFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    itemFilter === filter
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Google Maps</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Raw JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {item.businessName}
                        {item.address && <p className="text-[11px] text-muted-foreground font-normal">{item.address}</p>}
                      </td>
                      <td className="py-3 px-4">
                        {item.website ? (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                          >
                            <Globe className="w-3 h-3" /> Website
                          </a>
                        ) : (
                          <span className="text-amber-500 font-medium text-[11px]">No Website</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.mapsUrl ? (
                          <a
                            href={item.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-[11px]"
                          >
                            <MapPin className="w-3 h-3" /> Maps Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {item.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {item.rating ? (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-500" /> {item.rating} ({item.reviewCount || 0})
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setRawInspectorId(rawInspectorId === idx ? null : idx)}
                          className="px-2.5 py-1 rounded border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-mono inline-flex items-center gap-1 transition-colors"
                        >
                          <Code className="w-3 h-3" /> {rawInspectorId === idx ? 'Close JSON' : 'Inspect'}
                        </button>
                      </td>
                    </tr>

                    {/* Raw JSON Inspector Dropdown */}
                    {rawInspectorId === idx && (
                      <tr className="bg-muted/30">
                        <td colSpan={7} className="p-4 border-b border-border">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono font-semibold text-foreground">
                              <span>Raw SerpAPI Response Payload for "{item.businessName}"</span>
                              <button
                                onClick={() => setRawInspectorId(null)}
                                className="text-muted-foreground hover:text-foreground text-[11px]"
                              >
                                ✕ Close
                              </button>
                            </div>
                            <pre className="p-3 rounded-md bg-background border border-border font-mono text-[11px] text-foreground overflow-x-auto max-h-60">
                              {JSON.stringify(item.raw || item, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
