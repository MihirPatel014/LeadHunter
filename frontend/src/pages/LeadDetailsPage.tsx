import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Star,
  Shield,
  Activity,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

import { leadService } from '../services/leadService';
import { StatusBadge, TemperatureBadge, WebsiteStatusBadge } from '../components/leads/LeadBadges';
import { LeadFormModal } from '../components/leads/LeadFormModal';
import { LeadDeleteDialog } from '../components/leads/LeadDeleteDialog';
import { CreateLeadPayload } from '../types/lead';

export const LeadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const leadId = parseInt(id || '0', 10);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadService.getLeadById(leadId),
    enabled: !isNaN(leadId) && leadId > 0,
  });

  const { data: scoringData, refetch: refetchScoring } = useQuery({
    queryKey: ['lead-scoring', leadId],
    queryFn: () => leadService.getScoringBreakdown(leadId),
    enabled: !isNaN(leadId) && leadId > 0,
  });

  const scoreMutation = useMutation({
    mutationFn: () => leadService.scoreLead(leadId),
    onSuccess: (data) => {
      toast.success(`Score recalculated: ${data.score}/100 (${data.temperature})`);
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-scoring', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Scoring failed');
    },
  });

  const validateMutation = useMutation({
    mutationFn: () => leadService.validateLead(leadId),
    onSuccess: (data) => {
      toast.success(`Validation complete: Status is ${data.validation.status}`);
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Validation failed');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadService.updateLead(leadId, payload),
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update lead');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadService.deleteLead(leadId),
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/leads');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete lead');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 bg-muted rounded w-24"></div>
        <div className="h-32 bg-muted rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-muted rounded-xl"></div>
          <div className="h-48 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="p-12 text-center border border-border rounded-xl bg-card space-y-4 max-w-xl mx-auto my-12">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-semibold text-foreground font-display">Lead Not Found</h2>
        <p className="text-xs text-muted-foreground">The lead record you are looking for does not exist or has been deleted.</p>
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads Management
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Recalculate lead score and temperature"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {scoreMutation.isPending ? 'Scoring...' : 'Recalculate Score'}
          </button>
          <button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Check DNS and HTTP reachability"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            {validateMutation.isPending ? 'Validating...' : 'Validate Website'}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => setIsDeleting(true)}
            className="px-3 py-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main Banner Header */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
              {lead.businessName}
            </h1>
            <StatusBadge status={lead.status} />
            <TemperatureBadge temperature={lead.temperature} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {lead.category && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {lead.category}
              </span>
            )}
            {lead.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {lead.city}
              </span>
            )}
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5" /> Created {new Date(lead.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Lead Score Card */}
        <div className="p-4 rounded-lg bg-background border border-border text-center min-w-[140px] shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Lead Score</span>
          <div className="text-3xl font-extrabold text-foreground font-display my-0.5">
            {lead.score} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Source: {lead.source}</span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business & Location Info */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h2 className="text-sm font-semibold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="w-4 h-4 text-primary" /> Business Details
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Business Name</span>
              <span className="font-semibold text-foreground">{lead.businessName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Category</span>
              <span className="text-foreground">{lead.category || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Address</span>
              <span className="text-foreground">{lead.address || 'No street address provided'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Rating & Reviews</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> {lead.rating || 0}
                </span>
                <span className="text-muted-foreground">({lead.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h2 className="text-sm font-semibold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
            <Mail className="w-4 h-4 text-primary" /> Contact Details
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Email Address</span>
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-primary font-mono hover:underline">
                  {lead.email}
                </a>
              ) : (
                <span className="text-muted-foreground italic">No email address available</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Phone Number</span>
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="text-foreground font-mono hover:underline">
                  {lead.phone}
                </a>
              ) : (
                <span className="text-muted-foreground italic">No phone number available</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Website</span>
              <div className="flex items-center gap-2 mt-1">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-mono inline-flex items-center gap-1"
                  >
                    {lead.website} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">No website URL</span>
                )}
                <WebsiteStatusBadge status={lead.websiteStatus} />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Google Business Profile</span>
              {lead.googleProfileLink ? (
                <a
                  href={lead.googleProfileLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-500 hover:text-green-400 hover:underline font-mono inline-flex items-center gap-1 mt-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View on Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-muted-foreground italic">No Google profile link</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Reasons Card */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Scoring Breakdown & Reasons
          </h2>
          <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2.5 py-1 rounded-md border border-border">
            {lead.score} / 100 ({lead.temperature})
          </span>
        </div>

        {scoringData?.reasons && scoringData.reasons.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium mb-2">Scoring rule evaluation details:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scoringData.reasons.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border text-xs"
                >
                  <span className="text-foreground font-medium">{item.rule}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic py-2">
            No specific scoring bonuses applied. Click "Recalculate Score" above to evaluate scoring rules.
          </div>
        )}
      </div>

      {/* Activity Timeline Card */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="text-sm font-semibold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
          <Activity className="w-4 h-4 text-primary" /> Activity Log & History
        </h2>
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
            <div>
              <p className="font-semibold text-foreground">Lead Created</p>
              <p className="text-muted-foreground text-[11px]">
                Discovered via <span className="font-mono text-foreground">{lead.source}</span> on{' '}
                {new Date(lead.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
            <div>
              <p className="font-semibold text-foreground">Record Updated</p>
              <p className="text-muted-foreground text-[11px]">
                Last modified on {new Date(lead.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <LeadFormModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
        initialData={lead}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <LeadDeleteDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        leadName={lead.businessName}
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
};
