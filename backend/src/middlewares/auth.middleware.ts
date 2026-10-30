import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../core/config/index.js';
import { UserRole } from '../features/auth/user.model.js';

export interface AuthenticatedUserPayload {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Bearer JWT Authentication Middleware
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Valid Bearer authentication token required.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired session token. Please sign in again.'
    });
  }
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
