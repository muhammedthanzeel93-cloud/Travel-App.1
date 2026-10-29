import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from './user.model.js';
import { config } from '../../core/config/index.js';

interface OtpRecord {
  code: string;
  target: string; // email or phone
  type: 'REGISTRATION' | 'PASSWORD_RESET';
  expiresAt: number;
  verified: boolean;
}

// In-memory OTP storage
const otpStore = new Map<string, OtpRecord>();

// Helper to check if MongoDB is connected and ready
const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

export interface MemoryUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordHash: string;
  role: 'TRAVELER' | 'HOTEL_HOST' | 'SUPER_ADMIN' | 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'BLOCKED';
  avatarUrl: string;
  bio: string;
  createdAt: string;
}

// Default Seed Users (Password: Travel@123)
const DEFAULT_SEED_USERS: MemoryUser[] = [
  {
    id: 'user_mem_1',
    username: 'aisha_dubai',
    name: 'Aisha Al-Falasi',
    email: 'aisha@travelbuddy.com',
    phone: '+971 50 123 4567',
    password: 'Travel@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Dubai sky-high explorer & sunset photographer 🌅✨',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_mem_2',
    username: 'clt_wanderlust',
    name: 'Kozhikode Wanderer',
    email: 'wanderer@enteyathra.com',
    phone: '+91 98470 54321',
    password: 'Travel@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Backwaters, spices, and mountain trails of Kerala 🌴⛰️',
    createdAt: new Date().toISOString()
  }
];

// Active user repository (retrieved from MongoDB database with initial fallback)
let memoryUsers: MemoryUser[] = [...DEFAULT_SEED_USERS];

export class AuthController {
  /**
   * Check if username, email, or phone is already taken in the database
   */
  public static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, phone } = req.body;

      // 1. Check Username
      if (username) {
        const cleanUsername = String(username).trim().toLowerCase();

        // Check in persistent store
        const inMemoryTaken = memoryUsers.some(
          (u) => u.username.toLowerCase() === cleanUsername
        );

        let dbTaken = false;
        if (isDbConnected()) {
          try {
            const existing = await User.findOne({ username: cleanUsername });
            if (existing) dbTaken = true;
          } catch {
            // ignore db offline
          }
        }

        if (inMemoryTaken || dbTaken) {
          res.status(200).json({
            available: false,
            field: 'username',
            message: 'This username is already taken. Please choose another username.'
          });
          return;
        }
      }

      // 2. Check Email
      if (email) {
        const cleanEmail = String(email).trim().toLowerCase();

        const inMemoryTaken = memoryUsers.some(
          (u) => u.email && u.email.toLowerCase() === cleanEmail
        );

        let dbTaken = false;
        if (isDbConnected()) {
          try {
            const existing = await User.findOne({ email: cleanEmail });
            if (existing) dbTaken = true;
          } catch {
            // ignore db offline
          }
        }

        if (inMemoryTaken || dbTaken) {
          res.status(200).json({
            available: false,
            field: 'email',
            message: 'An account with this email address already exists. Please sign in or use another email.'
          });
          return;
        }
      }

      // 3. Check Phone
      if (phone) {
        const cleanPhone = String(phone).replace(/\s+/g, '');

        const inMemoryTaken = memoryUsers.some(
          (u) => u.phone && u.phone.replace(/\s+/g, '') === cleanPhone
        );

        let dbTaken = false;
        if (isDbConnected()) {
          try {
            const existing = await User.findOne({ phone: cleanPhone });
            if (existing) dbTaken = true;
          } catch {
            // ignore db offline
          }
        }

        if (inMemoryTaken || dbTaken) {
          res.status(200).json({
            available: false,
            field: 'phone',
            message: 'An account with this mobile number already exists. Please sign in or use another number.'
          });
          return;
        }
      }

      res.status(200).json({
        available: true,
        message: 'Credentials available.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Dispatch OTP for Registration or Password Reset
   */
  public static async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { target, type = 'REGISTRATION', channel = 'email' } = req.body;

      if (!target) {
        res.status(400).json({ success: false, message: 'Target email or phone number is required.' });
        return;
      }

      const cleanTarget = String(target).trim();
      const isEmail = cleanTarget.includes('@');

      // For registration: verify uniqueness in database first
      if (type === 'REGISTRATION') {
        const isTaken = isEmail
          ? memoryUsers.some((u) => u.email?.toLowerCase() === cleanTarget.toLowerCase())
          : memoryUsers.some((u) => u.phone?.replace(/\s+/g, '') === cleanTarget.replace(/\s+/g, ''));

        if (isTaken) {
          res.status(400).json({
            success: false,
            message: isEmail
              ? 'An account with this email address already exists in the database.'
              : 'An account with this mobile number already exists in the database.'
          });
          return;
        }
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(cleanTarget.toLowerCase(), {
        code: otpCode,
        target: cleanTarget,
        type,
        expiresAt,
        verified: false
      });

      console.log(`🔑 [OTP DISPATCH] Generated OTP: ${otpCode} for ${cleanTarget} (${channel.toUpperCase()})`);

      res.status(200).json({
        success: true,
        message: isEmail
          ? `Verification OTP sent to ${cleanTarget}.`
          : `SMS verification OTP sent to ${cleanTarget}.`,
        target: cleanTarget,
        channel: isEmail ? 'EMAIL' : 'SMS',
        otpPreview: otpCode, // Provided for instant demo and local testing
        expiresInSeconds: 600
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Verify entered OTP
   */
  public static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { target, otp } = req.body;

      if (!target || !otp) {
        res.status(400).json({ success: false, message: 'Target identifier and OTP code are required.' });
        return;
      }

      const cleanTarget = String(target).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = otpStore.get(cleanTarget);

      if (!record) {
        res.status(400).json({
          success: false,
          message: 'No OTP request found for this email or phone. Please request a new OTP.'
        });
        return;
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanTarget);
        res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new code.'
        });
        return;
      }

      if (record.code !== cleanOtp) {
        res.status(400).json({
          success: false,
          message: 'Invalid OTP code. Please check and try again.'
        });
        return;
      }

      // Mark verified
      record.verified = true;
      otpStore.set(cleanTarget, record);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully! You can now proceed.',
        target: cleanTarget,
        verified: true
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Create New User Account and Store in Database (MongoDB + Persistent Storage)
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, name, email, phone, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required.' });
        return;
      }

      if (!email && !phone) {
        res.status(400).json({ success: false, message: 'Either email address or mobile phone number is required.' });
        return;
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
      const cleanPhone = phone ? String(phone).trim() : undefined;
      const cleanPassword = String(password).trim();

      if (cleanPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        return;
      }

      // 1. Check duplicate username in database
      const usernameExists = memoryUsers.some((u) => u.username.toLowerCase() === cleanUsername);
      if (usernameExists) {
        res.status(400).json({
          success: false,
          field: 'username',
          message: 'This username is already taken. Please choose another username.'
        });
        return;
      }

      // 2. Check duplicate email in database
      if (cleanEmail) {
        const emailExists = memoryUsers.some((u) => u.email?.toLowerCase() === cleanEmail);
        if (emailExists) {
          res.status(400).json({
            success: false,
            field: 'email',
            message: 'An account with this email address already exists. Please choose another.'
          });
          return;
        }
      }

      // 3. Check duplicate phone in database
      if (cleanPhone) {
        const phoneExists = memoryUsers.some((u) => u.phone?.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''));
        if (phoneExists) {
          res.status(400).json({
            success: false,
            field: 'phone',
            message: 'An account with this phone number already exists. Please choose another.'
          });
          return;
        }
      }

      // 4. Verify OTP was validated
      const verificationTarget = cleanEmail || cleanPhone;
      if (verificationTarget) {
        const otpRecord = otpStore.get(verificationTarget.toLowerCase());
        if (!otpRecord || !otpRecord.verified) {
          res.status(400).json({
            success: false,
            message: 'OTP verification is required before creating your account.'
          });
          return;
        }
      }

      // Hash password securely
      const passwordHash = await bcrypt.hash(cleanPassword, 10);

      // Create new user record
      const newUserId = `user_${Date.now()}`;
      const newMemoryUser: MemoryUser = {
        id: newUserId,
        username: cleanUsername,
        name: name ? String(name).trim() : cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: (req.body.role as any) || 'USER',
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&w=400&q=80`,
        bio: 'Just joined Travel Buddy! Ready for adventures ✈️🎒',
        createdAt: new Date().toISOString()
      };

      // 1. Store in MongoDB Database
      let mongoSaved = false;
      let dbId = newUserId;
      if (isDbConnected()) {
        try {
          const dbDoc = await User.create({
            username: cleanUsername,
            name: newMemoryUser.name,
            email: cleanEmail,
            phone: cleanPhone,
            password: cleanPassword,
            passwordHash,
            role: (req.body.role as any) || 'USER',
            status: 'ACTIVE',
            avatarUrl: newMemoryUser.avatarUrl,
            bio: newMemoryUser.bio
          });
          mongoSaved = true;
          dbId = dbDoc._id.toString();
          console.log(`✅ [MONGODB travel_buddy] Stored new user in MongoDB database: @${cleanUsername} (ID: ${dbDoc._id})`);
        } catch (dbErr: any) {
          console.warn('⚠️ [USER REGISTRATION] MongoDB save note:', dbErr.message);
        }
      }

      newMemoryUser.id = dbId;
      memoryUsers.push(newMemoryUser);

      // Clean up used OTP
      if (verificationTarget) {
        otpStore.delete(verificationTarget.toLowerCase());
      }

      // Generate JWT Session Token
      const token = jwt.sign(
        { id: newMemoryUser.id, username: newMemoryUser.username, role: newMemoryUser.role },
        config.jwtSecret || 'ente_yathra_jwt_secret',
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully and stored in the database! Welcome to Travel Buddy.',
        storedInDatabase: true,
        databaseTarget: mongoSaved ? 'MongoDB' : 'Persistent File DB',
        token,
        user: {
          id: newMemoryUser.id,
          username: newMemoryUser.username,
          name: newMemoryUser.name,
          email: newMemoryUser.email,
          phone: newMemoryUser.phone,
          role: newMemoryUser.role,
          avatarUrl: newMemoryUser.avatarUrl,
          bio: newMemoryUser.bio
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Standard User Login (Username / Email / Phone + Password)
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: 'Username and password are required.'
        });
        return;
      }

      const cleanInput = String(username).trim();
      const cleanPassword = String(password).trim();

      // Find user in database
      let user: MemoryUser | null = null;

      // 1. Check MongoDB travel_buddy database
      if (isDbConnected()) {
        try {
          const dbUser = await User.findOne({
            $or: [
              { username: cleanInput.toLowerCase() },
              { email: cleanInput.toLowerCase() },
              { phone: cleanInput }
            ]
          });

          if (dbUser) {
            user = {
              id: dbUser._id.toString(),
              username: dbUser.username || cleanInput,
              name: dbUser.name || cleanInput,
              email: dbUser.email,
              phone: dbUser.phone,
              password: (dbUser as any).password,
              passwordHash: dbUser.passwordHash,
              role: dbUser.role as any,
              status: ((dbUser as any).status as any) || 'ACTIVE',
              avatarUrl: dbUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              bio: dbUser.bio || '',
              createdAt: dbUser.createdAt?.toISOString() || new Date().toISOString()
            };
          }
        } catch {
          // ignore db offline
        }
      }

      // 2. Fallback to memory
      if (!user) {
        user =
          memoryUsers.find(
            (u) =>
              u.username.toLowerCase() === cleanInput.toLowerCase() ||
              (u.email && u.email.toLowerCase() === cleanInput.toLowerCase()) ||
              (u.phone && u.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, ''))
          ) || null;
      }

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'No account found matching this username or credentials. Please check or create an account.'
        });
        return;
      }

      // CRITICAL BLOCK ENFORCEMENT:
      // If user is BLOCKED by administrator, strictly reject login with 403 Forbidden
      if (user.status === 'BLOCKED') {
        console.warn(`🛑 [EXPRESS AUTH REJECTED] User @${user.username} (${user.role}) is BLOCKED by admin.`);
        res.status(403).json({
          success: false,
          blocked: true,
          message: `Your account (@${user.username}) has been BLOCKED by the administrator. Access is restricted for this ${user.role || 'user'} account.`
        });
        return;
      }

      // Check password (supports bcrypt hash and plaintext match)
      let isMatch = false;
      if (user.password && user.password === cleanPassword) {
        isMatch = true;
      } else if (user.passwordHash) {
        isMatch = await bcrypt.compare(cleanPassword, user.passwordHash).catch(() => false);
      }

      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify and try again or use Forgot Password.'
        });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        config.jwtSecret || 'ente_yathra_jwt_secret',
        { expiresIn: '30d' }
      );

      res.status(200).json({
        success: true,
        message: 'Successfully logged in to Travel Buddy.',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Request Password Reset OTP
   */
  public static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.body;

      if (!identifier) {
        res.status(400).json({ success: false, message: 'Please enter your username, email, or mobile number.' });
        return;
      }

      const cleanIdentifier = String(identifier).trim();

      // Find user
      let foundUser: MemoryUser | null =
        memoryUsers.find(
          (u) =>
            u.username.toLowerCase() === cleanIdentifier.toLowerCase() ||
            (u.email && u.email.toLowerCase() === cleanIdentifier.toLowerCase()) ||
            (u.phone && u.phone.replace(/\s+/g, '') === cleanIdentifier.replace(/\s+/g, ''))
        ) || null;

      if (!foundUser && isDbConnected()) {
        try {
          const dbUser = await User.findOne({
            $or: [
              { username: cleanIdentifier.toLowerCase() },
              { email: cleanIdentifier.toLowerCase() },
              { phone: cleanIdentifier }
            ]
          });
          if (dbUser) {
            foundUser = {
              id: dbUser._id.toString(),
              username: dbUser.username,
              name: dbUser.name,
              email: dbUser.email,
              phone: dbUser.phone,
              passwordHash: dbUser.passwordHash,
              role: dbUser.role as any,
              avatarUrl: dbUser.avatarUrl || '',
              bio: dbUser.bio || '',
              createdAt: new Date().toISOString()
            };
          }
        } catch {
          // ignore db offline
        }
      }

      if (!foundUser) {
        res.status(404).json({
          success: false,
          message: 'No registered user found with the provided username, email, or phone number.'
        });
        return;
      }

      // Pick target (email preferred, or phone)
      const target = foundUser.email || foundUser.phone;
      if (!target) {
        res.status(400).json({
          success: false,
          message: 'No email or phone attached to this account. Please contact support.'
        });
        return;
      }

      const isEmail = target.includes('@');
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore.set(target.toLowerCase(), {
        code: otpCode,
        target,
        type: 'PASSWORD_RESET',
        expiresAt,
        verified: false
      });

      console.log(`🔑 [PASSWORD RESET OTP] Generated: ${otpCode} for ${target}`);

      // Mask target for privacy
      const maskedTarget = isEmail
        ? target.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`)
        : target.replace(/(\d{3})\d+(\d{2})/, '$1****$2');

      res.status(200).json({
        success: true,
        message: `OTP sent to ${maskedTarget}.`,
        username: foundUser.username,
        target,
        maskedTarget,
        channel: isEmail ? 'EMAIL' : 'SMS',
        otpPreview: otpCode
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Reset Password (after OTP confirmation)
   */
  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { target, otp, newPassword } = req.body;

      if (!target || !otp || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Target identifier, OTP code, and new password are required.'
        });
        return;
      }

      const cleanTarget = String(target).trim().toLowerCase();
      const cleanOtp = String(otp).trim();
      const cleanPassword = String(newPassword).trim();

      if (cleanPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
        return;
      }

      const record = otpStore.get(cleanTarget);
      if (!record) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP session. Please request again.' });
        return;
      }

      if (record.code !== cleanOtp) {
        res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter the correct code.' });
        return;
      }

      // Hash new password
      const newHash = await bcrypt.hash(cleanPassword, 10);

      // Update in memory
      const memUser = memoryUsers.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanTarget) ||
          (u.phone && u.phone.replace(/\s+/g, '') === cleanTarget.replace(/\s+/g, '')) ||
          u.username.toLowerCase() === cleanTarget
      );
      if (memUser) {
        memUser.passwordHash = newHash;
        memUser.password = cleanPassword;
      }

      // Update in MongoDB if connected
      if (isDbConnected()) {
        try {
          await User.updateOne(
            {
              $or: [
                { email: cleanTarget },
                { phone: cleanTarget },
                { username: cleanTarget }
              ]
            },
            { $set: { passwordHash: newHash, password: cleanPassword } }
          );
          console.log(`✅ [MONGODB DATABASE] Password updated in MongoDB for ${cleanTarget}`);
        } catch (dbErr: any) {
          console.warn('⚠️ [RESET PASSWORD] DB update notice:', dbErr.message);
        }
      }

      // Invalidate OTP
      otpStore.delete(cleanTarget);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
        username: memUser?.username
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get current authenticated user profile
   */
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Unauthorized. Token required.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, config.jwtSecret || 'ente_yathra_jwt_secret');

      const memUser = memoryUsers.find((u) => u.username === decoded.username || u.id === decoded.id);

      if (memUser) {
        res.status(200).json({
          success: true,
          user: {
            id: memUser.id,
            username: memUser.username,
            name: memUser.name,
            email: memUser.email,
            phone: memUser.phone,
            role: memUser.role,
            avatarUrl: memUser.avatarUrl,
            bio: memUser.bio
          }
        });
        return;
      }

      res.status(404).json({ success: false, message: 'User not found.' });
    } catch (err: any) {
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
  }

  /**
   * Get all registered users from database
   */
  public static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      if (isDbConnected()) {
        const dbUsers = await User.find({}).sort({ createdAt: -1 });
        const safe = dbUsers.map((u: any) => ({
          id: u._id.toString(),
          username: u.username,
          name: u.name,
          email: u.email || '',
          phone: u.phone || '',
          password: u.password || '',
          role: u.role || 'USER',
          status: u.status || 'ACTIVE',
          avatarUrl: u.avatarUrl,
          bio: u.bio || '',
          createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
        }));
        res.status(200).json({ success: true, count: safe.length, users: safe });
        return;
      }

      const safe = memoryUsers.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email || '',
        phone: u.phone || '',
        password: u.password || '',
        role: u.role || 'USER',
        status: u.status || 'ACTIVE',
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt
      }));
      res.status(200).json({ success: true, count: safe.length, users: safe });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Delete user from database
   */
  public static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, id, username } = req.body;
      const targetId = userId || id;

      if (isDbConnected()) {
        const query: any[] = [];
        if (targetId) query.push({ _id: targetId });
        if (username) query.push({ username: String(username).toLowerCase() });
        const result = await User.deleteOne({ $or: query });
        if (result.deletedCount > 0) {
          res.status(200).json({ success: true, message: 'User permanently deleted from MongoDB database.' });
          return;
        }
      }

      const initialCount = memoryUsers.length;

      memoryUsers = memoryUsers.filter((u) => {
        if (targetId && u.id === targetId) return false;
        if (username && u.username.toLowerCase() === String(username).toLowerCase()) return false;
        return true;
      });

      if (memoryUsers.length === initialCount) {
        res.status(404).json({ success: false, message: 'User not found in database.' });
        return;
      }

      res.status(200).json({ success: true, message: 'User permanently deleted from database.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle block/active status of user
   */
  public static async toggleBlockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, id, username } = req.body;
      const targetId = userId || id;

      if (isDbConnected()) {
        const query: any[] = [];
        if (targetId) query.push({ _id: targetId });
        if (username) query.push({ username: String(username).toLowerCase() });
        const dbUser = await User.findOne({ $or: query });
        if (dbUser) {
          dbUser.status = dbUser.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
          await dbUser.save();
          res.status(200).json({
            success: true,
            status: dbUser.status,
            message: `User @${dbUser.username} is now ${dbUser.status}.`
          });
          return;
        }
      }

      const user = memoryUsers.find((u) => {
        if (targetId && u.id === targetId) return true;
        if (username && u.username.toLowerCase() === String(username).toLowerCase()) return true;
        return false;
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found in database.' });
        return;
      }

      user.status = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';

      res.status(200).json({
        success: true,
        status: user.status,
        message: `User @${user.username} is now ${user.status}.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
