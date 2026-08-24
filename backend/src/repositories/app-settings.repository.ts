import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AppSetting {
  key: string;
  value: string | null;
  category: string;
  label?: string | null;
}

// Default settings to seed on first run
const DEFAULT_SETTINGS: AppSetting[] = [
  // AI Configuration
  { key: 'ai_provider', value: 'gemini', category: 'ai', label: 'AI Provider' },
  { key: 'ai_model', value: 'gemini-2.5-flash', category: 'ai', label: 'AI Model' },
  { key: 'ai_api_key', value: '', category: 'ai', label: 'AI API Key (Encrypted)' },

  // Outreach Preferences
  { key: 'daily_email_limit', value: '20', category: 'outreach', label: 'Daily Email Limit' },
  { key: 'daily_whatsapp_limit', value: '50', category: 'outreach', label: 'Daily WhatsApp Limit' },
  { key: 'working_hours_start', value: '09:00', category: 'outreach', label: 'Working Hours Start' },
  { key: 'working_hours_end', value: '18:00', category: 'outreach', label: 'Working Hours End' },

  // Lead Scoring Rules
  { key: 'score_no_website', value: '40', category: 'scoring', label: 'No Website Score Bonus' },
  { key: 'score_broken_website', value: '30', category: 'scoring', label: 'Broken Website Score Bonus' },
  { key: 'score_no_phone', value: '5', category: 'scoring', label: 'No Phone Score Bonus' },
  { key: 'score_low_rating', value: '15', category: 'scoring', label: 'Low Rating (<4.0) Score Bonus' },
  { key: 'score_few_reviews', value: '10', category: 'scoring', label: 'Few Reviews (<20) Score Bonus' },

  // Sender Profile
  { key: 'sender_name', value: 'LeadHunter AI', category: 'profile', label: 'Sender Name' },
  { key: 'sender_agency', value: '', category: 'profile', label: 'Agency / Company Name' },
  { key: 'sender_email_signature', value: '', category: 'profile', label: 'Email Signature' },
  { key: 'sender_calendly_url', value: '', category: 'profile', label: 'Calendly / Meeting Link' },
];

export class AppSettingsRepository {
  /**
   * Seed default settings if they don't exist (runs on startup).
   */
  async seed(): Promise<void> {
    for (const setting of DEFAULT_SETTINGS) {
      await prisma.appSettings.upsert({
        where: { key: setting.key },
        update: {}, // Don't overwrite existing user-set values
        create: {
          key: setting.key,
          value: setting.value,
          category: setting.category,
          label: setting.label,
        },
      });
    }
  }

  /**
   * Get a single setting by key.
   */
  async get(key: string): Promise<string | null> {
    const row = await prisma.appSettings.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  /**
   * Set/update a single setting value.
   */
  async set(key: string, value: string, category?: string, label?: string): Promise<void> {
    await prisma.appSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value, category: category || 'general', label },
    });
  }

  /**
   * Get all settings, optionally filtered by category.
   */
  async getAll(category?: string): Promise<AppSetting[]> {
    const rows = await prisma.appSettings.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
    return rows.map((r) => ({
      key: r.key,
      value: r.value,
      category: r.category,
      label: r.label,
    }));
  }

  /**
   * Bulk update multiple settings at once.
   */
  async setBulk(settings: Record<string, string>): Promise<void> {
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.appSettings.updateMany({
          where: { key },
          data: { value },
        })
      )
    );
  }
}
