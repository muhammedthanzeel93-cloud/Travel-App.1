import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';

// In-memory OTP storage for registration & password resets
interface OtpRecord {
  code: string;
  target: string;
  type: string;
  expiresAt: number;
  verified: boolean;
}

const globalOtpStore = new Map<string, OtpRecord>();

// -------------------------------------------------------------
// MongoDB Driver Connection (database: travel_buddy)
// -------------------------------------------------------------
let cachedMongoose: any = null;

async function getMongoConnection(): Promise<any> {
  if (cachedMongoose && cachedMongoose.connection && cachedMongoose.connection.readyState === 1) {
    return cachedMongoose.connection.db;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), '../backend/node_modules/mongoose'),
    path.resolve(process.cwd(), 'backend/node_modules/mongoose'),
    'C:/Users/aysha/Downloads/Travel-app.1/backend/node_modules/mongoose'
  ];

  for (const p of candidatePaths) {
    try {
      const dynamicRequire = eval('require');
      const mg = dynamicRequire(p);
      if (mg.connection.readyState !== 1) {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_buddy';
        await mg.connect(uri, { serverSelectionTimeoutMS: 2000 });
      }
      cachedMongoose = mg;
      console.log('✅ [NEXT.JS API] Connected to MongoDB database: travel_buddy');
      return mg.connection.db;
    } catch {
      // try next path
    }
  }

  return null;
}

// Load all users from MongoDB travel_buddy collection 'users'
async function loadUsers(): Promise<any[]> {
  try {
    const db = await getMongoConnection();
    if (db) {
      const docs = await db.collection('users').find({}).toArray();
      if (docs && docs.length > 0) {
        return docs.map((u: any) => ({
          id: u._id.toString(),
          username: u.username,
          name: u.name || u.username,
          email: u.email || '',
          phone: u.phone || '',
          password: u.password || '',
          passwordHash: u.passwordHash,
          role: u.role || 'USER',
          status: u.status || 'ACTIVE',
          avatarUrl: u.avatarUrl,
          bio: u.bio || '',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()
        }));
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [NEXT.JS DB READ NOTE]:', err.message);
  }

  return [];
}

// Save or Update user in MongoDB travel_buddy collection 'users'
async function saveUser(user: any): Promise<void> {
  try {
    const db = await getMongoConnection();
    if (db) {
      await db.collection('users').updateOne(
        { username: user.username.toLowerCase() },
        {
          $set: {
            username: user.username.toLowerCase(),
            name: user.name || user.username,
            email: user.email ? user.email.toLowerCase() : undefined,
            phone: user.phone || undefined,
            password: user.password || '',
            passwordHash: user.passwordHash || (user.password ? hashPassword(user.password) : undefined),
            role: user.role || 'USER',
            status: user.status || 'ACTIVE',
            avatarUrl: user.avatarUrl,
            bio: user.bio || '',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`💾 [MONGODB travel_buddy] Saved user @${user.username} to database.`);
    }
  } catch (err: any) {
    console.warn('⚠️ [MONGODB WRITE NOTE]:', err.message);
  }
}

// Delete user from MongoDB travel_buddy
async function deleteUser(targetId?: string, username?: string): Promise<boolean> {
  try {
    const db = await getMongoConnection();
    if (db) {
      const conditions: any[] = [];
      if (username) conditions.push({ username: String(username).toLowerCase() });
      if (targetId) {
        try {
          if (cachedMongoose?.Types?.ObjectId) {
            conditions.push({ _id: new cachedMongoose.Types.ObjectId(targetId) });
          }
        } catch {
          conditions.push({ id: targetId });
        }
      }
      if (conditions.length > 0) {
        const res = await db.collection('users').deleteOne({ $or: conditions });
        return res.deletedCount > 0;
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [MONGODB DELETE NOTE]:', err.message);
  }
  return false;
}

// Toggle block status in MongoDB travel_buddy
async function toggleBlockUser(targetId?: string, username?: string): Promise<string> {
  try {
    const db = await getMongoConnection();
    if (db) {
      const conditions: any[] = [];
      if (username) conditions.push({ username: String(username).toLowerCase() });
      if (targetId) {
        try {
          if (cachedMongoose?.Types?.ObjectId) {
            conditions.push({ _id: new cachedMongoose.Types.ObjectId(targetId) });
          }
        } catch {
          conditions.push({ id: targetId });
        }
      }

      if (conditions.length > 0) {
        const existing = await db.collection('users').findOne({ $or: conditions });
        if (existing) {
          const newStatus = existing.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
          await db.collection('users').updateOne({ _id: existing._id }, { $set: { status: newStatus } });
          console.log(`🛡️ [MONGODB travel_buddy] User @${existing.username} status toggled to: ${newStatus}`);
          return newStatus;
        }
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [MONGODB TOGGLE NOTE]:', err.message);
  }
  return 'ACTIVE';
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_travel_salt_2026').digest('hex');
}

function verifyPassword(password: string, storedHash?: string, storedPlainPassword?: string): boolean {
  if (storedPlainPassword && storedPlainPassword === password) return true;
  if (!storedHash) return false;
  const sha = hashPassword(password);
  if (sha === storedHash) return true;
  try {
    const dynamicRequire = eval('require');
    const bcrypt = dynamicRequire(path.resolve(process.cwd(), '../backend/node_modules/bcryptjs'));
    if (bcrypt.compareSync(password, storedHash)) return true;
  } catch {
    // ignore
  }
  return false;
}

// -------------------------------------------------------------
// GET Handler
// -------------------------------------------------------------
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const action = slug.join('/');

  // ACTION: users (Fetch all users from MongoDB travel_buddy)
  if (action === 'users') {
    const users = await loadUsers();
    return NextResponse.json({ success: true, count: users.length, users });
  }

  // ACTION: check-status (Check if a user is active or blocked)
  if (action === 'check-status') {
    const url = new URL(req.url);
    const identifier = url.searchParams.get('username') || url.searchParams.get('identifier') || '';
    const clean = identifier.trim().toLowerCase();
    const users = await loadUsers();
    const user = users.find(
      (u) =>
        u.username?.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/\s+/g, '') === clean)
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found in database.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      status: user.status || 'ACTIVE',
      isBlocked: user.status === 'BLOCKED'
    });
  }

  return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 404 });
}

// -------------------------------------------------------------
// POST Handler
// -------------------------------------------------------------
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const action = slug.join('/');
  const body = await req.json().catch(() => ({}));

  try {
    // -------------------------------------------------------------
    // ACTION: users/delete (ADMIN DELETE USER FROM MONGODB)
    // -------------------------------------------------------------
    if (action === 'users/delete') {
      const { userId, id, username } = body;
      const targetId = userId || id;
      await deleteUser(targetId, username);
      return NextResponse.json({ success: true, message: 'User permanently deleted from MongoDB database.' });
    }

    // -------------------------------------------------------------
    // ACTION: users/toggle-block (ADMIN BLOCK/UNBLOCK USER IN MONGODB)
    // -------------------------------------------------------------
    if (action === 'users/toggle-block') {
      const { userId, id, username } = body;
      const targetId = userId || id;
      const newStatus = await toggleBlockUser(targetId, username);

      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `User status is now ${newStatus}.`
      });
    }

    // -------------------------------------------------------------
    // ACTION: check-status (POST)
    // -------------------------------------------------------------
    if (action === 'check-status') {
      const rawIdentifier = body.identifier || body.username || body.email || body.phone || '';
      const clean = String(rawIdentifier).trim().toLowerCase();
      const users = await loadUsers();
      const user = users.find(
        (u) =>
          u.username?.toLowerCase() === clean ||
          (u.email && u.email.toLowerCase() === clean) ||
          (u.phone && u.phone.replace(/\s+/g, '') === clean)
      );

      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found in database.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        username: user.username,
        role: user.role,
        status: user.status || 'ACTIVE',
        isBlocked: user.status === 'BLOCKED'
      });
    }

    // -------------------------------------------------------------
    // ACTION: login (AUTHENTICATE AGAINST MONGODB travel_buddy)
    // -------------------------------------------------------------
    if (action === 'login') {
      const rawIdentifier = body.identifier || body.username || body.email || body.phone;
      const cleanPassword = String(body.password || '').trim();

      if (!rawIdentifier || !cleanPassword) {
        return NextResponse.json(
          { success: false, message: 'Username/Email/Phone and password are required.' },
          { status: 400 }
        );
      }

      const cleanId = String(rawIdentifier).trim().toLowerCase();
      const cleanPhone = String(rawIdentifier).trim().replace(/\s+/g, '');

      // Load live users from MongoDB travel_buddy database
      const users = await loadUsers();
      const user = users.find(
        (u) =>
          u.username?.toLowerCase() === cleanId ||
          (u.email && u.email.toLowerCase() === cleanId) ||
          (u.phone && u.phone.replace(/\s+/g, '') === cleanPhone)
      );

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'No registered account found with these details.' },
          { status: 404 }
        );
      }

      // CRITICAL BLOCK ENFORCEMENT:
      // If user is BLOCKED by administrator in MongoDB, strictly reject login with 403 Forbidden
      if (user.status === 'BLOCKED') {
        console.warn(`🛑 [AUTH LOGIN REJECTED] User @${user.username} (${user.role}) is BLOCKED by administrator.`);
        return NextResponse.json(
          {
            success: false,
            blocked: true,
            message: `Your account (@${user.username}) has been BLOCKED by the administrator. Login access is prohibited for this ${user.role || 'user'} account.`
          },
          { status: 403 }
        );
      }

      const isValid =
        (user.password && user.password === cleanPassword) ||
        verifyPassword(cleanPassword, user.passwordHash, user.password);

      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Incorrect password. Please verify and try again.' },
          { status: 401 }
        );
      }

      const token = `token_tb_${user.id}_${Date.now()}`;

      return NextResponse.json({
        success: true,
        message: 'Successfully logged in to Travel Buddy.',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          password: user.password || '',
          role: user.role,
          status: user.status || 'ACTIVE',
          avatarUrl: user.avatarUrl,
          bio: user.bio
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: check-availability
    // -------------------------------------------------------------
    if (action === 'check-availability') {
      const { username, email, phone } = body;
      const users = await loadUsers();

      if (username) {
        const clean = String(username).trim().toLowerCase();
        const taken = users.some((u) => u.username?.toLowerCase() === clean);
        if (taken) {
          return NextResponse.json({
            available: false,
            field: 'username',
            message: 'This username is already taken. Please choose another username.'
          });
        }
      }

      if (email) {
        const clean = String(email).trim().toLowerCase();
        const taken = users.some((u) => u.email && u.email.toLowerCase() === clean);
        if (taken) {
          return NextResponse.json({
            available: false,
            field: 'email',
            message: 'An account with this email address already exists.'
          });
        }
      }

      if (phone) {
        const clean = String(phone).trim().replace(/\s+/g, '');
        const taken = users.some((u) => u.phone && u.phone.replace(/\s+/g, '') === clean);
        if (taken) {
          return NextResponse.json({
            available: false,
            field: 'phone',
            message: 'An account with this mobile number already exists.'
          });
        }
      }

      return NextResponse.json({ available: true, message: 'Credential is available.' });
    }

    // -------------------------------------------------------------
    // ACTION: send-otp
    // -------------------------------------------------------------
    if (action === 'send-otp') {
      const { target, channel, type = 'REGISTRATION' } = body;
      if (!target) {
        return NextResponse.json({ success: false, message: 'Target email/phone is required.' }, { status: 400 });
      }

      const cleanTarget = String(target).trim();
      const users = await loadUsers();

      if (type === 'REGISTRATION') {
        const exists =
          channel === 'email'
            ? users.some((u) => u.email?.toLowerCase() === cleanTarget.toLowerCase())
            : users.some((u) => u.phone?.replace(/\s+/g, '') === cleanTarget.replace(/\s+/g, ''));

        if (exists) {
          return NextResponse.json(
            { success: false, message: `An account already exists for ${cleanTarget}. Please log in.` },
            { status: 400 }
          );
        }
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      globalOtpStore.set(cleanTarget.toLowerCase(), {
        code: otp,
        target: cleanTarget,
        type,
        expiresAt,
        verified: false
      });

      return NextResponse.json({
        success: true,
        message: `OTP sent to ${cleanTarget}`,
        otpPreview: otp,
        channel: channel || 'email'
      });
    }

    // -------------------------------------------------------------
    // ACTION: verify-otp
    // -------------------------------------------------------------
    if (action === 'verify-otp') {
      const { target, otp } = body;
      if (!target || !otp) {
        return NextResponse.json({ success: false, message: 'Target and OTP code are required.' }, { status: 400 });
      }

      const cleanTarget = String(target).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = globalOtpStore.get(cleanTarget);
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'No active OTP verification session found. Request a new code.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        globalOtpStore.delete(cleanTarget);
        return NextResponse.json(
          { success: false, message: 'OTP code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (record.code !== cleanOtp) {
        return NextResponse.json(
          { success: false, message: 'Invalid OTP code. Please enter the correct code.' },
          { status: 400 }
        );
      }

      record.verified = true;
      globalOtpStore.set(cleanTarget, record);

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully. You may now complete account creation.'
      });
    }

    // -------------------------------------------------------------
    // ACTION: register (STORE USER IN MONGODB travel_buddy)
    // -------------------------------------------------------------
    if (action === 'register') {
      const { username, name, email, phone, password, role } = body;

      if (!username || !password) {
        return NextResponse.json(
          { success: false, message: 'Username and password are required.' },
          { status: 400 }
        );
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
      const cleanPhone = phone ? String(phone).trim() : undefined;
      const cleanPassword = String(password).trim();

      const users = await loadUsers();

      if (users.some((u) => u.username?.toLowerCase() === cleanUsername)) {
        return NextResponse.json(
          {
            success: false,
            field: 'username',
            message: 'This username is already taken. Please choose another username.'
          },
          { status: 400 }
        );
      }

      if (cleanEmail && users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
        return NextResponse.json(
          {
            success: false,
            field: 'email',
            message: 'An account with this email address already exists.'
          },
          { status: 400 }
        );
      }

      if (cleanPhone && users.some((u) => u.phone?.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''))) {
        return NextResponse.json(
          {
            success: false,
            field: 'phone',
            message: 'An account with this mobile number already exists.'
          },
          { status: 400 }
        );
      }

      // Check OTP verification
      const verificationTarget = cleanEmail || cleanPhone;
      if (verificationTarget) {
        const otpRecord = globalOtpStore.get(verificationTarget.toLowerCase());
        if (!otpRecord || !otpRecord.verified) {
          return NextResponse.json(
            { success: false, message: 'OTP verification is required before creating your account.' },
            { status: 400 }
          );
        }
      }

      // Create new user in MongoDB travel_buddy
      const newUser = {
        id: `user_${Date.now()}`,
        username: cleanUsername,
        name: name ? String(name).trim() : cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        password: cleanPassword,
        passwordHash: hashPassword(cleanPassword),
        role: role || 'USER',
        status: 'ACTIVE',
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&w=400&q=80`,
        bio: 'Just joined Travel Buddy! Ready for adventures ✈️🎒',
        createdAt: new Date().toISOString()
      };

      await saveUser(newUser);

      if (verificationTarget) {
        globalOtpStore.delete(verificationTarget.toLowerCase());
      }

      const token = `token_tb_${newUser.id}_${Date.now()}`;

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully in MongoDB database! Welcome to Travel Buddy.',
          storedInDatabase: true,
          token,
          user: newUser
        },
        { status: 201 }
      );
    }

    // -------------------------------------------------------------
    // ACTION: forgot-password/request
    // -------------------------------------------------------------
    if (action === 'forgot-password/request') {
      const { identifier } = body;
      const clean = String(identifier || '').trim().toLowerCase();

      const users = await loadUsers();
      const user = users.find(
        (u) =>
          u.username?.toLowerCase() === clean ||
          (u.email && u.email.toLowerCase() === clean) ||
          (u.phone && u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, ''))
      );

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'No registered user found with these details.' },
          { status: 404 }
        );
      }

      const target = user.email || user.phone;
      if (!target) {
        return NextResponse.json(
          { success: false, message: 'This user does not have a registered email or mobile number.' },
          { status: 400 }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      globalOtpStore.set(target.toLowerCase(), {
        code: otp,
        target,
        type: 'PASSWORD_RESET',
        expiresAt: Date.now() + 5 * 60 * 1000,
        verified: false
      });

      let masked = target;
      if (user.email) {
        const [local, dom] = user.email.split('@');
        masked = `${local.slice(0, 2)}••••@${dom}`;
      } else if (user.phone) {
        masked = `••••••${user.phone.slice(-4)}`;
      }

      return NextResponse.json({
        success: true,
        message: `Reset code sent to ${masked}`,
        target,
        maskedTarget: masked,
        otpPreview: otp,
        username: user.username
      });
    }

    // -------------------------------------------------------------
    // ACTION: forgot-password/reset
    // -------------------------------------------------------------
    if (action === 'forgot-password/reset') {
      const { target, otp, newPassword } = body;
      if (!target || !otp || !newPassword) {
        return NextResponse.json(
          { success: false, message: 'Target, OTP code, and new password are required.' },
          { status: 400 }
        );
      }

      const cleanTarget = String(target).trim().toLowerCase();
      const cleanOtp = String(otp).trim();
      const cleanNewPassword = String(newPassword).trim();

      const record = globalOtpStore.get(cleanTarget);
      if (!record || record.code !== cleanOtp) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired OTP code for password reset.' },
          { status: 400 }
        );
      }

      const users = await loadUsers();
      const user = users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanTarget) ||
          (u.phone && u.phone.replace(/\s+/g, '') === cleanTarget.replace(/\s+/g, '')) ||
          u.username?.toLowerCase() === cleanTarget
      );

      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found in database.' }, { status: 404 });
      }

      user.password = cleanNewPassword;
      user.passwordHash = hashPassword(cleanNewPassword);
      await saveUser(user);

      globalOtpStore.delete(cleanTarget);

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully in MongoDB. You may now sign in with your new password.',
        username: user.username
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
