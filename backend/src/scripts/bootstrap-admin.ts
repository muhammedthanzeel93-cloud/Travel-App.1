import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../core/config/index.js';
import { User } from '../features/auth/user.model.js';

async function bootstrapAdmin() {
  const username = String(process.env.BOOTSTRAP_ADMIN_USERNAME || '').trim().toLowerCase();
  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!/^[a-z0-9_.-]{3,30}$/.test(username) || !email.includes('@') || password.length < 14) {
    throw new Error('Set BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (14+ characters).');
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  const existingAdmin = await User.exists({ role: 'SUPER_ADMIN' });
  if (existingAdmin) throw new Error('A SUPER_ADMIN already exists; bootstrap is one-time and will not change it.');
  await User.create({
    username,
    email,
    name: String(process.env.BOOTSTRAP_ADMIN_NAME || username).trim().slice(0, 100),
    passwordHash: await bcrypt.hash(password, 12),
    role: 'SUPER_ADMIN',
    status: 'ACTIVE'
  });
  console.log('Initial SUPER_ADMIN account created. Clear bootstrap environment variables now.');
}

bootstrapAdmin()
  .catch((error) => {
    console.error('[ADMIN BOOTSTRAP]', error instanceof Error ? error.message : 'Failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
