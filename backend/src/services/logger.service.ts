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
  | 'DATABASE';

export interface LogEntry {
  id: string;
  timestamp: string;
  source: LogSource;
  level: LogLevel;
  category: LogCategory | string;
  message: string;
  meta?: Record<string, any>;
}

export interface ListLogsFilter {
  source?: LogSource;
  level?: LogLevel;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class LoggerService {
  private static instance: LoggerService;
  private readonly maxCapacity = 1000;
  private logs: LogEntry[] = [];
  private idCounter = 0;

  constructor() {
    // Seed an initial startup log
    this.log({
      source: 'BACKEND',
      level: 'INFO',
      category: 'SYSTEM',
      message: 'LeadHunter Unified Logger Service initialized',
      meta: { environment: process.env.NODE_ENV || 'development', maxCapacity: this.maxCapacity },
    });
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  log(entry: Omit<LogEntry, 'id' | 'timestamp'> & { timestamp?: string }): LogEntry {
    const fullEntry: LogEntry = {
      id: `log_${Date.now()}_${++this.idCounter}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      source: entry.source || 'BACKEND',
      level: entry.level || 'INFO',
      category: entry.category || 'SYSTEM',
      message: entry.message,
      meta: entry.meta,
    };

    this.logs.unshift(fullEntry);

    // Keep within maxCapacity ring buffer
    if (this.logs.length > this.maxCapacity) {
      this.logs.length = this.maxCapacity;
    }

    return fullEntry;
  }

  info(category: LogCategory | string, message: string, meta?: Record<string, any>, source: LogSource = 'BACKEND') {
    return this.log({ source, level: 'INFO', category, message, meta });
  }

  warn(category: LogCategory | string, message: string, meta?: Record<string, any>, source: LogSource = 'BACKEND') {
    return this.log({ source, level: 'WARN', category, message, meta });
  }

  error(category: LogCategory | string, message: string, meta?: Record<string, any>, source: LogSource = 'BACKEND') {
    return this.log({ source, level: 'ERROR', category, message, meta });
  }

  debug(category: LogCategory | string, message: string, meta?: Record<string, any>, source: LogSource = 'BACKEND') {
    return this.log({ source, level: 'DEBUG', category, message, meta });
  }

  list(filter: ListLogsFilter = {}) {
    let result = this.logs;

    if (filter.source) {
      result = result.filter((l) => l.source === filter.source);
    }

    if (filter.level) {
      result = result.filter((l) => l.level === filter.level);
    }

    if (filter.category && filter.category !== 'ALL') {
      result = result.filter((l) => l.category.toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          (l.meta && JSON.stringify(l.meta).toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    const paginated = result.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      logs: paginated,
      counts: {
        total: this.logs.length,
        errors: this.logs.filter((l) => l.level === 'ERROR').length,
        warnings: this.logs.filter((l) => l.level === 'WARN').length,
        backend: this.logs.filter((l) => l.source === 'BACKEND').length,
        frontend: this.logs.filter((l) => l.source === 'FRONTEND').length,
      },
    };
  }

  clear(): void {
    this.logs = [];
    this.log({
      source: 'BACKEND',
      level: 'INFO',
      category: 'SYSTEM',
      message: 'System logs buffer was cleared by user',
    });
  }
}

export const loggerService = LoggerService.getInstance();
