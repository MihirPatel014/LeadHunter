import React, { useEffect, useState, useCallback } from 'react';
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
  Filter,
  X,
} from 'lucide-react';
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

interface PreviewModalProps { approval: Approval; onClose: () => void; }
function PreviewModal({ approval, onClose }: PreviewModalProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Message Preview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">#{approval.id} &mdash; {approval.recipient}</p>
          </div>
          <button id="preview-close-btn" onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">To</p>
            <p className="text-sm text-foreground font-mono">{approval.recipient}</p>
          </div>
          {approval.subject && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Subject</p>
              <p className="text-sm text-foreground font-semibold">{approval.subject}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Body</p>
            <div className="bg-background/60 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border/40">
              {approval.body}
            </div>
          </div>
          {approval.reviewNote && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Rejection Note</p>
              <p className="text-sm text-rose-400 italic">{approval.reviewNote}</p>
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
          <h2 className="text-sm font-semibold text-foreground">Edit Message</h2>
          <button id="edit-close-btn" onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <input id="edit-subject-input" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Email subject..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Body</label>
            <textarea id="edit-body-textarea" rows={10} value={body} onChange={(e) => setBody(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
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
            <h2 className="text-sm font-semibold text-foreground">Reject Message</h2>
            <p className="text-xs text-muted-foreground">Approval #{approval.id}</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">Optionally explain why this message is being rejected.</p>
          <textarea id="reject-note-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Rejection reason..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none" />
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

interface ApprovalCardProps {
  approval: Approval;
  onApprove: (id: number) => void;
  onReject: (a: Approval) => void;
  onEdit: (a: Approval) => void;
  onPreview: (a: Approval) => void;
  approving: number | null;
}
function ApprovalCard({ approval, onApprove, onReject, onEdit, onPreview, approving }: ApprovalCardProps) {
  const isEditable = approval.status === 'DRAFT' || approval.status === 'PENDING_APPROVAL';
  const isApprovable = approval.status === 'PENDING_APPROVAL' || approval.status === 'DRAFT';
  const isRejectable = approval.status === 'PENDING_APPROVAL' || approval.status === 'DRAFT';
  const isApproving = approving === approval.id;
  const createdAt = new Date(approval.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
      className="bg-card border border-border/60 rounded-xl p-5 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={approval.status as ApprovalStatus} />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Mail className="w-3 h-3" />{approval.channel}
            </span>
            <span className="text-[11px] text-muted-foreground">&bull; #{approval.id}</span>
          </div>
          <p className="text-xs font-medium text-foreground truncate font-mono">{approval.recipient}</p>
          {approval.subject && <p className="text-sm font-semibold text-foreground truncate">{approval.subject}</p>}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{approval.body}</p>
          {approval.reviewNote && <p className="text-xs text-rose-400 italic">Note: {approval.reviewNote}</p>}
          <p className="text-[11px] text-muted-foreground">{createdAt}</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button id={`preview-btn-${approval.id}`} onClick={() => onPreview(approval)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Eye className="w-3 h-3" />Preview
          </button>
          {isEditable && (
            <button id={`edit-btn-${approval.id}`} onClick={() => onEdit(approval)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Edit3 className="w-3 h-3" />Edit
            </button>
          )}
          {isApprovable && (
            <button id={`approve-btn-${approval.id}`} onClick={() => onApprove(approval.id)} disabled={isApproving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
              {isApproving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {isApproving ? 'Sending...' : 'Approve'}
            </button>
          )}
          {isRejectable && (
            <button id={`reject-btn-${approval.id}`} onClick={() => onReject(approval)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-md bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 transition-colors">
              <XCircle className="w-3 h-3" />Reject
            </button>
          )}
        </div>
      </div>
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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await approvalService.list(activeTab || undefined);
      setApprovals(data);
    } catch (err: any) { setError(err.message ?? 'Failed to load approvals'); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    setApproving(id);
    try {
      await approvalService.approve(id);
      showToast('Email sent successfully!', 'success');
      load();
    } catch (err: any) { showToast(err.message ?? 'Failed to send email', 'error'); }
    finally { setApproving(null); }
  };

  const handleRejected = (updated: Approval) => {
    setApprovals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setRejectItem(null);
    showToast('Message rejected', 'success');
  };

  const handleSaved = (updated: Approval) => {
    setApprovals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditItem(null);
    showToast('Changes saved', 'success');
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING_APPROVAL' || a.status === 'DRAFT').length;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Human Approval Queue
              {pendingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {pendingCount} pending
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Review, edit, and approve messages before they are sent via Gmail.</p>
          </div>
          <button id="approvals-refresh-btn" onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} id={`tab-${tab.value || 'all'}`} onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${activeTab === tab.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-card/60 border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No approvals found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab ? `No messages with status "${activeTab}"` : 'Generate messages from the Messages page to start the approval workflow.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {approvals.map((approval) => (
                <ApprovalCard key={approval.id} approval={approval} approving={approving}
                  onApprove={handleApprove} onReject={setRejectItem} onEdit={setEditItem} onPreview={setPreviewItem} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {previewItem && <PreviewModal approval={previewItem} onClose={() => setPreviewItem(null)} />}
        {editItem && <EditDrawer approval={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} />}
        {rejectItem && <RejectModal approval={rejectItem} onClose={() => setRejectItem(null)} onRejected={handleRejected} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
