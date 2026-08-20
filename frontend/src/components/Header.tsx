import React, { useEffect, useState } from 'react';
import { Menu, Search, Bell, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const { theme, toggleTheme } = useTheme();

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
    <header className="h-16 border-b border-border bg-background px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Cal.com style global search bar */}
        <div className="relative hidden sm:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads, campaigns, templates..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-1.5 text-xs font-normal text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Health status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-medium text-foreground">API:</span>
          {apiStatus === 'checking' && <span className="text-amber-500 font-medium">Checking...</span>}
          {apiStatus === 'healthy' && <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>}
          {apiStatus === 'error' && <span className="text-rose-500 font-medium">Offline</span>}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md border border-border bg-card text-foreground hover:bg-secondary transition-colors"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Notification Icon */}
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs shadow-sm">
            LH
          </div>
        </div>
      </div>
    </header>
  );
};
