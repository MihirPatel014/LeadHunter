import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Eye,
  Clock,
  Send,
  AlertTriangle,
  RefreshCw,
  Mail,
  MessageSquare,
  Filter,
  X,
  Table as TableIcon,
  LayoutGrid,
  CheckSquare,
  Square,
  Search,
  Globe,
  MapPin,
  Tag,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { approvalService } from '../services/approvalService';
import { Approval, ApprovalStatus, UpdateApprovalPayload } from '../types/approval';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING_APPROVAL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Failed', value: 'FAILED' },
];

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; icon: React.ReactNode; className: string }> = {
  DRAFT: { label: 'Draft', icon: <Edit3 className="w-3 h-3" />, className: 'bg-muted/60 text-muted-foreground border-border/40' },
  PENDING_APPROVAL: { label: 'Pending', icon: <Clock className="w-3 h-3" />, className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  APPROVED: { label: 'Approved', icon: <CheckCircle2 className="w-3 h-3" />, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  REJECTED: { label: 'Rejected', icon: <XCircle className="w-3 h-3" />, className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  SENT: { label: 'Sent', icon: <Send className="w-3 h-3" />, className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  FAILED: { label: 'Failed', icon: <AlertTriangle className="w-3 h-3" />, className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const isWa = channel?.toUpperCase() === 'WHATSAPP';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
        isWa
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      }`}
    >
      {isWa ? <MessageSquare className="w-2.5 h-2.5" /> : <Mail className="w-2.5 h-2.5" />}
      {isWa ? 'WhatsApp' : 'Email'}
    </span>
  );
}

interface PreviewModalProps { approval: Approval; onClose: () => void; }
function PreviewModal({ approval, onClose }: PreviewModalProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Message Preview
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Approval #{approval.id} &bull; {approval.recipient}
              {approval.lead?.businessName && ` &bull; ${approval.lead.businessName}`}
            </p>
          </div>
          <button id="preview-close-btn" onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Lead Context Snapshot */}
          {approval.lead && (
            <div className="bg-secondary/30 rounded-lg p-3 border border-border/50 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-foreground">{approval.lead.businessName}</span>
                {approval.lead.category && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">
                    {approval.lead.category}
                  </span>
                )}
                {approval.lead.city && (
                  <span className="ml-2 text-muted-foreground">📍 {approval.lead.city}</span>
                )}
              </div>
              {approval.lead.website && (
                <a
                  href={approval.lead.website.startsWith('http') ? approval.lead.website : `https://${approval.lead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Globe className="w-3 h-3" />
                  {approval.lead.website}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">To Recipient</p>
            <p className="text-sm text-foreground font-mono">{approval.recipient}</p>
          </div>

          {approval.subject && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Subject Line</p>
              <p className="text-sm text-foreground font-semibold">{approval.subject}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Message Body</p>
            <div className="bg-background/80 rounded-lg p-4 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border/40 font-sans">
              {approval.body}
            </div>
          </div>

          {approval.reviewNote && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Rejection / Review Note</p>
              <p className="text-xs text-rose-400 italic bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {approval.reviewNote}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface EditDrawerProps { approval: Approval; onClose: () => void; onSaved: (u: Approval) => void; }
function EditDrawer({ approval, onClose, onSaved }: EditDrawerProps) {
  const [subject, setSubject] = useState(approval.subject ?? '');
  const [body, setBody] = useState(approval.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: UpdateApprovalPayload = {};
      if (subject !== (approval.subject ?? '')) payload.subject = subject;
      if (body !== approval.body) payload.body = body;
      const updated = await approvalService.update(approval.id, payload);
      onSaved(updated);
    } catch (err: any) { setError(err.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.18 }}
        className="bg-card border border-border rounded-xl w-full max-w-2xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Edit Outreach Message</h2>
            <p className="text-xs text-muted-foreground">Approval #{approval.id} &bull; {approval.recipient}</p>
          </div>
          <button id="edit-close-btn" onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject Line</label>
            <input id="edit-subject-input" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Email subject..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Body Content</label>
            <textarea id="edit-body-textarea" rows={10} value={body} onChange={(e) => setBody(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed font-sans"
              placeholder="Message body..." />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button id="edit-cancel-btn" onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg bg-muted hover:bg-accent text-foreground transition-colors">Cancel</button>
          <button id="edit-save-btn" onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface RejectModalProps { approval: Approval; onClose: () => void; onRejected: (u: Approval) => void; }
function RejectModal({ approval, onClose, onRejected }: RejectModalProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await approvalService.reject(approval.id, { note });
      onRejected(updated);
    } catch (err: any) { setError(err.message ?? 'Failed to reject'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Reject Outreach Draft</h2>
            <p className="text-xs text-muted-foreground">Approval #{approval.id} &bull; {approval.recipient}</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">Optionally explain why this message is being rejected.</p>
          <textarea id="reject-note-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Lead is already a customer, incorrect template variable..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none" />
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button id="reject-cancel-btn" onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg bg-muted hover:bg-accent text-foreground transition-colors">Cancel</button>
          <button id="reject-confirm-btn" onClick={handleReject} disabled={loading}
            className="px-4 py-2 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors disabled:opacity-50">
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<Approval | null>(null);
  const [editItem, setEditItem] = useState<Approval | null>(null);
  const [rejectItem, setRejectItem] = useState<Approval | null>(null);

  // View Mode: Table vs Cards
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Multi-select state for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'EMAIL' | 'WHATSAPP'>('ALL');
  const [websiteFilter, setWebsiteFilter] = useState<'ALL' | 'HAS_WEBSITE' | 'NO_WEBSITE'>('ALL');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await approvalService.list(activeTab || undefined);
      setApprovals(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  // Extract unique filter options from current list
  const uniqueTemplates = useMemo(() => {
    const list: { id: number; name: string }[] = [];
    const seen = new Set<number>();
    approvals.forEach((a) => {
      if (a.template && !seen.has(a.template.id)) {
        seen.add(a.template.id);
        list.push({ id: a.template.id, name: a.template.name });
      }
    });
    return list;
  }, [approvals]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    approvals.forEach((a) => {
      if (a.lead?.city) cities.add(a.lead.city);
    });
    return Array.from(cities);
  }, [approvals]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    approvals.forEach((a) => {
      if (a.lead?.category) categories.add(a.lead.category);
    });
    return Array.from(categories);
  }, [approvals]);

  // Filtered Approvals List
  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      // Channel Filter
      if (channelFilter !== 'ALL' && a.channel?.toUpperCase() !== channelFilter) {
        return false;
      }

      // Template Filter
      if (templateFilter && a.templateId !== Number(templateFilter)) {
        return false;
      }

      // Website Filter
      if (websiteFilter === 'HAS_WEBSITE') {
        if (!a.lead?.website || a.lead.website.trim() === '') return false;
      } else if (websiteFilter === 'NO_WEBSITE') {
        if (a.lead?.website && a.lead.website.trim() !== '') return false;
      }

      // City Filter
      if (cityFilter && (!a.lead?.city || !a.lead.city.toLowerCase().includes(cityFilter.toLowerCase()))) {
        return false;
      }

      // Category Filter
      if (categoryFilter && (!a.lead?.category || !a.lead.category.toLowerCase().includes(categoryFilter.toLowerCase()))) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRecipient = a.recipient.toLowerCase().includes(q);
        const matchesSubject = a.subject ? a.subject.toLowerCase().includes(q) : false;
        const matchesBody = a.body.toLowerCase().includes(q);
        const matchesBusiness = a.lead?.businessName ? a.lead.businessName.toLowerCase().includes(q) : false;
        const matchesCity = a.lead?.city ? a.lead.city.toLowerCase().includes(q) : false;

        if (!matchesRecipient && !matchesSubject && !matchesBody && !matchesBusiness && !matchesCity) {
          return false;
        }
      }

      return true;
    });
  }, [approvals, channelFilter, templateFilter, websiteFilter, cityFilter, categoryFilter, searchQuery]);

  // Selection helpers
  const allFilteredSelected =
    filteredApprovals.length > 0 && filteredApprovals.every((a) => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredApprovals.forEach((a) => next.delete(a.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredApprovals.forEach((a) => next.add(a.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Actions
  const handleApprove = async (id: number) => {
    setApproving(id);
    try {
      await approvalService.approve(id);
      toast.success('Message dispatched successfully');
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to dispatch message');
    } finally {
      setApproving(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkApproving(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await approvalService.bulkApprove(ids);
      toast.success(`Bulk dispatch complete: ${res.approved} sent, ${res.failed} failed`);
      setSelectedIds(new Set());
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to process bulk approvals');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkRejecting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await approvalService.bulkReject(ids);
      toast.success(`${res.rejected} message(s) rejected`);
      setSelectedIds(new Set());
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to reject messages');
    } finally {
      setIsBulkRejecting(false);
    }
  };

  const handleRejected = (updated: Approval) => {
    setApprovals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setRejectItem(null);
    toast.success('Message rejected');
  };

  const handleSaved = (updated: Approval) => {
    setApprovals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditItem(null);
    toast.success('Changes saved successfully');
  };

  const pendingCount = approvals.filter(
    (a) => a.status === 'PENDING_APPROVAL' || a.status === 'DRAFT'
  ).length;

  const resetFilters = () => {
    setSearchQuery('');
    setChannelFilter('ALL');
    setWebsiteFilter('ALL');
    setCityFilter('');
    setCategoryFilter('');
    setTemplateFilter('');
  };

  const hasActiveFilters =
    searchQuery ||
    channelFilter !== 'ALL' ||
    websiteFilter !== 'ALL' ||
    cityFilter ||
    categoryFilter ||
    templateFilter;

  return (
    <>
      <Toaster position="top-right" theme="system" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6 max-w-7xl mx-auto pb-12"
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5 font-display">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Human Approval Queue
              {pendingCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {pendingCount} pending
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Review, edit, personalize, and batch approve messages before automated outreach dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center p-1 bg-secondary/60 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </button>
            </div>

            <button
              id="approvals-refresh-btn"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count = tab.value
              ? approvals.filter((a) => a.status === tab.value).length
              : approvals.length;
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                id={`tab-${tab.value || 'all'}`}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient, business name, subject..."
                className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Channel Filter */}
            <div>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as any)}
                className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email (Gmail)</option>
                <option value="WHATSAPP">WhatsApp (OpenWA)</option>
              </select>
            </div>

            {/* Template / Campaign Filter */}
            <div>
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary truncate"
              >
                <option value="">All Templates / Campaigns</option>
                {uniqueTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Website Presence Filter */}
            <div>
              <select
                value={websiteFilter}
                onChange={(e) => setWebsiteFilter(e.target.value as any)}
                className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Websites</option>
                <option value="HAS_WEBSITE">🌐 Has Website</option>
                <option value="NO_WEBSITE">❌ No Website</option>
              </select>
            </div>

            {/* City / Category Quick Filter */}
            <div className="flex gap-2">
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter City..."
                className="w-1/2 bg-background border border-border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder="Category (e.g. Gym)..."
                className="w-1/2 bg-background border border-border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Active filter summary & reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>
                Showing <strong>{filteredApprovals.length}</strong> of {approvals.length} records matching filters
              </span>
              <button
                onClick={resetFilters}
                className="text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Multi-Select Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  {selectedIds.size} message(s) selected
                </span>

                <div className="h-4 w-px bg-border" />

                {/* Bulk Approve */}
                <button
                  onClick={handleBulkApprove}
                  disabled={isBulkApproving}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isBulkApproving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {isBulkApproving ? 'Sending...' : `Approve & Dispatch (${selectedIds.size})`}
                </button>

                {/* Bulk Reject */}
                <button
                  onClick={handleBulkReject}
                  disabled={isBulkRejecting}
                  className="px-3 py-1.5 rounded-md bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isBulkRejecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {isBulkRejecting ? 'Rejecting...' : `Reject Selected (${selectedIds.size})`}
                </button>
              </div>

              <div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Deselect all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        {error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-card border border-border rounded-xl">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No approvals found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters
                  ? 'No messages match your active filters. Try adjusting your search query or criteria.'
                  : activeTab
                  ? `No messages with status "${activeTab}"`
                  : 'Run a campaign or generate outreach messages to start the human approval workflow.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* ======================== 1. TABLE VIEW FORMAT ======================== */
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                    </th>
                    <th className="p-3 font-medium">Status & Channel</th>
                    <th className="p-3 font-medium">Business / Lead Details</th>
                    <th className="p-3 font-medium">Recipient</th>
                    <th className="p-3 font-medium">Subject & Message Preview</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApprovals.map((approval) => {
                    const isSelected = selectedIds.has(approval.id);
                    const isEditable =
                      approval.status === 'DRAFT' || approval.status === 'PENDING_APPROVAL';
                    const isApprovable =
                      approval.status === 'PENDING_APPROVAL' || approval.status === 'DRAFT';
                    const isRejectable =
                      approval.status === 'PENDING_APPROVAL' || approval.status === 'DRAFT';
                    const isApprovingThis = approving === approval.id;
                    const dateFormatted = new Date(approval.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={approval.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-secondary/20'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(approval.id)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                        </td>

                        {/* Status & Channel */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={approval.status as ApprovalStatus} />
                            <ChannelBadge channel={approval.channel} />
                          </div>
                        </td>

                        {/* Lead / Business Details */}
                        <td className="p-3 max-w-[220px]">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground truncate">
                              {approval.lead?.businessName || `Lead #${approval.leadId || '—'}`}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                              {approval.lead?.category && (
                                <span className="px-1.5 py-0.2 rounded bg-secondary text-[10px] text-foreground">
                                  {approval.lead.category}
                                </span>
                              )}
                              {approval.lead?.city && (
                                <span>📍 {approval.lead.city}</span>
                              )}
                            </div>
                            {approval.lead?.website ? (
                              <a
                                href={
                                  approval.lead.website.startsWith('http')
                                    ? approval.lead.website
                                    : `https://${approval.lead.website}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5 truncate"
                              >
                                <Globe className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{approval.lead.website.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2 h-2 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-zinc-500 italic">No website</span>
                            )}
                          </div>
                        </td>

                        {/* Recipient */}
                        <td className="p-3 max-w-[180px]">
                          <p className="text-xs font-mono text-foreground truncate">
                            {approval.recipient}
                          </p>
                          {approval.template && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              Template: {approval.template.name}
                            </p>
                          )}
                        </td>

                        {/* Subject & Message Snippet */}
                        <td className="p-3 max-w-sm">
                          <div className="space-y-0.5">
                            {approval.subject && (
                              <p className="font-medium text-foreground truncate">
                                {approval.subject}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                              {approval.body}
                            </p>
                            {approval.reviewNote && (
                              <p className="text-[10px] text-rose-400 italic truncate">
                                Note: {approval.reviewNote}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-3 text-[11px] text-muted-foreground whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewItem(approval)}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Preview Full Message"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isEditable && (
                              <button
                                onClick={() => setEditItem(approval)}
                                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit Message"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isApprovable && (
                              <button
                                onClick={() => handleApprove(approval.id)}
                                disabled={isApprovingThis}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Approve and Send"
                              >
                                {isApprovingThis ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>
                            )}

                            {isRejectable && (
                              <button
                                onClick={() => setRejectItem(approval)}
                                className="p-1.5 rounded-md hover:bg-rose-500/20 text-rose-400 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ======================== 2. CARDS VIEW FORMAT ======================== */
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredApprovals.map((approval) => {
                const isSelected = selectedIds.has(approval.id);
                const isEditable =
                  approval.status === 'DRAFT' || approval.status === 'PENDING_APPROVAL';
                const isApprovable =
                  approval.status === 'PENDING_APPROVAL' || approval.status === 'DRAFT';
                const isRejectable =
                  approval.status === 'PENDING_APPROVAL' || approval.status === 'DRAFT';
                const isApprovingThis = approving === approval.id;
                const createdAt = new Date(approval.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={approval.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className={`bg-card border rounded-xl p-5 transition-all ${
                      isSelected ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Checkbox & Details */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(approval.id)}
                          className="mt-1 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 shrink-0"
                        />

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={approval.status as ApprovalStatus} />
                            <ChannelBadge channel={approval.channel} />
                            <span className="text-[11px] text-muted-foreground">&bull; #{approval.id}</span>
                            {approval.template && (
                              <span className="text-[11px] text-muted-foreground">
                                &bull; Template: <strong className="text-foreground">{approval.template.name}</strong>
                              </span>
                            )}
                          </div>

                          {/* Business & Recipient */}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {approval.lead?.businessName || approval.recipient}
                              </p>
                              {approval.lead?.category && (
                                <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">
                                  {approval.lead.category}
                                </span>
                              )}
                              {approval.lead?.city && (
                                <span className="text-[11px] text-muted-foreground">📍 {approval.lead.city}</span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">{approval.recipient}</p>
                          </div>

                          {approval.subject && (
                            <p className="text-xs font-semibold text-foreground truncate">
                              {approval.subject}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {approval.body}
                          </p>
                          {approval.reviewNote && (
                            <p className="text-xs text-rose-400 italic">Note: {approval.reviewNote}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground">{createdAt}</p>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => setPreviewItem(approval)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </button>
                        {isEditable && (
                          <button
                            onClick={() => setEditItem(approval)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {isApprovable && (
                          <button
                            onClick={() => handleApprove(approval.id)}
                            disabled={isApprovingThis}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                          >
                            {isApprovingThis ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {isApprovingThis ? 'Sending...' : 'Approve'}
                          </button>
                        )}
                        {isRejectable && (
                          <button
                            onClick={() => setRejectItem(approval)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal approval={previewItem} onClose={() => setPreviewItem(null)} />
        )}
        {editItem && (
          <EditDrawer
            approval={editItem}
            onClose={() => setEditItem(null)}
            onSaved={handleSaved}
          />
        )}
        {rejectItem && (
          <RejectModal
            approval={rejectItem}
            onClose={() => setRejectItem(null)}
            onRejected={handleRejected}
          />
        )}
      </AnimatePresence>
    </>
  );
};
