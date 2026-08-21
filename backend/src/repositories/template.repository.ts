import { Template, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { CreateTemplateInput, UpdateTemplateInput, TemplateQueryInput } from '../validators/template.validator.js';

export class TemplateRepository {
  async findMany(query: TemplateQueryInput): Promise<Template[]> {
    const { channel, search, isActive } = query;

    const where: Prisma.TemplateWhereInput = {};
    if (channel) where.channel = channel;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { subject: { contains: search } },
        { body: { contains: search } },
      ];
    }

    return prisma.template.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: number): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { id },
    });
  }

  async create(data: CreateTemplateInput): Promise<Template> {
    return prisma.template.create({
      data,
    });
  }

  async update(id: number, data: UpdateTemplateInput): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Template> {
    return prisma.template.delete({
      where: { id },
    });
  }
}
