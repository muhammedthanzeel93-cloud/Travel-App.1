import { Request, Response } from 'express';
import { FlightTicket } from '../flights/flightTicket.model.js';
import { TrainTicket } from '../trains/trainTicket.model.js';

export class VaultController {
  public static async getOfflineVaultPasses(req: Request, res: Response): Promise<void> {
    try {
      const flightTickets = await FlightTicket.find({
        status: { $in: ['ISSUED', 'CHECKED_IN', 'BOARDED'] }
      }).sort({ createdAt: -1 });

      const trainTickets = await TrainTicket.find({
        ticketStatus: { $in: ['CONFIRMED', 'RAC'] }
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        vaultExpiryHours: 4,
        cachedAt: new Date(),
        passes: {
          flights: flightTickets,
          trains: trainTickets
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
