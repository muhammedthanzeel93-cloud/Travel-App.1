import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser, UserRole } from './user.model.js';
import { AuthChallenge } from './authChallenge.model.js';
import { consumeVerifiedOtp, createAndDispatchOtp, verifyOtp } from './otp.service.js';
import { clearSessionCookie, getRequestToken, setSessionCookie } from './session.js';
import { issueSessionToken } from './token.js';
import { OperationsHubSocket } from '../../core/sockets/operationsHub.js';
import { config } from '../../core/config/index.js';

export const ACTIVE_PRESENCE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

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
      let shouldDispatch = true;
      if (type === 'REGISTRATION') {
        shouldDispatch = !(await User.exists(isEmail ? { email: normalized } : { phone: normalized }));
      }
      if (type === 'PASSWORD_RESET') {
        const user = await User.findOne({ $or: [{ email: normalized }, { phone: normalized }] }).select('email phone');
        shouldDispatch = Boolean(user);
      }
      if (shouldDispatch) await createAndDispatchOtp(normalized, type, isEmail ? 'email' : 'sms');
      res.status(200).json({ success: true, message: 'If the contact can be used for this request, a verification code will be sent.' });
    } catch (error) {
      console.error('[OTP] Delivery failed:', error instanceof Error ? error.message : 'unknown error');
      res.status(200).json({ success: true, message: 'If the contact can be used for this request, a verification code will be sent.' });
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
        avatarUrl: undefined, bio: '', lastActiveAt: new Date()
      });
      await consumeVerifiedOtp(target, 'REGISTRATION');
      const token = issueSessionToken(user, '24h');
      setSessionCookie(res, token, 24 * 60 * 60);
      res.status(201).json({ success: true, message: 'Account created successfully.', user: safeUser(user) });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({ success: false, message: 'Unable to create this account. Check the details or try another identifier.' });
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
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        user.lastActiveAt = new Date();
        await user.save();
      }
      const token = issueSessionToken(user, '24h');
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
      // Keep the response identical when delivery fails so provider state cannot
      // reveal whether the identifier belongs to an account.
      res.status(200).json({ success: true, message: 'If the account exists, a verification code will be sent.' });
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
      user.sessionVersion = (user.sessionVersion || 0) + 1;
      await user.save();
      OperationsHubSocket.revokeUserSessions(user._id.toString());
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
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } });
      }
      res.status(200).json({ success: true, user: safeUser(user) });
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = getRequestToken(req);
      if (token) {
        const decoded = jwt.verify(token, config.jwtSecret) as { id?: string };
        if (decoded?.id && mongoose.isValidObjectId(decoded.id)) {
          await User.updateOne({ _id: decoded.id }, { $set: { lastActiveAt: null } });
        }
      }
    } catch {
      // Ignore token verification errors on logout
    }
    clearSessionCookie(res);
    res.status(200).json({ success: true, message: 'Signed out.' });
  }

  public static async heartbeat(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const authenticatedUser = (req as any).user;
      if (!authenticatedUser?.id || !mongoose.isValidObjectId(authenticatedUser.id)) {
        res.status(401).json({ success: false, message: 'Valid traveler session required.' });
        return;
      }
      // Never count admins in active user presence
      if (authenticatedUser.role === 'SUPER_ADMIN' || authenticatedUser.role === 'ADMIN') {
        res.status(200).json({ success: true, active: false, ignored: true, message: 'Admin session excluded from active traveler metrics.' });
        return;
      }
      const result = await User.updateOne(
        { _id: authenticatedUser.id, status: 'ACTIVE', role: { $nin: ['ADMIN', 'SUPER_ADMIN'] } },
        { $set: { lastActiveAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        res.status(403).json({ success: false, message: 'Account is not an active traveler.' });
        return;
      }
      res.status(200).json({ success: true, active: true, message: 'Presence updated.' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update heartbeat.' });
    }
  }

  public static async getActiveUserCount(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const threshold = new Date(Date.now() - ACTIVE_PRESENCE_WINDOW_MS);
      const activeUsers = await User.find({
        role: { $nin: ['ADMIN', 'SUPER_ADMIN'] },
        status: 'ACTIVE',
        lastActiveAt: { $gte: threshold }
      }).select('username name email role lastActiveAt').lean();

      res.status(200).json({
        success: true,
        activeUserCount: activeUsers.length,
        activeUsers: activeUsers.map((u: any) => ({
          id: u._id.toString(),
          username: u.username,
          name: u.name,
          email: u.email || '',
          role: u.role,
          lastActiveAt: u.lastActiveAt
        })),
        activeEmails: activeUsers.map((u: any) => u.email).filter(Boolean),
        windowSeconds: ACTIVE_PRESENCE_WINDOW_MS / 1000
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to calculate active user count.' });
    }
  }

  public static async getAllUsers(req: Request, res: Response): Promise<void> {
    if (!requireDatabase(res)) return;
    try {
      const threshold = new Date(Date.now() - ACTIVE_PRESENCE_WINDOW_MS);
      const [users, activeUserCount] = await Promise.all([
        User.find({}).select('username name email phone role status avatarUrl bio lastActiveAt createdAt').sort({ createdAt: -1 }).lean(),
        User.countDocuments({
          role: { $nin: ['ADMIN', 'SUPER_ADMIN'] },
          status: 'ACTIVE',
          lastActiveAt: { $gte: threshold }
        })
      ]);
      const registeredTravelersCount = users.filter((u: any) => u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN').length;
      const activeUsersList = users.filter((u: any) => {
        if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || u.status === 'BLOCKED' || !u.lastActiveAt) return false;
        return new Date(u.lastActiveAt) >= threshold;
      });
      const activeEmails = activeUsersList.map((u: any) => u.email).filter(Boolean);

      res.status(200).json({
        success: true,
        count: users.length,
        registeredTravelersCount,
        activeUserCount,
        activeEmails,
        users: users.map((user: any) => ({
          id: user._id.toString(), username: user.username, name: user.name, email: user.email || '', phone: user.phone || '',
          role: user.role || 'USER', status: user.status || 'ACTIVE', avatarUrl: user.avatarUrl, bio: user.bio || '',
          lastActiveAt: user.lastActiveAt || null, createdAt: user.createdAt
        }))
      });
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
      const targetUser = await User.findOne({ $or: query, role: { $ne: 'SUPER_ADMIN' } }).select('_id');
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found or protected.' });
        return;
      }
      const result = await User.deleteOne({ _id: targetUser._id });
      if (result.deletedCount) OperationsHubSocket.revokeUserSessions(targetUser._id.toString());
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
      OperationsHubSocket.revokeUserSessions(user._id.toString());
      res.status(200).json({ success: true, status: user.status, message: 'User status updated.' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update user status.' });
    }
  }
}
