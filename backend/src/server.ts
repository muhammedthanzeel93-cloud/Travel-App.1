import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './core/config/index.js';
import { OperationsHubSocket } from './core/sockets/operationsHub.js';
import apiRoutes from './routes/api.routes.js';

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

// Middlewares
app.use(cors());
app.use(express.json());

// API Base Route
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    architecture: 'Feature-Based Architecture',
    service: 'Travel Platform Core Gateway & Real-World Ticketing Engine',
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

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 [BACKEND ENGINE] Travel Platform API Server listening on http://localhost:${PORT}`);
  console.log(`🎫 [SUPER ADMIN DESK] Listening for incoming orders on /api/v1/admin/operations/ticketing-desk`);
});

export { app, server, io };
