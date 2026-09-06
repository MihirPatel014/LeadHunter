import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateCampaignData {
  name: string;
  description?: string;
  city?: string;
  category?: string;
  leadSource?: string;
  leadIds?: number[];
  templateId: number;
  channel?: string;
  dailyLimit?: number;
  status?: string;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  city?: string;
  category?: string;
  leadSource?: string;
  leadIds?: number[];
  templateId?: number;
  channel?: string;
  dailyLimit?: number;
  status?: string;
}

export interface FindManyCampaignFilters {
  status?: string;
  city?: string;
  category?: string;
  leadSource?: string;
}

export class CampaignRepository {
  async findMany(filters: FindManyCampaignFilters = {}) {
    const where: Prisma.CampaignWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.city) where.city = { contains: filters.city };
    if (filters.category) where.category = { contains: filters.category };
    if (filters.leadSource) where.leadSource = filters.leadSource;

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map(this.formatCampaign);
  }

  async findById(id: number) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    return campaign ? this.formatCampaign(campaign) : null;
  }

  async create(data: CreateCampaignData) {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        city: data.city,
        category: data.category,
        leadSource: data.leadSource,
        leadIds: data.leadIds && data.leadIds.length > 0 ? JSON.stringify(data.leadIds) : null,
        templateId: data.templateId,
        channel: data.channel ?? 'EMAIL',
        dailyLimit: data.dailyLimit ?? 20,
        status: data.status ?? 'DRAFT',
      },
    });

    return this.formatCampaign(campaign);
  }

  async update(id: number, data: UpdateCampaignData) {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.leadSource !== undefined && { leadSource: data.leadSource }),
        ...(data.leadIds !== undefined && {
          leadIds: data.leadIds && data.leadIds.length > 0 ? JSON.stringify(data.leadIds) : null,
        }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return this.formatCampaign(campaign);
  }

  async delete(id: number) {
    return prisma.campaign.delete({ where: { id } });
  }

  private formatCampaign(campaign: any) {
    let parsedLeadIds: number[] | null = null;
    if (campaign.leadIds) {
      try {
        parsedLeadIds = JSON.parse(campaign.leadIds);
      } catch {
        parsedLeadIds = null;
      }
    }

    return {
      ...campaign,
      leadIds: parsedLeadIds,
    };
  }
}

