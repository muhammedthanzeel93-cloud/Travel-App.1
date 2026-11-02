import { Request, Response } from 'express';

export const SESSION_COOKIE = 'travel_buddy_session';

export function setSessionCookie(res: Response, token: string, maxAgeSeconds: number): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', SESSION_COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAgeSeconds + secure);
}

export function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', SESSION_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure);
}

export function getRequestToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  const cookie = req.headers.cookie;
  if (!cookie) return undefined;
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(SESSION_COOKIE + '='));
  return match ? match.slice(SESSION_COOKIE.length + 1) : undefined;
}
