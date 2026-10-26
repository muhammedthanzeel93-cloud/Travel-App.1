export interface FlightPassenger {
  title: 'MR' | 'MRS' | 'MS' | 'MASTER';
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  seatNumber: string;
  eTicketNumber?: string;
}

export interface FlightSector {
  originIata: string;
  originAirport: string;
  destinationIata: string;
  destinationAirport: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  carrier: string;
  baseFare: number;
}
