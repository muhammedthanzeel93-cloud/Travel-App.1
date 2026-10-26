import { Request, Response } from 'express';
import { FlightTicket } from './flightTicket.model.js';
import { Booking } from '../booking/booking.model.js';
import { IataTicketingService } from './iataTicketing.service.js';
import { OperationsHubSocket } from '../../core/sockets/operationsHub.js';

export class FlightsController {
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

  public static async bookFlight(req: Request, res: Response): Promise<void> {
    try {
      const { userId, airline, flightSector, passengers, paymentGateway = 'RAZORPAY' } = req.body;

      if (!passengers || !passengers.length) {
        res.status(400).json({ success: false, message: 'At least one passenger is required.' });
        return;
      }

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

      const fare = IataTicketingService.constructIataFare(flightSector.baseFare || 14500, passengers.length);

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
}
