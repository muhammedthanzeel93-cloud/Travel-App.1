import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../core/config/index.js';
import { User, UserRole } from '../features/auth/user.model.js';
import { getRequestToken } from '../features/auth/session.js';

export interface AuthenticatedUserPayload {
  id: string;
  username: string;
  role: UserRole;
  sessionVersion: number;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

async function resolveAuthenticatedUser(token: string): Promise<AuthenticatedUserPayload | null> {
  const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUserPayload;
  const user = await User.findById(decoded.id).select('username role email name status sessionVersion');
  if (!user || user.status === 'BLOCKED' || (decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
    return null;
  }
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    sessionVersion: user.sessionVersion ?? 0,
    email: user.email,
    name: user.name
  };
}

/**
 * HttpOnly session cookie or compatibility Bearer JWT authentication middleware.
 */
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = getRequestToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Valid Bearer authentication token required.'
    });
    return;
  }

  try {
    const user = await resolveAuthenticatedUser(token);
    if (!user) {
      res.status(401).json({ success: false, message: 'Session is no longer valid.' });
      return;
    }
    req.user = user;
    next();
  } catch (err: any) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired session token. Please sign in again.'
    });
  }
};

export const optionalAuthenticateToken = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  const token = getRequestToken(req);
  if (!token) { next(); return; }
  try {
    req.user = (await resolveAuthenticatedUser(token)) || undefined;
  } catch {
    // Public reads remain available when an optional session has expired.
  }
  next();
};

/**
 * Role-Based Access Control Guard
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to authorized roles (${allowedRoles.join(', ')}). Your role: ${req.user?.role || 'ANONYMOUS'}`
      });
      return;
    }
    next();
  };
};

/**
 * Super Admin privilege guard
 */
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
