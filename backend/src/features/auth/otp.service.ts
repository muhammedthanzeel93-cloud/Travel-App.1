import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { AuthChallenge, AuthChallengePurpose } from './authChallenge.model.js';
import { config } from '../../core/config/index.js';

function digest(code: string): string {
  return createHmac('sha256', config.jwtSecret).update(code).digest('hex');
}

export function verifyOtpDigest(code: string, expectedHash: string): boolean {
  const actual = Buffer.from(digest(code), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createAndDispatchOtp(target: string, purpose: AuthChallengePurpose, channel: 'email' | 'sms') {
  const webhookUrl = process.env.OTP_DELIVERY_WEBHOOK_URL;
  const webhookToken = process.env.OTP_DELIVERY_WEBHOOK_TOKEN;

  const code = randomInt(100000, 1000000).toString();
  const normalizedTarget = target.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await AuthChallenge.findOneAndUpdate(
    { target: normalizedTarget, purpose },
    { $set: { codeHash: digest(code), expiresAt, attempts: 0, createdAt: new Date() }, $unset: { verifiedAt: 1 } },
    { upsert: true, new: true, runValidators: true }
  );

  // Development fallback: log OTP to terminal when webhook is not configured
  if (!webhookUrl || !webhookToken) {
    if (process.env.NODE_ENV === 'production') {
      await AuthChallenge.deleteOne({ target: normalizedTarget, purpose });
      throw new Error('OTP delivery is not configured. Set OTP_DELIVERY_WEBHOOK_URL and OTP_DELIVERY_WEBHOOK_TOKEN.');
    }
    console.log(`\n┌─────────────────────────────────────────┐`);
    console.log(`│          🔑  DEV OTP (terminal)         │`);
    console.log(`│  Target  : ${target.padEnd(29)}│`);
    console.log(`│  Channel : ${channel.padEnd(29)}│`);
    console.log(`│  Purpose : ${purpose.padEnd(29)}│`);
    console.log(`│  Code    : ${code.padEnd(29)}│`);
    console.log(`│  Expires : 10 minutes                   │`);
    console.log(`└─────────────────────────────────────────┘\n`);
    return { expiresInSeconds: 600 };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${webhookToken}` },
      body: JSON.stringify({ to: target, channel, purpose, code, expiresInSeconds: 600 }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`OTP delivery provider returned ${response.status}.`);
  } catch (error) {
    await AuthChallenge.deleteOne({ target: normalizedTarget, purpose });
    throw error;
  }

  return { expiresInSeconds: 600 };
}

export async function verifyOtp(target: string, purpose: AuthChallengePurpose, code: string): Promise<boolean> {
  const normalizedTarget = target.trim().toLowerCase();
  const record = await AuthChallenge.findOneAndUpdate(
    { target: normalizedTarget, purpose, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
    { $inc: { attempts: 1 } },
    { new: true }
  ).select('+codeHash');
  if (!record || !verifyOtpDigest(code.trim(), record.codeHash)) return false;
  record.verifiedAt = new Date();
  await record.save();
  return true;
}

export async function consumeVerifiedOtp(target: string, purpose: AuthChallengePurpose): Promise<boolean> {
  const record = await AuthChallenge.findOneAndDelete({
    target: target.trim().toLowerCase(), purpose, verifiedAt: { $ne: null }, expiresAt: { $gt: new Date() }
  });
  return Boolean(record);
}
