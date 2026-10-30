import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export class OperationsHubSocket {
  private static io: SocketIOServer | null = null;

  public static initialize(io: SocketIOServer) {
    this.io = io;

    // 🔒 ZERO-TRUST SECURITY: Authenticate client socket connection with JWT
    io.use((socket: Socket, next: (err?: Error) => void) => {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        console.warn(`🛑 [SOCKET REJECTED] Anonymous connection rejected from socket ${socket.id}: Missing Bearer Token`);
        return next(new Error('Authentication required: Missing or invalid token'));
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        socket.data.user = decoded;
        return next();
      } catch (err: any) {
        console.warn(`🛑 [SOCKET REJECTED] Token verification failed for socket ${socket.id}: ${err.message}`);
        return next(new Error('Authentication failed: Invalid or expired token'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      console.log(`[SOCKET CONNECTED] Client ID: ${socket.id} (User: @${user?.username || 'Authenticated'} [${user?.role || 'USER'}])`);

      // Guarded Admin Desk room (Super Admin privilege strictly required)
      socket.on('join:admin-desk', () => {
        if (!socket.data.user || socket.data.user.role !== 'SUPER_ADMIN') {
          console.warn(`🛑 [SECURITY BREACH REJECTED] Unauthorized join:admin-desk attempt by socket ${socket.id}`);
          socket.emit('socket:error', { message: 'Access denied: Super Admin authorization required.' });
          return;
        }
        socket.join('admin-operations');
        console.log(`🛡️ [SOCKET AUTHORIZED] ${socket.id} (@${socket.data.user.username}) joined admin-operations room`);
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
      });
    });
  }

  /**
   * Broadcasts administrative operations alert to Super Admin Desk
   */
  public static broadcastAdminAlert(alertData: any) {
    if (this.io) {
      this.io.to('admin-operations').emit('admin:alert', {
        timestamp: new Date(),
        alertData,
        soundAlert: true
      });
      console.log(`[SOCKET BROADCAST] Emitted admin:alert`);
    }
  }
}
