import { Lead } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { Temperature } from '../types/lead.types.js';
import { classifyWebsite } from '../utils/website-classifier.js';
import { appSettingsService } from './app-settings.service.js';

export interface ScoringReason {
  rule: string;
  points: number;
}

export interface ScoringResult {
  score: number;
  temperature: Temperature;
  reasons: ScoringReason[];
}

export interface ScoringWeights {
  score_no_website?: number;
  score_broken_website?: number;
  score_no_phone?: number;
  score_low_rating?: number;
  score_few_reviews?: number;
}

export class LeadScoringService {
  /**
   * Calculate lead score and temperature from a lead record, optionally with custom DB weights.
   */
  calculateScore(lead: Partial<Lead>, weights?: ScoringWeights): ScoringResult {
    const reasons: ScoringReason[] = [];
    let totalScore = 0;

    const noWebPts = weights?.score_no_website ?? 40;
    const brokenWebPts = weights?.score_broken_website ?? 30;
    const phonePts = weights?.score_no_phone ?? 5;

    const webClassification = classifyWebsite(lead.website);

    // Rule 1: No website
    if (webClassification.type === 'NONE') {
      reasons.push({ rule: 'No website', points: noWebPts });
      totalScore += noWebPts;
    } else if (webClassification.isSocialOrDirectory) {
      const pts = Math.round(noWebPts * 0.8);
      reasons.push({ rule: `Only has ${webClassification.label} (No dedicated website)`, points: pts });
      totalScore += pts;
    }

    // Rule 2: Broken website
    if (!webClassification.isSocialOrDirectory && (lead.websiteStatus === 'OFFLINE' || lead.websiteStatus === 'INVALID')) {
      reasons.push({ rule: 'Broken website', points: brokenWebPts });
      totalScore += brokenWebPts;
    }

    // Rule 3: Phone available
    if (lead.phone && lead.phone.trim()) {
      reasons.push({ rule: 'Phone available', points: phonePts });
      totalScore += phonePts;
    }

    // Rule 4: Email available (+5)
    if (lead.email && lead.email.trim()) {
      reasons.push({ rule: 'Email available', points: 5 });
      totalScore += 5;
    }

    // Rule 5: Review count
    if (lead.reviewCount && lead.reviewCount >= 20) {
      reasons.push({ rule: 'High review count (>=20)', points: 10 });
      totalScore += 10;
    }

    // Rule 6: Target category specified
    if (lead.category && lead.category.trim()) {
      reasons.push({ rule: 'Target category specified', points: 10 });
      totalScore += 10;
    }

    // Rule 7: Business rating
    if (lead.rating && lead.rating >= 4.0) {
      reasons.push({ rule: 'High business rating (>=4.0)', points: 15 });
      totalScore += 15;
    }

    // Cap score at 100
    const finalScore = Math.min(100, totalScore);

    // Temperature threshold calculation
    let temperature: Temperature = 'LOW';
    if (finalScore >= 70) {
      temperature = 'HOT';
    } else if (finalScore >= 40) {
      temperature = 'WARM';
    }

    return {
      score: finalScore,
      temperature,
      reasons,
    };
  }

  /**
   * Score a single lead by ID and save to database using dynamic DB weights.
   */
  async scoreLead(leadId: number) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      const error: any = new Error(`Lead with ID ${leadId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const weights = await appSettingsService.getScoringRules();
    const { score, temperature, reasons } = this.calculateScore(lead, weights);

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        score,
        temperature,
      },
    });

    return {
      lead: updatedLead,
      score,
      temperature,
      reasons,
    };
  }

  /**
   * Bulk score leads (by list of IDs or all leads) using dynamic DB weights.
   */
  async bulkScoreLeads(leadIds?: number[]) {
    const where = leadIds && leadIds.length > 0 ? { id: { in: leadIds } } : {};
    const leads = await prisma.lead.findMany({ where });
    const weights = await appSettingsService.getScoringRules();

    let hot = 0;
    let warm = 0;
    let low = 0;

    const results = [];

    for (const lead of leads) {
      const { score, temperature, reasons } = this.calculateScore(lead, weights);

      await prisma.lead.update({
        where: { id: lead.id },
        data: { score, temperature },
      });

      if (temperature === 'HOT') hot++;
      else if (temperature === 'WARM') warm++;
      else low++;

      results.push({
        leadId: lead.id,
        businessName: lead.businessName,
        score,
        temperature,
        reasons,
      });
    }

    return {
      total: leads.length,
      hot,
      warm,
      low,
      results,
    };
  }
}
