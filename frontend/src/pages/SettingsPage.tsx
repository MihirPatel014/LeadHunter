import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { toast, Toaster } from 'sonner';
import {
  User,
  Sliders,
  Clock,
  Save,
  RefreshCw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  FileText,
  Mail,
  Zap,
} from 'lucide-react';

import { settingsService } from '../services/settingsService';

type TabType = 'profile' | 'scoring' | 'outreach';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Form State
  const [profileForm, setProfileForm] = useState({
    sender_name: '',
    sender_agency: '',
    sender_calendly_url: '',
    sender_email_signature: '',
  });

  const [scoringForm, setScoringForm] = useState({
    score_no_website: '40',
    score_broken_website: '30',
    score_no_phone: '5',
    score_low_rating: '15',
    score_few_reviews: '10',
  });

  const [outreachForm, setOutreachForm] = useState({
    daily_email_limit: '20',
    daily_whatsapp_limit: '50',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
  });

  // Query settings from DB
  const { data: settingsList = [], isLoading, refetch } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => settingsService.getSettings(),
  });

  // Populate forms when settings arrive
  useEffect(() => {
    if (settingsList.length > 0) {
      const map = Object.fromEntries(settingsList.map((s) => [s.key, s.value || '']));

      setProfileForm({
        sender_name: map.sender_name || 'LeadHunter AI',
        sender_agency: map.sender_agency || '',
        sender_calendly_url: map.sender_calendly_url || '',
        sender_email_signature: map.sender_email_signature || '',
      });

      setScoringForm({
        score_no_website: map.score_no_website || '40',
        score_broken_website: map.score_broken_website || '30',
        score_no_phone: map.score_no_phone || '5',
        score_low_rating: map.score_low_rating || '15',
        score_few_reviews: map.score_few_reviews || '10',
      });

      setOutreachForm({
        daily_email_limit: map.daily_email_limit || '20',
        daily_whatsapp_limit: map.daily_whatsapp_limit || '50',
        working_hours_start: map.working_hours_start || '09:00',
        working_hours_end: map.working_hours_end || '18:00',
      });
    }
  }, [settingsList]);

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => settingsService.updateSettingsBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Settings saved to database');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save settings');
    },
  });

  // Rescore Leads Mutation
  const rescoreMutation = useMutation({
    mutationFn: () => settingsService.rescoreAllLeads(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      toast.success(`Rescored ${data.total} leads: ${data.hot} HOT 🔥, ${data.warm} WARM ⚡, ${data.low} LOW`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to rescore leads');
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(profileForm);
  };

  const handleSaveScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync(scoringForm);
    rescoreMutation.mutate();
  };

  const handleSaveOutreach = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(outreachForm);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-4xl mx-auto pb-16"
    >
      <Toaster position="top-right" theme="system" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary" />
            Application & Outreach Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your sender identity, dynamic lead scoring rule weights, and outbound dispatch limits.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Reload Settings
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Sender Profile & Identity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scoring')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'scoring'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Lead Scoring Point Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outreach')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'outreach'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Outreach Preferences
        </button>
      </div>

      {/* TAB 1: SENDER PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Sender Identity & Signature
            </h3>
            <p className="text-xs text-muted-foreground">This identity is inserted into outreach variables like {"{{sender_name}}"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Mihir Patel"
                value={profileForm.sender_name}
                onChange={(e) => setProfileForm({ ...profileForm, sender_name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Agency / Company Name</label>
              <input
                type="text"
                placeholder="e.g. LeadHunter Digital Agency"
                value={profileForm.sender_agency}
                onChange={(e) => setProfileForm({ ...profileForm, sender_agency: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Calendly / Meeting Link</label>
            <input
              type="url"
              placeholder="https://calendly.com/your-name/30min"
              value={profileForm.sender_calendly_url}
              onChange={(e) => setProfileForm({ ...profileForm, sender_calendly_url: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Default Email Signature</label>
            <textarea
              rows={4}
              placeholder="Best regards,&#10;Mihir Patel | Founder&#10;LeadHunter AI Agency"
              value={profileForm.sender_email_signature}
              onChange={(e) => setProfileForm({ ...profileForm, sender_email_signature: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Profile Settings
          </button>
        </form>
      )}

      {/* TAB 2: LEAD SCORING RULES */}
      {activeTab === 'scoring' && (
        <form onSubmit={handleSaveScoring} className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Dynamic Lead Scoring Weight Rules
            </h3>
            <p className="text-xs text-muted-foreground">
              Customize how many points each lead attribute adds. Higher total scores push leads from LOW → WARM (40+) → HOT (70+).
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">No Website Bonus Points</label>
                <p className="text-[11px] text-muted-foreground">Added when lead has zero website registered</p>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={scoringForm.score_no_website}
                  onChange={(e) => setScoringForm({ ...scoringForm, score_no_website: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Broken Website Bonus Points</label>
                <p className="text-[11px] text-muted-foreground">Added when website responds with 404 or connection error</p>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={scoringForm.score_broken_website}
                  onChange={(e) => setScoringForm({ ...scoringForm, score_broken_website: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Phone Available</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={scoringForm.score_no_phone}
                  onChange={(e) => setScoringForm({ ...scoringForm, score_no_phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Low Google Rating (&lt;4.0)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={scoringForm.score_low_rating}
                  onChange={(e) => setScoringForm({ ...scoringForm, score_low_rating: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Few Reviews (&lt;20)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={scoringForm.score_few_reviews}
                  onChange={(e) => setScoringForm({ ...scoringForm, score_few_reviews: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending || rescoreMutation.isPending}
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saveMutation.isPending || rescoreMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              Save Rules & Rescore All Leads
            </button>
            <span className="text-[11px] text-muted-foreground">Applies new point weights across all 119+ leads</span>
          </div>
        </form>
      )}

      {/* TAB 3: OUTREACH PREFERENCES */}
      {activeTab === 'outreach' && (
        <form onSubmit={handleSaveOutreach} className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Outreach & Safety Limits
            </h3>
            <p className="text-xs text-muted-foreground">Control message frequency limits and business dispatch hours</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Daily Email Dispatch Limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={outreachForm.daily_email_limit}
                onChange={(e) => setOutreachForm({ ...outreachForm, daily_email_limit: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Daily WhatsApp Dispatch Limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={outreachForm.daily_whatsapp_limit}
                onChange={(e) => setOutreachForm({ ...outreachForm, daily_whatsapp_limit: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Working Hours Start</label>
              <input
                type="time"
                value={outreachForm.working_hours_start}
                onChange={(e) => setOutreachForm({ ...outreachForm, working_hours_start: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Working Hours End</label>
              <input
                type="time"
                value={outreachForm.working_hours_end}
                onChange={(e) => setOutreachForm({ ...outreachForm, working_hours_end: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Outreach Preferences
          </button>
        </form>
      )}
    </motion.div>
  );
};
