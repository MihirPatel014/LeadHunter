import { LeadRepository } from '../repositories/lead.repository.js';
import { TemplateRepository } from '../repositories/template.repository.js';
import { TemplateService } from './template.service.js';
import { MessagePreviewResponse } from '../types/message.types.js';

export class MessageService {
  private leadRepo: LeadRepository;
  private templateRepo: TemplateRepository;
  private templateService: TemplateService;

  constructor() {
    this.leadRepo = new LeadRepository();
    this.templateRepo = new TemplateRepository();
    this.templateService = new TemplateService();
  }

  /**
   * Generate a rendered message preview by combining a Lead + Template.
   * No AI — pure variable substitution.
   */
  async previewMessage(leadId: number, templateId: number): Promise<MessagePreviewResponse> {
    // 1. Fetch the lead
    const lead = await this.leadRepo.findById(leadId);
    if (!lead) {
      const error: any = new Error(`Lead with ID ${leadId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 2. Fetch the template
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      const error: any = new Error(`Template with ID ${templateId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 3. Build context from lead fields
    const context: Record<string, string | number | null | undefined> = {
      businessName: lead.businessName,
      business_name: lead.businessName,
      contact_name: null, // No contact name in lead model yet
      city: lead.city,
      category: lead.category,
      website: lead.website,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      review_count: lead.reviewCount,
      senderName: 'LeadHunter Team',
      sender_name: 'LeadHunter Team',
    };

    // 4. Render subject and body
    const renderedSubject = template.subject
      ? this.templateService.renderTemplate(template.subject, context)
      : null;
    const renderedBody = this.templateService.renderTemplate(template.body, context);

    return {
      lead: {
        id: lead.id,
        businessName: lead.businessName,
        category: lead.category,
        city: lead.city,
      },
      template: {
        id: template.id,
        name: template.name,
        channel: template.channel,
      },
      rendered: {
        subject: renderedSubject,
        body: renderedBody,
      },
    };
  }
}
