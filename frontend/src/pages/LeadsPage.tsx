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
  RefreshCw,
  Building2,
  CheckSquare,
  Square,
  Minus,
  MapPin,
  Shield,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

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

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState<LeadStatus | ''>('');
  const [bulkTempValue, setBulkTempValue] = useState<TemperatureStatus | ''>('');
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);

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

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: () => leadService.bulkDelete({ ids: Array.from(selectedIds) }),
    onSuccess: (result) => {
      toast.success(`${result.deleted} lead(s) deleted`);
      setSelectedIds(new Set());
      setIsBulkDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk delete failed');
    },
  });

  // Bulk Update Mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { status?: LeadStatus; temperature?: TemperatureStatus }) =>
      leadService.bulkUpdate({ ids: Array.from(selectedIds), data }),
    onSuccess: (result) => {
      toast.success(`${result.updated} lead(s) updated`);
      setSelectedIds(new Set());
      setBulkStatusValue('');
      setBulkTempValue('');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk update failed');
    },
  });

  // Bulk Validate Mutation
  const bulkValidateMutation = useMutation({
    mutationFn: (leadIds?: number[]) => leadService.bulkValidateLeads(leadIds),
    onSuccess: (data) => {
      toast.success(`Validation complete: ${data.online} Online, ${data.offline} Offline, ${data.invalid} Invalid`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk validation failed');
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

  // Selection helpers
  const allOnPageSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const someOnPageSelected = leads.some((l) => selectedIds.has(l.id)) && !allOnPageSelected;

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const next = new Set(selectedIds);
      leads.forEach((l) => next.delete(l.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      leads.forEach((l) => next.add(l.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkUpdate = () => {
    if (!bulkStatusValue && !bulkTempValue) {
      toast.error('Please select a Status or Temperature to apply');
      return;
    }
    const data: { status?: LeadStatus; temperature?: TemperatureStatus } = {};
    if (bulkStatusValue) data.status = bulkStatusValue as LeadStatus;
    if (bulkTempValue) data.temperature = bulkTempValue as TemperatureStatus;
    bulkUpdateMutation.mutate(data);
  };

  const colSpan = 11; // total columns including checkbox and google profile

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
            onClick={() => bulkValidateMutation.mutate(undefined)}
            disabled={bulkValidateMutation.isPending || leads.length === 0}
            className="px-3 py-2 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Perform DNS & HTTP validation for all leads"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            {bulkValidateMutation.isPending ? 'Validating...' : 'Validate Websites'}
          </button>
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

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-sm">
              <span className="font-semibold text-indigo-300 text-xs flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                {selectedIds.size} selected
              </span>

              <div className="h-4 w-px bg-border" />

              {/* Bulk Status Update */}
              <select
                value={bulkStatusValue}
                onChange={(e) => setBulkStatusValue(e.target.value as LeadStatus | '')}
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Set Status…</option>
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

              {/* Bulk Temp Update */}
              <select
                value={bulkTempValue}
                onChange={(e) => setBulkTempValue(e.target.value as TemperatureStatus | '')}
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Set Temperature…</option>
                <option value="HOT">HOT</option>
                <option value="WARM">WARM</option>
                <option value="LOW">LOW</option>
              </select>

              <button
                onClick={handleBulkUpdate}
                disabled={bulkUpdateMutation.isPending}
                className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {bulkUpdateMutation.isPending ? 'Updating…' : 'Apply Update'}
              </button>

              <div className="h-4 w-px bg-border" />

              {/* Bulk Delete */}
              {!isBulkDeleteConfirm ? (
                <button
                  onClick={() => setIsBulkDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete {selectedIds.size} leads
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400 font-medium">Confirm delete?</span>
                  <button
                    onClick={() => bulkDeleteMutation.mutate()}
                    disabled={bulkDeleteMutation.isPending}
                    className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {bulkDeleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setIsBulkDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="ml-auto">
                <button
                  onClick={() => { setSelectedIds(new Set()); setIsBulkDeleteConfirm(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                {/* Select All Checkbox */}
                <th className="py-3 px-4 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    {allOnPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : someOnPageSelected ? (
                      <Minus className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Profile</th>
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
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-4" /></td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-10"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-8"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-12"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-muted rounded w-20"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-muted rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={colSpan} className="py-12 px-4 text-center text-rose-400 text-xs">
                    Failed to load leads. Please try refreshing.
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={colSpan} className="py-12 px-4 text-center">
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
                    className={`hover:bg-accent/40 transition-colors group ${selectedIds.has(lead.id) ? 'bg-indigo-500/5' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleSelect(lead.id)}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {selectedIds.has(lead.id) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

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

                    {/* Google Profile */}
                    <td className="py-3 px-4">
                      {lead.googleProfileLink ? (
                        <a
                          href={lead.googleProfileLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Google Business Profile"
                          className="inline-flex items-center gap-1 text-green-500 hover:text-green-400 hover:underline text-[11px]"
                        >
                          <MapPin className="w-3 h-3" />
                          Maps
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">—</span>
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
            {selectedIds.size > 0 && (
              <span className="ml-2 text-indigo-400 font-medium">· {selectedIds.size} selected</span>
            )}
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
