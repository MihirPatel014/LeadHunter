import { AgentProvider, PersonalizationInput, PersonalizationResult } from '../agent.provider.js';

/**
 * OpenAI Agent Provider
 * Uses OpenAI Chat Completions API to personalize messages without hallucinating facts.
 */
export class OpenAiAgentProvider implements AgentProvider {
  readonly providerName = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generatePersonalization(input: PersonalizationInput): Promise<PersonalizationResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is not configured.');
    }

    const { lead, template, renderedMessage, customInstructions } = input;

    const systemPrompt = `You are an elite B2B outreach personalization specialist for LeadHunter AI.
YOUR GOAL: Enhance and personalize the provided template outreach message for a specific business lead.

STRICT ANTI-HALLUCINATION RULES:
1. You MUST ONLY use the verified structured facts provided below. Do NOT invent awards, staff names, specific products, fake history, or unverified claims.
2. Maintain the core goal, value proposition, and call to action of the original outreach template.
3. Keep the tone professional, concise, respectful, and high-converting.
4. If channel is WHATSAPP: keep it punchy, conversational, and direct.
5. If channel is EMAIL: keep subject line compelling (under 60 characters) and body scannable (under 160 words).
6. Return JSON only with fields: "subject" (string or null for WhatsApp), "body" (string), "reasoning" (string).`;

    const userPrompt = `LEAD STRUCTURED FACTS:
- Business Name: ${lead.businessName}
- Category: ${lead.category || 'N/A'}
- City: ${lead.city || 'N/A'}
- Address: ${lead.address || 'N/A'}
- Website: ${lead.website || 'No website registered'}
- Website Status: ${lead.websiteStatus || 'UNKNOWN'}
- Google Rating: ${lead.rating ? `${lead.rating} stars` : 'N/A'}
- Review Count: ${lead.reviewCount ?? 'N/A'}
- Lead Score: ${lead.score ?? 'N/A'} (Temperature: ${lead.temperature ?? 'N/A'})

TEMPLATE DETAILS:
- Template Name: ${template.name}
- Channel: ${template.channel}
- Base Rendered Subject: ${renderedMessage.subject || 'N/A'}
- Base Rendered Body:
"""
${renderedMessage.body}
"""

${customInstructions ? `USER CUSTOM INSTRUCTIONS: ${customInstructions}\n` : ''}`;

    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    let parsed: { subject?: string | null; body?: string; reasoning?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        subject: renderedMessage.subject,
        body: content,
        reasoning: 'Extracted raw output.',
      };
    }

    return {
      subject: template.channel === 'EMAIL' ? (parsed.subject || renderedMessage.subject) : null,
      body: parsed.body || renderedMessage.body,
      provider: 'openai',
      model: this.model,
      aiEnhanced: true,
      reasoning: parsed.reasoning || 'Personalized using OpenAI model.',
      confidenceScore: 0.9,
      usedFallback: false,
    };
  }
}
