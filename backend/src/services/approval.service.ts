import { prisma } from '../config/prisma.js';
import { ApprovalRepository } from '../repositories/approval.repository.js';
import { OutreachService } from './outreach.service.js';

export interface CreateApprovalPayload {
  leadId?: number;
  templateId?: number;
  channel?: string;
  recipient: string;
  subject?: string;
  body: string;
  status?: string;
}

export interface UpdateApprovalPayload {
  subject?: string;
  body?: string;
}

const EDITABLE_STATUSES = ['DRAFT', 'PENDING_APPROVAL'];

export class ApprovalService {
  private approvalRepo: ApprovalRepository;
  private outreachService: OutreachService;

  constructor() {
    this.approvalRepo = new ApprovalRepository();
    this.outreachService = new OutreachService();
  }

  async list(filters: { status?: string; leadId?: number; channel?: string; templateId?: number }) {
    const approvals = await this.approvalRepo.findMany(filters);

    const leadIds = Array.from(
      new Set(approvals.map((a) => a.leadId).filter((id): id is number => id !== null && id !== undefined))
    );
    const templateIds = Array.from(
      new Set(approvals.map((a) => a.templateId).filter((id): id is number => id !== null && id !== undefined))
    );

    const [leads, templates] = await Promise.all([
      leadIds.length > 0 ? prisma.lead.findMany({ where: { id: { in: leadIds } } }) : [],
      templateIds.length > 0 ? prisma.template.findMany({ where: { id: { in: templateIds } } }) : [],
    ]);

    const leadMap = new Map(leads.map((l) => [l.id, l]));
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    return approvals.map((approval) => ({
      ...approval,
      lead: approval.leadId ? leadMap.get(approval.leadId) || null : null,
      template: approval.templateId ? templateMap.get(approval.templateId) || null : null,
    }));
  }

  async getById(id: number) {
    const record = await this.approvalRepo.findById(id);
    if (!record) {
      const err: any = new Error(`Approval #${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    const [lead, template] = await Promise.all([
      record.leadId ? prisma.lead.findUnique({ where: { id: record.leadId } }) : null,
      record.templateId ? prisma.template.findUnique({ where: { id: record.templateId } }) : null,
    ]);

    return {
      ...record,
      lead,
      template,
    };
  }

  async create(payload: CreateApprovalPayload) {
    return this.approvalRepo.create({
      leadId: payload.leadId,
      templateId: payload.templateId,
      channel: payload.channel ?? 'EMAIL',
      recipient: payload.recipient,
      subject: payload.subject,
      body: payload.body,
      status: payload.status ?? 'PENDING_APPROVAL',
    });
  }

  async update(id: number, payload: UpdateApprovalPayload) {
    const record = await this.getById(id);

    if (!EDITABLE_STATUSES.includes(record.status)) {
      const err: any = new Error(
        `Cannot edit an approval in status "${record.status}". Only DRAFT and PENDING_APPROVAL records can be edited.`
      );
      err.statusCode = 409;
      throw err;
    }

    return this.approvalRepo.update(id, {
      subject: payload.subject,
      body: payload.body,
    });
  }

  /**
   * Approves the record and immediately dispatches the message via OutreachService.
   * Dispatches EMAIL or WHATSAPP based on record.channel — enforcing the approval gate.
   */
  async approve(id: number) {
    const record = await this.getById(id);

    if (record.status !== 'PENDING_APPROVAL' && record.status !== 'DRAFT') {
      const err: any = new Error(
        `Cannot approve an approval in status "${record.status}".`
      );
      err.statusCode = 409;
      throw err;
    }

    // Mark as APPROVED first
    await this.approvalRepo.update(id, { status: 'APPROVED' });

    const channel = (record.channel || 'EMAIL').toUpperCase();

    // Dispatch message based on channel
    try {
      let result: { sentMessage: any };

      if (channel === 'WHATSAPP') {
        result = await this.outreachService.sendWhatsApp({
          leadId: record.leadId ?? undefined,
          recipient: record.recipient,
          body: record.body,
        });
      } else {
        result = await this.outreachService.sendEmail({
          leadId: record.leadId ?? undefined,
          recipient: record.recipient,
          subject: record.subject ?? '(No Subject)',
          body: record.body,
          isHtml: false,
        });
      }

      // Link to sent message record and mark as SENT
      await this.approvalRepo.update(id, {
        status: 'SENT',
        sentMessageId: result.sentMessage.id,
      });

      return { success: true, status: 'SENT', channel, sentMessage: result.sentMessage };
    } catch (err: any) {
      // Mark as FAILED but preserve error context
      await this.approvalRepo.update(id, { status: 'FAILED' });
      const error: any = new Error(
        `Approval #${id} approved but ${channel} dispatch failed: ${err.message}`
      );
      error.statusCode = 502;
      throw error;
    }
  }

  async reject(id: number, note?: string) {
    const record = await this.getById(id);

    if (record.status !== 'PENDING_APPROVAL' && record.status !== 'DRAFT') {
      const err: any = new Error(
        `Cannot reject an approval in status "${record.status}".`
      );
      err.statusCode = 409;
      throw err;
    }

    return this.approvalRepo.update(id, {
      status: 'REJECTED',
      reviewNote: note ?? '',
    });
  }

  async bulkApprove(ids: number[]) {
    const results: { approved: number; failed: number; errors: Array<{ id: number; error: string }> } = {
      approved: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        await this.approve(id);
        results.approved++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ id, error: err.message || 'Failed to dispatch' });
      }
    }

    return results;
  }

  async bulkReject(ids: number[], note?: string) {
    const result = await prisma.approval.updateMany({
      where: {
        id: { in: ids },
        status: { in: ['PENDING_APPROVAL', 'DRAFT'] },
      },
      data: {
        status: 'REJECTED',
        reviewNote: note || 'Bulk rejected by reviewer',
      },
    });

    return { rejected: result.count };
  }
}

