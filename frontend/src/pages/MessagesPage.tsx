import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { leadService } from '../services/leadService';
import { templateService } from '../services/templateService';
import { messageService, SendEmailPayload, SendWhatsAppPayload } from '../services/messageService';
import { personalizationService } from '../services/personalizationService';
import { MessagePreviewResponse } from '../types/message';
import { PersonalizationResponse } from '../types/personalization';
import { 
  Send, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  User, 
  FileText, 
  CheckCircle2, 
  Copy, 
  RefreshCw,
  Building2,
  MapPin,
  Globe,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Key,
  Settings,
  Rocket,
  PartyPopper,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const MessagesPage: React.FC = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [enableAI, setEnableAI] = useState<boolean>(true);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'mock'>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [quickApiKey, setQuickApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'personalized' | 'base' | 'comparison'>('personalized');
  const [copied, setCopied] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Fetch AI Status
  const { data: aiStatus } = useQuery({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const data = await personalizationService.getAIStatus();
      if (data.provider) {
        setSelectedProvider(data.provider as any);
        setSelectedModel(data.model);
      }
      return data;
    },
  });

  // Fetch Leads (limit 100 for selection)
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', { limit: 100 }],
    queryFn: () => leadService.getLeads({ limit: 100 }),
  });

  // Fetch Templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates(),
  });

  // Standard Template Preview Mutation
  const standardPreviewMutation = useMutation({
    mutationFn: () => {
      if (!selectedLeadId || !selectedTemplateId) {
        throw new Error('Please select both a lead and a template');
      }
      return messageService.previewMessage({
        leadId: Number(selectedLeadId),
        templateId: Number(selectedTemplateId),
      });
    },
  });

  // AI Personalization Mutation
  const aiPersonalizationMutation = useMutation({
    mutationFn: () => {
      if (!selectedLeadId || !selectedTemplateId) {
        throw new Error('Please select both a lead and a template');
      }
      return personalizationService.generatePersonalization({
        leadId: Number(selectedLeadId),
        templateId: Number(selectedTemplateId),
        customInstructions: customInstructions.trim() || undefined,
        provider: selectedProvider,
        model: selectedModel,
        apiKey: quickApiKey.trim() || undefined,
      });
    },
  });

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error('No lead selected');

      // Determine which message content to send
      const subject = aiData
        ? (activeTab === 'base' ? aiData.baseRendered.subject : aiData.personalized.subject) || ''
        : standardData?.rendered.subject || '';
      const body = aiData
        ? (activeTab === 'base' ? aiData.baseRendered.body : aiData.personalized.body)
        : standardData?.rendered.body || '';
      const channel = aiData?.template.channel || standardData?.template.channel;

      if (channel === 'EMAIL') {
        if (!selectedLead.email) throw new Error('This lead has no email address. Please add one in the Leads page first.');
        const payload: SendEmailPayload = {
          leadId: selectedLead.id,
          recipient: selectedLead.email,
          subject: subject || `Outreach to ${selectedLead.businessName}`,
          body,
        };
        return messageService.sendEmail(payload);
      } else {
        if (!selectedLead.phone) throw new Error('This lead has no phone number. Please add one in the Leads page first.');
        const payload: SendWhatsAppPayload = {
          leadId: selectedLead.id,
          recipient: selectedLead.phone,
          body,
        };
        return messageService.sendWhatsApp(payload);
      }
    },
    onSuccess: () => {
      setSendSuccess(true);
      setShowSendConfirm(false);
      setTimeout(() => setSendSuccess(false), 5000);
    },
    onError: () => {
      setShowSendConfirm(false);
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedTemplateId) return;
    setSendSuccess(false);

    if (enableAI) {
      aiPersonalizationMutation.mutate();
    } else {
      standardPreviewMutation.mutate();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedLead = leadsData?.leads.find((l) => l.id === Number(selectedLeadId));
  const selectedTemplate = templates.find((t) => t.id === Number(selectedTemplateId));

  const standardData: MessagePreviewResponse | undefined = standardPreviewMutation.data;
  const aiData: PersonalizationResponse | undefined = aiPersonalizationMutation.data;

  const isPending = enableAI ? aiPersonalizationMutation.isPending : standardPreviewMutation.isPending;
  const isError = enableAI ? aiPersonalizationMutation.isError : standardPreviewMutation.isError;
  const error = enableAI ? (aiPersonalizationMutation.error as Error) : (standardPreviewMutation.error as Error);
  const hasPreview = Boolean(aiData || standardData);
  const currentChannel = aiData?.template.channel || standardData?.template.channel;
  const canSend = hasPreview && selectedLead && (
    (currentChannel === 'EMAIL' && selectedLead.email) ||
    (currentChannel === 'WHATSAPP' && selectedLead.phone)
  );

  const currentProviderDetails = aiStatus?.availableProviders?.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Send className="w-7 h-7 text-indigo-500" />
            Message Generation & AI Personalization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize outreach with Gemini, OpenAI, or Local engine with zero hallucinations and instant model switching.
          </p>
        </div>

        {/* AI Readiness Badge & Settings Link */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>AI Settings & Keys</span>
          </Link>
          {aiStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-muted-foreground">Default:</span>
              <span className="font-semibold text-foreground uppercase text-[11px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                {aiStatus.provider}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selectors & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Configure Outreach Message
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Lead Selector */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  1. Select Target Lead
                </label>
                {leadsLoading ? (
                  <div className="h-10 bg-muted/40 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => {
                      setSelectedLeadId(e.target.value ? Number(e.target.value) : '');
                      standardPreviewMutation.reset();
                      aiPersonalizationMutation.reset();
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- Choose a lead --</option>
                    {leadsData?.leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.businessName} ({lead.city || 'No City'} • {lead.category || 'Lead'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  2. Select Outreach Template
                </label>
                {templatesLoading ? (
                  <div className="h-10 bg-muted/40 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value ? Number(e.target.value) : '');
                      standardPreviewMutation.reset();
                      aiPersonalizationMutation.reset();
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- Choose a template --</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        [{tpl.channel}] {tpl.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* AI Enhancement Toggle */}
              <div className="p-3.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-foreground">AI Personalization Agent</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAI}
                      onChange={(e) => setEnableAI(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {enableAI && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-2 border-t border-indigo-500/10 text-xs"
                  >
                    {/* Provider Select */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          AI Engine:
                        </label>
                        <select
                          value={selectedProvider}
                          onChange={(e) => {
                            const newProv = e.target.value as any;
                            setSelectedProvider(newProv);
                            const p = aiStatus?.availableProviders.find((x) => x.id === newProv);
                            if (p) setSelectedModel(p.defaultModel);
                          }}
                          className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="gemini">Google Gemini</option>
                          <option value="openai">OpenAI GPT</option>
                          <option value="mock">Local Heuristic (No Key)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          Model Version:
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {currentProviderDetails?.models.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          )) || <option value={selectedModel}>{selectedModel}</option>}
                        </select>
                      </div>
                    </div>

                    {/* Quick API Key Input (if provider requires key and user wants to provide/override) */}
                    {currentProviderDetails?.requiresKey && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            {selectedProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI Key'}:
                          </label>
                          {aiStatus?.hasKey && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Server Key Active
                            </span>
                          )}
                        </div>
                        <input
                          type="password"
                          placeholder={
                            aiStatus?.hasKey
                              ? 'Using server key (type to override)'
                              : 'Paste API key here...'
                          }
                          value={quickApiKey}
                          onChange={(e) => setQuickApiKey(e.target.value)}
                          className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Custom Prompt Instructions */}
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Custom Focus / Strategy (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Mention their 4.8 star rating and mobile site speed"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={!selectedLeadId || !selectedTemplateId || isPending}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {enableAI ? 'AI Personalizing Message...' : 'Rendering Preview...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {enableAI ? 'Generate AI Personalized Message' : 'Render Standard Preview'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Lead Context Summary Card */}
          {selectedLead && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 border border-border/80 rounded-xl p-4 space-y-3"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Selected Lead Context
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="font-medium text-foreground flex items-center justify-between">
                  <span>{selectedLead.businessName}</span>
                  {selectedLead.score && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {selectedLead.score} Score
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedLead.city || 'Unknown City'} • {selectedLead.category || 'General'}
                </div>
                {selectedLead.website ? (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 truncate">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedLead.website}</span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 rounded bg-muted text-muted-foreground">
                      {selectedLead.websiteStatus || 'UNKNOWN'}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> No website found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Template Info Card */}
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 border border-border/80 rounded-xl p-4 space-y-3"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Selected Template Info
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{selectedTemplate.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selectedTemplate.channel}
                  </span>
                </div>
                {selectedTemplate.description && (
                  <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Live Rendered Output */}
        <div className="lg:col-span-7">
          <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col min-h-[540px]">
            {/* Output Header with Tabs */}
            <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(aiData?.template.channel || standardData?.template.channel) === 'WHATSAPP' ? (
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Mail className="w-5 h-5 text-indigo-500" />
                )}
                <span className="font-semibold text-foreground text-sm">
                  {aiData ? 'Personalized Message' : standardData ? 'Standard Template Preview' : 'Outreach Message Preview'}
                </span>
              </div>

              {/* View Switcher Tabs if AI Data is loaded */}
              {aiData && (
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setActiveTab('personalized')}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeTab === 'personalized'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    AI Personalized
                  </button>
                  <button
                    onClick={() => setActiveTab('base')}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeTab === 'base'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Base Template
                  </button>
                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                      activeTab === 'comparison'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Compare Diff
                  </button>
                </div>
              )}

              {/* Copy Button */}
              {(aiData || standardData) && (
                <button
                  onClick={() => {
                    const text = aiData
                      ? activeTab === 'base'
                        ? aiData.baseRendered.subject
                          ? `Subject: ${aiData.baseRendered.subject}\n\n${aiData.baseRendered.body}`
                          : aiData.baseRendered.body
                        : aiData.personalized.subject
                        ? `Subject: ${aiData.personalized.subject}\n\n${aiData.personalized.body}`
                        : aiData.personalized.body
                      : standardData?.rendered.subject
                      ? `Subject: ${standardData.rendered.subject}\n\n${standardData.rendered.body}`
                      : standardData?.rendered.body || '';
                    handleCopy(text);
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1.5 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Send Success Banner */}
            {sendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mt-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400"
              >
                <PartyPopper className="w-5 h-5" />
                <span className="font-medium">Message sent successfully!</span>
                <span className="text-xs text-emerald-400/70">
                  {currentChannel === 'EMAIL' ? `Email dispatched to ${selectedLead?.email}` : `WhatsApp sent to ${selectedLead?.phone}`}
                </span>
              </motion.div>
            )}

            {/* Send Error Banner */}
            {sendMutation.isError && !sendSuccess && (
              <div className="mx-5 mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{(sendMutation.error as Error)?.message || 'Failed to send message'}</span>
              </div>
            )}

            {/* Output Body */}
            <div className="p-6 flex-1 flex flex-col justify-center">
              {isPending ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-foreground">
                    {enableAI ? 'Personalizing outreach message...' : 'Generating standard preview...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {enableAI
                      ? `AI agent (${selectedProvider.toUpperCase()}) is weaving verified lead facts into the outreach`
                      : 'Substituting template tags with lead data'}
                  </p>
                </div>
              ) : isError ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  <p className="font-semibold">Error rendering message:</p>
                  <p className="text-xs mt-1">{error.message}</p>
                </div>
              ) : aiData ? (
                <div className="space-y-4">
                  {/* AI Metadata Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-foreground">
                        Engine: <span className="uppercase">{aiData.metadata.provider}</span> ({aiData.metadata.model})
                      </span>
                    </div>
                    {aiData.metadata.usedFallback ? (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Fallback Mode Active ({aiData.metadata.fallbackReason})
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Anti-Hallucination Verified
                      </span>
                    )}
                  </div>

                  {/* AI Reasoning Note */}
                  {aiData.metadata.reasoning && (
                    <div className="text-xs text-muted-foreground bg-muted/20 border border-border/60 p-2.5 rounded-lg">
                      <span className="font-medium text-foreground">Personalization Context: </span>
                      {aiData.metadata.reasoning}
                    </div>
                  )}

                  {/* Tab Views */}
                  {activeTab === 'personalized' && (
                    <div className="space-y-3">
                      {aiData.personalized.subject && (
                        <div className="bg-muted/30 border border-border/80 rounded-lg p-3.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Personalized Subject Line
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {aiData.personalized.subject}
                          </div>
                        </div>
                      )}
                      <div className="bg-muted/30 border border-border/80 rounded-lg p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Personalized Message Body
                        </div>
                        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {aiData.personalized.body}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'base' && (
                    <div className="space-y-3">
                      {aiData.baseRendered.subject && (
                        <div className="bg-muted/30 border border-border/80 rounded-lg p-3.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Base Template Subject Line
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {aiData.baseRendered.subject}
                          </div>
                        </div>
                      )}
                      <div className="bg-muted/30 border border-border/80 rounded-lg p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Base Template Body
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {aiData.baseRendered.body}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'comparison' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Base */}
                      <div className="bg-muted/20 border border-border/80 rounded-lg p-3 space-y-2">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Original Template
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {aiData.baseRendered.subject && (
                            <p className="font-semibold text-foreground mb-1">Subj: {aiData.baseRendered.subject}</p>
                          )}
                          {aiData.baseRendered.body}
                        </div>
                      </div>

                      {/* Right: AI Personalized */}
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 space-y-2">
                        <div className="text-[11px] font-semibold text-indigo-400 uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Personalized
                        </div>
                        <div className="text-xs text-foreground whitespace-pre-wrap">
                          {aiData.personalized.subject && (
                            <p className="font-semibold text-indigo-300 mb-1">Subj: {aiData.personalized.subject}</p>
                          )}
                          {aiData.personalized.body}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : standardData ? (
                <div className="space-y-4">
                  {/* Standard Message View */}
                  {standardData.template.channel === 'EMAIL' && (
                    <div className="bg-muted/30 border border-border/80 rounded-lg p-3.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Subject Line
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {standardData.rendered.subject || '(No Subject)'}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/30 border border-border/80 rounded-lg p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Message Content
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {standardData.rendered.body}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                      <User className="w-3 h-3" /> Lead #{standardData.lead.id}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                      <FileText className="w-3 h-3" /> Template #{standardData.template.id}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Standard Tags Substituted
                    </span>
                  </div>
                </div>

              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                    <Send className="w-6 h-6 opacity-60" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">No Preview Generated</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                      Choose a target lead and outreach template on the left, then click &quot;Generate AI Personalized Message&quot;.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Send Message Button (shown when preview is available) ─── */}
              {hasPreview && !sendSuccess && (
                <div className="border-t border-border px-6 py-4 mt-2">
                  {!showSendConfirm ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowSendConfirm(true)}
                        disabled={!canSend || sendMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-5 rounded-lg shadow-sm transition-all text-sm"
                      >
                        <Rocket className="w-4 h-4" />
                        {currentChannel === 'EMAIL' ? 'Send Email Now' : 'Send WhatsApp Now'}
                      </button>
                      {!canSend && hasPreview && (
                        <div className="text-xs text-amber-400 flex items-center gap-1 max-w-[200px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {currentChannel === 'EMAIL'
                            ? 'Lead has no email address'
                            : 'Lead has no phone number'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Confirm Send</p>
                          <p className="mt-0.5">
                            {currentChannel === 'EMAIL'
                              ? <>This will send an email to <strong className="text-foreground">{selectedLead?.email}</strong> via Gmail.</>
                              : <>This will send a WhatsApp message to <strong className="text-foreground">{selectedLead?.phone}</strong> via OpenWA.</>
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sendMutation.mutate()}
                          disabled={sendMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm"
                        >
                          {sendMutation.isPending ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                          ) : (
                            <><Send className="w-4 h-4" /> Yes, Send It</>
                          )}
                        </button>
                        <button
                          onClick={() => setShowSendConfirm(false)}
                          disabled={sendMutation.isPending}
                          className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
