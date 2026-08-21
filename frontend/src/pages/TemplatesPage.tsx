import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Mail,
  MessageSquare,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'motion/react';

import { templateService } from '../services/templateService';
import { Template, TemplateChannel } from '../types/template';

export const TemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [channelFilter, setChannelFilter] = useState<TemplateChannel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['templates', { channelFilter, search }],
    queryFn: () =>
      templateService.getTemplates({
        channel: channelFilter === 'ALL' ? undefined : channelFilter,
        search: search || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => templateService.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeletingTemplate(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete template');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      templateService.updateTemplate(id, { isActive }),
    onSuccess: () => {
      toast.success('Template status updated');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update template');
    },
  });

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
            <FileText className="w-6 h-6 text-primary" />
            Outreach Templates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage email and WhatsApp templates with dynamic variables. Templates work standalone without requiring AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh templates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/templates/new"
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Channel Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-secondary border border-border">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                channelFilter === 'ALL'
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Templates
            </button>
            <button
              onClick={() => setChannelFilter('EMAIL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                channelFilter === 'EMAIL'
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email
            </button>
            <button
              onClick={() => setChannelFilter('WHATSAPP')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                channelFilter === 'WHATSAPP'
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search template name or content..."
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-border bg-card space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center border border-border rounded-xl bg-card space-y-3 max-w-md mx-auto my-6">
          <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="font-semibold text-sm text-foreground font-display">No Templates Found</h3>
          <p className="text-xs text-muted-foreground">
            No outreach templates match your filter. Create a new template to streamline your outreach.
          </p>
          <Link
            to="/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Create Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all flex flex-col justify-between gap-4 shadow-sm group"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          tpl.channel === 'EMAIL'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {tpl.channel === 'EMAIL' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {tpl.channel}
                      </span>
                      <h3 className="font-semibold text-sm text-foreground font-display group-hover:text-primary transition-colors">
                        {tpl.name}
                      </h3>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{tpl.description}</p>
                    )}
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: tpl.id, isActive: !tpl.isActive })}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                      tpl.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}
                    title="Click to toggle template active status"
                  >
                    {tpl.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Email Subject preview if present */}
                {tpl.channel === 'EMAIL' && tpl.subject && (
                  <div className="p-2 rounded bg-background border border-border text-xs text-muted-foreground font-mono truncate">
                    <span className="font-semibold text-foreground">Subject:</span> {tpl.subject}
                  </div>
                )}

                {/* Body snippet */}
                <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground font-mono line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {tpl.body}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <span className="text-[10px] font-mono">
                  Updated {new Date(tpl.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/templates/${tpl.id}`}
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Template"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setDeletingTemplate(tpl)}
                    className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="font-semibold text-base text-foreground font-display">Delete Template</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deletingTemplate.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="px-4 py-2 rounded-md bg-secondary text-foreground text-xs font-medium border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingTemplate.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
