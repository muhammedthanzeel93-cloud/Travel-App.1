export interface CachedOfflinePass {
  pnr: string;
  type: 'FLIGHT' | 'TRAIN';
  carrier: string;
  sector: string;
  passenger: string;
  seat: string;
  ticketNumber?: string;
  departureTime: string;
  cachedAt: string;
  status: string;
}
