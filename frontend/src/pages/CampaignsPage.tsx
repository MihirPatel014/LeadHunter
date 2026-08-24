import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Send,
  Plus,
  Play,
  Edit2,
  Trash2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Layers,
  MapPin,
  Tag,
  Gauge,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { campaignService } from '../services/campaignService';
import { templateService } from '../services/templateService';
import { Campaign, CampaignStatus, CampaignRunResult } from '../types/campaign';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  ACTIVE: { label: 'Active', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  PAUSED: { label: 'Paused', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  COMPLETED: { label: 'Completed', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

export const CampaignsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [runningCampaignId, setRunningCampaignId] = useState<number | null>(null);
  const [runResultModal, setRunResultModal] = useState<{ campaign: Campaign; result: CampaignRunResult } | null>(null);

  // Queries
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['campaigns', { statusFilter }],
    queryFn: () =>
      campaignService.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates(),
  });

  // Map of template ID to Template name
  const templateMap = React.useMemo(() => {
    const map = new Map<number, string>();
    templates.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [templates]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignService.delete(id),
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeletingCampaign(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete campaign');
    },
  });

  const runMutation = useMutation({
    mutationFn: (campaign: Campaign) => campaignService.run(campaign.id),
    onMutate: (campaign) => {
      setRunningCampaignId(campaign.id);
    },
    onSuccess: (result, campaign) => {
      setRunningCampaignId(null);
      setRunResultModal({ campaign, result });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(`Run completed: ${result.enqueued} approvals enqueued!`);
    },
    onError: (err: any) => {
      setRunningCampaignId(null);
      toast.error(err.message || 'Failed to run campaign');
    },
  });

  // Filtered campaigns by search
  const filteredCampaigns = campaigns.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  });

  // Stat counts
  const totalCampaigns = campaigns.length;
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const draftCount = campaigns.filter((c) => c.status === 'DRAFT').length;
  const totalDailyLimit = campaigns
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + (c.dailyLimit || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <Toaster position="top-right" theme="system" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <Send className="w-6 h-6 text-primary" />
            Outreach Campaigns
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure automated batch campaigns that match target leads and queue personalized messages for human approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh campaigns"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/campaigns/new"
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Campaigns</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalCampaigns}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Play className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold text-zinc-400 mt-1">{draftCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Active Daily Capacity</p>
            <p className="text-2xl font-bold text-primary mt-1">{totalDailyLimit} <span className="text-xs font-normal text-muted-foreground">/ day</span></p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns, city, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {status === 'ALL' ? 'All Statuses' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-secondary rounded w-1/3"></div>
                <div className="h-5 bg-secondary rounded w-16"></div>
              </div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
              <div className="h-8 bg-secondary rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No campaigns found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No campaigns match your current filters. Try changing your search query or status filter.'
              : 'Create your first outreach campaign to start batch-matching leads and queuing personalized messages for review.'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <Link
              to="/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => {
            const statusStyle = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
            const templateName = templateMap.get(campaign.templateId) || `Template #${campaign.templateId}`;
            const isRunning = runningCampaignId === campaign.id;

            return (
              <div
                key={campaign.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-border/80 transition-all shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                        <Link to={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
                      </h3>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Criteria & Details */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Tag className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span className="truncate">
                        Category: <strong className="text-foreground">{campaign.category || 'All'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span className="truncate">
                        City: <strong className="text-foreground">{campaign.city || 'All'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {campaign.channel === 'EMAIL' ? (
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="truncate">
                        Channel: <strong className="text-foreground">{campaign.channel}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        Limit: <strong className="text-foreground">{campaign.dailyLimit} / run</strong>
                      </span>
                    </div>
                  </div>

                  {/* Linked Template */}
                  <div className="pt-1">
                    <div className="bg-secondary/40 border border-border/50 rounded-md px-3 py-1.5 text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">Linked Template:</span>
                      <span className="font-medium text-foreground truncate max-w-[200px]" title={templateName}>
                        {templateName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runMutation.mutate(campaign)}
                      disabled={isRunning}
                      className="px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Run campaign to populate approval queue"
                    >
                      {isRunning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {isRunning ? 'Processing...' : 'Run Campaign'}
                    </button>
                    <Link
                      to="/approvals"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                    >
                      View Approvals →
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeletingCampaign(campaign)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCampaign && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Delete Campaign</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-foreground/80">
                Are you sure you want to delete campaign{' '}
                <strong className="text-foreground">"{deletingCampaign.name}"</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeletingCampaign(null)}
                  className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingCampaign.id)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1.5 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Campaign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Run Result Modal */}
      <AnimatePresence>
        {runResultModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Campaign Run Completed</h3>
                  <p className="text-xs text-muted-foreground">{runResultModal.campaign.name}</p>
                </div>
              </div>

              <div className="bg-secondary/40 border border-border rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-foreground font-semibold">
                  <span>Enqueued for Approval:</span>
                  <span className="text-emerald-400 text-sm font-bold">
                    {runResultModal.result.enqueued}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Skipped Leads:</span>
                  <span className="text-amber-400 font-medium">
                    {runResultModal.result.skipped}
                  </span>
                </div>

                {runResultModal.result.skipped > 0 && (
                  <div className="pt-2 border-t border-border/50 space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>• Already in Approval Queue:</span>
                      <span>{runResultModal.result.reasons.alreadyQueued}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Missing Email Address:</span>
                      <span>{runResultModal.result.reasons.noEmail}</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                All messages have been rendered and placed into the Human Approval Queue. No emails have been sent yet.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRunResultModal(null)}
                  className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors"
                >
                  Close
                </button>
                <Link
                  to="/approvals"
                  onClick={() => setRunResultModal(null)}
                  className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  Go to Approvals Queue →
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
