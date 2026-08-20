import React from 'react';
import { Sparkles, Users, Compass, Megaphone, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const DashboardPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground mb-3 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            LeadHunter AI Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground font-display">
            Lead Discovery & Personalization
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Find high-intent business leads, score opportunities, and generate personalized outreach with human-in-the-loop approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all flex items-center gap-2">
            <Compass className="w-3.5 h-3.5" />
            Start Lead Discovery
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Leads</span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-semibold text-foreground font-display">0</p>
          <p className="text-xs text-muted-foreground">Ready for discovery</p>
        </div>

        <div className="p-5 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Searches</span>
            <Compass className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-semibold text-foreground font-display">0</p>
          <p className="text-xs text-muted-foreground">SerpAPI ready</p>
        </div>

        <div className="p-5 rounded-lg bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-semibold text-foreground font-display">0</p>
          <p className="text-xs text-muted-foreground">Configured</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Approval Queue</span>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-semibold text-foreground font-display">0</p>
          <p className="text-xs text-muted-foreground">Queue clear</p>
        </div>
      </div>

      {/* Feature / Workflow Card */}
      <div className="p-6 sm:p-8 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground font-display">Outreach Workflow Pipeline</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border font-medium">
            CHUNK 01 Active
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          LeadHunter AI operates with strict architecture control: Discover leads via SerpAPI, validate websites, score lead potential, apply template variables, generate optional AI enhancements, and require human approval before dispatching via Gmail or WhatsApp.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-background border border-border space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1</span>
            <h3 className="text-sm font-semibold text-foreground">Lead Discovery</h3>
            <p className="text-xs text-muted-foreground">Query SerpAPI by city & category to discover new local business opportunities.</p>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2</span>
            <h3 className="text-sm font-semibold text-foreground">Validation & Scoring</h3>
            <p className="text-xs text-muted-foreground">Check DNS & HTTP status automatically, then score leads into HOT, WARM, or LOW.</p>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 3</span>
            <h3 className="text-sm font-semibold text-foreground">Human Approval</h3>
            <p className="text-xs text-muted-foreground">Review and edit generated outreach templates before any message is sent.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
