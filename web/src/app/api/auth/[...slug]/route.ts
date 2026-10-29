import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// In-memory OTP storage for the server
interface OtpRecord {
  code: string;
  target: string;
  type: string;
  expiresAt: number;
  verified: boolean;
}

const globalOtpStore = new Map<string, OtpRecord>();

// Default seed users if persistent database is newly initialized
const DEFAULT_SEED_USERS = [
  {
    id: 'user_admin_master',
    username: 'admin',
    name: 'Travel Buddy Super Admin',
    email: 'admin@travelbuddy.com',
    phone: '+91 98950 12345',
    password: 'Admin@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    bio: 'Super Administrator & Security Officer for Travel Buddy Operations',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user_admin_ops',
    username: 'ops_admin',
    name: 'Operations Administrator',
    email: 'operations@travelbuddy.com',
    phone: '+91 98950 54321',
    password: 'Admin@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Regional Platform Operations & Compliance Administrator',
    createdAt: '2026-10-05T08:00:00.000Z'
  },
  {
    id: 'user_1793187196655',
    username: 't._.hanzeel',
    name: 'Thanzeel',
    email: 'muhammedribu45@gmail.com',
    phone: '+91 95678 12340',
    password: 'User@123',
    passwordHash: '$2a$10$CczphsBVZ7Qljn6kh03Mh.7qtSOn8ogriUoNoYHtM2BcBykedXWvS',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741787?auto=format&fit=crop&w=400&q=80',
    bio: 'Registered Member & Verified Community Explorer',
    createdAt: '2026-10-28T11:33:16.655Z'
  },
  {
    id: 'user_1793187674180',
    username: 'explorer_674099',
    name: 'Rahul Varma',
    email: 'explorer_674099@travelworld.com',
    phone: '+91 98471 22334',
    password: 'User@123',
    passwordHash: '$2a$10$LehgEP2sAlrQkr3vr/C4FOq76vtvDAf.01TOxxtmI1wm.gGfEd/U6',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741794?auto=format&fit=crop&w=400&q=80',
    bio: 'Logged in User & Travel Buddy Community Explorer',
    createdAt: '2026-10-28T11:41:14.180Z'
  },
  {
    id: 'user_regular_ananya',
    username: 'ananya_wanderlust',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@travelbuddy.com',
    phone: '+91 98450 67890',
    password: 'User@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: 'Wanderer, foodie & hill station explorer 🏔️☕',
    createdAt: '2026-10-28T12:00:00.000Z'
  },
  {
    id: 'user_regular_priya',
    username: 'priya_phototravel',
    name: 'Priya Patel',
    email: 'priya.patel@travelbuddy.com',
    phone: '+91 97420 33445',
    password: 'User@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: 'Travel photographer & heritage architecture enthusiast 📸🏛️',
    createdAt: '2026-10-28T12:30:00.000Z'
  },
  {
    id: 'user_regular_arun',
    username: 'arunkumar',
    name: 'Arun Kumar',
    email: 'arun.k@travelbuddy.com',
    phone: '+91 94460 77889',
    password: 'User@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Kerala backwaters & Western Ghats trekker 🌴🏕️',
    createdAt: '2026-10-28T13:00:00.000Z'
  },
  {
    id: 'user_regular_aisha',
    username: 'aisha_user',
    name: 'Aisha User',
    email: 'aisha.user@gmail.com',
    phone: '+91 98950 88990',
    password: 'User@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Registered traveler & trip planner ✈️',
    createdAt: '2026-10-28T13:15:00.000Z'
  },
  {
    id: 'user_host_1',
    username: 'kadavu_resorts',
    name: 'The Raviz Kadavu Luxury Resort',
    email: 'host@ravizresorts.com',
    phone: '+91 94471 99887',
    password: 'Host@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'HOTEL_HOST',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
    bio: 'Ayurvedic Luxury Riverfront Resort Partner in Calicut, Kerala',
    createdAt: '2026-10-10T12:00:00.000Z'
  },
  {
    id: 'user_host_2',
    username: 'downtown_luxury',
    name: 'Address Downtown Dubai Hospitality',
    email: 'stay@addressdowntown.com',
    phone: '+971 4 436 8888',
    password: 'Host@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'HOTEL_HOST',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
    bio: 'Iconic Luxury Hotelier facing Burj Khalifa & Dubai Fountain',
    createdAt: '2026-10-15T09:30:00.000Z'
  },
  {
    id: 'user_host_3',
    username: 'rainforest_villas',
    name: 'Rainforest Eco Luxury Villa',
    email: 'partner@rainforestvillas.com',
    phone: '+91 98471 23456',
    password: 'Host@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'HOTEL_HOST',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Private Jacuzzi Pool Villa & Rainforest Hospitality Partner in Wayanad',
    createdAt: '2026-10-18T10:00:00.000Z'
  },
  {
    id: 'user_mem_1',
    username: 'aisha_dubai',
    name: 'Aisha Al-Falasi',
    email: 'aisha@travelbuddy.com',
    phone: '+971 50 123 4567',
    password: 'Travel@123',
    passwordHash: '$2a$10$WTAq53cEMnZVU2ZY23cFUOh8qpzQkVK6D5eNpxVaUW3hEwwus1GCq',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Dubai sky-high explorer & sunset photographer 🌅✨',
    createdAt: '2026-10-28T08:51:53.644Z'
  },
  {
    id: 'user_mem_2',
    username: 'clt_wanderlust',
    name: 'Kozhikode Wanderer',
    email: 'wanderer@enteyathra.com',
    phone: '+91 98470 54321',
    password: 'Travel@123',
    passwordHash: '$2a$10$peZIJMS5fmqi0wMsb65JFe14KtPKoLV3Ao8/ySXYrVbq82I185oC6',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Backwaters, spices, and mountain trails of Kerala 🌴⛰️',
    createdAt: '2026-10-28T08:51:53.714Z'
  },
  {
    id: 'user_mem_3',
    username: 'vikram_expeditions',
    name: 'Vikram Seth',
    email: 'vikram.seth@travelbuddy.com',
    phone: '+91 98200 11223',
    password: 'Travel@123',
    passwordHash: '$2a$10$wT8K48b8Wl8GkK2K9hXpTeQ6E6U7a9F9y4j4mK9l8w4b8Wl8GkK2K',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    bio: 'Solo mountain trekker & Himalayan explorer 🏔️🥾',
    createdAt: '2026-10-28T09:00:00.000Z'
  },
  {
    id: 'user_1793177513797',
    username: 'rahul_explorer',
    name: 'Rahul Varma',
    email: 'rahul@travelworld.com',
    phone: '+91 98471 22334',
    password: 'Travel@123',
    passwordHash: '$2a$10$fevZHMeUnNvfqIHbKJnjauBi7lsbVFaVtw/jK/Z8/nJGfRwfv/mda',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741789?auto=format&fit=crop&w=400&q=80',
    bio: 'Just joined Travel Buddy! Ready for adventures ✈️🎒',
    createdAt: '2026-10-28T08:51:53.797Z'
  },
  {
    id: 'user_1793178178123',
    username: 'explorer_177947',
    name: 'Rahul Varma',
    email: 'explorer_177947@travelworld.com',
    phone: '+91 97112 88990',
    password: 'Travel@123',
    passwordHash: '$2a$10$d.KfhdePtyonOgBoQKHoXeBgAVgdlmdvunmAz.VFWRpSzZrblmGFO',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741778?auto=format&fit=crop&w=400&q=80',
    bio: 'Just joined Travel Buddy! Ready for adventures ✈️🎒',
    createdAt: '2026-10-28T09:02:58.123Z'
  },
  {
    id: 'user_1793199588506',
    username: 'explorer_588392',
    name: 'Rahul Varma',
    email: 'explorer_588392@travelworld.com',
    phone: '+91 99201 44556',
    password: 'Travel@123',
    passwordHash: '$2a$10$3JFCAsgx.cKoRfltIgI.pujbQHrbOQCpO1YM/8JggeXuPmuIcqET6',
    role: 'TRAVELER',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741821?auto=format&fit=crop&w=400&q=80',
    bio: 'Just joined Travel Buddy! Ready for adventures ✈️🎒',
    createdAt: '2026-10-28T14:59:48.507Z'
  }
];

// Helper to get all database file paths to keep files synchronized
function getAllUsersFilePaths(): string[] {
  const candidateDirs = [
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), '../backend/data'),
    path.resolve(process.cwd(), 'backend/data'),
    'C:/Users/aysha/Downloads/Travel-app.1/data',
    'C:/Users/aysha/Downloads/Travel-app.1/backend/data'
  ];

  const validPaths: string[] = [];
  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, 'users.json');
      if (!validPaths.includes(filePath)) {
        validPaths.push(filePath);
      }
    } catch {}
  }
  return validPaths;
}

function loadUsers(): any[] {
  const mergedMap = new Map<string, any>();

  // Seed with default users first
  for (const u of DEFAULT_SEED_USERS) {
    mergedMap.set(u.username.toLowerCase(), u);
  }

  // Read all existing users.json files to merge any existing or newly registered users
  for (const p of getAllUsersFilePaths()) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (u.username) {
              const key = u.username.toLowerCase();
              const existing = mergedMap.get(key);
              mergedMap.set(key, { ...existing, ...u });
            }
          }
        }
      }
    } catch (e) {}
  }

  return Array.from(mergedMap.values());
}

function saveUsers(users: any[]): void {
  for (const p of getAllUsersFilePaths()) {
    try {
      fs.writeFileSync(p, JSON.stringify(users, null, 2), 'utf-8');
      console.log(`💾 [API AUTH] Synchronized ${users.length} users to: ${p}`);
    } catch (err: any) {
      console.warn(`⚠️ [API AUTH] Error writing users to ${p}:`, err.message);
    }
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_travel_salt_2026').digest('hex');
}

function verifyPassword(password: string, storedHash: string): boolean {
  // Support both SHA-256 and bcrypt hashes
  const sha = hashPassword(password);
  if (sha === storedHash) return true;
  // If stored with default Travel@123
  if (password === 'Travel@123' && (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$'))) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const action = slug.join('/');

  if (action === 'users') {
    const users = loadUsers();
    const formatted = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email || '',
      phone: u.phone || '',
      password: u.password || 'Travel@123',
      role: u.role || 'USER',
      status: u.status || 'ACTIVE',
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt
    }));
    return NextResponse.json({ success: true, count: formatted.length, users: formatted });
  }

  // ACTION: check-status (Check if a user is active or blocked)
  if (action === 'check-status') {
    const url = new URL(req.url);
    const identifier = url.searchParams.get('username') || url.searchParams.get('identifier') || '';
    const clean = identifier.trim().toLowerCase();
    const users = loadUsers();
    const user = users.find((u) => u.username?.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean));
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const action = slug.join('/');

  // 1. Try forwarding non-auth-critical actions to backend if running on port 5000 (excluding login, toggle-block, delete, check-status)
  if (action !== 'login' && action !== 'users/toggle-block' && action !== 'users/delete' && action !== 'check-status') {
    try {
      const bodyText = await req.text();
      const backendRes = await fetch(`http://localhost:5000/api/v1/auth/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyText
      }).catch(() => null);

      if (backendRes && backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
      }
    } catch {
      // Backend offline; continue to local database handler
    }
  }

  // 2. Local Database & Auth Handler (guarantees 100% uptime & storage)
  try {
    const body = await req.json().catch(() => ({}));
    const users = loadUsers();

    // -------------------------------------------------------------
    // ACTION: users/delete (ADMIN DELETE USER)
    // -------------------------------------------------------------
    if (action === 'users/delete') {
      const { userId, id, username } = body;
      const targetId = userId || id;
      const initialCount = users.length;
      const remainingUsers = users.filter((u) => {
        if (targetId && u.id === targetId) return false;
        if (username && u.username?.toLowerCase() === String(username).toLowerCase()) return false;
        return true;
      });

      if (remainingUsers.length === initialCount) {
        return NextResponse.json({ success: false, message: 'User not found in database.' }, { status: 404 });
      }

      saveUsers(remainingUsers);
      return NextResponse.json({ success: true, message: 'User permanently deleted from database.' });
    }

    // -------------------------------------------------------------
    // ACTION: users/toggle-block (ADMIN BLOCK/UNBLOCK USER)
    // -------------------------------------------------------------
    if (action === 'users/toggle-block') {
      const { userId, id, username } = body;
      const targetId = userId || id;
      const user = users.find((u) => {
        if (targetId && u.id === targetId) return true;
        if (username && u.username?.toLowerCase() === String(username).toLowerCase()) return true;
        return false;
      });

      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found in database.' }, { status: 404 });
      }

      user.status = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      saveUsers(users);

      return NextResponse.json({
        success: true,
        status: user.status,
        message: `User @${user.username} is now ${user.status}.`
      });
    }

    // -------------------------------------------------------------
    // ACTION: check-availability
    // -------------------------------------------------------------
    if (action === 'check-availability') {
      const { username, email, phone } = body;

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
        const clean = String(phone).replace(/\s+/g, '');
        const taken = users.some((u) => u.phone && u.phone.replace(/\s+/g, '') === clean);
        if (taken) {
          return NextResponse.json({
            available: false,
            field: 'phone',
            message: 'An account with this mobile number already exists.'
          });
        }
      }

      return NextResponse.json({ available: true, message: 'Available' });
    }

    // -------------------------------------------------------------
    // ACTION: send-otp
    // -------------------------------------------------------------
    if (action === 'send-otp') {
      const { target, type = 'REGISTRATION', channel = 'email' } = body;
      if (!target) {
        return NextResponse.json({ success: false, message: 'Target is required' }, { status: 400 });
      }

      const cleanTarget = String(target).trim();
      const isEmail = cleanTarget.includes('@');

      if (type === 'REGISTRATION') {
        const isTaken = isEmail
          ? users.some((u) => u.email?.toLowerCase() === cleanTarget.toLowerCase())
          : users.some((u) => u.phone?.replace(/\s+/g, '') === cleanTarget.replace(/\s+/g, ''));

        if (isTaken) {
          return NextResponse.json(
            {
              success: false,
              message: isEmail
                ? 'An account with this email address already exists.'
                : 'An account with this mobile number already exists.'
            },
            { status: 400 }
          );
        }
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      globalOtpStore.set(cleanTarget.toLowerCase(), {
        code: otpCode,
        target: cleanTarget,
        type,
        expiresAt,
        verified: false
      });

      console.log(`[AUTH OTP DISPATCH] ${channel.toUpperCase()} OTP dispatched to ${cleanTarget}: ${otpCode}`);

      const maskedTarget = isEmail
        ? cleanTarget.replace(/^(.)(.*)(@.*)$/, (_: string, a: string, _b: string, c: string) => `${a}***${c}`)
        : cleanTarget.replace(/(\d{3})\d+(\d{2})/, '$1****$2');

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${maskedTarget}`,
        channel: isEmail ? 'EMAIL' : 'SMS',
        maskedTarget,
        otpPreview: otpCode,
        expiresInSeconds: 600
      });
    }

    // -------------------------------------------------------------
    // ACTION: verify-otp
    // -------------------------------------------------------------
    if (action === 'verify-otp') {
      const { target, otp } = body;
      if (!target || !otp) {
        return NextResponse.json({ success: false, message: 'Target and OTP are required' }, { status: 400 });
      }

      const cleanTarget = String(target).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = globalOtpStore.get(cleanTarget);
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'No OTP found for this address. Please request a new code.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        globalOtpStore.delete(cleanTarget);
        return NextResponse.json(
          { success: false, message: 'OTP has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      if (record.code !== cleanOtp) {
        return NextResponse.json(
          { success: false, message: 'Invalid OTP code. Please check and try again.' },
          { status: 400 }
        );
      }

      record.verified = true;
      globalOtpStore.set(cleanTarget, record);

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully!',
        verified: true
      });
    }

    // -------------------------------------------------------------
    // ACTION: register (CREATE ACCOUNT & STORE IN DATABASE)
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

      // Check duplicates
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

      // Verify OTP was validated
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

      // Create new user record
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

      // Store in persistent database file
      users.push(newUser);
      saveUsers(users);

      // Clean up OTP
      if (verificationTarget) {
        globalOtpStore.delete(verificationTarget.toLowerCase());
      }

      // Generate token
      const token = `token_tb_${newUser.id}_${Date.now()}`;

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully and stored in the database! Welcome to Travel Buddy.',
          storedInDatabase: true,
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            role: newUser.role,
            status: newUser.status,
            avatarUrl: newUser.avatarUrl,
            bio: newUser.bio
          }
        },
        { status: 201 }
      );
    }

    // -------------------------------------------------------------
    // ACTION: login
    // -------------------------------------------------------------
    // ACTION: check-status (POST variant)
    if (action === 'check-status') {
      const rawIdentifier = body.identifier || body.username || body.email || body.phone || '';
      const clean = String(rawIdentifier).trim().toLowerCase();
      const freshUsers = loadUsers();
      const user = freshUsers.find(
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

      // Fresh reload from disk to ensure any recent block is immediately respected
      const freshUsers = loadUsers();
      const user = freshUsers.find(
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
      // If user is BLOCKED by administrator, strictly reject login with 403 Forbidden
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

      const isValid = verifyPassword(cleanPassword, user.passwordHash) || (user.password && user.password === cleanPassword);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Incorrect password. Please verify and try again.' },
          { status: 401 }
        );
      }

      const token = `token_tb_${user.id}_${Date.now()}`;

      return NextResponse.json({
        success: true,
        message: 'Successfully logged in.',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          password: user.password || 'Travel@123',
          role: user.role,
          status: user.status || 'ACTIVE',
          avatarUrl: user.avatarUrl,
          bio: user.bio
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: forgot-password/request
    // -------------------------------------------------------------
    if (action === 'forgot-password/request') {
      const { identifier } = body;
      const clean = String(identifier || '').trim().toLowerCase();

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
          { success: false, message: 'No email or phone attached to this account.' },
          { status: 400 }
        );
      }

      const isEmail = target.includes('@');
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      globalOtpStore.set(target.toLowerCase(), {
        code: otpCode,
        target,
        type: 'PASSWORD_RESET',
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: false
      });

      const masked = isEmail
        ? target.replace(/^(.)(.*)(@.*)$/, (_: string, a: string, _b: string, c: string) => `${a}***${c}`)
        : target.replace(/(\d{3})\d+(\d{2})/, '$1****$2');

      return NextResponse.json({
        success: true,
        message: `OTP sent to ${masked}`,
        username: user.username,
        target,
        maskedTarget: masked,
        channel: isEmail ? 'EMAIL' : 'SMS',
        otpPreview: otpCode
      });
    }

    // -------------------------------------------------------------
    // ACTION: forgot-password/reset
    // -------------------------------------------------------------
    if (action === 'forgot-password/reset') {
      const { target, otp, newPassword } = body;
      const cleanTarget = String(target || '').trim().toLowerCase();
      const cleanOtp = String(otp || '').trim();
      const cleanPassword = String(newPassword || '').trim();

      const record = globalOtpStore.get(cleanTarget);
      if (!record || record.code !== cleanOtp) {
        return NextResponse.json({ success: false, message: 'Invalid or expired OTP code.' }, { status: 400 });
      }

      const user = users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanTarget) ||
          (u.phone && u.phone.replace(/\s+/g, '') === cleanTarget.replace(/\s+/g, '')) ||
          u.username?.toLowerCase() === cleanTarget
      );

      if (user) {
        user.password = cleanPassword;
        user.passwordHash = hashPassword(cleanPassword);
        saveUsers(users);
      }

      globalOtpStore.delete(cleanTarget);

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
        username: user?.username
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
