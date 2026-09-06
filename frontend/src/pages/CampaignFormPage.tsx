import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Send,
  Mail,
  MessageSquare,
  MapPin,
  Tag,
  Gauge,
  Layers,
  Loader2,
  FileText,
  AlertCircle,
  Sparkles,
  Users,
  Search,
  CheckSquare,
  Square,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Dumbbell,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'motion/react';

import { campaignService } from '../services/campaignService';
import { templateService } from '../services/templateService';
import { leadService } from '../services/leadService';
import {
  CampaignChannel,
  CampaignStatus,
  CreateCampaignPayload,
} from '../types/campaign';
import { Lead } from '../types/lead';

export const CampaignFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';
  const campaignId = parseInt(id || '0', 10);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Navigation state passed from LeadsPage
  const locationState = location.state as {
    selectedLeadIds?: number[];
    suggestedCategory?: string;
    suggestedCity?: string;
  } | null;

  // Targeting Mode: 'specific' (handpicked / recent leads) vs 'filters' (dynamic criteria)
  const [targetMode, setTargetMode] = useState<'specific' | 'filters'>('filters');
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  // Lead Picker filter/search states
  const [leadSearch, setLeadSearch] = useState('');
  const [leadCategoryFilter, setLeadCategoryFilter] = useState('');
  const [leadSourceFilter, setLeadSourceFilter] = useState('');
  const [leadRecencyFilter, setLeadRecencyFilter] = useState<'ALL' | '24H' | '7D' | '30D'>('ALL');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [channel, setChannel] = useState<CampaignChannel>('EMAIL');
  const [dailyLimit, setDailyLimit] = useState<number>(20);
  const [status, setStatus] = useState<CampaignStatus>('DRAFT');

  // Fetch available templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates({ isActive: true }),
  });

  // Fetch campaign if editing
  const { data: existingCampaign, isLoading: isFetchingCampaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !isNew && !isNaN(campaignId) && campaignId > 0,
  });

  // Fetch leads for the interactive lead picker (up to 100 recent leads)
  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads-for-campaign-picker', leadCategoryFilter, leadSourceFilter],
    queryFn: () =>
      leadService.getLeads({
        page: 1,
        limit: 100,
        category: leadCategoryFilter || undefined,
        source: leadSourceFilter || undefined,
      }),
  });

  const availableLeads = useMemo(() => leadsData?.leads || [], [leadsData]);

  // Filter leads locally by search term and recency
  const filteredLeads = useMemo(() => {
    let result = availableLeads;

    if (leadSearch.trim()) {
      const q = leadSearch.toLowerCase();
      result = result.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.category && l.category.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q))
      );
    }

    if (leadRecencyFilter !== 'ALL') {
      const now = new Date().getTime();
      const hoursMap = {
        '24H': 24,
        '7D': 7 * 24,
        '30D': 30 * 24,
      };
      const maxAgeMs = hoursMap[leadRecencyFilter] * 60 * 60 * 1000;
      result = result.filter((l) => {
        const leadTime = new Date(l.createdAt).getTime();
        return now - leadTime <= maxAgeMs;
      });
    }

    return result;
  }, [availableLeads, leadSearch, leadRecencyFilter]);

  // Handle passed location state from Leads table selection
  useEffect(() => {
    if (locationState?.selectedLeadIds && locationState.selectedLeadIds.length > 0) {
      setSelectedLeadIds(locationState.selectedLeadIds);
      setTargetMode('specific');
      setDailyLimit(Math.max(20, locationState.selectedLeadIds.length));

      if (locationState.suggestedCategory) {
        setCategory(locationState.suggestedCategory);
        setName(`${locationState.suggestedCategory} Outreach - ${new Date().toLocaleDateString()}`);
      } else {
        setName(`Lead Outreach Campaign - ${new Date().toLocaleDateString()}`);
      }

      if (locationState.suggestedCity) {
        setCity(locationState.suggestedCity);
      }
    }
  }, [locationState]);

  useEffect(() => {
    if (existingCampaign) {
      setName(existingCampaign.name);
      setDescription(existingCampaign.description || '');
      setCity(existingCampaign.city || '');
      setCategory(existingCampaign.category || '');
      setLeadSource(existingCampaign.leadSource || '');
      setTemplateId(existingCampaign.templateId);
      setChannel(existingCampaign.channel);
      setDailyLimit(existingCampaign.dailyLimit);
      setStatus(existingCampaign.status);

      if (existingCampaign.leadIds && existingCampaign.leadIds.length > 0) {
        setSelectedLeadIds(existingCampaign.leadIds);
        setTargetMode('specific');
      }
    }
  }, [existingCampaign]);

  // If templates load and we don't have a template selected yet, select the first matching channel
  useEffect(() => {
    if (templates.length > 0 && templateId === '') {
      const match = templates.find((t) => t.channel === channel) || templates[0];
      if (match) {
        setTemplateId(match.id);
      }
    }
  }, [templates, channel, templateId]);

  // Selection toggle helpers
  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredLeads.map((l) => l.id);
    setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const deselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredLeads.map((l) => l.id));
    setSelectedLeadIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => {
      if (!isNew) {
        return campaignService.update(campaignId, payload);
      }
      return campaignService.create(payload);
    },
    onSuccess: () => {
      toast.success(`Campaign ${isNew ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/campaigns');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save campaign');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!templateId || typeof templateId !== 'number') {
      toast.error('Please select an outreach template');
      return;
    }

    if (targetMode === 'specific' && selectedLeadIds.length === 0) {
      toast.error('Please select at least one lead or switch to Demographic Filters');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      city: city.trim() || undefined,
      category: category.trim() || undefined,
      leadSource: leadSource.trim() || undefined,
      leadIds: targetMode === 'specific' && selectedLeadIds.length > 0 ? selectedLeadIds : undefined,
      templateId: Number(templateId),
      channel,
      dailyLimit: Number(dailyLimit) || 20,
      status,
    });
  };

  if (isFetchingCampaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredTemplates = templates.filter((t) => t.channel === channel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      <Toaster position="top-right" theme="system" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/campaigns"
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              {isNew ? 'Create New Campaign' : `Edit Campaign: ${existingCampaign?.name || ''}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target recently uploaded/captured leads or filter by industry demographic to generate personalized outreach.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/campaigns"
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isNew ? 'Create Campaign' : 'Save Changes'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Campaign Details & Audience Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Campaign Information
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Campaign Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym Owners Outreach - Cold Email Wave 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Internal notes about target audience or offer (e.g. Targeting local gym & fitness studio owners)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Lead Targeting Mode Selection Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Target Audience Selection
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Choose whether to pick specific/recent leads or use demographic matching filters.
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center p-1 bg-secondary/50 rounded-lg border border-border self-start">
                <button
                  type="button"
                  onClick={() => setTargetMode('specific')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    targetMode === 'specific'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Select Specific Leads
                  {selectedLeadIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
                      {selectedLeadIds.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('filters')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    targetMode === 'filters'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Dynamic Filters
                </button>
              </div>
            </div>

            {/* Mode A: Interactive Specific / Recent Leads Picker */}
            {targetMode === 'specific' ? (
              <div className="space-y-4 pt-1">
                {/* Quick Preset Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" /> Quick Recency:
                  </span>
                  {(
                    [
                      { label: 'All Leads', val: 'ALL' },
                      { label: 'Added < 24 Hours', val: '24H' },
                      { label: 'Added Last 7 Days', val: '7D' },
                      { label: 'Added Last 30 Days', val: '30D' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setLeadRecencyFilter(item.val)}
                      className={`px-2.5 py-1 text-[11px] rounded-md border transition-all ${
                        leadRecencyFilter === item.val
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  <div className="h-4 w-px bg-border mx-1" />

                  {/* Gym Preset button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadCategoryFilter(leadCategoryFilter === 'Gym' ? '' : 'Gym');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-all flex items-center gap-1 ${
                      leadCategoryFilter === 'Gym'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <Dumbbell className="w-3 h-3 text-amber-400" />
                    Gyms / Fitness
                  </button>

                  {/* CSV Upload Preset button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeadSourceFilter(leadSourceFilter === 'CSV_IMPORT' ? '' : 'CSV_IMPORT');
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-all flex items-center gap-1 ${
                      leadSourceFilter === 'CSV_IMPORT'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    CSV Imports
                  </button>
                </div>

                {/* Lead Search & Multi-select Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search recent leads by name, city, email..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                    >
                      Select All Filtered ({filteredLeads.length})
                    </button>
                    {selectedLeadIds.length > 0 && (
                      <button
                        type="button"
                        onClick={deselectAllFiltered}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Deselect Filtered
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Leads Banner */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>
                      <strong>{selectedLeadIds.length}</strong> lead(s) selected for this campaign
                    </span>
                  </div>
                  {selectedLeadIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedLeadIds([])}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline"
                    >
                      Clear all selections
                    </button>
                  )}
                </div>

                {/* Leads Scrollable List Table */}
                <div className="border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto bg-background/50">
                  {isLoadingLeads ? (
                    <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                      Loading recent leads...
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No leads match your filter criteria. Try adjusting the search or recency filter.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground sticky top-0">
                        <tr>
                          <th className="p-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredLeads.length > 0 &&
                                filteredLeads.every((l) => selectedLeadIds.includes(l.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) selectAllFiltered();
                                else deselectAllFiltered();
                              }}
                              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                          </th>
                          <th className="p-2.5 font-medium">Business / Name</th>
                          <th className="p-2.5 font-medium">Category</th>
                          <th className="p-2.5 font-medium">City</th>
                          <th className="p-2.5 font-medium">Contact</th>
                          <th className="p-2.5 font-medium">Source / Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredLeads.map((lead: Lead) => {
                          const isSelected = selectedLeadIds.includes(lead.id);
                          const dateAdded = new Date(lead.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          });

                          return (
                            <tr
                              key={lead.id}
                              onClick={() => toggleLeadSelection(lead.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10' : 'hover:bg-secondary/30'
                              }`}
                            >
                              <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleLeadSelection(lead.id)}
                                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                              </td>
                              <td className="p-2.5 font-medium text-foreground">
                                {lead.businessName}
                              </td>
                              <td className="p-2.5 text-muted-foreground">
                                {lead.category ? (
                                  <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-foreground">
                                    {lead.category}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-2.5 text-muted-foreground">{lead.city || '—'}</td>
                              <td className="p-2.5 text-muted-foreground">
                                {channel === 'EMAIL' ? (
                                  lead.email ? (
                                    <span className="text-foreground">{lead.email}</span>
                                  ) : (
                                    <span className="text-rose-400 text-[10px]">No Email</span>
                                  )
                                ) : lead.phone ? (
                                  <span className="text-foreground">{lead.phone}</span>
                                ) : (
                                  <span className="text-rose-400 text-[10px]">No Phone</span>
                                )}
                              </td>
                              <td className="p-2.5 text-[11px] text-muted-foreground">
                                <span className="opacity-75">{lead.source || 'MANUAL'}</span> ·{' '}
                                <span>{dateAdded}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              /* Mode B: Dynamic Demographic Filters */
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Target City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Surat (or leave blank for all)"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      Business Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gym, Salon, Cafe, Dentist (or blank for all)"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    Lead Acquisition Source
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Sources</option>
                    <option value="CSV_IMPORT">CSV Uploads / Imports</option>
                    <option value="GOOGLE_MAPS">Google Maps Discovery</option>
                    <option value="MANUAL">Manually Added</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Template & Message Configuration */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Message Template
              </h3>
              <Link
                to="/templates/new"
                target="_blank"
                className="text-[11px] text-primary hover:underline font-medium"
              >
                + Create New Template
              </Link>
            </div>

            {isLoadingTemplates ? (
              <div className="h-10 bg-secondary rounded animate-pulse"></div>
            ) : templates.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  No templates available. Please{' '}
                  <Link to="/templates/new" className="underline font-semibold">
                    create a template
                  </Link>{' '}
                  first.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Select Outreach Template <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="" disabled>
                      Select a template...
                    </option>
                    {filteredTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.channel})
                      </option>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <option value="" disabled>
                        No active templates for {channel} channel
                      </option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings & Guardrails */}
        <div className="space-y-6">
          {/* Channel Selection */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Outreach Channel</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between gap-2 ${
                  channel === 'EMAIL'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs font-semibold">Email</p>
                  <p className="text-[10px] text-muted-foreground">Gmail OAuth</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between gap-2 ${
                  channel === 'WHATSAPP'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold">WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground">OpenWA</p>
                </div>
              </button>
            </div>
          </div>

          {/* Campaign Status & Limits */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Status & Execution Limits</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Campaign Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    Daily / Batch Limit
                  </span>
                  <span className="text-xs font-bold text-primary">{dailyLimit} leads</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Math.max(1, Math.min(500, Number(e.target.value))))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Maximum leads to enqueue into the Human Approval Queue per execution run (1 - 500).
                </p>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Human-in-the-Loop Safe
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Running this campaign will render personalized outreach and generate entries into the <strong>Approval Queue</strong>. Messages are never dispatched without explicit review.
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

