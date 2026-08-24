import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/overview
 * Returns all KPI counts for the dashboard.
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalLeads,
      newLeads,
      contactedLeads,
      repliedLeads,
      interestedLeads,
      convertedLeads,
      disqualifiedLeads,
      totalSent,
      totalCampaigns,
      activeCampaigns,
      pendingApprovals,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.lead.count({ where: { status: 'CONTACTED' } }),
      prisma.lead.count({ where: { status: 'REPLIED' } }),
      prisma.lead.count({ where: { status: 'INTERESTED' } }),
      prisma.lead.count({ where: { status: 'CONVERTED' } }),
      prisma.lead.count({ where: { status: 'DISQUALIFIED' } }),
      prisma.sentMessage.count({ where: { status: 'SENT' } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.approval.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10 : 0;
    const responseRate = contactedLeads > 0 ? Math.round((repliedLeads / contactedLeads) * 100 * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        leads: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          replied: repliedLeads,
          interested: interestedLeads,
          converted: convertedLeads,
          disqualified: disqualifiedLeads,
        },
        outreach: {
          totalSent,
          pendingApprovals,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        rates: {
          conversionRate,
          responseRate,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/analytics/pipeline
 * Returns lead counts by status for funnel visualization.
 */
export const getPipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const statuses = ['NEW', 'RESEARCHED', 'QUALIFIED', 'PENDING_APPROVAL', 'CONTACTED', 'REPLIED', 'INTERESTED', 'CONVERTED'];

    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.lead.count({ where: { status } }),
      }))
    );

    res.json({ success: true, data: counts });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/analytics/cities
 * Returns top cities by lead count.
 */
export const getTopCities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 10;

    // Group by city using raw aggregation
    const rawCities = await prisma.lead.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
      where: { city: { not: null } },
    });

    const data = rawCities.map((row) => ({
      city: row.city || 'Unknown',
      count: row._count.id,
    }));

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/analytics/categories
 * Returns lead counts by business category.
 */
export const getTopCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 10;

    const rawCategories = await prisma.lead.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
      where: { category: { not: null } },
    });

    const data = rawCategories.map((row) => ({
      category: row.category || 'Uncategorized',
      count: row._count.id,
    }));

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/analytics/campaigns
 * Returns campaign performance stats.
 */
export const getCampaignPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Count approvals sent per campaign
    const data = await Promise.all(
      campaigns.map(async (c) => {
        const sent = await prisma.approval.count({
          where: { status: 'SENT' },
        });
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          channel: c.channel,
          city: c.city,
          category: c.category,
          dailyLimit: c.dailyLimit,
          createdAt: c.createdAt,
          messagesSent: sent,
        };
      })
    );

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/analytics/lead-source
 * Returns breakdown of leads by source (SERPAPI vs MANUAL).
 */
export const getLeadSourceBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sources = await prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    const data = sources.map((row) => ({
      source: row.source,
      count: row._count.id,
    }));

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/analytics/temperature
 * Returns lead counts by temperature (HOT/WARM/LOW).
 */
export const getLeadTemperature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const temps = await prisma.lead.groupBy({
      by: ['temperature'],
      _count: { id: true },
    });

    const data = temps.map((row) => ({
      temperature: row.temperature,
      count: row._count.id,
    }));

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
