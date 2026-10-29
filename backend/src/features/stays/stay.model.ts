import mongoose, { Document, Schema } from 'mongoose';

export interface IHotel extends Document {
  hostId: mongoose.Types.ObjectId;
  name: string;
  city: string;
  address: string;
  starRating: number;
  contactEmail: string;
  contactPhone: string;
  documents: {
    tradeLicenseUrl: string;
    fireSafetyNocUrl: string;
    taxCertificateGstUrl: string;
    propertyDeedUrl: string;
  };
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedByAdminId?: mongoose.Types.ObjectId;
  amenities: string[];
  bannerImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomHighlightTag {
  url: string;
  label: string;
  isApprovedBadge: boolean;
  reviewedByAdmin: boolean;
}

export interface IStayPackage {
  packageName: string;
  durationNights: number;
  includedAmenities: string[];
  packagePrice: number;
  discountPercentage: number;
}

export interface IRoom extends Document {
  hotelId: mongoose.Types.ObjectId;
  roomType: string;
  basePricePerNight: number;
  maxGuests: number;
  availableCount: number;
  totalRoomsCount: number;
  photosWithHighlights: IRoomHighlightTag[];
  packages: IStayPackage[];
  amenities: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomBooking extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
  numberOfGuests: number;
  selectedPackage?: string;
  specialRequests?: string;
  checkInStatus: 'UPCOMING' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  actualCheckInTime?: Date;
  actualCheckOutTime?: Date;
  escrowStatus: 'HELD_UNTIL_24H_POST_CHECKIN' | 'HELD_IN_ESCROW' | 'RELEASED_TO_HOST' | 'RELEASED_TO_PARTNER' | 'REFUNDED';
  hotelVoucherCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    starRating: { type: Number, default: 4 },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    documents: {
      tradeLicenseUrl: { type: String, default: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80' },
      fireSafetyNocUrl: { type: String, default: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80' },
      taxCertificateGstUrl: { type: String, default: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80' },
      propertyDeedUrl: { type: String, default: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80' }
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION'
    },
    rejectionReason: String,
    verifiedAt: Date,
    verifiedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    amenities: [{ type: String }],
    bannerImages: [{ type: String }]
  },
  { timestamps: true }
);

const RoomSchema = new Schema<IRoom>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomType: { type: String, required: true },
    basePricePerNight: { type: Number, required: true },
    maxGuests: { type: Number, default: 2 },
    availableCount: { type: Number, default: 5 },
    totalRoomsCount: { type: Number, default: 10 },
    photosWithHighlights: [
      {
        url: { type: String, required: true },
        label: { type: String, required: true },
        isApprovedBadge: { type: Boolean, default: false },
        reviewedByAdmin: { type: Boolean, default: false }
      }
    ],
    packages: [
      {
        packageName: { type: String, required: true },
        durationNights: { type: Number, required: true },
        includedAmenities: [{ type: String }],
        packagePrice: { type: Number, required: true },
        discountPercentage: { type: Number, default: 10 }
      }
    ],
    amenities: [{ type: String }],
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const RoomBookingSchema = new Schema<IRoomBooking>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number, required: true },
    numberOfGuests: { type: Number, default: 2 },
    selectedPackage: String,
    specialRequests: String,
    checkInStatus: {
      type: String,
      enum: ['UPCOMING', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
      default: 'UPCOMING'
    },
    actualCheckInTime: Date,
    actualCheckOutTime: Date,
    escrowStatus: {
      type: String,
      enum: ['HELD_UNTIL_24H_POST_CHECKIN', 'HELD_IN_ESCROW', 'RELEASED_TO_HOST', 'RELEASED_TO_PARTNER', 'REFUNDED'],
      default: 'HELD_UNTIL_24H_POST_CHECKIN'
    },
    hotelVoucherCode: { type: String, required: true }
  },
  { timestamps: true }
);

export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema);
export const Room = mongoose.model<IRoom>('Room', RoomSchema);
export const RoomBooking = mongoose.model<IRoomBooking>('RoomBooking', RoomBookingSchema);
