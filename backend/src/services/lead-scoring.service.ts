import { Lead } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { Temperature } from '../types/lead.types.js';

export interface ScoringReason {
  rule: string;
  points: number;
}

export interface ScoringResult {
  score: number;
  temperature: Temperature;
  reasons: ScoringReason[];
}

export class LeadScoringService {
  /**
   * Calculate lead score and temperature from a lead record
   */
  calculateScore(lead: Partial<Lead>): ScoringResult {
    const reasons: ScoringReason[] = [];
    let totalScore = 0;

    // Rule 1: No website (+30)
    if (!lead.website || !lead.website.trim()) {
      reasons.push({ rule: 'No website', points: 30 });
      totalScore += 30;
    }

    // Rule 2: Broken website (+25)
    if (lead.websiteStatus === 'OFFLINE' || lead.websiteStatus === 'INVALID') {
      reasons.push({ rule: 'Broken website', points: 25 });
      totalScore += 25;
    }

    // Rule 3: Phone available (+5)
    if (lead.phone && lead.phone.trim()) {
      reasons.push({ rule: 'Phone available', points: 5 });
      totalScore += 5;
    }

    // Rule 4: Email available (+5)
    if (lead.email && lead.email.trim()) {
      reasons.push({ rule: 'Email available', points: 5 });
      totalScore += 5;
    }

    // Rule 5: High review count (+10)
    if (lead.reviewCount && lead.reviewCount >= 20) {
      reasons.push({ rule: 'High review count', points: 10 });
      totalScore += 10;
    }

    // Rule 6: Target category specified (+10)
    if (lead.category && lead.category.trim()) {
      reasons.push({ rule: 'Target category', points: 10 });
      totalScore += 10;
    }

    // Rule 7: High business rating (+15)
    if (lead.rating && lead.rating >= 4.0) {
      reasons.push({ rule: 'High business rating', points: 15 });
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
   * Score a single lead by ID and save to database
   */
  async scoreLead(leadId: number) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      const error: any = new Error(`Lead with ID ${leadId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const { score, temperature, reasons } = this.calculateScore(lead);

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
   * Bulk score leads (by list of IDs or all leads)
   */
  async bulkScoreLeads(leadIds?: number[]) {
    const where = leadIds && leadIds.length > 0 ? { id: { in: leadIds } } : {};
    const leads = await prisma.lead.findMany({ where });

    let hot = 0;
    let warm = 0;
    let low = 0;

    const results = [];

    for (const lead of leads) {
      const { score, temperature, reasons } = this.calculateScore(lead);

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
