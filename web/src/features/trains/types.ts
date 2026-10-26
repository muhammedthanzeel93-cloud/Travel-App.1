export interface TrainPassenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  berthPreference?: string;
  coach?: string;
  berthNumber?: number;
}

export interface TrainDetails {
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  departure: string;
  travelClass: '1A' | '2A' | '3A' | 'SL' | 'CC';
  quota: 'GN' | 'TQ' | 'LD' | 'SS';
}
