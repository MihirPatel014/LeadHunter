import { AgentProvider, PersonalizationInput, PersonalizationResult } from '../agent.provider.js';

/**
 * Mock Agent Provider
 * Performs rule-based contextual message enrichment without calling external APIs.
 * Useful for local testing, demoing, or offline fallback.
 */
export class MockAgentProvider implements AgentProvider {
  readonly providerName = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async generatePersonalization(input: PersonalizationInput): Promise<PersonalizationResult> {
    const { lead, template, renderedMessage, customInstructions } = input;

    let personalizedSubject = renderedMessage.subject;
    let personalizedBody = renderedMessage.body;

    // Contextual enrichments based on real structured facts
    const insights: string[] = [];

    if (lead.websiteStatus === 'OFFLINE' || !lead.website) {
      insights.push(`I noticed ${lead.businessName} currently doesn't have an active web presence`);
    } else if (lead.rating && lead.rating >= 4.5 && lead.reviewCount && lead.reviewCount > 10) {
      insights.push(`Congratulations on the stellar ${lead.rating}★ rating across ${lead.reviewCount} customer reviews in ${lead.city || 'your area'}`);
    } else if (lead.city && lead.category) {
      insights.push(`Looking at the growing demand for top-rated ${lead.category} services in ${lead.city}`);
    }

    if (insights.length > 0) {
      const introInsight = insights[0];
      // Inject an intelligent, non-hallucinatory opening sentence if not already present
      if (!personalizedBody.includes(introInsight)) {
        // Look for greeting line (e.g. "Hi ...")
        const lines = personalizedBody.split('\n');
        if (lines.length > 1) {
          lines.splice(1, 0, `\n${introInsight} — which caught our attention.`);
          personalizedBody = lines.join('\n');
        } else {
          personalizedBody = `${personalizedBody}\n\n${introInsight}.`;
        }
      }
    }

    if (customInstructions && customInstructions.trim()) {
      personalizedBody += `\n\n[P.S. Note: ${customInstructions.trim()}]`;
    }

    if (personalizedSubject && (lead.city || lead.category)) {
      personalizedSubject = `${personalizedSubject} (${lead.city ? `${lead.city} ` : ''}${lead.category || 'Growth'})`;
    }

    return {
      subject: personalizedSubject,
      body: personalizedBody,
      provider: 'mock',
      model: 'local-heuristic-v1',
      aiEnhanced: true,
      reasoning: `Enhanced with verified lead facts: city (${lead.city || 'N/A'}), rating (${lead.rating || 'N/A'}), website status (${lead.websiteStatus || 'N/A'}).`,
      confidenceScore: 0.95,
      usedFallback: false,
    };
  }
}
