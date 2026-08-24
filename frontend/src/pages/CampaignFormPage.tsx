import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'motion/react';

import { campaignService } from '../services/campaignService';
import { templateService } from '../services/templateService';
import {
  CampaignChannel,
  CampaignStatus,
  CreateCampaignPayload,
} from '../types/campaign';

export const CampaignFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';
  const campaignId = parseInt(id || '0', 10);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
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

  useEffect(() => {
    if (existingCampaign) {
      setName(existingCampaign.name);
      setDescription(existingCampaign.description || '');
      setCity(existingCampaign.city || '');
      setCategory(existingCampaign.category || '');
      setTemplateId(existingCampaign.templateId);
      setChannel(existingCampaign.channel);
      setDailyLimit(existingCampaign.dailyLimit);
      setStatus(existingCampaign.status);
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

    saveMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      city: city.trim() || undefined,
      category: category.trim() || undefined,
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
      className="space-y-6 max-w-4xl mx-auto pb-12"
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
              Specify lead audience filters, outreach channel, message template, and batch sending limits.
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
        {/* Left Column: Main Campaign Details */}
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
                  placeholder="e.g. Surat Hair Salons - Cold Email Wave 1"
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
                  placeholder="Internal notes about target audience or offer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Lead Targeting Criteria Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Target Demographics & Filters
            </h3>
            <p className="text-[11px] text-muted-foreground">
              When triggered, this campaign automatically searches your lead database for contacts matching these criteria.
            </p>

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
                  placeholder="e.g. Salon, Cafe, Dentist (or blank for all)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
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
