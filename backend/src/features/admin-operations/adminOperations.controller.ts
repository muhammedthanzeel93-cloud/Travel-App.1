import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../auth/user.model.js';
import { consumeVerifiedOtp, createAndDispatchOtp, verifyOtp } from '../auth/otp.service.js';
import { clearSessionCookie, getRequestToken, setSessionCookie } from '../auth/session.js';
import { config } from '../../core/config/index.js';

export class AdminOperationsController {
  private static async findAdmin(username: string, email: string, password: string) {
    if (mongoose.connection.readyState !== 1) return null;
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      username: cleanUsername,
      email: cleanEmail,
      role: 'SUPER_ADMIN', status: 'ACTIVE'
    }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    return user;
  }

  public static async validateAdminCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body || {};
      if (!username || !email || typeof password !== 'string') {
        res.status(400).json({ success: false, message: 'Username, email and password are required.' });
        return;
      }
      const user = await AdminOperationsController.findAdmin(username, email, password);
      if (!user || !user.email) {
        res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        return;
      }
      await createAndDispatchOtp(user.email, 'ADMIN_LOGIN', 'email');
      res.status(200).json({ success: true, message: 'Verification code dispatched.', email: user.email, expiresInSeconds: 600 });
    } catch (error) {
      console.error('[ADMIN AUTH] Credential verification or OTP delivery failed:', error instanceof Error ? error.message : 'unknown error');
      res.status(503).json({ success: false, message: 'Admin authentication is temporarily unavailable.' });
    }
  }

  public static async verifyAdminOtp(req: Request, res: Response): Promise<void> {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const otp = String(req.body?.otp || '').trim();
      if (!email || !/^\d{6}$/.test(otp)) {
        res.status(400).json({ success: false, message: 'Email and six-digit verification code are required.' });
        return;
      }
      if (!(await verifyOtp(email, 'ADMIN_LOGIN', otp)) || !(await consumeVerifiedOtp(email, 'ADMIN_LOGIN'))) {
        res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
        return;
      }
      const admin = await User.findOne({ email, role: 'SUPER_ADMIN', status: 'ACTIVE' }).select('username email name role');
      if (!admin) {
        res.status(401).json({ success: false, message: 'Admin account is unavailable.' });
        return;
      }
      const token = jwt.sign({ id: admin._id.toString(), username: admin.username, role: admin.role }, config.jwtSecret, { expiresIn: '8h' });
      setSessionCookie(res, token, 8 * 60 * 60);
      res.status(200).json({
        success: true,
        message: 'Admin sign-in verified.',
        admin: { username: admin.username, email: admin.email, name: admin.name, role: admin.role }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to verify admin sign-in.' });
    }
  }

  public static async loginAdmin(req: Request, res: Response): Promise<void> {
    await AdminOperationsController.validateAdminCredentials(req, res);
  }

  public static async verifyAdminToken(req: Request, res: Response): Promise<void> {
    try {
      const token = getRequestToken(req);
      if (!token) {
        res.status(401).json({ success: false, valid: false, message: 'Admin session required.' });
        return;
      }
      const decoded = jwt.verify(token, config.jwtSecret) as { id?: string; role?: string };
      if (!decoded.id || !mongoose.isValidObjectId(decoded.id)) throw new Error('Invalid subject');
      const admin = await User.findOne({ _id: decoded.id, role: 'SUPER_ADMIN', status: 'ACTIVE' }).select('username email role');
      if (!admin) throw new Error('Admin unavailable');
      res.status(200).json({ success: true, valid: true, admin: { username: admin.username, email: admin.email, role: admin.role } });
    } catch {
      clearSessionCookie(res);
      res.status(401).json({ success: false, valid: false, message: 'Admin session expired or invalid.' });
    }
  }

  public static async logoutAdmin(_req: Request, res: Response): Promise<void> {
    clearSessionCookie(res);
    res.status(200).json({ success: true, message: 'Admin session cleared.' });
  }
}
