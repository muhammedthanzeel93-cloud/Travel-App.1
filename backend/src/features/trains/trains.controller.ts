import { Request, Response } from 'express';
import { TrainTicket } from './trainTicket.model.js';
import { Booking } from '../booking/booking.model.js';
import { PrsRailTicketingService } from './prsRailTicketing.service.js';
import { OperationsHubSocket } from '../../core/sockets/operationsHub.js';

export class TrainsController {
  public static async searchTrains(req: Request, res: Response): Promise<void> {
    try {
      const { origin = 'CLT', destination = 'NZM', date = '2026-10-25' } = req.query;

      const mockTrains = [
        {
          trainNumber: '12617',
          trainName: 'Mangala Lakshadweep Superfast Express',
          originStationCode: 'CLT',
          originStationName: 'Kozhikode Main',
          destinationStationCode: 'NZM',
          destinationStationName: 'Hazrat Nizamuddin (Delhi)',
          scheduledDeparture: new Date(`${date}T13:15:00Z`),
          scheduledArrival: new Date(`2026-10-27T13:30:00Z`),
          classesAvailable: [
            { classCode: '3A', className: 'AC 3 Tier', availableSeats: 48, baseFare: 2150 },
            { classCode: '2A', className: 'AC 2 Tier', availableSeats: 14, baseFare: 3120 },
            { classCode: 'SL', className: 'Sleeper Class', availableSeats: 112, baseFare: 820 }
          ]
        },
        {
          trainNumber: '12217',
          trainName: 'Kerala Sampark Kranti Express',
          originStationCode: 'CLT',
          originStationName: 'Kozhikode Main',
          destinationStationCode: 'NZM',
          destinationStationName: 'Hazrat Nizamuddin (Delhi)',
          scheduledDeparture: new Date(`${date}T18:30:00Z`),
          scheduledArrival: new Date(`2026-10-27T14:45:00Z`),
          classesAvailable: [
            { classCode: '3A', className: 'AC 3 Tier', availableSeats: 22, baseFare: 2280 },
            { classCode: '1A', className: 'AC First Class', availableSeats: 6, baseFare: 5400 }
          ]
        }
      ];

      res.status(200).json({ success: true, count: mockTrains.length, trains: mockTrains });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async bookTrain(req: Request, res: Response): Promise<void> {
    try {
      const { userId, trainDetails, quota = 'GN', travelClass = '3A', passengers, baseFarePerPax = 2150 } = req.body;

      if (!passengers || !passengers.length) {
        res.status(400).json({ success: false, message: 'Passengers are required.' });
        return;
      }

      const fare = PrsRailTicketingService.calculateRailFare({
        baseFare: baseFarePerPax,
        travelClass,
        quota,
        paxCount: passengers.length
      });

      const allocatedPassengers = PrsRailTicketingService.allocateBerths(passengers, travelClass, 3);

      const bookingRef = `TRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const booking = await Booking.create({
        bookingReference: bookingRef,
        userId: userId || '65f123456789012345678901',
        bookingType: 'TRAIN',
        status: 'PAID',
        totalAmount: fare.totalGrossAmount,
        currency: 'INR',
        paymentDetails: {
          gateway: 'RAZORPAY',
          paidAt: new Date(),
          platformCommission: fare.platformServiceFee,
          partnerPayoutAmount: fare.totalGrossAmount - fare.platformServiceFee,
          escrowStatus: 'HELD_IN_ESCROW'
        },
        contactDetails: {
          email: passengers[0]?.email || 'traveler@example.com',
          phone: passengers[0]?.phone || '+91 98470 12345'
        }
      });

      const pnr = PrsRailTicketingService.generatePnr('421');
      const trainTicket = await TrainTicket.create({
        orderId: booking._id,
        userId: booking.userId,
        pnr,
        trainDetails,
        quota,
        travelClass,
        passengers: allocatedPassengers,
        chartingStatus: 'CHART_NOT_PREPARED',
        fareBreakdown: fare,
        ticketStatus: 'PENDING_ISSUANCE'
      });

      OperationsHubSocket.broadcastNewBookingToAdmin({
        bookingReference: booking.bookingReference,
        pnr: trainTicket.pnr,
        type: 'TRAIN',
        passengerCount: passengers.length,
        sector: `${trainDetails.originStationCode} -> ${trainDetails.destinationStationCode}`,
        totalAmount: fare.totalGrossAmount
      });

      res.status(201).json({
        success: true,
        message: 'Train booked! 10-digit PNR generated and queued for admin issuance.',
        pnr: trainTicket.pnr,
        ticketId: trainTicket._id
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
