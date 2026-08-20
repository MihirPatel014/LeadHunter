import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Compass,
  FileText,
  Megaphone,
  CheckCircle2,
  MessageSquare,
  Clock,
  BarChart3,
  Plug,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Discovery', path: '/discovery', icon: Compass },
  { name: 'Templates', path: '/templates', icon: FileText },
  { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { name: 'Approvals', path: '/approvals', icon: CheckCircle2 },
  { name: 'Messages', path: '/messages', icon: MessageSquare },
  { name: 'Follow-ups', path: '/follow-ups', icon: Clock },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
];

const secondaryItems = [
  { name: 'Integrations', path: '/integrations', icon: Plug },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full select-none transition-colors">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5 font-display">
            LeadHunter <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground">Outreach Platform</p>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            System
          </p>
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-card border border-border text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Ready
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
