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

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { city: { contains: search } },
        { category: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
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
}
