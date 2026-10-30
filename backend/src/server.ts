import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
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
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});
app.use(globalLimiter);

// 🛡️ Strict Auth Rate Limiter: Blocks credential stuffing & OTP spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/send-otp', authLimiter);
app.use('/api/v1/auth/forgot-password/request', authLimiter);
app.use('/api/v1/admin/login', authLimiter);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20kb' })); // Restrict JSON body size to prevent memory exhaustion

// API Base Route
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    app: 'Travel Buddy',
    security: 'ZERO_TRUST_HARDENED',
    architecture: 'Feature-Based Architecture',
    service: 'Travel Buddy Core Gateway & Real-World Ticketing Engine (IATA & PRS)',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Database Connection with graceful offline fallback
mongoose
  .connect(config.mongoUri)
  .then(() => console.log('✅ [DATABASE] Connected to MongoDB Atlas / Local Instance successfully.'))
  .catch((err) => {
    console.warn('⚠️ [DATABASE] MongoDB not reachable at', config.mongoUri);
    console.log('⚡ [BACKEND] Running in in-memory resilience mode for testing & simulated ticketing.');
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

startServer(currentPort);

export { app, server, io };
