export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string[];
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const method = options.method || 'GET';
  if (import.meta.env.DEV) {
    console.debug(`[HTTP Request] ${method} ${endpoint}`, options.body || '');
  }

  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    if (import.meta.env.DEV) {
      console.error(`[HTTP Error ${response.status}] ${method} ${endpoint}:`, errorMessage);
    }

    // Automatically report client-side API errors to backend log buffer (skip /api/logs to prevent recursion)
    if (!endpoint.includes('/api/logs')) {
      try {
        fetch('/api/logs/client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'ERROR',
            category: 'CLIENT',
            message: `API Error ${response.status} on ${method} ${endpoint}: ${errorMessage}`,
            meta: { endpoint, method, status: response.status, details: data.details },
          }),
        }).catch(() => {});
      } catch {
        // Ignore telemetry failure
      }
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  if (import.meta.env.DEV) {
    console.debug(`[HTTP Response ${response.status}] ${method} ${endpoint}:`, data);
  }

  return data;
}
