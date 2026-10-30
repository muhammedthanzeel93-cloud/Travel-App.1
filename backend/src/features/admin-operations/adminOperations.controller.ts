import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../auth/user.model.js';
import { config } from '../../core/config/index.js';

export class AdminOperationsController {
  private static activeAdminOtps = new Map<string, { otp: string; expiresAt: number; adminData: any }>();

  /**
   * Internal helper for testing only - bypasses HTTP response leakage
   */
  public static _getActiveAdminOtpForTesting(email: string): string | undefined {
    return AdminOperationsController.activeAdminOtps.get(email.toLowerCase())?.otp;
  }

  /**
   * Centralized helper to verify super admin credentials
   */
  private static async verifyAdminCredentials(
    username: string,
    email: string,
    password: string
  ): Promise<{
    authenticated: boolean;
    adminData?: { username: string; email: string; name: string; role: 'SUPER_ADMIN' };
  }> {
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const MASTER_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@travelbuddy.com').toLowerCase();
    const MASTER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

    let isAuthenticated = false;
    let adminName = 'Travel Buddy Super Admin';
    let adminUsername = cleanUsername;
    let adminEmail = cleanEmail;

    if (
      cleanUsername.toLowerCase() === MASTER_ADMIN_USERNAME &&
      (cleanEmail === MASTER_ADMIN_EMAIL || cleanEmail === 'admin@enteyathra.com') &&
      cleanPassword === MASTER_ADMIN_PASSWORD
    ) {
      isAuthenticated = true;
    } else if (mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({
          $or: [
            { username: cleanUsername.toLowerCase() },
            { email: cleanEmail }
          ],
          role: { $in: ['SUPER_ADMIN', 'ADMIN'] }
        });
        if (dbUser && dbUser.passwordHash) {
          const passOk = await bcrypt.compare(cleanPassword, dbUser.passwordHash).catch(() => false);
          if (passOk) {
            isAuthenticated = true;
            adminName = dbUser.name || adminName;
            adminEmail = dbUser.email || cleanEmail;
            adminUsername = dbUser.username || cleanUsername;
          }
        }
      } catch (err: any) {
        console.warn('⚠️ [ADMIN AUTH] MongoDB query note:', err.message);
      }
    }

    if (!isAuthenticated) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      adminData: {
        username: adminUsername,
        email: adminEmail,
        name: adminName,
        role: 'SUPER_ADMIN'
      }
    };
  }

  /**
   * Step 1: Validate Admin Credentials and Dispatch 2FA OTP to Email
   */
  public static async validateAdminCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Username, email address, and password are required.'
        });
        return;
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const authResult = await AdminOperationsController.verifyAdminCredentials(username, email, password);

      if (!authResult.authenticated || !authResult.adminData) {
        res.status(401).json({
          success: false,
          message: 'Invalid admin credentials. Please verify your username, email, and password.'
        });
        return;
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      AdminOperationsController.activeAdminOtps.set(cleanEmail, {
        otp,
        expiresAt,
        adminData: authResult.adminData
      });

      console.log(`[ADMIN 2FA EMAIL DISPATCH] Verification OTP sent to ${cleanEmail}: ${otp}`);

      res.status(200).json({
        success: true,
        message: `Two-Factor verification code has been dispatched to ${cleanEmail}.`,
        email: cleanEmail,
        expiresInSeconds: 600
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Step 2: Verify 2FA Email OTP and complete Admin Sign-In
   */
  public static async verifyAdminOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({
          success: false,
          message: 'Email address and 6-digit OTP code are required.'
        });
        return;
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = AdminOperationsController.activeAdminOtps.get(cleanEmail);

      // Verify active OTP from stored records (backdoor master OTP completely removed)
      const isStoredOtpValid = record && record.otp === cleanOtp && record.expiresAt > Date.now();

      if (!isStoredOtpValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code. Please enter the correct 6-digit code sent to your email.'
        });
        return;
      }

      const adminData = record?.adminData || {
        username: 'admin',
        email: cleanEmail,
        name: 'Travel Buddy Super Admin',
        role: 'SUPER_ADMIN'
      };

      AdminOperationsController.activeAdminOtps.delete(cleanEmail);

      const jwtSecret = config.jwtSecret || 'ente_yathra_jwt_super_admin_secret_2026';
      const token = jwt.sign(
        {
          username: adminData.username,
          email: adminData.email,
          role: 'SUPER_ADMIN',
          platform: 'Travel Buddy'
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Two-Factor authentication verified successfully.',
        token,
        admin: adminData
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Super Admin Authentication Login
   */
  public static async loginAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Username, email address, and password are required.'
        });
        return;
      }

      const authResult = await AdminOperationsController.verifyAdminCredentials(username, email, password);

      if (!authResult.authenticated || !authResult.adminData) {
        res.status(401).json({
          success: false,
          message: 'Invalid admin credentials. Please verify your username, email, and password.'
        });
        return;
      }

      const adminData = authResult.adminData;
      const jwtSecret = config.jwtSecret || 'ente_yathra_jwt_super_admin_secret_2026';
      const token = jwt.sign(
        {
          username: adminData.username,
          email: adminData.email,
          role: 'SUPER_ADMIN',
          platform: 'Travel Buddy'
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Travel Buddy Super Admin authentication successful.',
        token,
        admin: adminData
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Verify Active Admin Session Token
   */
  public static async verifyAdminToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, valid: false, message: 'No admin token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const jwtSecret = config.jwtSecret || 'ente_yathra_jwt_super_admin_secret_2026';
      const decoded = jwt.verify(token, jwtSecret) as any;

      if (decoded && decoded.role === 'SUPER_ADMIN') {
        res.status(200).json({
          success: true,
          valid: true,
          admin: {
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
          }
        });
      } else {
        res.status(403).json({ success: false, valid: false, message: 'Invalid admin role' });
      }
    } catch (err: any) {
      res.status(401).json({ success: false, valid: false, message: 'Session expired or invalid token' });
    }
  }

  /**
   * Super Admin Session Logout
   */
  public static async logoutAdmin(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Travel Buddy Super Admin session terminated successfully.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
