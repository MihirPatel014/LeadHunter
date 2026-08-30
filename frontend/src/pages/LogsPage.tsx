import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Terminal,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Trash2,
  Download,
  Search,
  Server,
  Laptop,
  CheckCircle2,
  Sparkles,
  Filter,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { logService, LogEntry, LogLevel, LogSource } from '../services/logService';

const CATEGORIES = [
  'ALL',
  'API',
  'OUTREACH',
  'WEBHOOK',
  'WHATSAPP',
  'GMAIL',
  'AI',
  'SYSTEM',
  'CLIENT',
  'DATABASE',
];

export const LogsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & State
  const [sourceFilter, setSourceFilter] = useState<LogSource | ''>('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [copied, setCopied] = useState(false);

  // Queries
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['logs', { source: sourceFilter, level: levelFilter, category: categoryFilter, search }],
    queryFn: () =>
      logService.getLogs({
        source: sourceFilter || undefined,
        level: levelFilter || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: search || undefined,
        limit: 200,
      }),
    refetchInterval: autoRefresh ? 3000 : false,
  });

  const logs = data?.logs || [];
  const counts = data?.counts || { total: 0, errors: 0, warnings: 0, backend: 0, frontend: 0 };

  // Mutations
  const clearMutation = useMutation({
    mutationFn: () => logService.clearLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      toast.success('Log buffer cleared successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to clear logs');
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () => logService.simulateLog(),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      toast.success(`Generated ${created.length} simulated test logs!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate test logs');
    },
  });

  const handleExportJson = () => {
    if (logs.length === 0) {
      toast.info('No logs to export');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `leadhunter_logs_${new Date().toISOString().slice(0, 19)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${logs.length} log records to JSON`);
  };

  const handleCopyMeta = (meta: any) => {
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Log metadata copied to clipboard');
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> ERROR
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case 'INFO':
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
      case 'DEBUG':
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-secondary text-muted-foreground border border-border inline-flex items-center gap-1">
            DEBUG
          </span>
        );
    }
  };

  const getSourceBadge = (source: LogSource) => {
    if (source === 'BACKEND') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 inline-flex items-center gap-1">
          <Server className="w-3 h-3" /> BACKEND
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 inline-flex items-center gap-1">
        <Laptop className="w-3 h-3" /> FRONTEND
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">System Logs</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time diagnostics and event tracing across Express backend and React frontend
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Live Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
            title={autoRefresh ? 'Live refresh active (3s)' : 'Live refresh paused'}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
            {autoRefresh ? 'Auto-Refresh (3s)' : 'Paused'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Simulate Log */}
          <button
            onClick={() => simulateMutation.mutate()}
            disabled={simulateMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulate Logs
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          {/* Clear Buffer */}
          <button
            onClick={() => {
              if (window.confirm('Clear the in-memory log stream?')) {
                clearMutation.mutate();
              }
            }}
            disabled={clearMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Buffered Logs</p>
            <p className="text-2xl font-bold text-foreground mt-1">{counts.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Terminal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Errors Logged</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{counts.errors}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Warnings</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{counts.warnings}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Backend / Frontend</p>
            <p className="text-xl font-bold text-foreground mt-1">
              <span className="text-purple-400">{counts.backend}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-cyan-400">{counts.frontend}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs by message, category, metadata, URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Sources</option>
              <option value="BACKEND">Backend</option>
              <option value="FRONTEND">Frontend</option>
            </select>

            {/* Level */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Levels</option>
              <option value="ERROR">Errors Only</option>
              <option value="WARN">Warnings Only</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Clear Filter button if active */}
            {(sourceFilter || levelFilter || categoryFilter !== 'ALL' || search) && (
              <button
                onClick={() => {
                  setSourceFilter('');
                  setLevelFilter('');
                  setCategoryFilter('ALL');
                  setSearch('');
                }}
                className="px-2.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground hover:text-foreground border border-border transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs Table / Stream View */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-secondary/30 border-b border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>
            Displaying {logs.length} log events {search && `matching "${search}"`}
          </span>
          <span className="font-mono text-[11px]">Buffer capacity: 1,000</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Streaming logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Terminal className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">No logs found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || sourceFilter || levelFilter || categoryFilter !== 'ALL'
                ? 'No log records matched your active filter criteria. Try broadening your filters.'
                : 'No logs buffered yet. Perform actions across the application or click "Simulate Logs" to test.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 overflow-x-auto font-mono">
            {logs.map((log) => {
              const logDate = new Date(log.timestamp);
              const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateStr = logDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="px-4 py-2.5 flex items-start gap-3 hover:bg-accent/40 cursor-pointer transition-colors text-xs select-text group"
                >
                  {/* Timestamp */}
                  <div className="text-[11px] text-muted-foreground shrink-0 pt-0.5 min-w-[110px]">
                    <span className="text-muted-foreground/80 mr-1">{dateStr}</span>
                    <span className="font-semibold text-foreground/80">{timeStr}</span>
                  </div>

                  {/* Level Badge */}
                  <div className="shrink-0 pt-0.5">{getLevelBadge(log.level)}</div>

                  {/* Source Badge */}
                  <div className="shrink-0 pt-0.5 hidden sm:block">{getSourceBadge(log.source)}</div>

                  {/* Category Pill */}
                  <div className="shrink-0 pt-0.5">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-secondary text-muted-foreground border border-border uppercase">
                      {log.category}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0 text-foreground font-sans text-xs pt-0.5 truncate leading-relaxed">
                    <span
                      className={
                        log.level === 'ERROR'
                          ? 'text-red-400 font-medium'
                          : log.level === 'WARN'
                          ? 'text-amber-300'
                          : 'text-foreground'
                      }
                    >
                      {log.message}
                    </span>
                  </div>

                  {/* Meta indicator button */}
                  {log.meta && (
                    <div className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-0.5 rounded bg-secondary text-[10px] text-primary border border-border flex items-center gap-1 font-sans">
                        <Eye className="w-3 h-3" /> Meta
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground font-display">Log Event Details</h3>
                  {getLevelBadge(selectedLog.level)}
                  {getSourceBadge(selectedLog.source)}
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
                {/* Message */}
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Log Message</p>
                  <div className="p-3 bg-secondary/40 border border-border rounded-lg text-sm text-foreground font-mono leading-relaxed select-text">
                    {selectedLog.message}
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-secondary/20 border border-border/60 rounded-lg">
                    <p className="text-muted-foreground text-[10px]">TIMESTAMP</p>
                    <p className="font-mono text-foreground mt-0.5">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-secondary/20 border border-border/60 rounded-lg">
                    <p className="text-muted-foreground text-[10px]">CATEGORY</p>
                    <p className="font-semibold text-foreground mt-0.5 uppercase">{selectedLog.category}</p>
                  </div>
                </div>

                {/* Structured Metadata / Stack */}
                {selectedLog.meta && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                        Structured Metadata (JSON)
                      </p>
                      <button
                        onClick={() => handleCopyMeta(selectedLog.meta)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="p-3 bg-secondary/50 border border-border rounded-lg font-mono text-[11px] text-foreground/90 overflow-x-auto max-h-60 select-text leading-relaxed">
                      {JSON.stringify(selectedLog.meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-border bg-secondary/20 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
