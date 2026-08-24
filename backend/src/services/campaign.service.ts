import { prisma } from '../config/prisma.js';
import { CampaignRepository } from '../repositories/campaign.repository.js';
import { TemplateService } from './template.service.js';
import { ApprovalService } from './approval.service.js';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  ListCampaignQueryInput,
} from '../validators/campaign.validator.js';

// Lead statuses where re-contacting makes no sense
const INELIGIBLE_LEAD_STATUSES = [
  'CONTACTED',
  'REPLIED',
  'INTERESTED',
  'CONVERTED',
  'DISQUALIFIED',
];

export interface CampaignRunResult {
  enqueued: number;
  skipped: number;
  reasons: {
    noEmail: number;
    alreadyQueued: number;
    ineligibleStatus: number;
  };
}

export class CampaignService {
  private campaignRepo: CampaignRepository;
  private templateService: TemplateService;
  private approvalService: ApprovalService;

  constructor() {
    this.campaignRepo = new CampaignRepository();
    this.templateService = new TemplateService();
    this.approvalService = new ApprovalService();
  }

  async list(filters: ListCampaignQueryInput) {
    return this.campaignRepo.findMany(filters);
  }

  async getById(id: number) {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      const err: any = new Error(`Campaign #${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    return campaign;
  }

  async create(data: CreateCampaignInput) {
    // Validate template exists
    await this.templateService.getTemplateById(data.templateId);
    return this.campaignRepo.create(data);
  }

  async update(id: number, data: UpdateCampaignInput) {
    await this.getById(id);
    if (data.templateId !== undefined) {
      await this.templateService.getTemplateById(data.templateId);
    }
    return this.campaignRepo.update(id, data);
  }

  async delete(id: number) {
    await this.getById(id);
    return this.campaignRepo.delete(id);
  }

  /**
   * Run a campaign: match eligible leads, render the template, and push each
   * into the approval queue.  Does NOT send any emails directly.
   */
  async run(id: number): Promise<CampaignRunResult> {
    const campaign = await this.getById(id);

    // 1. Fetch the template
    const template = await this.templateService.getTemplateById(campaign.templateId);

    // 2. Query matching leads (city + category filters, capped at dailyLimit)
    const whereClause: Record<string, any> = {
      status: { notIn: INELIGIBLE_LEAD_STATUSES },
    };
    if (campaign.city) whereClause['city'] = { contains: campaign.city };
    if (campaign.category) whereClause['category'] = { contains: campaign.category };

    const leads = await prisma.lead.findMany({
      where: whereClause,
      take: campaign.dailyLimit * 3, // fetch extra to account for skips
      orderBy: { score: 'desc' },
    });

    // 3. Fetch existing PENDING_APPROVAL / DRAFT approvals for deduplication
    const existingApprovals = await prisma.approval.findMany({
      where: {
        status: { in: ['DRAFT', 'PENDING_APPROVAL'] },
        leadId: { in: leads.map((l) => l.id) },
      },
      select: { leadId: true },
    });
    const alreadyQueuedLeadIds = new Set(
      existingApprovals.map((a) => a.leadId).filter((id): id is number => id !== null)
    );

    const reasons = { noEmail: 0, alreadyQueued: 0, ineligibleStatus: 0 };
    let enqueued = 0;

    for (const lead of leads) {
      if (enqueued >= campaign.dailyLimit) break;

      // Skip if already in queue
      if (alreadyQueuedLeadIds.has(lead.id)) {
        reasons.alreadyQueued++;
        continue;
      }

      // Skip if no email and channel is EMAIL
      if (campaign.channel === 'EMAIL' && !lead.email) {
        reasons.noEmail++;
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

      const { renderTemplate } = new (await import('./template.service.js')).TemplateService();
      const renderedSubject = template.subject
        ? renderTemplate(template.subject, context)
        : undefined;
      const renderedBody = renderTemplate(template.body, context);

      // Determine recipient
      const recipient =
        campaign.channel === 'EMAIL'
          ? (lead.email as string)
          : (lead.phone ?? lead.email ?? '');

      // Create approval entry
      await this.approvalService.create({
        leadId: lead.id,
        templateId: template.id,
        channel: campaign.channel,
        recipient,
        subject: renderedSubject,
        body: renderedBody,
        status: 'PENDING_APPROVAL',
      });

      enqueued++;
    }

    const skipped = reasons.noEmail + reasons.alreadyQueued + reasons.ineligibleStatus;
    return { enqueued, skipped, reasons };
  }
}
