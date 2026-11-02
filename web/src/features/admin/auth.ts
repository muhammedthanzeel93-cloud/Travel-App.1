import { AdminUserSession } from './types';

export type { AdminUserSession };

const ADMIN_USER_KEY = 'travel_buddy_admin_user';
const ADMIN_AUTH_EVENT = 'travel_buddy_admin_auth_changed';

export function getAdminSession(): AdminUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY) || localStorage.getItem('ente_yathra_admin_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.role === 'SUPER_ADMIN' && parsed?.username) {
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
  localStorage.removeItem('travel_buddy_admin_token');
  // Clean up legacy keys
  localStorage.removeItem('ente_yathra_admin_user');
  localStorage.removeItem('ente_yathra_admin_token');

  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export async function performAdminLogout(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Clear local profile cache even if the API is unavailable.
  }

  // Purge all admin storage
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem('travel_buddy_admin_token');
  localStorage.removeItem('ente_yathra_admin_user');
  localStorage.removeItem('ente_yathra_admin_token');

  try {
    sessionStorage.clear();
  } catch {}

  // Broadcast event to active UI components
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));

  // Redirect to /admin with logout indicator
  window.location.replace('/admin?logout=success');
}
