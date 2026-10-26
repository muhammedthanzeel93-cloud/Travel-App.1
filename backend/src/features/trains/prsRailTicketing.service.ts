import QRCode from 'qrcode';

export interface IRailPassengerInput {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  berthPreference?: 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'WS';
  foodChoice?: 'VEG' | 'NON_VEG' | 'NO_FOOD';
}

export class PrsRailTicketingService {
  /**
   * Generates a standard 10-digit Indian Railway PRS PNR
   */
  public static generatePnr(zoneCode: string = '421'): string {
    let serial = '';
    for (let i = 0; i < 7; i++) {
      serial += Math.floor(Math.random() * 10).toString();
    }
    return `${zoneCode}${serial}`;
  }

  /**
   * Calculates Railway Fare including Tatkal Surcharges & Superfast fees
   */
  public static calculateRailFare(params: {
    baseFare: number;
    travelClass: string;
    quota: string;
    paxCount: number;
  }) {
    const { baseFare, travelClass, quota, paxCount } = params;
    const totalBase = baseFare * paxCount;
    const reservationFee = 40 * paxCount;
    const superfastCharge = 45 * paxCount;

    let tatkalCharge = 0;
    if (quota === 'TQ' || quota === 'PT') {
      if (['1A', 'EC'].includes(travelClass)) {
        tatkalCharge = Math.min(Math.max(totalBase * 0.3, 400 * paxCount), 500 * paxCount);
      } else if (['2A', '3A', '3E', 'CC'].includes(travelClass)) {
        tatkalCharge = Math.min(Math.max(totalBase * 0.3, 300 * paxCount), 400 * paxCount);
      } else {
        tatkalCharge = Math.min(Math.max(totalBase * 0.1, 100 * paxCount), 200 * paxCount);
      }
    }

    const gst = ['1A', '2A', '3A', '3E', 'CC', 'EC'].includes(travelClass)
      ? Math.round((totalBase + tatkalCharge) * 0.05)
      : 0;

    const platformServiceFee = 40 * paxCount;
    const totalGrossAmount = totalBase + reservationFee + superfastCharge + tatkalCharge + gst + platformServiceFee;

    return {
      railBaseFare: totalBase,
      reservationFee,
      superfastCharge,
      tatkalCharge: Math.round(tatkalCharge),
      gst,
      platformServiceFee,
      totalGrossAmount
    };
  }

  /**
   * PRS Berth Allocation Engine
   */
  public static allocateBerths(
    passengers: IRailPassengerInput[],
    travelClass: string,
    coachIndex: number = 3
  ) {
    const coachPrefixMap: Record<string, string> = {
      '1A': 'H',
      '2A': 'A',
      '3A': 'B',
      '3E': 'M',
      CC: 'C',
      EC: 'E',
      SL: 'S',
      '2S': 'D'
    };

    const prefix = coachPrefixMap[travelClass] || 'B';
    const coachName = `${prefix}${coachIndex}`;

    const berthCycle: ('LB' | 'MB' | 'UB' | 'LB' | 'MB' | 'UB' | 'SL' | 'SU')[] = [
      'LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'
    ];

    let startBerth = 33;

    return passengers.map((pax, idx) => {
      let allocatedBerthType: 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'WS' = berthCycle[(startBerth + idx) % 8];

      if (pax.age >= 60) {
        allocatedBerthType = 'LB';
      } else if (pax.berthPreference) {
        allocatedBerthType = pax.berthPreference;
      }

      return {
        name: pax.name,
        age: pax.age,
        gender: pax.gender,
        bookingStatus: 'CNF',
        currentStatus: 'CNF',
        coach: coachName,
        berthNumber: startBerth + idx,
        berthType: allocatedBerthType,
        foodChoice: pax.foodChoice || 'VEG'
      };
    });
  }

  /**
   * Generates QR Code Data URL for Indian Railway Electronic Reservation Slip (ERS)
   */
  public static async generateErsQrCode(pnr: string, trainNo: string, date: string): Promise<string> {
    const verificationUrl = `https://railways.gov.in/pnr-verify?pnr=${pnr}&trn=${trainNo}&dt=${date}`;
    try {
      return await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 250
      });
    } catch (err) {
      console.error('ERS QR generation failed:', err);
      return '';
    }
  }

  /**
   * Railway Cancellation Clerkage & TDR Refund Engine
   */
  public static calculateRailwayCancellation(
    totalFare: number,
    travelClass: string,
    departureTime: Date,
    cancellationTime: Date = new Date()
  ) {
    const hoursBeforeDeparture = (new Date(departureTime).getTime() - new Date(cancellationTime).getTime()) / (1000 * 60 * 60);

    let clerkageDeduction = 0;
    let refundable = 0;
    let refundStatus = 'REFUND_APPROVED';

    const flatClassDeductions: Record<string, number> = {
      '1A': 240,
      '2A': 200,
      '3A': 180,
      '3E': 180,
      CC: 180,
      EC: 240,
      SL: 120,
      '2S': 60
    };

    if (hoursBeforeDeparture > 48) {
      clerkageDeduction = flatClassDeductions[travelClass] || 180;
      refundable = Math.max(0, totalFare - clerkageDeduction);
    } else if (hoursBeforeDeparture >= 12 && hoursBeforeDeparture <= 48) {
      clerkageDeduction = Math.round(totalFare * 0.25);
      refundable = totalFare - clerkageDeduction;
    } else if (hoursBeforeDeparture >= 4 && hoursBeforeDeparture < 12) {
      clerkageDeduction = Math.round(totalFare * 0.5);
      refundable = totalFare - clerkageDeduction;
    } else {
      clerkageDeduction = totalFare;
      refundable = 0;
      refundStatus = 'TDR_FILING_REQUIRED';
    }

    return {
      hoursBeforeDeparture: Math.round(hoursBeforeDeparture * 10) / 10,
      clerkageDeduction,
      refundable,
      refundStatus
    };
  }
}
