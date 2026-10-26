import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'TRAVELER' | 'HOTEL_HOST' | 'SUPER_ADMIN';
  phone?: string;
  avatarUrl?: string;
  bio?: string;
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
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['TRAVELER', 'HOTEL_HOST', 'SUPER_ADMIN'], default: 'TRAVELER' },
    phone: { type: String, default: '+91 98470 12345' },
    avatarUrl: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
    bio: { type: String, default: 'Global nomad & cultural explorer ✈️🌍' },
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
