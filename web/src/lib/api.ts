const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchFromApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    console.warn(`[API REQUEST ERROR] ${endpoint}:`, err.message);
    throw err;
  }
}
