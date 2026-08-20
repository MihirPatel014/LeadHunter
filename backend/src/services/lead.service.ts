import { Lead } from '@prisma/client';
import { LeadRepository } from '../repositories/lead.repository.js';
import { CreateLeadInput, UpdateLeadInput, LeadQueryInput } from '../validators/lead.validator.js';
import { PaginatedResult } from '../types/lead.types.js';

export class LeadService {
  private repository: LeadRepository;

  constructor() {
    this.repository = new LeadRepository();
  }

  async getLeads(query: LeadQueryInput): Promise<PaginatedResult<Lead>> {
    const { page, limit } = query;
    const { leads, total } = await this.repository.findMany(query);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getLeadById(id: number): Promise<Lead> {
    const lead = await this.repository.findById(id);
    if (!lead) {
      const error: any = new Error(`Lead with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return lead;
  }

  async createLead(data: CreateLeadInput): Promise<Lead> {
    return this.repository.create(data);
  }

  async updateLead(id: number, data: UpdateLeadInput): Promise<Lead> {
    await this.getLeadById(id); // Ensure exists
    return this.repository.update(id, data);
  }

  async deleteLead(id: number): Promise<void> {
    await this.getLeadById(id); // Ensure exists
    await this.repository.delete(id);
  }
}
