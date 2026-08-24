import { AgentProvider, PersonalizationInput, PersonalizationResult } from '../agent.provider.js';

/**
 * Gemini Agent Provider
 * Uses Google Gemini API to personalize messages without hallucinating business facts.
 */
export class GeminiAgentProvider implements AgentProvider {
  readonly providerName = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.5-flash';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generatePersonalization(input: PersonalizationInput): Promise<PersonalizationResult> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const { lead, template, renderedMessage, customInstructions } = input;

    const systemPrompt = `You are an elite B2B sales copywriter and outreach personalization specialist for LeadHunter AI.
YOUR GOAL: Enhance and personalize the provided template outreach message for a specific business lead.

STRICT ANTI-HALLUCINATION RULES:
1. You MUST ONLY use the verified structured facts provided below. Do NOT invent awards, staff names, specific products, fake history, or unverified claims.
2. Maintain the core goal, value proposition, and call to action of the original outreach template.
3. Keep the tone professional, concise, respectful, and high-converting.
4. If channel is WHATSAPP: keep it punchy, conversational, and direct.
5. If channel is EMAIL: keep subject line compelling (under 60 characters) and body scannable (under 160 words).
6. Return JSON only with two keys: "subject" (string or null if WhatsApp) and "body" (string) and "reasoning" (short explanation of changes).`;

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

${customInstructions ? `USER CUSTOM INSTRUCTIONS: ${customInstructions}\n` : ''}

Respond with valid JSON matching:
{
  "subject": "refined subject line or null",
  "body": "personalized message text",
  "reasoning": "brief description of how facts were utilized"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty response.');
    }

    let parsed: { subject?: string | null; body?: string; reasoning?: string };
    try {
      parsed = JSON.parse(candidateText);
    } catch {
      // If parsing fails, extract text fallback
      parsed = {
        subject: renderedMessage.subject,
        body: candidateText,
        reasoning: 'Extracted response from model output.',
      };
    }

    return {
      subject: template.channel === 'EMAIL' ? (parsed.subject || renderedMessage.subject) : null,
      body: parsed.body || renderedMessage.body,
      provider: 'gemini',
      model: this.model,
      aiEnhanced: true,
      reasoning: parsed.reasoning || 'Personalized using Gemini with lead facts.',
      confidenceScore: 0.9,
      usedFallback: false,
    };
  }

  /**
   * Direct Chat / Prompt Test for verifying API key and connectivity
   */
  async testChat(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured. Please supply a valid Gemini API key.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty response.');
    }

    return candidateText;
  }
}
