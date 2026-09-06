export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string[];
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const method = options.method || 'GET';
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  if (import.meta.env.DEV) {
    console.debug(`[HTTP Request] ${method} ${url}`, options.body || '');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch (networkError: any) {
    console.error(`[API Network Failure] ${method} ${url}:`, networkError);
    const err: any = new Error(
      `Cannot connect to API backend at ${baseUrl || window.location.origin}. Please check your backend deployment status.`
    );
    err.status = 0;
    err.originalError = networkError;
    throw err;
  }

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const rawText = await response.text();
    console.warn(`[API Non-JSON Response] ${method} ${url} status ${response.status}:`, rawText.slice(0, 300));
    data = {
      success: response.ok,
      message: response.ok ? rawText : `Backend returned non-JSON error (Status ${response.status})`,
      error: !response.ok ? `Server error: HTTP ${response.status}` : undefined,
    };
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    console.error(`[HTTP Error ${response.status}] ${method} ${endpoint}:`, errorMessage);

    // Automatically report client-side API errors to backend log buffer (skip /api/logs to prevent recursion)
    if (!endpoint.includes('/api/logs')) {
      try {
        fetch(`${baseUrl}/api/logs/client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'ERROR',
            category: 'CLIENT',
            message: `API Error ${response.status} on ${method} ${endpoint}: ${errorMessage}`,
            meta: { endpoint, method, status: response.status, details: data?.details },
          }),
        }).catch(() => {});
      } catch {
        // Ignore telemetry failure
      }
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  if (import.meta.env.DEV) {
    console.debug(`[HTTP Response ${response.status}] ${method} ${endpoint}:`, data);
  }

  return data;
}
