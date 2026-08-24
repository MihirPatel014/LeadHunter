import { fetchApi } from './api';
import {
  AnalyticsOverview,
  PipelineStage,
  CityStat,
  CategoryStat,
  SourceStat,
  TemperatureStat,
  CampaignStat,
} from '../types/analytics';

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await fetchApi<AnalyticsOverview>('/api/analytics/overview');
    return res.data!;
  },

  async getPipeline(): Promise<PipelineStage[]> {
    const res = await fetchApi<PipelineStage[]>('/api/analytics/pipeline');
    return res.data!;
  },

  async getTopCities(limit = 10): Promise<CityStat[]> {
    const res = await fetchApi<CityStat[]>(`/api/analytics/cities?limit=${limit}`);
    return res.data!;
  },

  async getTopCategories(limit = 10): Promise<CategoryStat[]> {
    const res = await fetchApi<CategoryStat[]>(`/api/analytics/categories?limit=${limit}`);
    return res.data!;
  },

  async getLeadSourceBreakdown(): Promise<SourceStat[]> {
    const res = await fetchApi<SourceStat[]>('/api/analytics/lead-source');
    return res.data!;
  },

  async getLeadTemperatureDistribution(): Promise<TemperatureStat[]> {
    const res = await fetchApi<TemperatureStat[]>('/api/analytics/temperature');
    return res.data!;
  },

  async getCampaignPerformance(): Promise<CampaignStat[]> {
    const res = await fetchApi<CampaignStat[]>('/api/analytics/campaigns');
    return res.data!;
  },
};
