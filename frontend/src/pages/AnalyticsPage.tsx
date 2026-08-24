import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  BarChart2,
  Users,
  Send,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Zap,
  Target,
  Building2,
  Flame,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { analyticsService } from '../services/analyticsService';

const PIPELINE_COLORS: Record<string, string> = {
  NEW: '#6366f1',
  RESEARCHED: '#8b5cf6',
  QUALIFIED: '#ec4899',
  PENDING_APPROVAL: '#f59e0b',
  CONTACTED: '#3b82f6',
  REPLIED: '#10b981',
  INTERESTED: '#14b8a6',
  CONVERTED: '#22c55e',
};

const TEMP_COLORS: Record<string, string> = {
  HOT: '#ef4444',
  WARM: '#f59e0b',
  LOW: '#64748b',
};

const SOURCE_COLORS: Record<string, string> = {
  SERPAPI: '#6366f1',
  MANUAL: '#10b981',
};

export const AnalyticsPage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('30d');

  // Queries
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview(),
  });

  const { data: pipeline = [] } = useQuery({
    queryKey: ['analytics-pipeline'],
    queryFn: () => analyticsService.getPipeline(),
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['analytics-cities'],
    queryFn: () => analyticsService.getTopCities(8),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['analytics-categories'],
    queryFn: () => analyticsService.getTopCategories(8),
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['analytics-sources'],
    queryFn: () => analyticsService.getLeadSourceBreakdown(),
  });

  const { data: temperatures = [] } = useQuery({
    queryKey: ['analytics-temperatures'],
    queryFn: () => analyticsService.getLeadTemperatureDistribution(),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['analytics-campaigns'],
    queryFn: () => analyticsService.getCampaignPerformance(),
  });

  const handleRefresh = () => {
    refetchOverview();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-16"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Analytics & Conversion Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track lead progression, campaign conversion rates, response rates, and regional lead concentration.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2.5 py-1.5 bg-card border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Leads</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{overview?.leads.total ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{overview?.leads.new ?? 0}</span> new uncontacted
          </p>
        </div>

        {/* Contacted */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Outreach Sent</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{overview?.outreach.totalSent ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">
            <span className="text-amber-400 font-semibold">{overview?.outreach.pendingApprovals ?? 0}</span> pending approval
          </p>
        </div>

        {/* Response Rate */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Response Rate</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {overview?.rates.responseRate ?? 0}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{overview?.leads.replied ?? 0}</span> lead replies
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary font-mono">
            {overview?.rates.conversionRate ?? 0}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            <span className="text-primary font-semibold">{overview?.leads.converted ?? 0}</span> converted clients
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Lead Funnel Pipeline Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Lead Lifecycle & Conversion Pipeline
              </h3>
              <p className="text-xs text-muted-foreground">Distribution of leads across each funnel stage</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#888' }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipeline.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIPELINE_COLORS[entry.status] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Lead Temperature & Source Donuts */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-amber-400" />
              Lead Temperature Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Scored lead qualification levels</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={temperatures}
                    dataKey="count"
                    nameKey="temperature"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {temperatures.map((entry, i) => (
                      <Cell key={`temp-${i}`} fill={TEMP_COLORS[entry.temperature] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h4 className="text-xs font-semibold text-foreground mb-2">Discovery Source</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {sources.map((s) => (
                <div key={s.source} className="flex items-center justify-between p-2 rounded bg-secondary/40 border border-border/40">
                  <span className="text-muted-foreground">{s.source}</span>
                  <span className="font-bold text-foreground font-mono">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities Horizontal Chart */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Top Cities by Lead Density
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={cities} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis dataKey="city" type="category" tick={{ fontSize: 11, fill: '#ccc' }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Performance Summary */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Campaign Outbound Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-medium">Campaign</th>
                  <th className="pb-2 font-medium">Channel</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Messages Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No active campaigns found. Create a campaign to start tracking performance!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 font-medium text-foreground">{c.name}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground uppercase font-mono">
                          {c.channel}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-foreground">
                        {c.messagesSent}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
