import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateCampaignData {
  name: string;
  description?: string;
  city?: string;
  category?: string;
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
  templateId?: number;
  channel?: string;
  dailyLimit?: number;
  status?: string;
}

export interface FindManyCampaignFilters {
  status?: string;
  city?: string;
  category?: string;
}

export class CampaignRepository {
  async findMany(filters: FindManyCampaignFilters = {}) {
    const where: Prisma.CampaignWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.city) where.city = { contains: filters.city };
    if (filters.category) where.category = { contains: filters.category };

    return prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.campaign.findUnique({ where: { id } });
  }

  async create(data: CreateCampaignData) {
    return prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        city: data.city,
        category: data.category,
        templateId: data.templateId,
        channel: data.channel ?? 'EMAIL',
        dailyLimit: data.dailyLimit ?? 20,
        status: data.status ?? 'DRAFT',
      },
    });
  }

  async update(id: number, data: UpdateCampaignData) {
    return prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async delete(id: number) {
    return prisma.campaign.delete({ where: { id } });
  }
}
