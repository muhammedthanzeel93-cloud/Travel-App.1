export interface AdminUserSession {
  username: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  token: string;
  authenticatedAt: string;
}

export function getAdminSession(): AdminUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ente_yathra_admin_user');
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
  localStorage.setItem('ente_yathra_admin_user', JSON.stringify(session));
  localStorage.setItem('ente_yathra_admin_token', session.token);
  window.dispatchEvent(new Event('ente_yathra_admin_auth_changed'));
}

export async function performAdminLogout(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('ente_yathra_admin_token');

  // Attempt backend logout notification asynchronously
  const candidateUrls = [
    'http://localhost:5000/api/v1/admin/logout',
    'http://localhost:5001/api/v1/admin/logout',
    'http://localhost:4550/api/v1/admin/logout'
  ];

  for (const url of candidateUrls) {
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).catch(() => {});
    } catch {
      // Ignore network errors during logout
    }
  }

  // Purge all admin storage
  localStorage.removeItem('ente_yathra_admin_user');
  localStorage.removeItem('ente_yathra_admin_token');
  try {
    sessionStorage.removeItem('ente_yathra_admin_user');
    sessionStorage.removeItem('ente_yathra_admin_token');
    sessionStorage.clear();
  } catch {}

  // Expire any cookies if present
  document.cookie = 'ente_yathra_admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

  // Broadcast event to active UI components
  window.dispatchEvent(new Event('ente_yathra_admin_auth_changed'));

  // Clean, complete redirect to /admin with logout indicator
  window.location.replace('/admin?logout=success');
}
