import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingReference: string; // e.g. TRV-2026-98124
  userId: mongoose.Types.ObjectId;
  bookingType: 'FLIGHT' | 'TRAIN' | 'ROOM_STAY';
  status: 'PENDING_PAYMENT' | 'PAID' | 'QUEUED_ISSUANCE' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  totalAmount: number;
  currency: string;
  paymentDetails: {
    gateway: 'RAZORPAY' | 'STRIPE';
    paymentId?: string;
    orderId?: string;
    signature?: string;
    paidAt?: Date;
    platformCommission: number;
    partnerPayoutAmount: number;
    escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED_TO_PARTNER' | 'REFUNDED_TO_USER';
  };
  contactDetails: {
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingReference: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingType: { type: String, enum: ['FLIGHT', 'TRAIN', 'ROOM_STAY'], required: true },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAID', 'QUEUED_ISSUANCE', 'CONFIRMED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING_PAYMENT'
    },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentDetails: {
      gateway: { type: String, enum: ['RAZORPAY', 'STRIPE'], default: 'RAZORPAY' },
      paymentId: String,
      orderId: String,
      signature: String,
      paidAt: Date,
      platformCommission: { type: Number, default: 0 },
      partnerPayoutAmount: { type: Number, default: 0 },
      escrowStatus: {
        type: String,
        enum: ['HELD_IN_ESCROW', 'RELEASED_TO_PARTNER', 'REFUNDED_TO_USER'],
        default: 'HELD_IN_ESCROW'
      }
    },
    contactDetails: {
      email: { type: String, required: true },
      phone: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
