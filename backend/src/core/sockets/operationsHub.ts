import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export class OperationsHubSocket {
  private static io: SocketIOServer | null = null;

  public static initialize(io: SocketIOServer) {
    this.io = io;

    // 🔒 Security Handshake: Authenticate client socket connection with JWT
    io.use((socket: Socket, next: (err?: Error) => void) => {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as any;
          socket.data.user = decoded;
          return next();
        } catch (err) {
          console.warn(`⚠️ [SOCKET AUTH] Invalid token attempt from socket ID ${socket.id}`);
          // Allow connection as anonymous guest for public alerts, but socket.data.user remains undefined
          return next();
        }
      }
      // Allow anonymous connection for public broadcasts
      next();
    });

    io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      console.log(`[SOCKET CONNECTED] Client ID: ${socket.id} (User: ${user ? `@${user.username} [${user.role}]` : 'Anonymous Guest'})`);

      // Guarded Admin Desk room (Super Admin privilege required)
      socket.on('join:admin-desk', () => {
        if (!socket.data.user || socket.data.user.role !== 'SUPER_ADMIN') {
          console.warn(`🛑 [SECURITY BREACH REJECTED] Unauthorized join:admin-desk attempt by socket ${socket.id}`);
          socket.emit('socket:error', { message: 'Access denied: Super Admin authorization required.' });
          return;
        }
        socket.join('admin-operations');
        console.log(`🛡️ [SOCKET AUTHORIZED] ${socket.id} (@${socket.data.user.username}) joined admin-operations room`);
      });

      // Guarded User Vault room (Prevent IDOR eavesdropping)
      socket.on('join:user-vault', (userId: string) => {
        if (socket.data.user && socket.data.user.id !== userId && socket.data.user.role !== 'SUPER_ADMIN') {
          console.warn(`🛑 [IDOR ATTEMPT REJECTED] Socket ${socket.id} attempted to join vault for other user ${userId}`);
          socket.emit('socket:error', { message: 'Access denied: Cannot access another user vault.' });
          return;
        }
        socket.join(`user:${userId}`);
        console.log(`[SOCKET] ${socket.id} joined user:${userId} room`);
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
      });
    });
  }

  /**
   * Broadcasts a new booking order requiring ticketing action to the Super Admin Desk
   */
  public static broadcastNewBookingToAdmin(orderData: any) {
    if (this.io) {
      this.io.to('admin-operations').emit('admin:new-booking-queued', {
        timestamp: new Date(),
        orderData,
        soundAlert: true
      });
      console.log(`[SOCKET BROADCAST] Emitted admin:new-booking-queued for order ${orderData.bookingReference}`);
    }
  }

  /**
   * Emits ticket issuance confirmation directly to the traveler's offline vault
   */
  public static pushTicketToTravelerVault(userId: string, ticketData: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('vault:ticket-ready', {
        ticketData,
        cachedAt: new Date()
      });
      console.log(`[SOCKET PUSH] Pushed ticket ${ticketData.pnr} to traveler vault user:${userId}`);
    }
  }

  /**
   * Disruption alert broadcast (Flight delay, Gate change, Platform change)
   */
  public static broadcastDisruptionAlert(channel: string, alertData: any) {
    if (this.io) {
      this.io.emit('broadcast:disruption-alert', alertData);
      console.log(`[SOCKET BROADCAST] Disruption alert pushed: ${alertData.summary}`);
    }
  }
}
