const CANDIDATE_API_URLS = [
  '/api',
  'http://localhost:5000/api/v1',
  'http://localhost:5001/api/v1'
];

export async function fetchFromApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let lastError: Error = new Error('Network error');

  for (const baseUrl of CANDIDATE_API_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || `Request failed with status ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      lastError = err;
      // If server responded with application error (400, 401, etc.), throw it immediately
      if (
        err.message &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('NetworkError') &&
        !err.message.includes('fetch failed') &&
        !err.message.includes('404')
      ) {
        throw err;
      }
    }
  }

  console.warn(`[API REQUEST ERROR] ${endpoint}:`, lastError.message);
  throw lastError;
}
