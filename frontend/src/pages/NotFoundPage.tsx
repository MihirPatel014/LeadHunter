import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, RefreshCw, Home, Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Page Not Found',
  description = 'The requested route or resource could not be found.',
}) => {
  const navigate = useNavigate();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentPath = window.location.pathname;
  const currentUrl = window.location.href;
  const apiUrl = import.meta.env.VITE_API_URL || '(same-origin / relative)';

  const diagnosticInfo = JSON.stringify(
    {
      url: currentUrl,
      pathname: currentPath,
      timestamp: new Date().toISOString(),
      viteApiUrl: apiUrl,
      userAgent: navigator.userAgent,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(diagnosticInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/5">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border text-xs font-mono text-muted-foreground mb-4">
        <span>HTTP 404</span>
        <span>•</span>
        <span className="text-foreground">{currentPath}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display mb-2">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
        {description} We will update you shortly when our site or this resource is live and available.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Home className="w-3.5 h-3.5" />
          Go to Dashboard
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Page
        </button>
      </div>

      {/* Diagnostics / Console Log drawer for debugging */}
      <div className="w-full text-left">
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground bg-card/50 hover:bg-card border border-border/70 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Developer Diagnostics & Console Info</span>
          </span>
          {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDiagnostics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 p-3 bg-zinc-950 border border-border rounded-lg text-[11px] font-mono text-zinc-300 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
              <span className="text-zinc-500">Route & Environment Debug Log</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="overflow-x-auto text-[10px] leading-tight text-emerald-400/90">
              {diagnosticInfo}
            </pre>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
