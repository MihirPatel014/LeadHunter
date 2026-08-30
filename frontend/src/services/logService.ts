import { fetchApi } from './api';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type LogSource = 'BACKEND' | 'FRONTEND';
export type LogCategory =
  | 'API'
  | 'OUTREACH'
  | 'WEBHOOK'
  | 'WHATSAPP'
  | 'GMAIL'
  | 'AI'
  | 'SYSTEM'
  | 'CLIENT'
  | 'DATABASE'
  | string;

export interface LogEntry {
  id: string;
  timestamp: string;
  source: LogSource;
  level: LogLevel;
  category: LogCategory;
  message: string;
  meta?: Record<string, any>;
}

export interface ListLogsResult {
  total: number;
  limit: number;
  offset: number;
  logs: LogEntry[];
  counts: {
    total: number;
    errors: number;
    warnings: number;
    backend: number;
    frontend: number;
  };
}

export interface ListLogsParams {
  source?: LogSource;
  level?: LogLevel;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const logService = {
  async getLogs(params: ListLogsParams = {}): Promise<ListLogsResult> {
    const query = new URLSearchParams();
    if (params.source) query.set('source', params.source);
    if (params.level) query.set('level', params.level);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const res = await fetchApi<ListLogsResult>(`/api/logs?${query.toString()}`);
    return res.data!;
  },

  async sendClientLog(entry: {
    level: LogLevel;
    category?: string;
    message: string;
    meta?: Record<string, any>;
  }): Promise<LogEntry> {
    const res = await fetchApi<LogEntry>('/api/logs/client', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    return res.data!;
  },

  async clearLogs(): Promise<void> {
    await fetchApi('/api/logs', {
      method: 'DELETE',
    });
  },

  async simulateLog(): Promise<LogEntry[]> {
    const res = await fetchApi<LogEntry[]>('/api/logs/simulate', {
      method: 'POST',
    });
    return res.data!;
  },
};
