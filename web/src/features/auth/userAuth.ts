export interface UserSession {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'TRAVELER' | 'HOTEL_HOST' | 'SUPER_ADMIN' | 'USER' | 'ADMIN' | string;
  avatarUrl?: string;
  bio?: string;
  authenticatedAt: string;
}

const STORAGE_KEY = 'travel_buddy_traveler_session';
const AUTH_EVENT = 'travel_buddy_traveler_auth_changed';

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.removeItem('travel_buddy_traveler_token');
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('travel_buddy_traveler_token');
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
}

export function subscribeToUserSession(callback: (session: UserSession | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = () => {
    callback(getUserSession());
  };
  
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener('storage', handler);
  
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
