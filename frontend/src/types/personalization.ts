export interface AvailableProvider {
  id: 'gemini' | 'openai' | 'mock';
  name: string;
  defaultModel: string;
  models: string[];
  requiresKey: boolean;
}

export interface AIStatus {
  provider: 'gemini' | 'openai' | 'mock' | string;
  isConfigured: boolean;
  hasKey: boolean;
  model: string;
  availableProviders: AvailableProvider[];
}

export interface AIConfigUpdate {
  provider: 'gemini' | 'openai' | 'mock';
  apiKey?: string;
  model?: string;
}

export interface PersonalizationRequest {
  leadId: number;
  templateId: number;
  customInstructions?: string;
  provider?: 'mock' | 'gemini' | 'openai';
  model?: string;
  apiKey?: string;
}

export interface PersonalizationResponse {
  lead: {
    id: number;
    businessName: string;
    category?: string | null;
    city?: string | null;
  };
  template: {
    id: number;
    name: string;
    channel: 'EMAIL' | 'WHATSAPP' | string;
  };
  baseRendered: {
    subject?: string | null;
    body: string;
  };
  personalized: {
    subject?: string | null;
    body: string;
  };
  metadata: {
    provider: string;
    model: string;
    aiEnhanced: boolean;
    reasoning?: string;
    usedFallback: boolean;
    fallbackReason?: string;
  };
}
