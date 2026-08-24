import { prisma } from '../config/prisma.js';
import { FollowUpRepository } from '../repositories/follow-up.repository.js';
import { ApprovalService } from './approval.service.js';
import { TemplateService } from './template.service.js';
import {
  ListFollowUpsQueryInput,
  UpdateFollowUpConfigInput,
  ScheduleFollowUpInput,
} from '../validators/follow-up.validator.js';

// Statuses where outreach must completely cease
const TERMINAL_STOP_STATUSES = [
  'REPLIED',
  'INTERESTED',
  'CONVERTED',
  'DISQUALIFIED',
];

export interface FollowUpProcessResult {
  processed: number;
  queuedForApproval: number;
  stopped: number;
  errors: number;
}

export class FollowUpService {
  private followUpRepo: FollowUpRepository;
  private approvalService: ApprovalService;
  private templateService: TemplateService;

  constructor() {
    this.followUpRepo = new FollowUpRepository();
    this.approvalService = new ApprovalService();
    this.templateService = new TemplateService();
  }

  async list(filters: ListFollowUpsQueryInput) {
    return this.followUpRepo.findMany({
      status: filters.status,
      leadId: filters.leadId,
      isDue: filters.isDue,
    });
  }

  async getConfig() {
    return this.followUpRepo.getOrCreateConfig();
  }

  async updateConfig(input: UpdateFollowUpConfigInput) {
    return this.followUpRepo.updateConfig(input.intervals, input.name);
  }

  /**
   * Parse configured interval day offsets e.g. "1,3,7,10" -> [1, 3, 7, 10]
   */
  async getParsedIntervals(): Promise<number[]> {
    const config = await this.getConfig();
    return config.intervals
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
  }

  /**
   * Schedule a follow-up step for a given lead
   */
  async scheduleFollowUp(input: ScheduleFollowUpInput) {
    const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) {
      const err: any = new Error(`Lead #${input.leadId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (TERMINAL_STOP_STATUSES.includes(lead.status)) {
      const err: any = new Error(
        `Cannot schedule follow-up: Lead #${lead.id} is in "${lead.status}" status (follow-ups stopped).`
      );
      err.statusCode = 400;
      throw err;
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + (input.daysFromNow || 1));

    const schedule = await this.followUpRepo.create({
      leadId: input.leadId,
      templateId: input.templateId,
      step: input.step,
      scheduledAt: scheduledDate,
      notes: input.notes,
    });

    // Update lead tracking
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        nextFollowUpAt: scheduledDate,
      },
    });

    return schedule;
  }

  /**
   * Skip a scheduled follow-up and schedule the next step if available
   */
  async skipFollowUp(id: number) {
    const schedule = await this.followUpRepo.findById(id);
    if (!schedule) {
      const err: any = new Error(`Follow-up schedule #${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (schedule.status !== 'SCHEDULED') {
      const err: any = new Error(
        `Cannot skip follow-up with status "${schedule.status}". Only SCHEDULED follow-ups can be skipped.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Mark current as SKIPPED
    await this.followUpRepo.update(id, {
      status: 'SKIPPED',
      notes: schedule.notes ? `${schedule.notes} (Skipped manually)` : 'Skipped manually',
    });

    // Determine next step
    const intervals = await this.getParsedIntervals();
    const nextStep = schedule.step + 1;

    if (nextStep <= intervals.length) {
      const daysOffset = intervals[nextStep - 1];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysOffset);

      await this.followUpRepo.create({
        leadId: schedule.leadId,
        templateId: schedule.templateId ?? undefined,
        step: nextStep,
        scheduledAt: nextDate,
        notes: `Follow-up Step ${nextStep} after step ${schedule.step} skipped`,
      });

      await prisma.lead.update({
        where: { id: schedule.leadId },
        data: {
          followUpStep: schedule.step,
          nextFollowUpAt: nextDate,
        },
      });
    } else {
      // Sequence completed
      await prisma.lead.update({
        where: { id: schedule.leadId },
        data: {
          nextFollowUpAt: null,
        },
      });
    }

    return { success: true, message: `Follow-up #${id} skipped` };
  }

  /**
   * Resolve the outreach channel for a scheduled follow-up.
   * Priority: template.channel → most recent SentMessage for lead → EMAIL
   */
  private async resolveChannel(item: { templateId?: number | null; lead?: any }): Promise<string> {
    if (item.templateId) {
      const tpl = await prisma.template.findUnique({
        where: { id: item.templateId as number },
        select: { channel: true },
      });
      if (tpl?.channel) return tpl.channel.toUpperCase();
    }
    if (item.lead?.id) {
      const lastMsg = await prisma.sentMessage.findFirst({
        where: { leadId: item.lead.id },
        orderBy: { sentAt: 'desc' },
        select: { channel: true },
      });
      if (lastMsg?.channel) return lastMsg.channel.toUpperCase();
    }
    return 'EMAIL';
  }

  /**
   * Process all due follow-ups (as of right now)
   * 1. Check stop conditions (replied, interested, converted, disqualified)
   * 2. Resolve channel (EMAIL / WHATSAPP) from template or last outreach
   * 3. Validate recipient contact exists for that channel
   * 4. Render template and push to Approval Queue (PENDING_APPROVAL)
   * 5. Update lead tracking and schedule subsequent step in sequence
   */
  async processDueFollowUps(): Promise<FollowUpProcessResult> {
    const dueSchedules = await this.followUpRepo.findDueSchedules(new Date());
    const intervals = await this.getParsedIntervals();

    const result: FollowUpProcessResult = {
      processed: dueSchedules.length,
      queuedForApproval: 0,
      stopped: 0,
      errors: 0,
    };

    for (const item of dueSchedules) {
      try {
        const lead = item.lead;
        if (!lead) {
          await this.followUpRepo.update(item.id, {
            status: 'CANCELLED',
            notes: 'Lead record no longer exists',
          });
          result.stopped++;
          continue;
        }

        // Rule Check: Stop conditions
        if (TERMINAL_STOP_STATUSES.includes(lead.status)) {
          await this.followUpRepo.update(item.id, {
            status: 'CANCELLED',
            notes: `Auto-stopped: Lead entered "${lead.status}" status`,
          });
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nextFollowUpAt: null },
          });
          result.stopped++;
          continue;
        }

        // Resolve channel (EMAIL vs WHATSAPP)
        const channel = await this.resolveChannel(item);

        // Validate recipient by channel
        let recipient: string | null = null;
        if (channel === 'WHATSAPP') {
          recipient = lead.phone || null;
          if (!recipient) {
            await this.followUpRepo.update(item.id, {
              status: 'SKIPPED',
              notes: `Lead has no phone number (WHATSAPP channel)`,
            });
            result.stopped++;
            continue;
          }
        } else {
          recipient = lead.email || null;
          if (!recipient) {
            await this.followUpRepo.update(item.id, {
              status: 'SKIPPED',
              notes: `Lead has no email address (${channel} channel)`,
            });
            result.stopped++;
            continue;
          }
        }

        // Find or fallback template
        let template;
        if (item.templateId) {
          template = await prisma.template.findUnique({ where: { id: item.templateId } });
        }
        if (!template) {
          // Fallback to active template matching the resolved channel
          template = await prisma.template.findFirst({
            where: { channel, isActive: true },
            orderBy: { id: 'asc' },
          });
        }
        // Last-resort fallback: any active template
        if (!template) {
          template = await prisma.template.findFirst({
            where: { isActive: true },
            orderBy: { id: 'asc' },
          });
        }

        if (!template) {
          await this.followUpRepo.update(item.id, {
            notes: 'No active template found to render follow-up',
          });
          result.errors++;
          continue;
        }

        // Render template variables
        const context: Record<string, string | number | null | undefined> = {
          businessName: lead.businessName,
          business_name: lead.businessName,
          contact_name: null,
          city: lead.city,
          category: lead.category,
          website: lead.website,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          review_count: lead.reviewCount,
          senderName: 'LeadHunter Team',
          sender_name: 'LeadHunter Team',
        };

        const renderedSubject = template.subject
          ? this.templateService.renderTemplate(
              `Follow-up (Step ${item.step}): ${template.subject}`,
              context
            )
          : `Following up on ${lead.businessName}`;
        const renderedBody = this.templateService.renderTemplate(template.body, context);

        // Put into Human Approval Queue (Never auto-send!)
        await this.approvalService.create({
          leadId: lead.id,
          templateId: template.id,
          channel,
          recipient: recipient as string,
          subject: channel === 'WHATSAPP' ? undefined : renderedSubject,
          body: renderedBody,
          status: 'PENDING_APPROVAL',
        });

        // Mark this schedule item as queued
        await this.followUpRepo.update(item.id, {
          status: 'QUEUED_FOR_APPROVAL',
          notes: `Enqueued for approval via ${channel} at ${new Date().toISOString()}`,
        });

        // Advance step and schedule next step if sequence continues
        const nextStep = item.step + 1;
        let nextDate: Date | null = null;

        if (nextStep <= intervals.length) {
          const daysOffset = intervals[nextStep - 1];
          nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + daysOffset);

          await this.followUpRepo.create({
            leadId: lead.id,
            templateId: template.id,
            step: nextStep,
            scheduledAt: nextDate,
            notes: `Follow-up Step ${nextStep} scheduled via ${channel}`,
          });
        }

        // Update Lead tracking
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            followUpStep: item.step,
            nextFollowUpAt: nextDate,
            lastContactedAt: new Date(),
          },
        });

        result.queuedForApproval++;
      } catch (err: any) {
        console.error(`Error processing follow-up schedule #${item.id}:`, err);
        result.errors++;
      }
    }

    return result;
  }
}
