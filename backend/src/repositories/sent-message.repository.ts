import { prisma } from '../config/prisma.js';

export interface CreateSentMessageInput {
  leadId?: number | null;
  recipient: string;
  subject: string;
  body: string;
  channel?: string;
  provider: string;
  messageId?: string | null;
  threadId?: string | null;
  status: string;
  errorMessage?: string | null;
}

export class SentMessageRepository {
  async create(data: CreateSentMessageInput) {
    return prisma.sentMessage.create({
      data: {
        leadId: data.leadId ?? undefined,
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        channel: data.channel || 'EMAIL',
        provider: data.provider,
        messageId: data.messageId,
        threadId: data.threadId,
        status: data.status,
        errorMessage: data.errorMessage,
      },
    });
  }

  async findMany(options?: { leadId?: number; limit?: number }) {
    return prisma.sentMessage.findMany({
      where: options?.leadId ? { leadId: options.leadId } : undefined,
      take: options?.limit || 50,
      orderBy: { sentAt: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.sentMessage.findUnique({
      where: { id },
    });
  }
}
