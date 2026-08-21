import { Template } from '@prisma/client';
import { TemplateRepository } from '../repositories/template.repository.js';
import { CreateTemplateInput, UpdateTemplateInput, TemplateQueryInput } from '../validators/template.validator.js';

export class TemplateService {
  private repository: TemplateRepository;

  constructor() {
    this.repository = new TemplateRepository();
  }

  async getTemplates(query: TemplateQueryInput): Promise<Template[]> {
    return this.repository.findMany(query);
  }

  async getTemplateById(id: number): Promise<Template> {
    const template = await this.repository.findById(id);
    if (!template) {
      const error: any = new Error(`Template with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return template;
  }

  async createTemplate(data: CreateTemplateInput): Promise<Template> {
    return this.repository.create(data);
  }

  async updateTemplate(id: number, data: UpdateTemplateInput): Promise<Template> {
    await this.getTemplateById(id);
    return this.repository.update(id, data);
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.getTemplateById(id);
    await this.repository.delete(id);
  }

  /**
   * Safely render variables in a template without requiring AI
   */
  renderTemplate(templateText: string, context: Record<string, string | number | null | undefined>): string {
    let result = templateText;

    const replacements: Record<string, string> = {
      '{{business_name}}': String(context.businessName || context.business_name || 'there'),
      '{{contact_name}}': String(context.contactName || context.contact_name || 'Owner'),
      '{{city}}': String(context.city || 'your city'),
      '{{category}}': String(context.category || 'business'),
      '{{website}}': String(context.website || 'your website'),
      '{{rating}}': String(context.rating || 'N/A'),
      '{{review_count}}': String(context.reviewCount || context.review_count || '0'),
      '{{sender_name}}': String(context.senderName || context.sender_name || 'LeadHunter Team'),
    };

    for (const [key, value] of Object.entries(replacements)) {
      const escapedKey = key.replace(/[{}]/g, '\\$&');
      result = result.replace(new RegExp(escapedKey, 'g'), value);
    }

    return result;
  }
}
