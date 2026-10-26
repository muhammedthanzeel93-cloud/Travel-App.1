import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainPassenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bookingStatus: string;
  currentStatus: string;
  coach: string;
  berthNumber: number;
  berthType: 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'WS';
  foodChoice?: 'VEG' | 'NON_VEG' | 'NO_FOOD';
}

export interface ITrainTicket extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  pnr: string;
  trainDetails: {
    trainNumber: string;
    trainName: string;
    originStationCode: string;
    originStationName: string;
    destinationStationCode: string;
    destinationStationName: string;
    scheduledDeparture: Date;
    scheduledArrival: Date;
    durationHours: number;
    platformNumber?: string;
  };
  quota: 'GN' | 'TQ' | 'PT' | 'LD' | 'SS' | 'HP';
  travelClass: '1A' | '2A' | '3A' | '3E' | 'CC' | 'EC' | 'SL' | '2S';
  passengers: ITrainPassenger[];
  chartingStatus: 'CHART_NOT_PREPARED' | 'CHART_1_PREPARED' | 'CHART_2_PREPARED';
  fareBreakdown: {
    railBaseFare: number;
    reservationFee: number;
    superfastCharge: number;
    tatkalCharge: number;
    gst: number;
    platformServiceFee: number;
    totalGrossAmount: number;
  };
  ticketStatus: 'PENDING_ISSUANCE' | 'CONFIRMED' | 'RAC' | 'WAITLISTED' | 'CANCELLED' | 'TDR_FILED' | 'REFUNDED';
  tdrDetails?: {
    reason: string;
    filingTimestamp: Date;
    refundAmount: number;
    clerkageDeduction: number;
    status: 'FILED' | 'APPROVED' | 'REJECTED';
  };
  liveRunningStatus?: {
    currentStation: string;
    delayMinutes: number;
    lastUpdated: Date;
  };
  ersPdfUrl?: string;
  qrCodeDataUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrainTicketSchema = new Schema<ITrainTicket>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pnr: { type: String, required: true, unique: true, index: true },
    trainDetails: {
      trainNumber: { type: String, required: true },
      trainName: { type: String, required: true },
      originStationCode: { type: String, required: true },
      originStationName: { type: String, required: true },
      destinationStationCode: { type: String, required: true },
      destinationStationName: { type: String, required: true },
      scheduledDeparture: { type: Date, required: true },
      scheduledArrival: { type: Date, required: true },
      durationHours: { type: Number, default: 28 },
      platformNumber: { type: String, default: 'Platform 3' }
    },
    quota: {
      type: String,
      enum: ['GN', 'TQ', 'PT', 'LD', 'SS', 'HP'],
      default: 'GN'
    },
    travelClass: {
      type: String,
      enum: ['1A', '2A', '3A', '3E', 'CC', 'EC', 'SL', '2S'],
      default: '3A'
    },
    passengers: [
      {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
        bookingStatus: { type: String, default: 'CNF' },
        currentStatus: { type: String, default: 'CNF' },
        coach: { type: String, default: 'B3' },
        berthNumber: { type: Number, default: 42 },
        berthType: { type: String, enum: ['LB', 'MB', 'UB', 'SL', 'SU', 'WS'], default: 'MB' },
        foodChoice: { type: String, enum: ['VEG', 'NON_VEG', 'NO_FOOD'], default: 'VEG' }
      }
    ],
    chartingStatus: {
      type: String,
      enum: ['CHART_NOT_PREPARED', 'CHART_1_PREPARED', 'CHART_2_PREPARED'],
      default: 'CHART_NOT_PREPARED'
    },
    fareBreakdown: {
      railBaseFare: { type: Number, required: true },
      reservationFee: { type: Number, default: 40 },
      superfastCharge: { type: Number, default: 45 },
      tatkalCharge: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      platformServiceFee: { type: Number, default: 40 },
      totalGrossAmount: { type: Number, required: true }
    },
    ticketStatus: {
      type: String,
      enum: ['PENDING_ISSUANCE', 'CONFIRMED', 'RAC', 'WAITLISTED', 'CANCELLED', 'TDR_FILED', 'REFUNDED'],
      default: 'PENDING_ISSUANCE'
    },
    tdrDetails: {
      reason: String,
      filingTimestamp: Date,
      refundAmount: Number,
      clerkageDeduction: Number,
      status: { type: String, enum: ['FILED', 'APPROVED', 'REJECTED'] }
    },
    liveRunningStatus: {
      currentStation: String,
      delayMinutes: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    ersPdfUrl: String,
    qrCodeDataUrl: String
  },
  { timestamps: true }
);

export const TrainTicket = mongoose.model<ITrainTicket>('TrainTicket', TrainTicketSchema);
