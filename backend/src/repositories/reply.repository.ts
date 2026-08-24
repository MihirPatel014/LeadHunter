import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateReplyData {
  leadId?: number;
  sentMessageId?: number;
  threadId: string;
  messageId: string;
  sender: string;
  subject?: string;
  body: string;
  replyAt?: Date;
}

export interface FindManyRepliesFilters {
  leadId?: number;
  sender?: string;
  threadId?: string;
}

export class ReplyRepository {
  async findMany(filters: FindManyRepliesFilters = {}) {
    const where: Prisma.ReplyWhereInput = {};

    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.sender) where.sender = { contains: filters.sender };
    if (filters.threadId) where.threadId = filters.threadId;

    const replies = await prisma.reply.findMany({
      where,
      orderBy: { replyAt: 'desc' },
    });

    // Hydrate lead records for easy frontend display
    const leadIds = [...new Set(replies.map((r) => r.leadId).filter((id): id is number => id !== null))];
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    return replies.map((r) => ({
      ...r,
      lead: r.leadId ? leadMap.get(r.leadId) || null : null,
    }));
  }

  async findByMessageId(messageId: string) {
    return prisma.reply.findUnique({
      where: { messageId },
    });
  }

  async findByThreadId(threadId: string) {
    return prisma.reply.findMany({
      where: { threadId },
      orderBy: { replyAt: 'desc' },
    });
  }

  async create(data: CreateReplyData) {
    return prisma.reply.create({
      data: {
        leadId: data.leadId,
        sentMessageId: data.sentMessageId,
        threadId: data.threadId,
        messageId: data.messageId,
        sender: data.sender,
        subject: data.subject,
        body: data.body,
        replyAt: data.replyAt ?? new Date(),
      },
    });
  }
}
