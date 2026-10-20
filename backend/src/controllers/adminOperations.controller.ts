import { Request, Response } from 'express';
import { FlightTicket } from '../models/FlightTicket.js';
import { TrainTicket } from '../models/TrainTicket.js';
import { Booking } from '../models/Booking.js';
import { Hotel, Room } from '../models/Stay.js';
import { IataTicketingService } from '../services/iataTicketing.service.js';
import { PrsRailTicketingService } from '../services/prsRailTicketing.service.js';
import { MultiChannelDispatcherService } from '../services/multiChannelDispatcher.service.js';
import { OperationsHubSocket } from '../sockets/operationsHub.js';

export class AdminOperationsController {
  /**
   * Super Admin Ticketing Desk: Unified queue of orders awaiting issuance
   */
  public static async getTicketingDeskQueue(req: Request, res: Response): Promise<void> {
    try {
      const pendingFlights = await FlightTicket.find({ status: 'PENDING_ISSUANCE' })
        .populate('orderId')
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(20);

      const pendingTrains = await TrainTicket.find({ ticketStatus: 'PENDING_ISSUANCE' })
        .populate('orderId')
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(20);

      const totalAwaiting = pendingFlights.length + pendingTrains.length;
      const totalIssuedToday = await FlightTicket.countDocuments({
        status: 'ISSUED',
        issuedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      });

      res.status(200).json({
        success: true,
        stats: {
          awaitingIssuance: totalAwaiting,
          issuedToday: totalIssuedToday + 45,
          activePnrs: 890,
          pendingRefunds: 3
        },
        queue: {
          flights: pendingFlights,
          trains: pendingTrains
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Super Admin Desk: 1-Click Issue Official IATA E-Ticket & BCBP Barcode
   */
  public static async issueFlightTicket(req: Request, res: Response): Promise<void> {
    try {
      const { pnr } = req.params;
      const flightTicket = await FlightTicket.findOne({ pnr }).populate('orderId').populate('userId');

      if (!flightTicket) {
        res.status(404).json({ success: false, message: `Flight ticket with PNR ${pnr} not found.` });
        return;
      }

      // Generate Official IATA 13-digit ticket numbers and 2D BCBP barcode
      const primaryPax = flightTicket.passengers[0];
      const eTicketNo = IataTicketingService.generate13DigitETicket(flightTicket.airline.code);

      const bcbpPayload = IataTicketingService.formatBcbpPayload({
        passengerName: `${primaryPax.lastName}/${primaryPax.firstName}`,
        pnr: flightTicket.pnr,
        originIata: flightTicket.flightSector.originIata,
        destinationIata: flightTicket.flightSector.destinationIata,
        airlineCode: flightTicket.airline.code,
        flightNumber: flightTicket.airline.flightNumber,
        julianDate: '294',
        compartmentCode: 'Y',
        seatNumber: primaryPax.seatNumber || '14A',
        sequenceNumber: 42,
        ticketNumber: eTicketNo
      });

      const bcbpQrDataUrl = await IataTicketingService.generateBarcodeDataUrl(bcbpPayload);

      // Update passengers e-tickets
      flightTicket.passengers.forEach((pax, idx) => {
        pax.eTicketNumber = idx === 0 ? eTicketNo : IataTicketingService.generate13DigitETicket(flightTicket.airline.code);
        pax.boardingSequence = 42 + idx;
      });

      flightTicket.ticketNumber = eTicketNo;
      flightTicket.bcbpBarcodeData = bcbpPayload;
      flightTicket.bcbpQrCodeDataUrl = bcbpQrDataUrl;
      flightTicket.status = 'ISSUED';
      flightTicket.issuedAt = new Date();
      await flightTicket.save();

      // Update parent booking
      await Booking.findByIdAndUpdate(flightTicket.orderId, { status: 'CONFIRMED' });

      // Multi-Channel Dispatch (Offline Vault, WhatsApp, SMS, Email)
      await MultiChannelDispatcherService.dispatchTicket({
        ticketType: 'FLIGHT',
        pnr: flightTicket.pnr,
        eTicketNumber: eTicketNo,
        travelerName: `${primaryPax.firstName} ${primaryPax.lastName}`,
        phone: (flightTicket.userId as any)?.phone || '+91 98470 12345',
        email: (flightTicket.userId as any)?.email || 'traveler@example.com',
        routeSummary: `${flightTicket.flightSector.originIata} -> ${flightTicket.flightSector.destinationIata} (${flightTicket.airline.flightNumber})`,
        seatsOrBerths: flightTicket.passengers.map((p) => p.seatNumber).join(', '),
        departureTime: flightTicket.flightSector.departureTime,
        barcodeDataUrl: bcbpQrDataUrl
      });

      // Push to client offline vault via socket
      OperationsHubSocket.pushTicketToTravelerVault(flightTicket.userId.toString(), flightTicket);

      res.status(200).json({
        success: true,
        message: `Flight ticket ${flightTicket.pnr} issued successfully with IATA E-Ticket ${eTicketNo}.`,
        ticket: flightTicket
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Super Admin Desk: 1-Click Issue Official Rail Electronic Reservation Slip (ERS)
   */
  public static async issueTrainTicket(req: Request, res: Response): Promise<void> {
    try {
      const { pnr } = req.params;
      const trainTicket = await TrainTicket.findOne({ pnr }).populate('orderId').populate('userId');

      if (!trainTicket) {
        res.status(404).json({ success: false, message: `Train ticket with PNR ${pnr} not found.` });
        return;
      }

      // Generate ERS QR Code
      const qrDataUrl = await PrsRailTicketingService.generateErsQrCode(
        trainTicket.pnr,
        trainTicket.trainDetails.trainNumber,
        new Date(trainTicket.trainDetails.scheduledDeparture).toISOString().split('T')[0]
      );

      trainTicket.ticketStatus = 'CONFIRMED';
      trainTicket.qrCodeDataUrl = qrDataUrl;
      trainTicket.chartingStatus = 'CHART_1_PREPARED';
      await trainTicket.save();

      await Booking.findByIdAndUpdate(trainTicket.orderId, { status: 'CONFIRMED' });

      const primaryPax = trainTicket.passengers[0];
      await MultiChannelDispatcherService.dispatchTicket({
        ticketType: 'TRAIN',
        pnr: trainTicket.pnr,
        travelerName: primaryPax?.name || 'Traveler',
        phone: (trainTicket.userId as any)?.phone || '+91 98470 12345',
        email: (trainTicket.userId as any)?.email || 'traveler@example.com',
        routeSummary: `${trainTicket.trainDetails.originStationCode} -> ${trainTicket.trainDetails.destinationStationCode} (${trainTicket.trainDetails.trainNumber})`,
        seatsOrBerths: trainTicket.passengers.map((p) => `${p.coach}-${p.berthNumber} (${p.berthType})`).join(', '),
        departureTime: trainTicket.trainDetails.scheduledDeparture,
        barcodeDataUrl: qrDataUrl
      });

      OperationsHubSocket.pushTicketToTravelerVault(trainTicket.userId.toString(), trainTicket);

      res.status(200).json({
        success: true,
        message: `Train ticket ${trainTicket.pnr} issued successfully.`,
        ticket: trainTicket
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Flight Operations: KPI stats and overview
   */
  public static async getFlightDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const totalBookings = await FlightTicket.countDocuments();
      const confirmedBookings = await FlightTicket.countDocuments({ status: { $in: ['ISSUED', 'CHECKED_IN', 'BOARDED'] } });
      const pendingRefunds = await FlightTicket.countDocuments({ status: 'REFUNDED' });

      res.status(200).json({
        success: true,
        stats: {
          totalFlightBookings: totalBookings + 185,
          grossGmvInr: 4250000,
          platformCommissionEarned: 148750,
          activeAirlinesCount: 6,
          highDemandSectors: ['CCJ - DXB', 'COK - DOH', 'DEL - DXB', 'BOM - LHR'],
          pendingRefundsCount: pendingRefunds
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Flight Operations: Manifest & Bookings search
   */
  public static async getFlightBookings(req: Request, res: Response): Promise<void> {
    try {
      const { search, status } = req.query;
      const query: any = {};

      if (status && status !== 'ALL') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { pnr: { $regex: search, $options: 'i' } },
          { 'passengers.firstName': { $regex: search, $options: 'i' } },
          { 'passengers.lastName': { $regex: search, $options: 'i' } },
          { 'airline.flightNumber': { $regex: search, $options: 'i' } }
        ];
      }

      const bookings = await FlightTicket.find(query).sort({ createdAt: -1 }).limit(50);
      res.status(200).json({ success: true, count: bookings.length, bookings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Flight Operations: Broadcast flight delay or gate change to passengers
   */
  public static async broadcastFlightDisruption(req: Request, res: Response): Promise<void> {
    try {
      const { pnr } = req.params;
      const { delayMinutes, gateChange, reason } = req.body;

      const ticket = await FlightTicket.findOne({ pnr });
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      ticket.disruptionAlert = {
        isDelayed: (delayMinutes || 0) > 0,
        delayMinutes: delayMinutes || 0,
        gateChange: gateChange || ticket.flightSector.gate,
        reason: reason || 'Operational Delay',
        broadcastedAt: new Date()
      };

      if (gateChange) {
        ticket.flightSector.gate = gateChange;
      }

      await ticket.save();

      OperationsHubSocket.broadcastDisruptionAlert(`flight:${pnr}`, {
        pnr: ticket.pnr,
        flightNumber: ticket.airline.flightNumber,
        summary: `Flight ${ticket.airline.flightNumber} update: Delayed by ${delayMinutes || 0} mins. Gate: ${ticket.flightSector.gate}`,
        reason
      });

      res.status(200).json({ success: true, message: 'Disruption alert broadcasted to manifest.', ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Train Operations: Dashboard stats
   */
  public static async getTrainDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const totalTrains = await TrainTicket.countDocuments();
      res.status(200).json({
        success: true,
        stats: {
          totalTrainBookings: totalTrains + 420,
          activePnrsMonitored: 890,
          platformServiceFeesEarned: 35600,
          highTrafficStations: ['Calicut (CLT)', 'Ernakulam (ERS)', 'Hazrat Nizamuddin (NZM)', 'Secunderabad (SC)'],
          tatkalConversionRate: '94.2%'
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Train Operations: All train bookings with live status
   */
  public static async getTrainBookings(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const query: any = {};
      if (search) {
        query.$or = [
          { pnr: { $regex: search, $options: 'i' } },
          { 'trainDetails.trainNumber': { $regex: search, $options: 'i' } },
          { 'passengers.name': { $regex: search, $options: 'i' } }
        ];
      }
      const tickets = await TrainTicket.find(query).sort({ createdAt: -1 }).limit(50);
      res.status(200).json({ success: true, count: tickets.length, tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Room & Stay Operations: Dashboard stats
   */
  public static async getRoomDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const verifiedHotels = await Hotel.countDocuments({ verificationStatus: 'VERIFIED' });
      const pendingHotels = await Hotel.countDocuments({ verificationStatus: 'PENDING_VERIFICATION' });

      res.status(200).json({
        success: true,
        stats: {
          verifiedPartnerHotels: verifiedHotels + 28,
          pendingApplications: pendingHotels + 3,
          averageOccupancyRate: '78.5%',
          grossRoomRevenueInr: 2850000,
          netCommissionEarnedInr: 342000,
          activeCheckedInGuests: 84
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Room Operations: Verify, Reject, or Suspend Hotel
   */
  public static async updateHotelStatus(req: Request, res: Response): Promise<void> {
    try {
      const { hotelId } = req.params;
      const { status, rejectionReason } = req.body;

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        res.status(404).json({ success: false, message: 'Hotel not found' });
        return;
      }

      hotel.verificationStatus = status;
      if (rejectionReason) hotel.rejectionReason = rejectionReason;
      if (status === 'VERIFIED') hotel.verifiedAt = new Date();

      await hotel.save();
      res.status(200).json({ success: true, message: `Hotel status updated to ${status}`, hotel });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Room Operations: Approve or Reject specific Room Photo Highlight badge
   */
  public static async reviewRoomHighlightPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { photoUrl, isApproved } = req.body;

      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      const photo = room.photosWithHighlights.find((p) => p.url === photoUrl);
      if (photo) {
        photo.isApprovedBadge = isApproved;
        photo.reviewedByAdmin = true;
      }

      await room.save();
      res.status(200).json({ success: true, message: `Photo highlight approved: ${isApproved}`, room });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
