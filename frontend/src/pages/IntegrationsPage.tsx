import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import {
  Layers,
  Bot,
  Mail,
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Send,
  Loader2,
  Key,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Code2,
  MailCheck,
  Info,
  Copy,
  Check,
  QrCode,
  Power,
  PowerOff,
  RotateCcw,
  LogOut,
  Trash2,
  Plus,
  Smartphone,
  X,
} from 'lucide-react';

import { personalizationService } from '../services/personalizationService';
import { outreachService } from '../services/outreachService';
import type { TestEmailResult, SaveGmailCredentialsResponse } from '../types/outreach';
import type { WaSession, WaQrCode, WaCreateSession, WaSessionStatus } from '../types/whatsapp';

interface SerpApiStatus {
  accountStatus: string;
  planName: string;
  planId: string;
  planRenewalDate: string;
  searchesPerMonth: number;
  planSearchesLeft: number;
  extraCredits: number;
  totalSearchesLeft: number;
  thisMonthUsage: number;
  thisHourSearches: number;
  lastHourSearches: number;
  accountRateLimitPerHour: number;
}

const QUICK_PROMPTS = [
  'Test connection: What is LeadHunter AI?',
  'Write a punchy 1-line opening hook for a local hair salon in Surat',
  'Give 3 reasons why a business needs a modern mobile website',
];

export const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // AI State
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'mock'>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [apiKeyInput, setApiKeyInput] = useState('');

  // AI Live Chat Test State
  const [testPrompt, setTestPrompt] = useState(QUICK_PROMPTS[0]);
  const [aiTestResponse, setAiTestResponse] = useState<string | null>(null);

  // Queries
  const { data: aiStatus, isLoading: aiLoading, refetch: refetchAI } = useQuery({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const data = await personalizationService.getAIStatus();
      setSelectedProvider(data.provider as any);
      setSelectedModel(data.model);
      return data;
    },
  });

  const { data: gmailStatus, isLoading: gmailLoading, refetch: refetchGmail } = useQuery({
    queryKey: ['gmailStatus'],
    queryFn: () => outreachService.getGmailStatus(),
  });

  const { data: whatsappStatus, isLoading: whatsappLoading, refetch: refetchWhatsApp } = useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: () => outreachService.getWhatsAppStatus(),
  });

  const { data: serpapiStatus, isLoading: serpapiLoading, refetch: refetchSerpApi } = useQuery<SerpApiStatus>({
    queryKey: ['serpapi-status'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/serpapi/status');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load SerpAPI status');
      return json.data;
    },
    retry: false,
  });

  // Mutations
  const saveAIConfigMutation = useMutation({
    mutationFn: (data: { provider: 'gemini' | 'openai' | 'mock'; apiKey?: string; model?: string }) =>
      personalizationService.updateAIConfig(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['aiStatus'], updated);
      toast.success(`AI engine configured: ${updated.provider.toUpperCase()} (${updated.model})`);
      setApiKeyInput('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save AI configuration');
    },
  });

  const testAIChatMutation = useMutation({
    mutationFn: (prompt: string) =>
      personalizationService.testAIChat(prompt, {
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKeyInput.trim() ? apiKeyInput.trim() : undefined,
      }),
    onSuccess: (data) => {
      setAiTestResponse(data.reply);
      toast.success(`Received response from ${data.provider} (${data.model})`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'AI test failed');
    },
  });

  const connectGmailMutation = useMutation({
    mutationFn: () => outreachService.connectGmail(),
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (err: any) => {
      toast.error(`Gmail Connection Error: ${err.message}`);
    },
  });

  // Manual Gmail credentials paste (bypass OAuth consent)
  const [manualGmailClientId, setManualGmailClientId] = useState('');
  const [manualGmailClientSecret, setManualGmailClientSecret] = useState('');
  const [manualGmailRedirectUri, setManualGmailRedirectUri] = useState(
    'http://localhost:5000/api/integrations/gmail/callback'
  );
  const [manualGmailRefreshToken, setManualGmailRefreshToken] = useState('');
  const [showManualGmailSection, setShowManualGmailSection] = useState(false);

  const saveManualGmailMutation = useMutation({
    mutationFn: (): Promise<SaveGmailCredentialsResponse> =>
      outreachService.saveGmailCredentials({
        clientId: manualGmailClientId.trim() || undefined,
        clientSecret: manualGmailClientSecret.trim() || undefined,
        redirectUri: manualGmailRedirectUri.trim() || undefined,
        refreshToken: manualGmailRefreshToken.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success('Gmail credentials saved to database');
      // Clear sensitive fields from UI after save
      setManualGmailClientSecret('');
      setManualGmailRefreshToken('');
      queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
      // If all 3 creds present, redirect to OAuth flow
      if (data.authUrl && !data.credentialState.hasRefreshToken) {
        window.location.href = data.authUrl;
      }
    },
    onError: (err: any) => {
      toast.error(`Failed to save Gmail credentials: ${err.message}`);
    },
  });

  // Gmail test email state
  const [testRecipient, setTestRecipient] = useState('');
  const [lastTestResult, setLastTestResult] = useState<TestEmailResult | null>(null);

  const sendTestEmailMutation = useMutation({
    mutationFn: (recipient: string) => outreachService.sendTestEmail({ recipient }),
    onSuccess: (data) => {
      setLastTestResult(data);
      queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
      if (data.providerUsed === 'GMAIL' && data.providerMode === 'oauth' && data.providerIsConnected) {
        toast.success(`Test email dispatched via GMAIL to ${data.recipient}`);
      } else if (data.providerUsed === 'MOCK') {
        toast.warning('Test email sent via MOCK provider (no real email delivered) — Gmail credentials not loaded yet');
      } else {
        toast.info(`Test completed. Provider: ${data.providerUsed}`);
      }
    },
    onError: (err: any) => {
      toast.error(`Test email failed: ${err.message}`);
      setLastTestResult(null);
    },
  });

  // Copy helper for redirect URI (prevents 400: redirect_uri_mismatch)
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const handleCopyRedirectUri = () => {
    const uri = (gmailStatus?.redirectUri as string) || manualGmailRedirectUri;
    navigator.clipboard.writeText(uri);
    setCopiedRedirectUri(true);
    setTimeout(() => setCopiedRedirectUri(false), 2000);
  };

  // Auto-refresh Gmail status after OAuth redirect (with ?gmail=connected)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected') {
      toast.success('Gmail OAuth completed — tokens persisted');
      queryClient.invalidateQueries({ queryKey: ['gmailStatus'] });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  // ────────────────────────────────────────────────────────────────
  // WhatsApp / OpenWA state, queries, mutations
  // ────────────────────────────────────────────────────────────────

  const [showCreateWaSession, setShowCreateWaSession] = useState(false);
  const [waNewSessionName, setWaNewSessionName] = useState('');
  const [waPairingPhone, setWaPairingPhone] = useState('');
  const [waLastPairingCode, setWaLastPairingCode] = useState<string | null>(null);
  const [waSelectedSessionId, setWaSelectedSessionId] = useState<string | null>(null);

  const { data: waSessions, isLoading: waSessionsLoading, refetch: refetchWaSessions } = useQuery({
    queryKey: ['waSessions'],
    queryFn: () => outreachService.listWaSessions(),
    enabled: !!whatsappStatus?.gatewayReachable,
    staleTime: 5000,
  });

  const { data: waQrCode, isLoading: waQrLoading, refetch: refetchWaQr } = useQuery({
    queryKey: ['waQrCode', waSelectedSessionId || whatsappStatus?.sessionId],
    queryFn: () => outreachService.getWaQrCode(waSelectedSessionId || undefined),
    enabled: !!whatsappStatus?.gatewayReachable,
    staleTime: 2000,
  });

  const createWaSessionMutation = useMutation({
    mutationFn: (data: WaCreateSession) => outreachService.createWaSession(data),
    onSuccess: (sess) => {
      toast.success(`Session "${sess.name}" created (status: ${sess.status})`);
      setShowCreateWaSession(false);
      setWaNewSessionName('');
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Create session failed: ${err.message}`),
  });

  const startWaSessionMutation = useMutation({
    mutationFn: (id: string) => outreachService.startWaSession(id),
    onSuccess: (sess) => {
      toast.success(`Started session "${sess.name}" (${sess.status})`);
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      queryClient.invalidateQueries({ queryKey: ['waQrCode'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Start failed: ${err.message}`),
  });

  const stopWaSessionMutation = useMutation({
    mutationFn: (id: string) => outreachService.stopWaSession(id),
    onSuccess: (sess) => {
      toast.success(`Stopped session "${sess.name}"`);
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Stop failed: ${err.message}`),
  });

  const restartWaSessionMutation = useMutation({
    mutationFn: (id: string) => outreachService.restartWaSession(id),
    onSuccess: (sess) => {
      toast.success(`Restarted session "${sess.name}" (${sess.status})`);
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      queryClient.invalidateQueries({ queryKey: ['waQrCode'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Restart failed: ${err.message}`),
  });

  const logoutWaSessionMutation = useMutation({
    mutationFn: (id: string) => outreachService.logoutWaSession(id),
    onSuccess: (sess) => {
      toast.success(`Logged out session "${sess.name}"`);
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      queryClient.invalidateQueries({ queryKey: ['waQrCode'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Logout failed: ${err.message}`),
  });

  const deleteWaSessionMutation = useMutation({
    mutationFn: (id: string) => outreachService.deleteWaSession(id),
    onSuccess: (_, id) => {
      toast.success(`Deleted session ${id}`);
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Delete failed: ${err.message}`),
  });

  const forceKillWaSessionMutation = useMutation({
    mutationFn: (id: string) => outreachService.forceKillWaSession(id),
    onSuccess: (sess) => {
      toast.success(`Force-killed "${sess.name}" process`);
      queryClient.invalidateQueries({ queryKey: ['waSessions'] });
      refetchWhatsApp();
    },
    onError: (err: any) => toast.error(`Force-kill failed: ${err.message}`),
  });

  const requestWaPairingCodeMutation = useMutation({
    mutationFn: ({ phone, sid }: { phone: string; sid?: string }) =>
      outreachService.requestWaPairingCode(phone, sid),
    onSuccess: (r) => {
      setWaLastPairingCode(r.pairingCode);
      toast.success(`Pairing code generated: ${r.pairingCode} — enter this into WhatsApp → Linked Devices`);
    },
    onError: (err: any) => toast.error(`Pairing code failed: ${err.message}`),
  });

  const handleCreateWaSession = (e: React.FormEvent) => {
    e.preventDefault();
    const name = waNewSessionName.trim();
    if (!name) return;
    createWaSessionMutation.mutate({ name });
  };

  const handleRequestPairingCode = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = waPairingPhone.trim();
    if (!phone) return;
    requestWaPairingCodeMutation.mutate({
      phone,
      sid: waSelectedSessionId || undefined,
    });
  };

  const statusBadgeClass = (status: WaSessionStatus) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'qr_ready':
      case 'authenticating':
      case 'initializing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'disconnected':
      case 'failed':
      case 'action_required':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'created':
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const refetchAll = () => {
    refetchAI();
    refetchGmail();
    refetchWhatsApp();
    refetchSerpApi();
    toast.info('Refreshed all integration statuses');
  };

  const handleSaveAIConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAIConfigMutation.mutate({
      provider: selectedProvider,
      model: selectedModel,
      apiKey: apiKeyInput.trim() ? apiKeyInput.trim() : undefined,
    });
  };

  const handleSendTestChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    testAIChatMutation.mutate(testPrompt.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-6xl mx-auto pb-16"
    >
      <Toaster position="top-right" theme="system" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Integrations & Service Connections
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect AI personalization engines, Gmail OAuth, OpenWA WhatsApp gateway, and SerpAPI lead discovery.
          </p>
        </div>

        <button
          onClick={refetchAll}
          className="px-3 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Statuses
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Google Gemini AI Engine Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header & status badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Google Gemini AI Engine</h3>
                  <p className="text-xs text-muted-foreground">Personalized cold outreach & dynamic message refinement</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                  aiStatus?.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}
              >
                {aiStatus?.isConfigured ? 'Connected & Ready' : 'Key Needed / Fallback'}
              </span>
            </div>

            {/* Provider and key selector form */}
            <form onSubmit={handleSaveAIConfig} className="space-y-3 bg-secondary/30 p-3.5 rounded-lg border border-border/50 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">AI Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI GPT</option>
                    <option value="mock">Local Heuristic (No Key)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {selectedProvider === 'gemini' ? (
                      <>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Intelligence)</option>
                        <option value="gemini-flash-latest">gemini-flash-latest</option>
                        <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Ultra Fast)</option>
                      </>
                    ) : selectedProvider === 'openai' ? (
                      <>
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="gpt-4o">gpt-4o</option>
                      </>
                    ) : (
                      <option value="local-heuristic-v1">local-heuristic-v1</option>
                    )}
                  </select>
                </div>
              </div>

              {selectedProvider !== 'mock' && (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    {selectedProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={aiStatus?.hasKey ? '•••••••••••••••• (Key saved in env)' : 'Paste API Key here...'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={saveAIConfigMutation.isPending}
                      className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Interactive Live AI Test Console */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Live AI Chat / Prompt Test Console
                </span>
                <span className="text-[10px] text-muted-foreground">Test key connectivity live</span>
              </div>

              {/* Quick sample prompt chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestPrompt(p)}
                    className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    Preset {i + 1}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendTestChat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a test prompt or question to AI..."
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={testAIChatMutation.isPending || !testPrompt.trim()}
                  className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {testAIChatMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send
                </button>
              </form>

              {/* Response output */}
              <AnimatePresence>
                {aiTestResponse && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-secondary/40 border border-primary/20 rounded-lg p-3 text-xs text-foreground space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/40 pb-1">
                      <span className="font-semibold text-primary">Response Output:</span>
                      <span>Model: {selectedModel}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed pt-1 font-sans text-xs">{aiTestResponse}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 2. OpenWA WhatsApp Gateway Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">OpenWA WhatsApp Gateway</h3>
                  <p className="text-xs text-muted-foreground">Self-hosted WhatsApp API session for backend-controlled messaging</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                  whatsappStatus?.isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : whatsappStatus?.gatewayReachable
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}
              >
                {whatsappLoading
                  ? 'Checking...'
                  : whatsappStatus?.isConnected
                    ? 'Session Ready'
                    : whatsappStatus?.gatewayReachable
                      ? 'Gateway Reachable'
                      : 'Not Connected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-secondary/30 p-3 rounded-lg border border-border/50 text-[11px]">
              <div>
                <span className="text-muted-foreground">Gateway:</span>
                <div className="font-mono text-foreground truncate">{whatsappStatus?.baseUrl || '—'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Env Session:</span>
                <div className="font-mono text-foreground truncate">{whatsappStatus?.sessionId || '—'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-mono text-foreground">{whatsappStatus?.sessionStatus || 'unknown'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Precheck:</span>
                <div className="font-mono text-foreground">{whatsappStatus?.precheckContacts ? 'ON' : 'OFF'}</div>
              </div>
            </div>

            {!whatsappStatus?.gatewayReachable && (
              <div className="bg-secondary/20 border border-border/50 rounded-lg p-3 text-xs space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  Setup:
                </p>
                <ol className="list-decimal list-inside text-muted-foreground text-[11px] space-y-0.5">
                  <li>Start OpenWA gateway (dashboard: <code className="font-mono text-foreground">http://localhost:2785</code>)</li>
                  <li>Set <code className="font-mono text-foreground">OPENWA_BASE_URL</code>, <code className="font-mono text-foreground">OPENWA_API_KEY</code>, <code className="font-mono text-foreground">OPENWA_SESSION_ID</code> in backend env</li>
                  <li>Restart backend server, then refresh statuses</li>
                </ol>
                {whatsappStatus?.error && <p className="text-[11px] text-amber-300 pt-1">{whatsappStatus.error}</p>}
              </div>
            )}

            {whatsappStatus?.gatewayReachable && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateWaSession(true)}
                    className="px-2.5 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    New Session
                  </button>
                  <button
                    type="button"
                    onClick={() => { refetchWaSessions(); refetchWaQr(); refetchWhatsApp(); }}
                    className="px-2.5 py-1.5 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${waSessionsLoading || waQrLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <AnimatePresence>
                  {showCreateWaSession && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 bg-secondary/40 p-3 rounded-lg border border-border/60 text-[11px] overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Create New WhatsApp Session</span>
                        <button
                          type="button"
                          onClick={() => setShowCreateWaSession(false)}
                          className="p-0.5 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateWaSession} className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Session name (e.g. leadshunter-main)"
                          value={waNewSessionName}
                          onChange={(e) => setWaNewSessionName(e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-background border border-border rounded-md text-[11px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="submit"
                          disabled={createWaSessionMutation.isPending || !waNewSessionName.trim()}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {createWaSessionMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                          Create
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Sessions</span>
                    <span className="text-[10px] text-muted-foreground">
                      {waSessionsLoading ? 'Loading...' : `${waSessions?.length ?? 0} session(s)`}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                    {waSessionsLoading && (
                      <div className="text-[11px] text-muted-foreground py-3 text-center flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading sessions from OpenWA gateway...
                      </div>
                    )}

                    {!waSessionsLoading && waSessions && waSessions.length === 0 && (
                      <div className="text-[11px] text-muted-foreground py-3 text-center bg-secondary/20 border border-border/50 rounded-md">
                        No sessions found on gateway — click "New Session" to create one.
                      </div>
                    )}

                    {!waSessionsLoading && waSessions && waSessions.map((s: WaSession) => {
                      const isSelected = waSelectedSessionId === s.id || (!waSelectedSessionId && s.id === whatsappStatus?.sessionId);
                      const isReady = s.status === 'ready';
                      const isQr = s.status === 'qr_ready' || s.status === 'created' || s.status === 'initializing';
                      const isStopped = s.status === 'disconnected' || s.status === 'failed';
                      return (
                        <div
                          key={s.id}
                          className={`border rounded-lg p-2.5 text-[11px] space-y-2 transition-colors ${
                            isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setWaSelectedSessionId(isSelected ? null : s.id)}
                                  className="text-left font-semibold text-foreground truncate hover:text-primary transition-colors"
                                  title={isSelected ? 'Deselect' : 'Select for QR / pairing code'}
                                >
                                  {s.name}
                                </button>
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border shrink-0 ${statusBadgeClass(s.status)}`}>
                                  {s.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                                id: {s.id}
                                {s.phone && <> · w: {s.phone}</>}
                                {s.pushName && <> · {s.pushName}</>}
                              </div>
                              {s.lastError && (
                                <div className="text-[10px] text-rose-400 mt-0.5 truncate">err: {s.lastError}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {!isReady && (
                              <button
                                type="button"
                                onClick={() => startWaSessionMutation.mutate(s.id)}
                                disabled={startWaSessionMutation.isPending}
                                title="Start session → QR / auth"
                                className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-medium transition-colors flex items-center gap-0.5 disabled:opacity-50"
                              >
                                <Power className="w-2.5 h-2.5" /> Start
                              </button>
                            )}
                            {isReady && (
                              <button
                                type="button"
                                onClick={() => stopWaSessionMutation.mutate(s.id)}
                                disabled={stopWaSessionMutation.isPending}
                                title="Stop session (clean logout from engine)"
                                className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 font-medium transition-colors flex items-center gap-0.5 disabled:opacity-50"
                              >
                                <PowerOff className="w-2.5 h-2.5" /> Stop
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => restartWaSessionMutation.mutate(s.id)}
                              disabled={restartWaSessionMutation.isPending}
                              title="Restart session engine"
                              className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-medium transition-colors flex items-center gap-0.5 disabled:opacity-50"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Restart
                            </button>
                            {isReady && (
                              <button
                                type="button"
                                onClick={() => logoutWaSessionMutation.mutate(s.id)}
                                disabled={logoutWaSessionMutation.isPending}
                                title="Log out WhatsApp account (invalidates session)"
                                className="px-2 py-1 rounded bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 border border-violet-500/30 font-medium transition-colors flex items-center gap-0.5 disabled:opacity-50"
                              >
                                <LogOut className="w-2.5 h-2.5" /> Logout
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => forceKillWaSessionMutation.mutate(s.id)}
                              disabled={forceKillWaSessionMutation.isPending}
                              title="Force-kill stuck engine process"
                              className="px-2 py-1 rounded bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 font-medium transition-colors flex items-center gap-0.5 disabled:opacity-50"
                            >
                              <XCircle className="w-2.5 h-2.5" /> Kill
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete session "${s.name}"? This cannot be undone.`)) {
                                  deleteWaSessionMutation.mutate(s.id);
                                }
                              }}
                              disabled={deleteWaSessionMutation.isPending}
                              title="Delete session permanently"
                              className="px-2 py-1 rounded bg-zinc-600/15 hover:bg-zinc-600/25 text-zinc-400 border border-zinc-500/30 font-medium transition-colors flex items-center gap-0.5 disabled:opacity-50 ml-auto"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" /> QR Code Auth
                      </span>
                      <button
                        type="button"
                        onClick={() => refetchWaQr()}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 inline ${waQrLoading ? 'animate-spin' : ''}`} /> Regen
                      </button>
                    </div>
                    <div className="aspect-square bg-white rounded-md flex items-center justify-center border border-border overflow-hidden">
                      {waQrLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : waQrCode?.qrCode ? (
                        <img
                          src={waQrCode.qrCode}
                          alt="WhatsApp login QR"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center text-[10px] text-muted-foreground px-2 space-y-1">
                          <div><QrCode className="w-6 h-6 mx-auto mb-1 opacity-50" /></div>
                          <div>No QR available.</div>
                          <div>Start or select a qr_ready session.</div>
                        </div>
                      )}
                    </div>
                    {waQrCode?.status && (
                      <div className="text-center text-[10px] text-muted-foreground font-mono">
                        status: {waQrCode.status}
                      </div>
                    )}
                  </div>

                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Pairing Code (Phone)
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Alternative to QR: enter the account phone number, receive an 8-char code, then enter it in WhatsApp → Settings → Linked Devices → Link with Phone Number.
                    </p>
                    <form onSubmit={handleRequestPairingCode} className="flex flex-col gap-1.5">
                      <input
                        type="tel"
                        placeholder="+919876543210 (E.164 format)"
                        value={waPairingPhone}
                        onChange={(e) => setWaPairingPhone(e.target.value)}
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-[11px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        disabled={requestWaPairingCodeMutation.isPending || !waPairingPhone.trim()}
                        className="w-full px-2 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {requestWaPairingCodeMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                        Generate 8-char Code
                      </button>
                    </form>
                    {waLastPairingCode && (
                      <div className="mt-1 bg-blue-600/15 border border-blue-500/30 rounded-md p-2 text-center">
                        <div className="text-[9px] text-blue-300 uppercase tracking-wider">Your Code</div>
                        <div className="text-lg font-bold font-mono text-blue-200 tracking-widest">
                          {waLastPairingCode.slice(0, 4)}-{waLastPairingCode.slice(4)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Gmail OAuth Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Gmail OAuth Integration</h3>
                  <p className="text-xs text-muted-foreground">Send cold email campaigns and track inbound replies</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                  gmailStatus?.isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}
              >
                {gmailStatus?.isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <div className="space-y-2 bg-secondary/30 p-3.5 rounded-lg border border-border/50 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Connected Account:</span>
                <span className="font-semibold text-foreground">
                  {(gmailStatus as any)?.connectedEmail || gmailStatus?.email || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">OAuth Mode:</span>
                <span className="font-mono text-foreground">{gmailStatus?.mode || 'unconfigured'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Credentials:</span>
                <span className="font-mono text-[10px] text-foreground">
                  ID: {gmailStatus?.hasClientId ? '✅' : '❌'} · Secret: {gmailStatus?.hasClientSecret ? '✅' : '❌'} · Refresh: {gmailStatus?.hasRefreshToken ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 py-1">
                <span className="text-muted-foreground shrink-0">Redirect URI:</span>
                <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                  <code className="font-mono text-foreground truncate text-[10px]">
                    {(gmailStatus?.redirectUri as string) || manualGmailRedirectUri}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRedirectUri}
                    title="Copy redirect URI (paste into Google Cloud Console → OAuth → Authorized redirect URIs)"
                    className="shrink-0 p-1 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedRedirectUri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* ⚠️ redirect_uri_mismatch diagnostic banner */}
            {!gmailStatus?.hasRefreshToken && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-[11px] space-y-1.5">
                <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Before clicking Connect:
                </p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                  <li>Copy the Redirect URI above (click 📋)</li>
                  <li>Open Google Cloud Console → <span className="text-foreground font-medium">APIs &amp; Services → Credentials → OAuth 2.0 Client IDs</span></li>
                  <li>Edit your credential → <span className="text-foreground font-medium">Authorized redirect URIs</span> → paste the URI → Save</li>
                  <li>Ensure <span className="text-foreground font-medium">mihirbuilds@gmail.com</span> is on the <span className="text-foreground font-medium">OAuth consent screen → Test users</span> list</li>
                </ol>
              </div>
            )}

            {/* Manual Credentials Section */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowManualGmailSection((v) => !v)}
                className="w-full text-left text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showManualGmailSection ? 'rotate-90' : ''}`} />
                {showManualGmailSection ? 'Hide' : 'Show'} Manual Credentials (paste directly / OAuth Playground)
              </button>

              <AnimatePresence>
                {showManualGmailSection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 bg-secondary/40 p-3 rounded-lg border border-border/60 text-[11px] overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">OAuth Client ID</label>
                        <input
                          type="text"
                          placeholder="xxx.apps.googleusercontent.com"
                          value={manualGmailClientId}
                          onChange={(e) => setManualGmailClientId(e.target.value)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">OAuth Client Secret</label>
                        <input
                          type="password"
                          placeholder="GOCSPX-xxxxxxxx"
                          value={manualGmailClientSecret}
                          onChange={(e) => setManualGmailClientSecret(e.target.value)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
                          Redirect URI <span className="text-muted-foreground/70">(must match Google Cloud Console exactly)</span>
                        </label>
                        <input
                          type="text"
                          value={manualGmailRedirectUri}
                          onChange={(e) => setManualGmailRedirectUri(e.target.value)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
                          Refresh Token <span className="text-muted-foreground/70">(from OAuth Playground — bypasses consent flow)</span>
                        </label>
                        <input
                          type="password"
                          placeholder="1//0abcdefghij..."
                          value={manualGmailRefreshToken}
                          onChange={(e) => setManualGmailRefreshToken(e.target.value)}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveManualGmailMutation.mutate()}
                      disabled={saveManualGmailMutation.isPending}
                      className="w-full px-3 py-1.5 rounded-md bg-background hover:bg-secondary border border-border text-[11px] font-semibold text-foreground transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {saveManualGmailMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      <Key className="w-3 h-3" />
                      Save Credentials to Database
                    </button>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      💡 <span className="text-foreground">Fastest setup:</span> Go to{' '}
                      <a
                        href="https://developers.google.com/oauthplayground"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        OAuth Playground <ExternalLink className="w-2.5 h-2.5" />
                      </a>{' '}
                      → Settings ⚙ → "Use your own OAuth credentials" → paste ID &amp; Secret → enter scopes <code className="text-foreground">https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email</code> → Authorize → Exchange → copy Refresh token → paste above → Save.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 🔬 Send Test Email Diagnostic */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MailCheck className="w-3.5 h-3.5 text-primary" />
                  Diagnostic: Send Test Email
                </span>
                <span className="text-[10px] text-muted-foreground">Verifies GMAIL vs MOCK provider</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!testRecipient.trim()) return;
                  sendTestEmailMutation.mutate(testRecipient.trim());
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  placeholder="your-test-inbox@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={sendTestEmailMutation.isPending || !testRecipient.trim()}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {sendTestEmailMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Test
                </button>
              </form>

              {/* Diagnostic Result Panel */}
              <AnimatePresence>
                {lastTestResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-lg p-3 border text-[11px] space-y-1.5 overflow-hidden ${
                      lastTestResult.providerUsed === 'GMAIL' && lastTestResult.providerIsConnected
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-foreground border-b border-border/40 pb-1">
                      {lastTestResult.providerUsed === 'GMAIL' && lastTestResult.providerIsConnected ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real Gmail API — Check your inbox!</>
                      ) : lastTestResult.providerUsed === 'MOCK' ? (
                        <><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Mock Provider — No real email was sent</>
                      ) : (
                        <><Info className="w-3.5 h-3.5 text-blue-400" /> Provider: {lastTestResult.providerUsed}</>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground pt-1">
                      <div>Sent to:</div>
                      <div className="font-mono text-foreground truncate">{lastTestResult.recipient}</div>
                      <div>Provider:</div>
                      <div className="font-semibold text-foreground">{lastTestResult.providerUsed} ({lastTestResult.providerMode})</div>
                      <div>Gmail account:</div>
                      <div className="font-mono text-foreground truncate">{lastTestResult.gmailAccount || '(none)'}</div>
                      <div>Subject:</div>
                      <div className="font-mono text-foreground truncate">{lastTestResult.subject}</div>
                      <div>Creds (ID/Secret/Refresh):</div>
                      <div className="font-mono">
                        {lastTestResult.credentialState.hasClientId ? '✅' : '❌'}
                        {lastTestResult.credentialState.hasClientSecret ? ' ✅' : ' ❌'}
                        {lastTestResult.credentialState.hasRefreshToken ? ' ✅' : ' ❌'}
                      </div>
                    </div>
                    {lastTestResult.providerUsed === 'MOCK' && (
                      <p className="text-amber-300/90 text-[10px] pt-1 leading-snug">
                        💡 GmailProvider NOT selected:{' '}
                        {!lastTestResult.credentialState.hasClientId && 'missing Client ID · '}
                        {!lastTestResult.credentialState.hasClientSecret && 'missing Client Secret · '}
                        {!lastTestResult.credentialState.hasRefreshToken && 'missing Refresh token (complete OAuth or paste from Playground)'}
                        {lastTestResult.credentialState.hasClientId && lastTestResult.credentialState.hasClientSecret && lastTestResult.credentialState.hasRefreshToken && 'all creds present but Gmail API check returned not connected'}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => connectGmailMutation.mutate()}
              disabled={connectGmailMutation.isPending}
              className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {connectGmailMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {gmailStatus?.isConnected ? 'Reconnect Google Account' : 'Connect via Google OAuth'}
            </button>
          </div>
        </div>

        {/* 4. SerpAPI Lead Discovery Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">SerpAPI Lead Discovery</h3>
                  <p className="text-xs text-muted-foreground">Google Maps & Local Search scraping engine</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                  serpapiStatus?.accountStatus === 'Active' || serpapiStatus?.planSearchesLeft
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                Active Key
              </span>
            </div>

            {serpapiStatus ? (
              <div className="space-y-2 bg-secondary/30 p-3.5 rounded-lg border border-border/50 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-semibold text-foreground">{serpapiStatus.planName || 'Developer'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Searches Left:</span>
                  <span className="font-bold text-primary">{serpapiStatus.totalSearchesLeft ?? serpapiStatus.planSearchesLeft ?? 'Available'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Usage This Month:</span>
                  <span className="text-foreground">{serpapiStatus.thisMonthUsage ?? 0} searches</span>
                </div>
              </div>
            ) : (
              <div className="bg-secondary/30 p-3.5 rounded-lg border border-border/50 text-xs text-muted-foreground">
                Configured with active API key in backend environment.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
