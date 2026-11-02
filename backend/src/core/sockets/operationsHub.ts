import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../../features/auth/user.model.js';

const userRoom = (userId: string) => `user:${userId}`;

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
        const decoded = jwt.verify(token, config.jwtSecret) as { id?: string; sessionVersion?: number };
        if (!decoded.id) return next(new Error('Authentication required.'));
        void User.findById(decoded.id).select('username role status sessionVersion').then((user) => {
          if (!user || user.status !== 'ACTIVE' || (decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
            next(new Error('Authentication required.'));
            return;
          }
          socket.data.user = {
            id: user._id.toString(), username: user.username, role: user.role,
            sessionVersion: user.sessionVersion ?? 0
          };
          next();
        }).catch(() => next(new Error('Authentication required.')));
      } catch {
        return next(new Error('Authentication required.'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      if (user?.id) void socket.join(userRoom(user.id));

      // Guarded Admin Desk room (Super Admin privilege strictly required)
      socket.on('join:admin-desk', async () => {
        const identity = socket.data.user as { id?: string; sessionVersion?: number } | undefined;
        if (!identity?.id) {
          socket.emit('socket:error', { message: 'Access denied.' });
          return;
        }
        const current = await User.findOne({
          _id: identity.id, role: 'SUPER_ADMIN', status: 'ACTIVE', sessionVersion: identity.sessionVersion
        }).select('_id');
        if (!current) {
          socket.emit('socket:error', { message: 'Access denied.' });
          socket.disconnect(true);
          return;
        }
        socket.join('admin-operations');
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
      });
    });
  }

  public static revokeUserSessions(userId: string): void {
    this.io?.in(userRoom(userId)).disconnectSockets(true);
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
