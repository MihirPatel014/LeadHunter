import { prisma } from '../config/prisma.js';

import { Prisma } from '@prisma/client';

export interface CreateApprovalData {
  leadId?: number;
  templateId?: number;
  channel?: string;
  recipient: string;
  subject?: string;
  body: string;
  status?: string;
}

export interface UpdateApprovalData {
  subject?: string;
  body?: string;
  status?: string;
  reviewNote?: string;
  sentMessageId?: number;
}

export interface FindManyApprovalFilters {
  status?: string;
  leadId?: number;
}

export class ApprovalRepository {
  async findMany(filters: FindManyApprovalFilters = {}) {
    const where: Prisma.ApprovalWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.leadId) {
      where.leadId = filters.leadId;
    }

    return prisma.approval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.approval.findUnique({ where: { id } });
  }

  async create(data: CreateApprovalData) {
    return prisma.approval.create({
      data: {
        leadId: data.leadId,
        templateId: data.templateId,
        channel: data.channel ?? 'EMAIL',
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        status: data.status ?? 'PENDING_APPROVAL',
      },
    });
  }

  async update(id: number, data: UpdateApprovalData) {
    return prisma.approval.update({
      where: { id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.reviewNote !== undefined && { reviewNote: data.reviewNote }),
        ...(data.sentMessageId !== undefined && { sentMessageId: data.sentMessageId }),
      },
    });
  }
}
