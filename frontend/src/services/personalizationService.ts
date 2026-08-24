import { fetchApi } from './api';
import { AIStatus, AIConfigUpdate, PersonalizationRequest, PersonalizationResponse } from '../types/personalization';

export interface TestAIChatResult {
  success: boolean;
  reply: string;
  provider: string;
  model: string;
}

export const personalizationService = {
  async getAIStatus(): Promise<AIStatus> {
    const response = await fetchApi<AIStatus>('/api/personalization/status');
    return response.data!;
  },

  async updateAIConfig(data: AIConfigUpdate): Promise<AIStatus> {
    const response = await fetchApi<AIStatus>('/api/personalization/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async generatePersonalization(data: PersonalizationRequest): Promise<PersonalizationResponse> {
    const response = await fetchApi<PersonalizationResponse>('/api/personalization/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async testAIChat(prompt: string, configOverrides?: { provider?: string; model?: string; apiKey?: string }): Promise<TestAIChatResult> {
    const response = await fetchApi<TestAIChatResult>('/api/personalization/test', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        ...configOverrides,
      }),
    });
    return response.data!;
  },
};
