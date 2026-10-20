import { Request, Response } from 'express';
import { FlightTicket } from '../models/FlightTicket.js';
import { TrainTicket } from '../models/TrainTicket.js';
import { Booking } from '../models/Booking.js';
import { IataTicketingService } from '../services/iataTicketing.service.js';
import { PrsRailTicketingService } from '../services/prsRailTicketing.service.js';
import { OperationsHubSocket } from '../sockets/operationsHub.js';

export class TicketingController {
  /**
   * Search Flights: Returns available scheduled flights with real-time fares
   */
  public static async searchFlights(req: Request, res: Response): Promise<void> {
    try {
      const { origin = 'CCJ', destination = 'DXB', date = '2026-10-25' } = req.query;

      const mockFlights = [
        {
          airline: { code: 'EK', name: 'Emirates', flightNumber: 'EK 562', aircraftType: 'Boeing 777-300ER' },
          flightSector: {
            originIata: String(origin).toUpperCase(),
            originAirport: 'Calicut International Airport (Karipur)',
            destinationIata: String(destination).toUpperCase(),
            destinationAirport: 'Dubai International Airport',
            departureTerminal: 'Terminal 1',
            arrivalTerminal: 'Terminal 3',
            gate: 'B12',
            departureTime: new Date(`${date}T04:30:00Z`),
            arrivalTime: new Date(`${date}T07:10:00Z`),
            durationMinutes: 250
          },
          baseFare: 14500,
          cabinClasses: ['ECONOMY', 'BUSINESS']
        },
        {
          airline: { code: 'IX', name: 'Air India Express', flightNumber: 'IX 345', aircraftType: 'Boeing 737-800' },
          flightSector: {
            originIata: String(origin).toUpperCase(),
            originAirport: 'Calicut International Airport (Karipur)',
            destinationIata: String(destination).toUpperCase(),
            destinationAirport: 'Dubai International Airport',
            departureTerminal: 'Terminal 1',
            arrivalTerminal: 'Terminal 2',
            gate: 'A04',
            departureTime: new Date(`${date}T10:15:00Z`),
            arrivalTime: new Date(`${date}T13:00:00Z`),
            durationMinutes: 255
          },
          baseFare: 11200,
          cabinClasses: ['ECONOMY']
        },
        {
          airline: { code: 'FZ', name: 'Flydubai', flightNumber: 'FZ 442', aircraftType: 'Boeing 737 MAX 8' },
          flightSector: {
            originIata: String(origin).toUpperCase(),
            originAirport: 'Calicut International Airport (Karipur)',
            destinationIata: String(destination).toUpperCase(),
            destinationAirport: 'Dubai International Airport',
            departureTerminal: 'Terminal 1',
            arrivalTerminal: 'Terminal 2',
            gate: 'C19',
            departureTime: new Date(`${date}T22:45:00Z`),
            arrivalTime: new Date(`${date}T01:30:00Z`),
            durationMinutes: 255
          },
          baseFare: 12800,
          cabinClasses: ['ECONOMY', 'BUSINESS']
        }
      ];

      res.status(200).json({ success: true, count: mockFlights.length, flights: mockFlights });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Book Flight: Validates APIS manifest & creates order queued for issuance
   */
  public static async bookFlight(req: Request, res: Response): Promise<void> {
    try {
      const { userId, airline, flightSector, passengers, paymentGateway = 'RAZORPAY' } = req.body;

      if (!passengers || !passengers.length) {
        res.status(400).json({ success: false, message: 'At least one passenger is required.' });
        return;
      }

      // 1. APIS Passport Validation for all passengers
      const departureDate = new Date(flightSector.departureTime);
      for (const pax of passengers) {
        const validation = IataTicketingService.validateApisManifest(pax, departureDate);
        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            message: `APIS Validation Failed for ${pax.firstName} ${pax.lastName}: ${validation.errors.join('; ')}`
          });
          return;
        }
      }

      // 2. IATA Fare Construction
      const fare = IataTicketingService.constructIataFare(flightSector.baseFare || 14500, passengers.length);

      // 3. Create Master Booking
      const bookingRef = `TRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const booking = await Booking.create({
        bookingReference: bookingRef,
        userId: userId || '65f123456789012345678901',
        bookingType: 'FLIGHT',
        status: 'PAID',
        totalAmount: fare.totalGrossAmount,
        currency: 'INR',
        paymentDetails: {
          gateway: paymentGateway,
          paymentId: `pay_${Math.random().toString(36).substring(7)}`,
          paidAt: new Date(),
          platformCommission: fare.platformConvenienceFee,
          partnerPayoutAmount: fare.totalGrossAmount - fare.platformConvenienceFee,
          escrowStatus: 'HELD_IN_ESCROW'
        },
        contactDetails: {
          email: passengers[0]?.email || 'traveler@example.com',
          phone: passengers[0]?.phone || '+91 98470 12345'
        }
      });

      // 4. Generate 6-char PNR and create FlightTicket in PENDING_ISSUANCE state
      const pnr = IataTicketingService.generatePnr(airline.code);
      const tempTicketNo = IataTicketingService.generate13DigitETicket(airline.code);

      const flightTicket = await FlightTicket.create({
        orderId: booking._id,
        userId: booking.userId,
        pnr,
        ticketNumber: tempTicketNo,
        airline,
        flightSector,
        passengers: passengers.map((pax: any, idx: number) => ({
          ...pax,
          seatNumber: pax.seatNumber || `14${String.fromCharCode(65 + idx)}`,
          eTicketNumber: tempTicketNo,
          boardingSequence: 40 + idx
        })),
        fareBreakdown: fare,
        status: 'PENDING_ISSUANCE',
        bcbpBarcodeData: `PENDING_ISSUANCE_${pnr}`
      });

      // 5. Broadcast to Super Admin Ticketing Desk in real-time
      OperationsHubSocket.broadcastNewBookingToAdmin({
        bookingReference: booking.bookingReference,
        pnr: flightTicket.pnr,
        type: 'FLIGHT',
        passengerCount: passengers.length,
        sector: `${flightSector.originIata} -> ${flightSector.destinationIata}`,
        totalAmount: fare.totalGrossAmount
      });

      res.status(201).json({
        success: true,
        message: 'Flight booked! Queued at Super Admin Ticketing Desk for official issuance.',
        pnr: flightTicket.pnr,
        ticketId: flightTicket._id,
        bookingReference: booking.bookingReference
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Search Trains: Available trains and classes
   */
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

  /**
   * Book Train: Generates 10-digit rail PNR, allocates berths, and queues order
   */
  public static async bookTrain(req: Request, res: Response): Promise<void> {
    try {
      const { userId, trainDetails, quota = 'GN', travelClass = '3A', passengers, baseFarePerPax = 2150 } = req.body;

      if (!passengers || !passengers.length) {
        res.status(400).json({ success: false, message: 'Passengers are required.' });
        return;
      }

      // 1. Calculate PRS Fare with Tatkal and reservation fee
      const fare = PrsRailTicketingService.calculateRailFare({
        baseFare: baseFarePerPax,
        travelClass,
        quota,
        paxCount: passengers.length
      });

      // 2. Allocate coach & berth preserving family continuity
      const allocatedPassengers = PrsRailTicketingService.allocateBerths(passengers, travelClass, 3);

      // 3. Create Master Booking
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

      // 4. Generate 10-digit PRS PNR
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

  /**
   * 4-Hour Offline Vault Feed:
   * Returns all active flight boarding passes and train ERS slips formatted for offline cache
   */
  public static async getOfflineVaultPasses(req: Request, res: Response): Promise<void> {
    try {
      const { userId = '65f123456789012345678901' } = req.query;

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
