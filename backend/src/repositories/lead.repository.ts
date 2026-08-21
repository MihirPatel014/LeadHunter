import { Lead, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { CreateLeadInput, UpdateLeadInput, LeadQueryInput } from '../validators/lead.validator.js';

export class LeadRepository {
  async findMany(query: LeadQueryInput): Promise<{ leads: Lead[]; total: number }> {
    const { page, limit, search, status, temperature, city, category } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    if (status) where.status = status;
    if (temperature) where.temperature = temperature;
    if (city) where.city = { contains: city };
    if (category) where.category = { contains: category };
    if (query.websiteStatus) where.websiteStatus = query.websiteStatus;

    if (query.websiteType) {
      switch (query.websiteType) {
        case 'NONE':
          where.OR = [
            { website: null },
            { website: '' },
          ];
          break;
        case 'INSTAGRAM':
          where.website = { contains: 'instagram.com' };
          break;
        case 'FACEBOOK':
          where.OR = [
            { website: { contains: 'facebook.com' } },
            { website: { contains: 'fb.com' } },
          ];
          break;
        case 'INDIAMART':
          where.website = { contains: 'indiamart.com' };
          break;
        case 'JUSTDIAL':
          where.website = { contains: 'justdial.com' };
          break;
        case 'SOCIAL_OR_DIRECTORY':
          where.OR = [
            { website: { contains: 'instagram.com' } },
            { website: { contains: 'facebook.com' } },
            { website: { contains: 'indiamart.com' } },
            { website: { contains: 'justdial.com' } },
            { website: { contains: 'linkedin.com' } },
            { website: { contains: 'twitter.com' } },
            { website: { contains: 'x.com' } },
            { website: { contains: 'youtube.com' } },
            { website: { contains: 'tradeindia.com' } },
          ];
          break;
        case 'CUSTOM':
          where.AND = [
            { website: { not: null } },
            { website: { not: '' } },
            { website: { not: { contains: 'instagram.com' } } },
            { website: { not: { contains: 'facebook.com' } } },
            { website: { not: { contains: 'indiamart.com' } } },
            { website: { not: { contains: 'justdial.com' } } },
            { website: { not: { contains: 'youtube.com' } } },
          ];
          break;
      }
    }

    if (search) {
      const searchConditions = [
        { businessName: { contains: search } },
        { city: { contains: search } },
        { category: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { website: { contains: search } },
      ];

      if (where.OR) {
        where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    }


    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    return { leads, total };
  }

  async findById(id: number): Promise<Lead | null> {
    return prisma.lead.findUnique({
      where: { id },
    });
  }

  async create(data: CreateLeadInput): Promise<Lead> {
    return prisma.lead.create({
      data,
    });
  }

  async update(id: number, data: UpdateLeadInput): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Lead> {
    return prisma.lead.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: number[]): Promise<number> {
    const result = await prisma.lead.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  async bulkUpdate(ids: number[], data: Record<string, unknown>): Promise<number> {
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data,
    });
    return result.count;
  }
}
