import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser, UserRole } from './user.model.js';
import { config } from '../../core/config/index.js';
import { AuthChallenge } from './authChallenge.model.js';
import { consumeVerifiedOtp, createAndDispatchOtp, verifyOtp } from './otp.service.js';
import { clearSessionCookie, setSessionCookie } from './session.js';

const isDbConnected = () => mongoose.connection.readyState === 1;
const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const normalizePhone = (value: unknown) => String(value || '').replace(/\s+/g, '').trim();
const normalizeUsername = (value: unknown) => String(value || '').trim().toLowerCase();
const safeUser = (user: IUser) => ({
  id: user._id.toString(), username: user.username, name: user.name, email: user.email, phone: user.phone,
  role: user.role, status: user.status, avatarUrl: user.avatarUrl, bio: user.bio, createdAt: user.createdAt
});

function requireDatabase(res: Response): boolean {
  if (isDbConnected()) return true;
  res.status(503).json({ success: false, code: 'DATABASE_UNAVAILABLE', message: 'Account services are temporarily unavailable.' });
  return false;
}

export class AuthController {
  public static async checkAvailability(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const { username, email, phone } = req.body;
      const checks: Array<[string, any]> = [];
      if (username) checks.push(['username', { username: normalizeUsername(username) }]);
      if (email) checks.push(['email', { email: normalizeEmail(email) }]);
      if (phone) checks.push(['phone', { phone: normalizePhone(phone) }]);
      for (const [field, query] of checks) {
        if (await User.exists(query)) {
          res.status(200).json({ available: false, field, message: 'This account identifier is already in use.' });
          return;
        }
      }
      res.status(200).json({ available: true, message: 'Credentials available.' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to check account availability.' });
    }
  }

  public static async checkStatus(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const identifier = String(req.query.username || req.query.identifier || req.body?.identifier || req.body?.username || '').trim();
      if (!identifier) {
        res.status(400).json({ success: false, message: 'Username or identifier is required.' });
        return;
      }
      const user = await User.findOne({ $or: [
        { username: normalizeUsername(identifier) }, { email: normalizeEmail(identifier) }, { phone: normalizePhone(identifier) }
      ] }).select('username role status');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      res.status(200).json({ success: true, username: user.username, role: user.role, status: user.status, isBlocked: user.status === 'BLOCKED' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to check account status.' });
    }
  }

  public static async sendOtp(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const target = String(req.body?.target || '').trim();
      const type = req.body?.type === 'PASSWORD_RESET' ? 'PASSWORD_RESET' : 'REGISTRATION';
      if (!target || target.length > 254) {
        res.status(400).json({ success: false, message: 'A valid email or phone number is required.' });
        return;
      }
      const isEmail = target.includes('@');
      const normalized = isEmail ? normalizeEmail(target) : normalizePhone(target);
      if (type === 'REGISTRATION') {
        const exists = await User.exists(isEmail ? { email: normalized } : { phone: normalized });
        if (exists) {
          res.status(409).json({ success: false, message: 'An account already exists for this contact.' });
          return;
        }
      }
      if (type === 'PASSWORD_RESET') {
        const user = await User.findOne({ $or: [{ email: normalized }, { phone: normalized }] }).select('email phone');
        if (!user) {
          res.status(200).json({ success: true, message: 'If the account exists, a verification code will be sent.' });
          return;
        }
      }
      await createAndDispatchOtp(normalized, type, isEmail ? 'email' : 'sms');
      res.status(200).json({ success: true, message: 'Verification code dispatched.', target: normalized, channel: isEmail ? 'EMAIL' : 'SMS', expiresInSeconds: 600 });
    } catch (error) {
      console.error('[OTP] Delivery failed:', error instanceof Error ? error.message : 'unknown error');
      res.status(503).json({ success: false, message: 'Verification delivery is unavailable. Contact the administrator.' });
    }
  }

  public static async verifyOtp(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      let target = String(req.body?.target || '').trim();
      const code = String(req.body?.otp || '').trim();
      const purpose = req.body?.type === 'PASSWORD_RESET' ? 'PASSWORD_RESET' : 'REGISTRATION';
      if (!target || !/^\d{6}$/.test(code)) {
        res.status(400).json({ success: false, message: 'Target and six-digit code are required.' });
        return;
      }
      if (purpose === 'PASSWORD_RESET') {
        const identifier = target.includes('@') ? normalizeEmail(target) : normalizeUsername(target);
        const resetUser = await User.findOne({ $or: [{ username: identifier }, { email: identifier }, { phone: normalizePhone(target) }] }).select('email phone');
        target = resetUser?.email || resetUser?.phone || '';
      }
      const verified = target ? await verifyOtp(target, purpose, code) : false;
      if (!verified) {
        res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
        return;
      }
      res.status(200).json({ success: true, verified: true });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to verify code.' });
    }
  }

  public static async register(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const { username, name, email, phone, password } = req.body || {};
      const cleanUsername = normalizeUsername(username);
      const cleanEmail = email ? normalizeEmail(email) : undefined;
      const cleanPhone = phone ? normalizePhone(phone) : undefined;
      if (!/^[a-z0-9_.-]{3,30}$/.test(cleanUsername) || typeof password !== 'string' || password.length < 10 || password.length > 128) {
        res.status(400).json({ success: false, message: 'Provide a valid username and a password of at least 10 characters.' });
        return;
      }
      if (!cleanEmail && !cleanPhone) {
        res.status(400).json({ success: false, message: 'Email or phone is required.' });
        return;
      }
      const target = cleanEmail || cleanPhone!;
      const challenge = await AuthChallenge.findOne({ target: target.toLowerCase(), purpose: 'REGISTRATION', verifiedAt: { $ne: null }, expiresAt: { $gt: new Date() } });
      if (!challenge) {
        res.status(400).json({ success: false, message: 'Verify the registration contact before creating an account.' });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        username: cleanUsername, name: String(name || cleanUsername).trim().slice(0, 100), email: cleanEmail,
        phone: cleanPhone, passwordHash, role: 'USER' as UserRole, status: 'ACTIVE',
        avatarUrl: undefined, bio: ''
      });
      await consumeVerifiedOtp(target, 'REGISTRATION');
      const token = jwt.sign({ id: user._id.toString(), username: user.username, role: user.role }, config.jwtSecret, { expiresIn: '24h' });
      setSessionCookie(res, token, 24 * 60 * 60);
      res.status(201).json({ success: true, message: 'Account created successfully.', user: safeUser(user) });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({ success: false, field: Object.keys(error.keyPattern || {})[0], message: 'An account identifier is already in use.' });
        return;
      }
      console.error('[AUTH] Registration failed:', error instanceof Error ? error.message : 'unknown error');
      res.status(500).json({ success: false, message: 'Unable to create account.' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const identifier = String(req.body?.username || '').trim();
      const password = req.body?.password;
      if (!identifier || typeof password !== 'string' || password.length > 128) {
        res.status(400).json({ success: false, message: 'Username and password are required.' });
        return;
      }
      const normalized = identifier.includes('@') ? normalizeEmail(identifier) : normalizeUsername(identifier);
      const user = await User.findOne({ $or: [{ username: normalized }, { email: normalized }, { phone: normalizePhone(identifier) }] }).select('+passwordHash');
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ success: false, message: 'Invalid username or password.' });
        return;
      }
      if (user.status === 'BLOCKED') {
        res.status(403).json({ success: false, blocked: true, message: 'This account is blocked.' });
        return;
      }
      const token = jwt.sign({ id: user._id.toString(), username: user.username, role: user.role }, config.jwtSecret, { expiresIn: '24h' });
      setSessionCookie(res, token, 24 * 60 * 60);
      res.status(200).json({ success: true, message: 'Signed in.', user: safeUser(user) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to sign in.' });
    }
  }

  public static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const identifier = String(req.body?.identifier || '').trim();
      if (!identifier) {
        res.status(400).json({ success: false, message: 'Enter your username, email, or phone.' });
        return;
      }
      const normalized = identifier.includes('@') ? normalizeEmail(identifier) : normalizeUsername(identifier);
      const user = await User.findOne({ $or: [{ username: normalized }, { email: normalized }, { phone: normalizePhone(identifier) }] }).select('email phone');
      if (user) {
        const target = user.email || user.phone;
        if (target) await createAndDispatchOtp(target, 'PASSWORD_RESET', user.email ? 'email' : 'sms');
      }
      res.status(200).json({ success: true, message: 'If the account exists, a verification code will be sent.' });
    } catch {
      res.status(503).json({ success: false, message: 'Password reset delivery is unavailable.' });
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const identifier = String(req.body?.target || '').trim();
      const code = String(req.body?.otp || '').trim();
      const password = req.body?.newPassword;
      if (!identifier || !/^\d{6}$/.test(code) || typeof password !== 'string' || password.length < 10 || password.length > 128) {
        res.status(400).json({ success: false, message: 'Provide a valid code and a password of at least 10 characters.' });
        return;
      }
      const normalized = identifier.includes('@') ? normalizeEmail(identifier) : normalizeUsername(identifier);
      const user = await User.findOne({ $or: [{ username: normalized }, { email: normalized }, { phone: normalizePhone(identifier) }] });
      const target = user?.email || user?.phone;
      if (!user || !target) {
        res.status(400).json({ success: false, message: 'Unable to reset this account.' });
        return;
      }
      const valid = await verifyOtp(target, 'PASSWORD_RESET', code);
      if (!valid || !(await consumeVerifiedOtp(target, 'PASSWORD_RESET'))) {
        res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
        return;
      }
      user.passwordHash = await bcrypt.hash(password, 12);
      await user.save();
      res.status(200).json({ success: true, message: 'Password reset successfully.', username: user.username });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to reset password.' });
    }
  }

  public static async getProfile(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const authenticatedId = (req as any).user?.id;
      if (!authenticatedId || !mongoose.isValidObjectId(authenticatedId)) {
        res.status(401).json({ success: false, message: 'Authenticated account required.' });
        return;
      }
      const user = await User.findById(authenticatedId).select('-passwordHash -travelerPassport -agencyDetails');
      if (!user || user.status === 'BLOCKED') {
        clearSessionCookie(res);
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      res.status(200).json({ success: true, user: safeUser(user) });
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    clearSessionCookie(res);
    res.status(200).json({ success: true, message: 'Signed out.' });
  }

  public static async getAllUsers(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const users = await User.find({}).select('username name email phone role status avatarUrl bio createdAt').sort({ createdAt: -1 }).lean();
      res.status(200).json({ success: true, count: users.length, users: users.map((user: any) => ({
        id: user._id.toString(), username: user.username, name: user.name, email: user.email || '', phone: user.phone || '',
        role: user.role || 'USER', status: user.status || 'ACTIVE', avatarUrl: user.avatarUrl, bio: user.bio || '', createdAt: user.createdAt
      })) });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load users.' });
    }
  }

  public static async deleteUser(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const targetId = req.body?.userId || req.body?.id;
      const username = normalizeUsername(req.body?.username);
      const query: any[] = [];
      if (targetId && mongoose.isValidObjectId(targetId)) query.push({ _id: targetId });
      if (username) query.push({ username });
      if (!query.length) {
        res.status(400).json({ success: false, message: 'A valid user ID or username is required.' });
        return;
      }
      const result = await User.deleteOne({ $or: query, role: { $ne: 'SUPER_ADMIN' } });
      res.status(result.deletedCount ? 200 : 404).json({ success: result.deletedCount > 0, message: result.deletedCount ? 'User deleted.' : 'User not found or protected.' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to delete user.' });
    }
  }

  public static async toggleBlockUser(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const targetId = req.body?.userId || req.body?.id;
      const username = normalizeUsername(req.body?.username);
      const query: any[] = [];
      if (targetId && mongoose.isValidObjectId(targetId)) query.push({ _id: targetId });
      if (username) query.push({ username });
      if (!query.length) {
        res.status(400).json({ success: false, message: 'A valid user ID or username is required.' });
        return;
      }
      const user = await User.findOne({ $or: query, role: { $ne: 'SUPER_ADMIN' } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found or protected.' });
        return;
      }
      user.status = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      await user.save();
      res.status(200).json({ success: true, status: user.status, message: 'User status updated.' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update user status.' });
    }
  }
}
