import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'motion/react';

import { leadService } from '../services/leadService';
import { Lead, LeadStatus, TemperatureStatus, CreateLeadPayload, UpdateLeadPayload } from '../types/lead';
import { StatusBadge, TemperatureBadge, WebsiteStatusBadge } from '../components/leads/LeadBadges';
import { LeadFormModal } from '../components/leads/LeadFormModal';
import { LeadDeleteDialog } from '../components/leads/LeadDeleteDialog';

export const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [temperatureFilter, setTemperatureFilter] = useState<TemperatureStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  // Fetch leads with TanStack Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leads', { page, limit, search, statusFilter, temperatureFilter, categoryFilter, cityFilter }],
    queryFn: () =>
      leadService.getLeads({
        page,
        limit,
        search: search || undefined,
        status: (statusFilter as LeadStatus) || undefined,
        temperature: (temperatureFilter as TemperatureStatus) || undefined,
        category: categoryFilter || undefined,
        city: cityFilter || undefined,
      }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadService.createLead(payload),
    onSuccess: () => {
      toast.success('Lead created successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create lead');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateLeadPayload }) =>
      leadService.updateLead(id, payload),
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update lead');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadService.deleteLead(id),
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setDeletingLead(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete lead');
    },
  });

  const handleCreateOrUpdate = async (formData: CreateLeadPayload) => {
    if (editingLead) {
      await updateMutation.mutateAsync({ id: editingLead.id, payload: formData });
      setEditingLead(null);
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const leads = data?.leads || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <Toaster position="top-right" theme="system" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">
            Lead Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage, filter, score, and track your business leads pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search business name, email, phone..."
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as LeadStatus | '');
                setPage(1);
              }}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="RESEARCHED">RESEARCHED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="REPLIED">REPLIED</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="DISQUALIFIED">DISQUALIFIED</option>
            </select>
          </div>

          {/* Temperature Filter */}
          <div>
            <select
              value={temperatureFilter}
              onChange={(e) => {
                setTemperatureFilter(e.target.value as TemperatureStatus | '');
                setPage(1);
              }}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="">All Temperatures</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by City..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Temp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-8"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-20"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-muted rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Building2 className="w-8 h-8 text-muted-foreground/50" />
                      <p className="font-semibold text-sm text-foreground">No leads found</p>
                      <p className="text-xs text-muted-foreground text-center">
                        No lead records match your search or filter criteria. Add a new lead or adjust your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-accent/40 transition-colors group"
                  >
                    {/* Business */}
                    <td className="py-3 px-4 font-medium text-foreground">
                      <Link to={`/leads/${lead.id}`} className="hover:underline font-semibold text-foreground">
                        {lead.businessName}
                      </Link>
                      {lead.email && (
                        <p className="text-[11px] text-muted-foreground font-mono">{lead.email}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-muted-foreground">
                      {lead.category || '-'}
                    </td>

                    {/* City */}
                    <td className="py-3 px-4 text-muted-foreground">
                      {lead.city || '-'}
                    </td>

                    {/* Website */}
                    <td className="py-3 px-4">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                        >
                          Website <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <WebsiteStatusBadge status={lead.websiteStatus} />
                      )}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground font-mono">{lead.score}</span>
                      <span className="text-[10px] text-muted-foreground">/100</span>
                    </td>

                    {/* Temperature */}
                    <td className="py-3 px-4">
                      <TemperatureBadge temperature={lead.temperature} />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px] font-mono">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingLead(lead)}
                          className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{leads.length}</span> of{' '}
            <span className="font-semibold text-foreground">{pagination.total}</span> leads
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md border border-border bg-background text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-md border border-border bg-background text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal for Create & Edit */}
      <LeadFormModal
        isOpen={isCreateOpen || !!editingLead}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingLead(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingLead}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <LeadDeleteDialog
        isOpen={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        onConfirm={async () => {
          if (deletingLead) {
            await deleteMutation.mutateAsync(deletingLead.id);
          }
        }}
        leadName={deletingLead?.businessName}
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
};
