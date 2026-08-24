export interface StructuredLeadFacts {
  id: number;
  businessName: string;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  website?: string | null;
  websiteStatus?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  score?: number | null;
  temperature?: string | null;
  source?: string | null;
}

export interface StructuredTemplateInfo {
  id: number;
  name: string;
  channel: 'EMAIL' | 'WHATSAPP' | string;
  subject?: string | null;
  body: string;
}

export interface PersonalizationInput {
  lead: StructuredLeadFacts;
  template: StructuredTemplateInfo;
  renderedMessage: {
    subject?: string | null;
    body: string;
  };
  customInstructions?: string;
}

export interface PersonalizationResult {
  subject?: string | null;
  body: string;
  provider: string;
  model: string;
  aiEnhanced: boolean;
  reasoning?: string;
  confidenceScore?: number;
  usedFallback?: boolean;
}

export interface AgentProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  generatePersonalization(input: PersonalizationInput): Promise<PersonalizationResult>;
}
