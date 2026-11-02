import mongoose, { Schema } from 'mongoose';

export type AuthChallengePurpose = 'REGISTRATION' | 'PASSWORD_RESET' | 'ADMIN_LOGIN';

export interface IAuthChallenge extends mongoose.Document {
  target: string;
  purpose: AuthChallengePurpose;
  codeHash: string;
  expiresAt: Date;
  verifiedAt?: Date;
  attempts: number;
  createdAt: Date;
}

const AuthChallengeSchema = new Schema<IAuthChallenge>({
  target: { type: String, required: true, trim: true, lowercase: true },
  purpose: { type: String, enum: ['REGISTRATION', 'PASSWORD_RESET', 'ADMIN_LOGIN'], required: true },
  codeHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, expires: 0 },
  verifiedAt: Date,
  attempts: { type: Number, default: 0, min: 0, max: 10 },
  createdAt: { type: Date, default: Date.now, expires: 3600 }
});

AuthChallengeSchema.index({ target: 1, purpose: 1 }, { unique: true });

export const AuthChallenge = mongoose.model<IAuthChallenge>('AuthChallenge', AuthChallengeSchema);
