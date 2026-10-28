export interface UserSession {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'TRAVELER' | 'HOTEL_HOST' | 'SUPER_ADMIN';
  avatarUrl?: string;
  bio?: string;
  token: string;
  authenticatedAt: string;
}

const STORAGE_KEY = 'travel_buddy_traveler_session';
const TOKEN_KEY = 'travel_buddy_traveler_token';
const AUTH_EVENT = 'travel_buddy_traveler_auth_changed';

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.username) {
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
  localStorage.setItem(TOKEN_KEY, session.token);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
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
