import { Server as SocketIOServer, Socket } from 'socket.io';

export class OperationsHubSocket {
  private static io: SocketIOServer | null = null;

  public static initialize(io: SocketIOServer) {
    this.io = io;

    io.on('connection', (socket: Socket) => {
      console.log(`[SOCKET CONNECTED] Client ID: ${socket.id}`);

      // Join role-specific rooms
      socket.on('join:admin-desk', () => {
        socket.join('admin-operations');
        console.log(`[SOCKET] ${socket.id} joined admin-operations room`);
      });

      socket.on('join:user-vault', (userId: string) => {
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
