import { AppSettingsRepository } from '../repositories/app-settings.repository.js';
import { config } from '../config/env.js';

const repo = new AppSettingsRepository();

export class AppSettingsService {
  /**
   * Seed default rows on first startup.
   */
  async seed() {
    await repo.seed();
    // If GEMINI_API_KEY is in env but DB key is empty, sync it in
    const envKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
    if (envKey) {
      const stored = await repo.get('ai_api_key');
      if (!stored) {
        await repo.set('ai_api_key', envKey, 'ai', 'AI API Key');
      }
    }
  }

  async getAll(category?: string) {
    const settings = await repo.getAll(category);
    // Mask the api key value — never expose to frontend
    return settings.map((s) => ({
      ...s,
      value: s.key === 'ai_api_key' ? (s.value ? '••••••••••••••••' : '') : s.value,
    }));
  }

  async get(key: string) {
    return repo.get(key);
  }

  /**
   * Get the raw (unmasked) AI API key for internal use only.
   */
  async getAIApiKey(): Promise<string> {
    const stored = await repo.get('ai_api_key');
    if (stored && stored.trim()) return stored.trim();
    return process.env.GEMINI_API_KEY || process.env.AI_API_KEY || config.geminiApiKey || '';
  }

  async getAIProvider(): Promise<string> {
    return (await repo.get('ai_provider')) || config.aiProvider || 'gemini';
  }

  async getAIModel(): Promise<string> {
    return (await repo.get('ai_model')) || config.aiModel || 'gemini-2.5-flash';
  }

  async set(key: string, value: string) {
    await repo.set(key, value);
  }

  async setBulk(settings: Record<string, string>) {
    await repo.setBulk(settings);
  }

  async getScoringRules() {
    const rules = await repo.getAll('scoring');
    return Object.fromEntries(rules.map((r) => [r.key, Number(r.value || 0)]));
  }
}

// Singleton for use across services
export const appSettingsService = new AppSettingsService();
