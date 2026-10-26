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
