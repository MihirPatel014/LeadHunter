import React, { useEffect, useState } from 'react';
import { Menu, Search, Bell, Activity } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'healthy' | 'error'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApiStatus('healthy');
        } else {
          setApiStatus('error');
        }
      })
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <header className="h-16 border-b border-border/50 bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads, campaigns, templates..."
            className="w-full bg-secondary/40 border border-border/60 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 placeholder:text-muted-foreground/70 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Health status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>Backend Status:</span>
          {apiStatus === 'checking' && <span className="text-yellow-400">Checking...</span>}
          {apiStatus === 'healthy' && <span className="text-emerald-400 font-medium">Online</span>}
          {apiStatus === 'error' && <span className="text-rose-400 font-medium">Offline</span>}
        </div>

        {/* Notification Icon */}
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
        </button>

        {/* User avatar indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white ring-2 ring-indigo-500/30">
            LH
          </div>
        </div>
      </div>
    </header>
  );
};
