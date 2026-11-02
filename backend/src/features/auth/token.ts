import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../core/config/index.js';
import { IUser, UserRole } from './user.model.js';

export interface SessionClaims {
  id: string;
  username: string;
  role: UserRole;
  sessionVersion: number;
}

export function issueSessionToken(user: Pick<IUser, '_id' | 'username' | 'role' | 'sessionVersion'>, expiresIn: SignOptions['expiresIn']): string {
  return jwt.sign({
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    sessionVersion: user.sessionVersion || 0
  }, config.jwtSecret, { expiresIn });
}
