import { AdminUserSession } from './types';

export type { AdminUserSession };

const ADMIN_USER_KEY = 'travel_buddy_admin_user';
const ADMIN_TOKEN_KEY = 'travel_buddy_admin_token';
const ADMIN_AUTH_EVENT = 'travel_buddy_admin_auth_changed';

export function getAdminSession(): AdminUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY) || localStorage.getItem('ente_yathra_admin_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.role === 'SUPER_ADMIN' && parsed?.token) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminUserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(session));
  localStorage.setItem(ADMIN_TOKEN_KEY, session.token);
  // Clean up legacy keys
  localStorage.removeItem('ente_yathra_admin_user');
  localStorage.removeItem('ente_yathra_admin_token');

  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export async function performAdminLogout(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  try {
    fetch(`${backendUrl}/api/v1/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }).catch(() => {});
  } catch {
    // Ignore network errors during logout
  }

  // Purge all admin storage
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem('ente_yathra_admin_user');
  localStorage.removeItem('ente_yathra_admin_token');

  try {
    sessionStorage.clear();
  } catch {}

  document.cookie = 'travel_buddy_admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

  // Broadcast event to active UI components
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));

  // Redirect to /admin with logout indicator
  window.location.replace('/admin?logout=success');
}
