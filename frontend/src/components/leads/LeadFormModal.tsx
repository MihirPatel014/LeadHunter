import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Lead, CreateLeadPayload } from '../../types/lead';

const leadFormSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  category: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().min(0).optional(),
  websiteStatus: z.enum(['UNKNOWN', 'ONLINE', 'OFFLINE', 'INVALID']).default('UNKNOWN'),
  score: z.coerce.number().int().min(0).max(100).default(0),
  temperature: z.enum(['HOT', 'WARM', 'LOW']).default('LOW'),
  status: z.enum([
    'NEW',
    'RESEARCHED',
    'QUALIFIED',
    'PENDING_APPROVAL',
    'CONTACTED',
    'REPLIED',
    'INTERESTED',
    'CONVERTED',
    'DISQUALIFIED',
  ]).default('NEW'),
  source: z.string().default('MANUAL'),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadPayload) => Promise<void>;
  initialData?: Lead | null;
  isLoading?: boolean;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      businessName: '',
      category: '',
      city: '',
      address: '',
      website: '',
      phone: '',
      email: '',
      rating: 0,
      reviewCount: 0,
      websiteStatus: 'UNKNOWN',
      score: 0,
      temperature: 'LOW',
      status: 'NEW',
      source: 'MANUAL',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        businessName: initialData.businessName,
        category: initialData.category || '',
        city: initialData.city || '',
        address: initialData.address || '',
        website: initialData.website || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        rating: initialData.rating || 0,
        reviewCount: initialData.reviewCount || 0,
        websiteStatus: initialData.websiteStatus,
        score: initialData.score,
        temperature: initialData.temperature,
        status: initialData.status,
        source: initialData.source || 'MANUAL',
      });
    } else {
      reset({
        businessName: '',
        category: '',
        city: '',
        address: '',
        website: '',
        phone: '',
        email: '',
        rating: 0,
        reviewCount: 0,
        websiteStatus: 'UNKNOWN',
        score: 0,
        temperature: 'LOW',
        status: 'NEW',
        source: 'MANUAL',
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: LeadFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground font-display">
            {initialData ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('businessName')}
              placeholder="e.g. Apex Salon & Spa"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
            {errors.businessName && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.businessName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
              <input
                type="text"
                {...register('category')}
                placeholder="e.g. Salon"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City</label>
              <input
                type="text"
                {...register('city')}
                placeholder="e.g. Surat"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Address</label>
            <input
              type="text"
              {...register('address')}
              placeholder="Full street address"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                placeholder="contact@business.com"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Phone</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="+1 555-0192"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Website URL</label>
              <input
                type="text"
                {...register('website')}
                placeholder="https://example.com"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Website Status</label>
              <select
                {...register('websiteStatus')}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              >
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="INVALID">INVALID</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              >
                <option value="NEW">NEW</option>
                <option value="RESEARCHED">RESEARCHED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="REPLIED">REPLIED</option>
                <option value="INTERESTED">INTERESTED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Temperature</label>
              <select
                {...register('temperature')}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              >
                <option value="HOT">HOT</option>
                <option value="WARM">WARM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Score (0-100)</label>
              <input
                type="number"
                {...register('score')}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-secondary text-foreground text-xs font-medium border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
