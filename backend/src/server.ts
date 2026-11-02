import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from './core/config/index.js';
import { OperationsHubSocket } from './core/sockets/operationsHub.js';
import apiRoutes from './routes/api.routes.js';

// 🛑 Fail-Fast Principle: Validate critical secrets in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('super_secret')) {
    console.error('❌ FATAL SECURITY ERROR: Insecure JWT_SECRET in production! Server startup aborted.');
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;

if (config.trustedProxy.includes('true')) {
  throw new Error('TRUST_PROXY must list explicit proxy IPs or subnets; blanket trust is unsafe.');
}
app.set('trust proxy', config.trustedProxy.length ? config.trustedProxy : false);

if (config.environment === 'production' && !process.env.RATE_LIMIT_REDIS_URL) {
  throw new Error('RATE_LIMIT_REDIS_URL is required in production for shared rate-limit storage.');
}

const redisClient = process.env.RATE_LIMIT_REDIS_URL
  ? createClient({ url: process.env.RATE_LIMIT_REDIS_URL })
  : undefined;
redisClient?.on('error', () => console.error('[RATE LIMIT STORE] Redis connection failed.'));

const createSharedStore = (prefix: string) => redisClient
  ? new RedisStore({
      prefix,
      sendCommand: (...args: string[]) => redisClient.sendCommand(args) as Promise<string | number | boolean | (string | number | boolean)[]>
    })
  : undefined;

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

OperationsHubSocket.initialize(io);

// 🛡️ Security Headers
app.use(helmet());

// 🛡️ Global Rate Limiter: Mitigates volumetric flood & DoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 2000 : 300,
  store: createSharedStore('travel-buddy:global:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});
app.use(globalLimiter);

// Login/recovery paths use both source-IP and normalized-target quotas.
const authIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 30,
  store: createSharedStore('travel-buddy:auth:'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
const authTargetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  store: createSharedStore('travel-buddy:auth-target:'),
  keyGenerator: (req) => {
    const raw = req.body?.identifier || req.body?.target || req.body?.username || req.body?.email || 'missing-target';
    const target = String(raw).trim().toLowerCase().slice(0, 254);
    return target;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Middlewares
app.use(cors({ origin: config.corsOrigin.split(',').map((origin) => origin.trim()), credentials: true }));
app.use(express.json({ limit: '20kb' })); // Restrict JSON body size to prevent memory exhaustion

for (const path of [
  '/api/v1/auth/login', '/api/v1/auth/send-otp', '/api/v1/auth/verify-otp',
  '/api/v1/auth/register', '/api/v1/auth/forgot-password', '/api/v1/admin/login'
]) app.use(path, authIpLimiter, authTargetLimiter);

// API Base Route
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    app: 'Travel Buddy',
    security: 'ZERO_TRUST_HARDENED',
    architecture: 'Feature-Based Architecture',
    service: 'Travel Buddy Core Gateway & Social Explorer Platform',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start Server with Graceful Port Fallback
let currentPort = Number(config.port) || 5000;

function startServer(portToTry: number) {
  server.listen(portToTry, () => {
    console.log(`🚀 [BACKEND ENGINE] Travel Buddy API Server listening on http://localhost:${portToTry}`);
    console.log(`🎫 [SUPER ADMIN DESK] Listening for incoming orders on /api/v1/admin/operations/ticketing-desk`);
    console.log(`🛡️ [ADMIN AUTH] Super Admin sign-in route available at /api/v1/admin/login`);
  });
}

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = currentPort + 1;
    console.warn(`⚠️ [BACKEND] Port ${currentPort} is already in use by another process. Automatically switching to port ${nextPort}...`);
    currentPort = nextPort;
    startServer(currentPort);
  } else {
    console.error('❌ [BACKEND SERVER ERROR]', err);
  }
});

async function bootstrap() {
  if (config.environment === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    console.error('[CONFIG] A secure JWT_SECRET is required in production.');
    process.exit(1);
  }
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    const [legacyPosts, legacyStories] = await Promise.all([
      mongoose.connection.collection('posts').countDocuments({ $or: [
        { comments: { $exists: true } }, { likes: { $exists: true } }, { savedBy: { $exists: true } },
        { commentsCount: { $exists: false } }
      ] }),
      mongoose.connection.collection('stories').countDocuments({ $or: [
        { 'pollSticker.votedUserIds': { $exists: true } }, { 'qaSticker.responses': { $exists: true } },
        { qaSticker: { $exists: true }, qaResponseCount: { $exists: false } }
      ] })
    ]);
    if (legacyPosts || legacyStories) {
      throw new Error('Legacy social arrays detected. Back up the database, run npm run social:migrate -- --apply, then restart.');
    }
    if (redisClient) await redisClient.connect();
    await Promise.all([
      mongoose.model('PostComment').init(),
      mongoose.model('PostReaction').init(),
      mongoose.model('StoryResponse').init()
    ]);
    console.log('[DATABASE] Connected to configured MongoDB instance.');
    startServer(currentPort);
  } catch (err) {
    if (redisClient?.isOpen) await redisClient.quit().catch(() => undefined);
    console.error('[DATABASE] MongoDB connection failed; API startup aborted.', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') void bootstrap();

export { app, server, io };
