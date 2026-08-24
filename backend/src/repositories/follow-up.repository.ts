import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateFollowUpScheduleData {
  leadId: number;
  templateId?: number;
  step: number;
  scheduledAt: Date;
  status?: string;
  notes?: string;
}

export interface UpdateFollowUpScheduleData {
  status?: string;
  scheduledAt?: Date;
  notes?: string;
}

export interface FindManyFollowUpFilters {
  status?: string;
  leadId?: number;
  isDue?: boolean;
}

export class FollowUpRepository {
  /**
   * Find schedules matching criteria with lead joined for display/processing
   */
  async findMany(filters: FindManyFollowUpFilters = {}) {
    const where: Prisma.FollowUpScheduleWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.isDue) {
      where.status = 'SCHEDULED';
      where.scheduledAt = { lte: new Date() };
    }

    const schedules = await prisma.followUpSchedule.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    // Hydrate lead records manually for SQLite fast lookup
    const leadIds = [...new Set(schedules.map((s) => s.leadId))];
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    return schedules.map((s) => ({
      ...s,
      lead: leadMap.get(s.leadId) || null,
    }));
  }

  async findById(id: number) {
    const schedule = await prisma.followUpSchedule.findUnique({ where: { id } });
    if (!schedule) return null;
    const lead = await prisma.lead.findUnique({ where: { id: schedule.leadId } });
    return { ...schedule, lead };
  }

  async create(data: CreateFollowUpScheduleData) {
    return prisma.followUpSchedule.create({
      data: {
        leadId: data.leadId,
        templateId: data.templateId,
        step: data.step,
        scheduledAt: data.scheduledAt,
        status: data.status ?? 'SCHEDULED',
        notes: data.notes,
      },
    });
  }

  async update(id: number, data: UpdateFollowUpScheduleData) {
    return prisma.followUpSchedule.update({
      where: { id },
      data,
    });
  }

  async findDueSchedules(asOf: Date = new Date()) {
    const schedules = await prisma.followUpSchedule.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: asOf },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const leadIds = [...new Set(schedules.map((s) => s.leadId))];
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    return schedules.map((s) => ({
      ...s,
      lead: leadMap.get(s.leadId) || null,
    }));
  }

  // --- Configuration ---
  async getOrCreateConfig() {
    let config = await prisma.followUpConfig.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    if (!config) {
      config = await prisma.followUpConfig.create({
        data: {
          name: 'Default Sequence',
          intervals: '1,3,7,10',
          isActive: true,
        },
      });
    }

    return config;
  }

  async updateConfig(intervals: string, name?: string) {
    const current = await this.getOrCreateConfig();
    return prisma.followUpConfig.update({
      where: { id: current.id },
      data: {
        intervals,
        ...(name && { name }),
      },
    });
  }
}
