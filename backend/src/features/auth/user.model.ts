import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'USER' | 'TRAVELER' | 'TRAVEL_AGENCY' | 'HOTEL_HOST' | 'ADMIN' | 'SUPER_ADMIN';

export interface IUser extends Document {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: 'ACTIVE' | 'BLOCKED';
  avatarUrl?: string;
  bio?: string;
  agencyDetails?: {
    agencyName: string;
    licenseNumber: string;
    iataCode?: string;
    isVerified: boolean;
    verificationDate?: Date;
  };
  travelerPassport?: {
    passportNumber: string;
    issuingCountry: string;
    expiryDate: Date;
    nationality: string;
    dateOfBirth: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
  };
  followersCount: number;
  followingCount: number;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    name: {
      type: String,
      default: function (this: any) {
        return this.username || 'Travel Explorer';
      },
      trim: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['USER', 'TRAVELER', 'TRAVEL_AGENCY', 'HOTEL_HOST', 'ADMIN', 'SUPER_ADMIN'], 
      default: 'USER' 
    },
    status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    bio: { type: String, default: 'Global nomad & cultural explorer ✈️🌍' },
    agencyDetails: {
      agencyName: { type: String },
      licenseNumber: { type: String },
      iataCode: { type: String },
      isVerified: { type: Boolean, default: false },
      verificationDate: { type: Date }
    },
    travelerPassport: {
      passportNumber: { type: String },
      issuingCountry: { type: String },
      expiryDate: { type: Date },
      nationality: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] }
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
