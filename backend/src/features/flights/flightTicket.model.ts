import mongoose, { Document, Schema } from 'mongoose';

export interface IFlightPassenger {
  title: 'MR' | 'MRS' | 'MS' | 'MASTER';
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  passportNumber: string;
  passportExpiry: Date;
  nationality: string;
  seatNumber: string; // e.g. "14A"
  cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  baggageAllowanceKg: number;
  mealCode?: string;
  eTicketNumber: string; // 13-digit IATA (e.g. 176-2894109382)
  boardingSequence: number;
}

export interface IFlightTicket extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  pnr: string; // 6-character alphanumeric (e.g. EK89XQ)
  ticketNumber: string; // Primary 13-digit IATA
  airline: {
    code: string; // EK, AI, IX, FZ, 6E
    name: string;
    flightNumber: string;
    aircraftType: string;
  };
  flightSector: {
    originIata: string; // CCJ
    originAirport: string; // Calicut International Airport
    destinationIata: string; // DXB
    destinationAirport: string; // Dubai International Airport
    departureTerminal: string;
    arrivalTerminal: string;
    gate?: string;
    departureTime: Date;
    arrivalTime: Date;
    durationMinutes: number;
  };
  passengers: IFlightPassenger[];
  fareBreakdown: {
    baseFare: number;
    fuelSurchargeYQ: number;
    airportFeeUdf: number;
    securityFeeAsf: number;
    taxesGst: number;
    platformConvenienceFee: number;
    totalGrossAmount: number;
  };
  status: 'PENDING_ISSUANCE' | 'ISSUED' | 'CHECKED_IN' | 'BOARDED' | 'FLOWN' | 'CANCELLED' | 'REFUNDED';
  disruptionAlert?: {
    isDelayed: boolean;
    delayMinutes: number;
    newDepartureTime?: Date;
    gateChange?: string;
    reason?: string;
    broadcastedAt?: Date;
  };
  bcbpBarcodeData: string; // IATA standard 2D Bar Coded Boarding Pass string
  bcbpQrCodeDataUrl?: string; // Rendered QR/2D image for offline storage
  eTicketPdfUrl?: string;
  issuedByAdminId?: mongoose.Types.ObjectId;
  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlightTicketSchema = new Schema<IFlightTicket>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pnr: { type: String, required: true, uppercase: true, index: true },
    ticketNumber: { type: String, required: true, unique: true },
    airline: {
      code: { type: String, required: true },
      name: { type: String, required: true },
      flightNumber: { type: String, required: true },
      aircraftType: { type: String, default: 'Boeing 777-300ER' }
    },
    flightSector: {
      originIata: { type: String, required: true },
      originAirport: { type: String, required: true },
      destinationIata: { type: String, required: true },
      destinationAirport: { type: String, required: true },
      departureTerminal: { type: String, default: 'Terminal 1' },
      arrivalTerminal: { type: String, default: 'Terminal 3' },
      gate: { type: String, default: 'B12' },
      departureTime: { type: Date, required: true },
      arrivalTime: { type: Date, required: true },
      durationMinutes: { type: Number, required: true }
    },
    passengers: [
      {
        title: { type: String, enum: ['MR', 'MRS', 'MS', 'MASTER'], default: 'MR' },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
        passportNumber: { type: String, required: true },
        passportExpiry: { type: Date, required: true },
        nationality: { type: String, default: 'IND' },
        seatNumber: { type: String, default: '14A' },
        cabinClass: {
          type: String,
          enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
          default: 'ECONOMY'
        },
        baggageAllowanceKg: { type: Number, default: 30 },
        mealCode: { type: String, default: 'AVML' },
        eTicketNumber: { type: String, required: true },
        boardingSequence: { type: Number, default: 42 }
      }
    ],
    fareBreakdown: {
      baseFare: { type: Number, required: true },
      fuelSurchargeYQ: { type: Number, default: 0 },
      airportFeeUdf: { type: Number, default: 0 },
      securityFeeAsf: { type: Number, default: 0 },
      taxesGst: { type: Number, default: 0 },
      platformConvenienceFee: { type: Number, default: 350 },
      totalGrossAmount: { type: Number, required: true }
    },
    status: {
      type: String,
      enum: ['PENDING_ISSUANCE', 'ISSUED', 'CHECKED_IN', 'BOARDED', 'FLOWN', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING_ISSUANCE'
    },
    disruptionAlert: {
      isDelayed: { type: Boolean, default: false },
      delayMinutes: { type: Number, default: 0 },
      newDepartureTime: Date,
      gateChange: String,
      reason: String,
      broadcastedAt: Date
    },
    bcbpBarcodeData: { type: String, required: true },
    bcbpQrCodeDataUrl: String,
    eTicketPdfUrl: String,
    issuedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedAt: Date
  },
  { timestamps: true }
);

export const FlightTicket = mongoose.model<IFlightTicket>('FlightTicket', FlightTicketSchema);
