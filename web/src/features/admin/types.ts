export interface AdminQueueOrder {
  id: string;
  type: 'FLIGHT' | 'TRAIN';
  pnr: string;
  bookingRef: string;
  carrier: string;
  sector: string;
  departureTime: string;
  timeRemainingHours: number;
  status: 'PENDING_ISSUANCE' | 'ISSUED' | 'DISRUPTED';
}

export interface AdminAuthCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AdminUserSession {
  username: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  token: string;
  authenticatedAt: string;
}
