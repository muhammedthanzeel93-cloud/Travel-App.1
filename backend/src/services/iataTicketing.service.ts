import QRCode from 'qrcode';

export interface IPassengerInput {
  title: 'MR' | 'MRS' | 'MS' | 'MASTER';
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  passportNumber: string;
  passportExpiry: string | Date;
  nationality: string;
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  seatNumber?: string;
  mealCode?: string;
}

export interface IAirlineFlightInput {
  airlineCode: string; // "EK", "AI", "IX", "FZ", "6E"
  airlineName: string;
  flightNumber: string; // "EK 562"
  originIata: string; // "CCJ"
  destinationIata: string; // "DXB"
  departureTime: Date;
  baseFarePerPax: number;
}

export class IataTicketingService {
  /**
   * Generates a 6-character alphanumeric IATA PNR (e.g., 'EK89XQ', 'A7K9LP')
   */
  public static generatePnr(airlineCode?: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
  }

  /**
   * Generates a standard 13-digit IATA Electronic Ticket Number
   * Emirates (176), Air India (098), Air India Express (176), IndiGo (312), Flydubai (141)
   */
  public static generate13DigitETicket(airlineCode: string): string {
    const airlinePrefixMap: Record<string, string> = {
      EK: '176',
      AI: '098',
      IX: '176',
      FZ: '141',
      '6E': '312',
      QR: '157'
    };

    const prefix = airlinePrefixMap[airlineCode.toUpperCase()] || '176';
    let serial = '';
    for (let i = 0; i < 10; i++) {
      serial += Math.floor(Math.random() * 10).toString();
    }
    return `${prefix}-${serial}`;
  }

  /**
   * APIS Validation: Validates passenger passport against international aviation rules
   * Rule: Passport must be valid for at least 6 months beyond departure date.
   */
  public static validateApisManifest(passenger: IPassengerInput, departureDate: Date): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!passenger.firstName || passenger.firstName.trim().length < 2) {
      errors.push(`First name is required and must match passport.`);
    }

    if (!passenger.lastName || passenger.lastName.trim().length < 2) {
      errors.push(`Last name is required and must match passport.`);
    }

    if (!passenger.passportNumber || passenger.passportNumber.trim().length < 6) {
      errors.push(`Valid passport number required.`);
    }

    const expiry = new Date(passenger.passportExpiry);
    const minExpiryDate = new Date(departureDate);
    minExpiryDate.setMonth(minExpiryDate.getMonth() + 6);

    if (expiry < minExpiryDate) {
      errors.push(
        `Passport validity must be at least 6 months from travel date (${expiry.toISOString().split('T')[0]} is less than required ${minExpiryDate.toISOString().split('T')[0]}).`
      );
    }

    const dob = new Date(passenger.dateOfBirth);
    if (isNaN(dob.getTime()) || dob >= new Date()) {
      errors.push(`Invalid Date of Birth.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * IATA Fare Construction Engine:
   * Base Fare + YQ (Fuel) + UDF (Airport) + ASF (Security) + GST + Platform Convenience Fee
   */
  public static constructIataFare(baseFare: number, paxCount: number = 1) {
    const totalBase = baseFare * paxCount;
    const fuelSurchargeYQ = Math.round(totalBase * 0.12);
    const airportFeeUdf = 850 * paxCount;
    const securityFeeAsf = 430 * paxCount;
    const taxesGst = Math.round((totalBase + fuelSurchargeYQ) * 0.05);
    const platformConvenienceFee = 350 * paxCount;
    const totalGrossAmount = totalBase + fuelSurchargeYQ + airportFeeUdf + securityFeeAsf + taxesGst + platformConvenienceFee;

    return {
      baseFare: totalBase,
      fuelSurchargeYQ,
      airportFeeUdf,
      securityFeeAsf,
      taxesGst,
      platformConvenienceFee,
      totalGrossAmount
    };
  }

  /**
   * Formats IATA 2D Bar Coded Boarding Pass (BCBP) standard payload (Resolution 792)
   */
  public static formatBcbpPayload(params: {
    passengerName: string; // DOE/JOHN
    pnr: string;
    originIata: string;
    destinationIata: string;
    airlineCode: string;
    flightNumber: string;
    julianDate: string; // 3 digits
    compartmentCode: string; // Y, J, F
    seatNumber: string; // 14A
    sequenceNumber: number; // 0042
    ticketNumber: string; // 1762894109382
  }): string {
    const cleanName = params.passengerName.toUpperCase().padEnd(20, ' ').substring(0, 20);
    const pnrPad = params.pnr.toUpperCase().padEnd(7, ' ');
    const origin = params.originIata.toUpperCase().substring(0, 3);
    const dest = params.destinationIata.toUpperCase().substring(0, 3);
    const carrier = params.airlineCode.toUpperCase().padEnd(3, ' ');
    const flightNo = params.flightNumber.replace(/\D/g, '').padStart(5, '0');
    const julian = params.julianDate.padStart(3, '0');
    const comp = params.compartmentCode || 'Y';
    const seat = params.seatNumber.padStart(4, '0');
    const seq = params.sequenceNumber.toString().padStart(4, '0');
    const tkt = params.ticketNumber.replace(/[^0-9]/g, '').padEnd(13, '0');

    // Standard IATA Bar Coded Boarding Pass (BCBP) Structure:
    // Format code: M1
    return `M1${cleanName}E${pnrPad}${origin}${dest}${carrier}${flightNo} ${julian}${comp}${seat}${seq} 147>2180WW5${julian}B${carrier} ${tkt} 0`;
  }

  /**
   * Generates a high-density 2D barcode image data URL from the BCBP payload
   */
  public static async generateBarcodeDataUrl(bcbpPayload: string): Promise<string> {
    try {
      return await QRCode.toDataURL(bcbpPayload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320
      });
    } catch (err) {
      console.error('Barcode generation failed:', err);
      return '';
    }
  }
}
