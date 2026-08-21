import React, { useState } from 'react';
import { Eye, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { TemplateChannel } from '../../types/template';

interface LiveTemplatePreviewProps {
  channel: TemplateChannel;
  subject?: string;
  body: string;
}

const SAMPLE_LEAD_DATA = {
  '{{business_name}}': 'Apex Salon & Spa',
  '{{contact_name}}': 'Alex Smith',
  '{{city}}': 'Surat',
  '{{category}}': 'Salon',
  '{{website}}': 'https://apexsalon.com',
  '{{rating}}': '4.8',
  '{{review_count}}': '142',
  '{{sender_name}}': 'Mihir Patel',
};

export const LiveTemplatePreview: React.FC<LiveTemplatePreviewProps> = ({ channel, subject = '', body }) => {
  const [sampleData, setSampleData] = useState(SAMPLE_LEAD_DATA);

  const substituteVariables = (text: string) => {
    let result = text;
    for (const [key, value] of Object.entries(sampleData)) {
      const escapedKey = key.replace(/[{}]/g, '\\$&');
      result = result.replace(new RegExp(escapedKey, 'g'), value);
    }
    return result;
  };

  const renderedSubject = substituteVariables(subject);
  const renderedBody = substituteVariables(body);

  return (
    <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-xs font-semibold text-foreground font-display flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Live Variable Preview
        </h3>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-secondary border border-border text-foreground uppercase">
          {channel} Format
        </span>
      </div>

      {/* Rendered Email or WhatsApp View */}
      {channel === 'EMAIL' ? (
        <div className="p-4 rounded-lg bg-background border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs border-b border-border pb-2 text-muted-foreground">
            <Mail className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-foreground">Subject:</span>
            <span className="font-medium text-foreground">{renderedSubject || '(No Subject)'}</span>
          </div>
          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans min-h-[120px]">
            {renderedBody || <span className="text-muted-foreground italic">Template body preview will appear here...</span>}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message Preview
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground whitespace-pre-wrap min-h-[100px] shadow-sm">
            {renderedBody || <span className="text-muted-foreground italic">WhatsApp message preview will appear here...</span>}
          </div>
        </div>
      )}

      {/* Sample Context Legend */}
      <div className="pt-2 border-t border-border/60">
        <p className="text-[10px] text-muted-foreground font-medium mb-1">Previewing with sample values:</p>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-muted-foreground">
          <span>Apex Salon & Spa (Surat)</span> • <span>★ 4.8 (142 reviews)</span>
        </div>
      </div>
    </div>
  );
};
