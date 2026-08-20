import React from 'react';
import { Sparkles, Users, Compass, Megaphone, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const DashboardPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Welcome to LeadHunter AI. Track your leads and outreach automation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Discover New Leads
          </button>
        </div>
      </div>

      {/* Quick KPI stats preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Discovered Leads</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-muted-foreground">Ready for discovery</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Searches</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-muted-foreground">SerpAPI ready</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-muted-foreground">Configured</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Pending Approvals</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-muted-foreground">Queue clear</p>
        </div>
      </div>

      {/* Foundation Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-background border border-indigo-500/20 text-indigo-200">
        <h3 className="font-semibold text-white text-base mb-1">CHUNK 01: Project Foundation Ready</h3>
        <p className="text-xs text-indigo-300/80 leading-relaxed max-w-2xl">
          The monorepo structure, Express backend REST API, Vite React frontend, Tailwind design tokens, and central navigation layout are initialized and ready for feature implementation.
        </p>
      </div>
    </motion.div>
  );
};
