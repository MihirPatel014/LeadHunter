import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Inbox,
  MailCheck,
  RefreshCw,
  Search,
  MessageSquare,
  Sparkles,
  User,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { replyService } from '../services/replyService';
import { leadService } from '../services/leadService';
import { Reply, SyncRepliesResult } from '../types/reply';

const SAMPLE_REPLIES = [
  {
    subject: 'Re: Quick question about your website',
    body: 'Hi, thanks for reaching out! Yes, we have actually been thinking about redesigning our salon website. Could you send over some examples of your previous work and your pricing packages?',
  },
  {
    subject: 'Re: Digital marketing for our clinic',
    body: 'Hello! We received your note. Are you available for a quick 10-minute call this Thursday afternoon at 3 PM to discuss?',
  },
  {
    subject: 'Re: Partnership inquiry',
    body: 'Thanks for getting in touch. Please email our office manager at manager@business.com with more details.',
  },
  {
    subject: 'WhatsApp Reply',
    body: 'Yes, please share more details and your portfolio on WhatsApp! What are your typical turnaround times?',
  },
];

export const RepliesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Simulation Form State
  const [simLeadId, setSimLeadId] = useState<number | ''>('');
  const [simSubject, setSimSubject] = useState(SAMPLE_REPLIES[0].subject);
  const [simBody, setSimBody] = useState(SAMPLE_REPLIES[0].body);

  // Queries
  const { data: replies = [], isLoading, refetch } = useQuery({
    queryKey: ['replies'],
    queryFn: () => replyService.list(),
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads', { limit: 100 }],
    queryFn: () => leadService.getLeads({ limit: 100 }),
  });

  const leads = leadsData?.leads || [];

  // Mutations
  const syncMutation = useMutation({
    mutationFn: () => replyService.sync(),
    onSuccess: (result: SyncRepliesResult) => {
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });

      if (result.repliesFound === 0) {
        toast.info(`Sync complete: Checked ${result.threadsChecked} threads. No new incoming replies.`);
      } else {
        toast.success(
          `Sync complete: Found ${result.repliesFound} new replies! ${result.leadsUpdated} leads moved to REPLIED.`
        );
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to sync replies from Gmail');
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () => {
      if (!simLeadId) throw new Error('Please select a lead');
      return replyService.simulate({
        leadId: Number(simLeadId),
        subject: simSubject,
        body: simBody,
      });
    },
    onSuccess: () => {
      toast.success('Simulated reply recorded! Lead status updated to REPLIED.');
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      setIsSimulateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to simulate reply');
    },
  });

  // Filter replies
  const filteredReplies = replies.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.subject && r.subject.toLowerCase().includes(q)) ||
      r.sender.toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q) ||
      (r.lead?.businessName && r.lead.businessName.toLowerCase().includes(q)) ||
      (r.lead?.city && r.lead.city.toLowerCase().includes(q))
    );
  });

  // KPI Metrics
  const totalReplies = replies.length;
  const uniqueLeads = new Set(replies.map((r) => r.leadId).filter(Boolean)).size;
  const last24hReplies = replies.filter((r) => {
    const d = new Date(r.replyAt).getTime();
    return Date.now() - d < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      <Toaster position="top-right" theme="system" />

      {/* Top Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Link
          to="/messages"
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
        >
          Message Generator
        </Link>
        <Link
          to="/messages/replies"
          className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-md flex items-center gap-1.5 shadow-sm"
        >
          <Inbox className="w-3.5 h-3.5" />
          Incoming Replies Inbox
          {replies.length > 0 && (
            <span className="px-1.5 py-0.2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
              {replies.length}
            </span>
          )}
        </Link>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <MailCheck className="w-6 h-6 text-primary" />
            Gmail Reply Tracking & Inbox
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detects incoming replies on outreach email threads, matches responders to leads, and transitions status to REPLIED.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh replies"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="px-3 py-2 rounded-md border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Simulate Reply
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Inspect Gmail threads for new replies"
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Gmail Replies
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Inbound Replies</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalReplies}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Engaged Responders</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{uniqueLeads} leads</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Recent (Last 24h)</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{last24hReplies}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search replies by subject, sender, lead name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Showing {filteredReplies.length} of {totalReplies} replies
        </p>
      </div>

      {/* Replies List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse space-y-3">
              <div className="h-5 bg-secondary rounded w-1/3"></div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No replies detected yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search
              ? 'No replies match your search query. Try clearing your search.'
              : 'When leads reply to sent emails, they will appear here automatically. You can also test with the "Simulate Reply" button.'}
          </p>
          {!search && (
            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate First Test Reply
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReplies.map((reply) => {
            const replyDate = new Date(reply.replyAt);

            return (
              <div
                key={reply.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-all shadow-sm space-y-3"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      REPLIED
                    </span>
                    {(reply.subject?.toLowerCase().includes('whatsapp') || reply.threadId?.startsWith('wa_')) ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-600/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        WhatsApp
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <MailCheck className="w-3 h-3 text-blue-400" />
                        Email
                      </span>
                    )}
                    {reply.lead ? (
                      <Link
                        to={`/leads/${reply.lead.id}`}
                        className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {reply.lead.businessName}
                        {reply.lead.city && <span className="text-muted-foreground">({reply.lead.city})</span>}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unlinked Sender</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {replyDate.toLocaleDateString()} at {replyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Sender & Subject */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">From:</span>
                    <strong className="text-foreground">{reply.sender}</strong>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {reply.subject || '(No Subject)'}
                  </h4>
                </div>

                {/* Body Preview */}
                <div className="bg-secondary/40 border border-border/60 rounded-lg p-3 text-xs text-foreground/90 whitespace-pre-wrap line-clamp-3 font-sans leading-relaxed">
                  {reply.body}
                </div>

                {/* Action footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Thread ID: {reply.threadId}
                  </span>
                  <div className="flex items-center gap-2">
                    {reply.lead && (
                      <Link
                        to={`/leads/${reply.lead.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        View Lead Profile <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <button
                      onClick={() => setSelectedReply(reply)}
                      className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      View Full Message
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Message View Modal */}
      <AnimatePresence>
        {selectedReply && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <MailCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Inbound Reply Details</h3>
                </div>
                <button
                  onClick={() => setSelectedReply(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-secondary/30 p-3 rounded-lg border border-border">
                  <div>
                    <span className="text-muted-foreground">From:</span>
                    <p className="font-semibold text-foreground">{selectedReply.sender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received Date:</span>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedReply.replyAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Subject:</span>
                    <p className="font-semibold text-foreground">{selectedReply.subject || '(No Subject)'}</p>
                  </div>
                  {selectedReply.lead && (
                    <div className="col-span-2 pt-1 border-t border-border/50 flex items-center justify-between">
                      <span>
                        Linked Lead: <strong className="text-primary">{selectedReply.lead.businessName}</strong>
                      </span>
                      <Link
                        to={`/leads/${selectedReply.lead.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Open Lead Profile →
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-foreground">Message Content:</label>
                  <div className="bg-background border border-border rounded-lg p-4 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedReply.body}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setSelectedReply(null)}
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simulate Reply Modal */}
      <AnimatePresence>
        {isSimulateModalOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Simulate Inbound Reply</h3>
                </div>
                <button
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Test the reply detection workflow without waiting for a real email. Selecting a lead will create a reply and update the lead's status to <strong>REPLIED</strong>.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Select Responding Lead <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={simLeadId}
                    onChange={(e) => setSimLeadId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Select a lead...
                    </option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.businessName} ({l.city || 'No City'}) - Status: {l.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Subject</label>
                  <input
                    type="text"
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-foreground">Reply Message Body</label>
                    <div className="flex gap-1">
                      {SAMPLE_REPLIES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSimSubject(sample.subject);
                            setSimBody(sample.body);
                          }}
                          className="px-2 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Sample {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => simulateMutation.mutate()}
                  disabled={simulateMutation.isPending || !simLeadId}
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {simulateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Test Reply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
