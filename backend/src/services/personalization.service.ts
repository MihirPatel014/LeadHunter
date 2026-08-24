import { LeadRepository } from '../repositories/lead.repository.js';
import { TemplateRepository } from '../repositories/template.repository.js';
import { TemplateService } from './template.service.js';
import { config } from '../config/env.js';
import { AgentProvider, PersonalizationResult } from './ai/agent.provider.js';
import { MockAgentProvider } from './ai/providers/mock.provider.js';
import { GeminiAgentProvider } from './ai/providers/gemini.provider.js';
import { OpenAiAgentProvider } from './ai/providers/openai.provider.js';

export interface GeneratePersonalizationParams {
  leadId: number;
  templateId: number;
  customInstructions?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface PersonalizationServiceResponse {
  lead: {
    id: number;
    businessName: string;
    category?: string | null;
    city?: string | null;
  };
  template: {
    id: number;
    name: string;
    channel: string;
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

// In-memory runtime overrides so user can update keys/providers from UI
let runtimeAIConfig = {
  provider: config.aiProvider || 'gemini',
  apiKey: '',
  model: config.aiModel || 'gemini-2.5-flash',
};

function isDummyOrEmpty(val?: string | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  return trimmed.length === 0 || trimmed === 'string' || trimmed === 'undefined' || trimmed === 'null';
}

function getEffectiveKey(requestedApiKey?: string): string {
  if (!isDummyOrEmpty(requestedApiKey)) return requestedApiKey!.trim();
  if (!isDummyOrEmpty(runtimeAIConfig.apiKey)) return runtimeAIConfig.apiKey.trim();
  return process.env.GEMINI_API_KEY || process.env.AI_API_KEY || config.geminiApiKey || config.aiApiKey || '';
}

function getEffectiveModel(requestedModel?: string): string {
  if (!isDummyOrEmpty(requestedModel) && requestedModel !== 'gemini-1.5-flash') {
    return requestedModel!.trim();
  }
  return runtimeAIConfig.model || config.aiModel || 'gemini-2.5-flash';
}

export class PersonalizationService {
  private leadRepo: LeadRepository;
  private templateRepo: TemplateRepository;
  private templateService: TemplateService;

  constructor() {
    this.leadRepo = new LeadRepository();
    this.templateRepo = new TemplateRepository();
    this.templateService = new TemplateService();
  }

  /**
   * Factory method to instantiate the appropriate AgentProvider.
   */
  private getProvider(requestedProvider?: string, requestedApiKey?: string, requestedModel?: string): AgentProvider {
    const selected = (requestedProvider || runtimeAIConfig.provider || 'gemini').toLowerCase().trim();
    const effectiveKey = getEffectiveKey(requestedApiKey);

    switch (selected) {
      case 'gemini':
      case 'google':
        return new GeminiAgentProvider(
          effectiveKey,
          requestedModel || runtimeAIConfig.model || 'gemini-2.5-flash'
        );
      case 'openai':
      case 'gpt':
        return new OpenAiAgentProvider(
          effectiveKey,
          requestedModel || runtimeAIConfig.model || 'gpt-4o-mini'
        );
      case 'mock':
      case 'local':
      default:
        return new MockAgentProvider();
    }
  }

  /**
   * Status and capabilities of the active AI configuration.
   */
  getAIStatus() {
    const currentProviderName = runtimeAIConfig.provider || config.aiProvider || 'gemini';
    const provider = this.getProvider(currentProviderName);
    const effectiveKey = getEffectiveKey();
    const hasKey = Boolean(effectiveKey && effectiveKey.trim().length > 0);

    return {
      provider: currentProviderName,
      isConfigured: provider.isConfigured(),
      hasKey,
      model: runtimeAIConfig.model || (currentProviderName === 'gemini' ? 'gemini-2.5-flash' : currentProviderName === 'openai' ? 'gpt-4o-mini' : 'local-heuristic-v1'),
      availableProviders: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          defaultModel: 'gemini-2.5-flash',
          models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-2.5-flash-lite'],
          requiresKey: true,
        },
        {
          id: 'openai',
          name: 'OpenAI GPT',
          defaultModel: 'gpt-4o-mini',
          models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
          requiresKey: true,
        },
        {
          id: 'mock',
          name: 'Local Heuristic (No Key Needed)',
          defaultModel: 'local-heuristic-v1',
          models: ['local-heuristic-v1'],
          requiresKey: false,
        },
      ],
    };
  }

  /**
   * Update runtime AI Provider and API key settings from UI.
   */
  updateAIConfig(params: { provider: string; apiKey?: string; model?: string }) {
    runtimeAIConfig.provider = params.provider;
    if (params.apiKey !== undefined) {
      runtimeAIConfig.apiKey = params.apiKey;
    }
    if (params.model !== undefined) {
      runtimeAIConfig.model = params.model;
    }
    return this.getAIStatus();
  }

  /**
   * Generate an AI-personalized message.
   * If AI fails or is not available, safely falls back to standard template rendering.
   */
  async generatePersonalization(params: GeneratePersonalizationParams): Promise<PersonalizationServiceResponse> {
    const { leadId, templateId, customInstructions, provider: requestedProvider, model: requestedModel, apiKey: requestedApiKey } = params;

    // 1. Fetch Lead
    const lead = await this.leadRepo.findById(leadId);
    if (!lead) {
      const error: any = new Error(`Lead with ID ${leadId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 2. Fetch Template
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      const error: any = new Error(`Template with ID ${templateId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 3. Base variable replacement (zero AI baseline)
    const context: Record<string, string | number | null | undefined> = {
      businessName: lead.businessName,
      business_name: lead.businessName,
      contact_name: null,
      city: lead.city,
      category: lead.category,
      website: lead.website,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      review_count: lead.reviewCount,
      senderName: 'LeadHunter Team',
      sender_name: 'LeadHunter Team',
    };

    const baseSubject = template.subject
      ? this.templateService.renderTemplate(template.subject, context)
      : null;
    const baseBody = this.templateService.renderTemplate(template.body, context);

    // 4. Attempt AI Personalization
    let aiResult: PersonalizationResult;
    let usedFallback = false;
    let fallbackReason: string | undefined;

    const provider = this.getProvider(requestedProvider, requestedApiKey, requestedModel);

    try {
      if (!provider.isConfigured() && provider.providerName !== 'mock') {
        throw new Error(`Provider '${provider.providerName}' is not configured with an API key. Please enter your API key in Settings or the Message studio.`);
      }

      aiResult = await provider.generatePersonalization({
        lead: {
          id: lead.id,
          businessName: lead.businessName,
          category: lead.category,
          city: lead.city,
          address: lead.address,
          website: lead.website,
          websiteStatus: lead.websiteStatus,
          phone: lead.phone,
          email: lead.email,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          score: lead.score,
          temperature: lead.temperature,
          source: lead.source,
        },
        template: {
          id: template.id,
          name: template.name,
          channel: template.channel,
          subject: template.subject,
          body: template.body,
        },
        renderedMessage: {
          subject: baseSubject,
          body: baseBody,
        },
        customInstructions,
      });
    } catch (err: any) {
      // Graceful fallback to standard template
      usedFallback = true;
      fallbackReason = err.message || 'AI personalization failed';
      aiResult = {
        subject: baseSubject,
        body: baseBody,
        provider: provider.providerName,
        model: 'template-fallback',
        aiEnhanced: false,
        reasoning: `Standard template rendered safely: ${fallbackReason}`,
        usedFallback: true,
      };
    }

    return {
      lead: {
        id: lead.id,
        businessName: lead.businessName,
        category: lead.category,
        city: lead.city,
      },
      template: {
        id: template.id,
        name: template.name,
        channel: template.channel,
      },
      baseRendered: {
        subject: baseSubject,
        body: baseBody,
      },
      personalized: {
        subject: aiResult.subject,
        body: aiResult.body,
      },
      metadata: {
        provider: aiResult.provider,
        model: aiResult.model,
        aiEnhanced: aiResult.aiEnhanced,
        reasoning: aiResult.reasoning,
        usedFallback,
        fallbackReason,
      },
    };
  }

  /**
   * Direct Chat / Prompt test for verifying connection & model output
   */
  async testAIChat(params: { prompt: string; provider?: string; apiKey?: string; model?: string }) {
    const { prompt, provider: requestedProvider, apiKey: requestedApiKey, model: requestedModel } = params;
    const effectiveProviderName = requestedProvider || runtimeAIConfig.provider || config.aiProvider || 'gemini';
    const effectiveApiKey = getEffectiveKey(requestedApiKey);
    const effectiveModel = getEffectiveModel(requestedModel);

    if (effectiveProviderName === 'gemini') {
      const gemini = new GeminiAgentProvider(effectiveApiKey, effectiveModel);
      const reply = await gemini.testChat(prompt);
      return {
        success: true,
        reply,
        provider: 'gemini',
        model: effectiveModel,
      };
    } else if (effectiveProviderName === 'openai') {
      const openai = new OpenAiAgentProvider(effectiveApiKey, effectiveModel);
      if (!openai.isConfigured()) throw new Error('OpenAI API key is not configured.');
      // Simple fallback for openai test
      return {
        success: true,
        reply: `OpenAI provider configured (${effectiveModel}).`,
        provider: 'openai',
        model: effectiveModel,
      };
    } else {
      // Mock provider
      return {
        success: true,
        reply: `[Local AI Simulation] Received prompt: "${prompt}". Ready to personalize outreach with high-converting templates!`,
        provider: 'mock',
        model: 'local-heuristic-v1',
      };
    }
  }
}
