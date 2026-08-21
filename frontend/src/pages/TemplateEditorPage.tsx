import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Mail, MessageSquare, Tag, Eye, Loader2, Sparkles } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'motion/react';

import { templateService } from '../services/templateService';
import { VariablePicker } from '../components/templates/VariablePicker';
import { LiveTemplatePreview } from '../components/templates/LiveTemplatePreview';
import { TemplateChannel, CreateTemplatePayload } from '../types/template';

export const TemplateEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';
  const templateId = parseInt(id || '0', 10);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const [activeField, setActiveField] = useState<'subject' | 'body'>('body');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState<TemplateChannel>('EMAIL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch variables list
  const { data: variables = [] } = useQuery({
    queryKey: ['template-variables'],
    queryFn: () => templateService.getVariables(),
  });

  // Fetch existing template if editing
  const { data: existingTemplate, isLoading: isFetchingTemplate } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templateService.getTemplateById(templateId),
    enabled: !isNew && !isNaN(templateId) && templateId > 0,
  });

  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setDescription(existingTemplate.description || '');
      setChannel(existingTemplate.channel);
      setSubject(existingTemplate.subject || '');
      setBody(existingTemplate.body);
      setIsActive(existingTemplate.isActive);
    }
  }, [existingTemplate]);

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: CreateTemplatePayload) => {
      if (!isNew) {
        return templateService.updateTemplate(templateId, payload);
      }
      return templateService.createTemplate(payload);
    },
    onSuccess: (data) => {
      toast.success(`Template ${isNew ? 'created' : 'updated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save template');
    },
  });

  const handleInsertVariable = (variableKey: string) => {
    if (activeField === 'subject' && channel === 'EMAIL') {
      const input = subjectRef.current;
      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newSubject = subject.substring(0, start) + variableKey + subject.substring(end);
        setSubject(newSubject);
      } else {
        setSubject((prev) => prev + variableKey);
      }
    } else {
      const textarea = bodyRef.current;
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const newBody = body.substring(0, start) + variableKey + body.substring(end);
        setBody(newBody);
      } else {
        setBody((prev) => prev + variableKey);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Template body content is required');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      channel,
      subject: channel === 'EMAIL' ? subject.trim() || undefined : undefined,
      body: body.trim(),
      isActive,
    });
  };

  if (!isNew && isFetchingTemplate) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Loading template editor...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <Toaster position="top-right" theme="system" />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <Link
            to="/templates"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Templates
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {isNew ? 'Create Outreach Template' : `Edit Template: ${name}`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Template
          </button>
        </div>
      </div>

      {/* Split Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Template Details Card */}
          <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground font-display border-b border-border pb-3">
              Template Configuration
            </h2>

            {/* Channel Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Channel Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    channel === 'EMAIL'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email Outreach
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    channel === 'WHATSAPP'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Outreach
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cold Email - Hair Salons"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief internal note about when to use this template"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Subject line (Email only) */}
            {channel === 'EMAIL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Email Subject Line</label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onFocus={() => setActiveField('subject')}
                  placeholder="e.g. Quick question about {{business_name}}"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Message Body Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setActiveField('body')}
                rows={10}
                placeholder={`Hi {{contact_name}},\n\nI noticed {{business_name}} in {{city}} has great reviews ({{rating}} stars) but your website could be improved...\n\nBest,\n{{sender_name}}`}
                className="w-full bg-background border border-border rounded-md p-3 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Variable Picker & Live Preview */}
        <div className="lg:col-span-5 space-y-5">
          <VariablePicker
            variables={variables}
            onSelectVariable={handleInsertVariable}
          />

          <LiveTemplatePreview
            channel={channel}
            subject={subject}
            body={body}
          />
        </div>
      </div>
    </motion.div>
  );
};
