import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock,
  Play,
  FastForward,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Settings2,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  Sparkles,
  User,
  Building2,
  Mail,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { followUpService } from '../services/followUpService';
import { FollowUpSchedule, FollowUpStatus, FollowUpProcessResult } from '../types/followUp';

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  QUEUED_FOR_APPROVAL: { label: 'In Approval Queue', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  SKIPPED: { label: 'Skipped', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  CANCELLED: { label: 'Auto-Stopped', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
};

const PRESET_INTERVALS = [
  { label: 'Standard', value: '1,3,7,10', desc: 'Day 1 → Day 3 → Day 7 → Day 10' },
  { label: 'Aggressive', value: '1,2,4,7', desc: 'Day 1 → Day 2 → Day 4 → Day 7' },
  { label: 'Gentle', value: '2,5,10,14', desc: 'Day 2 → Day 5 → Day 10 → Day 14' },
];

export const FollowUpsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [intervalsInput, setIntervalsInput] = useState('');
  const [skippingScheduleId, setSkippingScheduleId] = useState<number | null>(null);

  // Queries
  const { data: schedules = [], isLoading, refetch } = useQuery({
    queryKey: ['follow-ups', { statusFilter }],
    queryFn: () =>
      followUpService.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['follow-up-config'],
    queryFn: async () => {
      const cfg = await followUpService.getConfig();
      setIntervalsInput(cfg.intervals);
      return cfg;
    },
  });

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: (intervals: string) => followUpService.updateConfig(intervals),
    onSuccess: (newConfig) => {
      toast.success('Follow-up sequence configuration updated');
      queryClient.invalidateQueries({ queryKey: ['follow-up-config'] });
      setIsEditingConfig(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update configuration');
    },
  });

  const skipMutation = useMutation({
    mutationFn: (id: number) => followUpService.skip(id),
    onMutate: (id) => setSkippingScheduleId(id),
    onSuccess: () => {
      setSkippingScheduleId(null);
      toast.success('Follow-up step skipped and next interval scheduled');
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
    onError: (err: any) => {
      setSkippingScheduleId(null);
      toast.error(err.message || 'Failed to skip follow-up');
    },
  });

  const processDueMutation = useMutation({
    mutationFn: () => followUpService.processDueNow(),
    onSuccess: (result: FollowUpProcessResult) => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      if (result.processed === 0) {
        toast.info('No follow-ups are due for processing right now.');
      } else {
        toast.success(
          `Processed ${result.processed} due follow-ups: ${result.queuedForApproval} queued for approval, ${result.stopped} stopped.`
        );
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to process due follow-ups');
    },
  });

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const leadName = s.lead?.businessName?.toLowerCase() || '';
    const city = s.lead?.city?.toLowerCase() || '';
    const email = s.lead?.email?.toLowerCase() || '';
    return leadName.includes(q) || city.includes(q) || email.includes(q);
  });

  // Calculate quick stats
  const totalSchedules = schedules.length;
  const now = new Date();
  const dueCount = schedules.filter(
    (s) => s.status === 'SCHEDULED' && new Date(s.scheduledAt) <= now
  ).length;
  const upcomingCount = schedules.filter(
    (s) => s.status === 'SCHEDULED' && new Date(s.scheduledAt) > now
  ).length;
  const queuedCount = schedules.filter((s) => s.status === 'QUEUED_FOR_APPROVAL').length;
  const stoppedCount = schedules.filter(
    (s) => s.status === 'CANCELLED' || s.status === 'SKIPPED'
  ).length;

  const currentIntervals = (config?.intervals || '1,3,7,10').split(',').map((p) => p.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      <Toaster position="top-right" theme="system" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Follow-Up Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated follow-up sequences with intelligent business stop rules. Due messages fan out to Human Approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh follow-ups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => processDueMutation.mutate()}
            disabled={processDueMutation.isPending}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Immediately evaluate and queue due follow-ups"
          >
            {processDueMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Process Due Now
          </button>
        </div>
      </div>

      {/* Sequence Configuration & Rule Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sequence Config Card */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-primary" />
              Follow-Up Interval Sequence
            </h3>
            <button
              onClick={() => setIsEditingConfig(!isEditingConfig)}
              className="text-xs text-primary hover:underline font-medium"
            >
              {isEditingConfig ? 'Cancel' : 'Edit Sequence'}
            </button>
          </div>

          {!isEditingConfig ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {currentIntervals.map((days, idx) => (
                <React.Fragment key={idx}>
                  <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-foreground">Day {days}</span>
                  </div>
                  {idx < currentIntervals.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1,3,7,10"
                  value={intervalsInput}
                  onChange={(e) => setIntervalsInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => updateConfigMutation.mutate(intervalsInput)}
                  disabled={updateConfigMutation.isPending}
                  className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Save Sequence
                </button>
              </div>

              {/* Preset quick buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_INTERVALS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setIntervalsInput(preset.value)}
                    className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <strong>{preset.label}</strong> ({preset.value})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Safety Guardrails Card */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Automatic Stop Rules
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Follow-up sequences automatically halt if a lead enters any of these terminal states:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ Replied
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              ✓ Interested
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              ✓ Converted
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
              ✓ Disqualified
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Due for Approval</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{dueCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Upcoming Scheduled</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{upcomingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">In Approval Queue</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{queuedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Auto-Stopped / Skipped</p>
            <p className="text-2xl font-bold text-zinc-400 mt-1">{stoppedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400">
            <FastForward className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search lead name, city, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SCHEDULED', 'QUEUED_FOR_APPROVAL', 'SKIPPED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {status === 'ALL'
                ? 'All Statuses'
                : status === 'QUEUED_FOR_APPROVAL'
                ? 'In Queue'
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-Ups List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse space-y-3">
              <div className="h-4 bg-secondary rounded w-1/4"></div>
              <div className="h-4 bg-secondary rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No follow-ups found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No follow-up records match your search or filter settings.'
              : 'Follow-ups are automatically scheduled when initial campaign outreach is dispatched, or can be scheduled manually.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedules.map((schedule) => {
            const statusStyle = STATUS_CONFIG[schedule.status] || STATUS_CONFIG.SCHEDULED;
            const scheduledDate = new Date(schedule.scheduledAt);
            const isPastDue = schedule.status === 'SCHEDULED' && scheduledDate <= now;
            const isSkipping = skippingScheduleId === schedule.id;

            return (
              <div
                key={schedule.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-all shadow-sm"
              >
                {/* Left: Lead details and sequence progress */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.label}
                    </span>

                    {/* Step pill */}
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-secondary text-foreground border border-border">
                      Step {schedule.step} of {currentIntervals.length}
                    </span>

                    {isPastDue && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        Ready to Process
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      <Link to={`/leads/${schedule.leadId}`}>
                        {schedule.lead?.businessName || `Lead #${schedule.leadId}`}
                      </Link>
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {schedule.lead?.city && <span>📍 {schedule.lead.city}</span>}
                      {schedule.lead?.email && <span>✉️ {schedule.lead.email}</span>}
                      {schedule.lead?.status && (
                        <span>
                          Status: <strong className="text-foreground">{schedule.lead.status}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {schedule.notes && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Note: {schedule.notes}
                    </p>
                  )}
                </div>

                {/* Right: Scheduled time & actions */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                  <div className="text-right text-xs">
                    <p className="text-muted-foreground">Scheduled For:</p>
                    <p className="font-semibold text-foreground">
                      {scheduledDate.toLocaleDateString()} {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {schedule.status === 'SCHEDULED' && (
                      <button
                        onClick={() => skipMutation.mutate(schedule.id)}
                        disabled={isSkipping}
                        className="px-2.5 py-1 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Skip this follow-up step and advance sequence"
                      >
                        {isSkipping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FastForward className="w-3.5 h-3.5" />
                        )}
                        Skip Step
                      </button>
                    )}

                    {schedule.status === 'QUEUED_FOR_APPROVAL' && (
                      <Link
                        to="/approvals"
                        className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        View in Queue <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
