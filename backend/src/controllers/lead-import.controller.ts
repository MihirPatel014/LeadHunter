import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { CsvParserService } from '../services/csv-parser.service.js';
import { z } from 'zod';

const importLeadItemSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  category: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  mapsUrl: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  reviewCount: z.number().nullable().optional(),
  updateIfExisting: z.boolean().optional().default(false),
});

const confirmImportSchema = z.object({
  leads: z.array(importLeadItemSchema).min(1, 'At least 1 lead required to import'),
});

const previewBodySchema = z.object({
  csvContent: z.string().min(5, 'CSV content cannot be empty'),
});

export class LeadImportController {
  /**
   * POST /api/leads/import/preview
   * Accepts raw CSV text, parses it, matches against existing DB records, and returns preview.
   */
  static async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csvContent } = previewBodySchema.parse(req.body);
      const rows = CsvParserService.parseCsv(csvContent);

      if (rows.length < 2) {
        res.status(400).json({
          success: false,
          error: 'CSV does not contain any data rows.',
        });
        return;
      }

      const items = await CsvParserService.transformAndCheckDuplicates(rows);

      const totalDiscovered = items.length;
      const duplicatesCount = items.filter((i) => i.isDuplicate).length;
      const newLeadsCount = totalDiscovered - duplicatesCount;

      res.status(200).json({
        success: true,
        data: {
          total: totalDiscovered,
          newLeads: newLeadsCount,
          duplicates: duplicatesCount,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/leads/import/confirm
   * Saves the verified / edited list of leads into the database.
   */
  static async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leads } = confirmImportSchema.parse(req.body);

      let createdCount = 0;
      let updatedCount = 0;

      for (const lead of leads) {
        // Check if duplicate exists
        const existing = await prisma.lead.findFirst({
          where: {
            OR: [
              { businessName: { equals: lead.businessName } },
              lead.phone ? { phone: { equals: lead.phone } } : { id: -1 },
            ],
          },
        });

        if (existing) {
          if (lead.updateIfExisting) {
            await prisma.lead.update({
              where: { id: existing.id },
              data: {
                category: lead.category || existing.category,
                city: lead.city || existing.city,
                address: lead.address || existing.address,
                website: lead.website || existing.website,
                mapsUrl: lead.mapsUrl || existing.mapsUrl,
                phone: lead.phone || existing.phone,
                email: lead.email || existing.email,
                rating: lead.rating !== undefined && lead.rating !== null ? lead.rating : existing.rating,
                reviewCount: lead.reviewCount !== undefined && lead.reviewCount !== null ? lead.reviewCount : existing.reviewCount,
              },
            });
            updatedCount++;
          }
          continue;
        }

        // Create new lead
        const websiteStatus = lead.website && lead.website.trim().length > 0 ? 'UNKNOWN' : 'INVALID';

        await prisma.lead.create({
          data: {
            businessName: lead.businessName,
            category: lead.category || null,
            city: lead.city || null,
            address: lead.address || null,
            website: lead.website || null,
            mapsUrl: lead.mapsUrl || null,
            phone: lead.phone || null,
            email: lead.email || null,
            rating: lead.rating ?? null,
            reviewCount: lead.reviewCount ?? null,
            source: 'GOOGLE_MAPS_IMPORT',
            websiteStatus,
            score: 0,
            temperature: 'LOW',
            status: 'NEW',
          },
        });

        createdCount++;
      }

      res.status(200).json({
        success: true,
        message: `Successfully processed import: ${createdCount} created, ${updatedCount} updated.`,
        data: {
          created: createdCount,
          updated: updatedCount,
          total: leads.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
