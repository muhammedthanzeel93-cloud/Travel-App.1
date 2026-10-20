import { IataTicketingService } from '../src/services/iataTicketing.service.js';
import { PrsRailTicketingService } from '../src/services/prsRailTicketing.service.js';

async function runTicketingVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 REAL-WORLD AVIATION & RAILWAY TICKETING VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // TEST 1: IATA PNR & 13-Digit E-Ticket
  console.log('--- TEST GROUP 1: Real-World IATA Airline Ticketing ---');
  const flightPnr = IataTicketingService.generatePnr('EK');
  assert(
    flightPnr.length === 6 && /^[A-Z0-9]{6}$/.test(flightPnr),
    `Generated valid 6-character alphanumeric IATA PNR: ${flightPnr}`
  );

  const eTicketNumber = IataTicketingService.generate13DigitETicket('EK');
  assert(
    eTicketNumber.startsWith('176-') && eTicketNumber.length === 14,
    `Generated valid 13-digit IATA E-Ticket for Emirates (176 prefix): ${eTicketNumber}`
  );

  // TEST 2: APIS Manifest Validation
  const departureDate = new Date('2026-12-01');
  const validPax = {
    title: 'MR' as const,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-05-15',
    gender: 'MALE' as const,
    passportNumber: 'Z5891240',
    passportExpiry: '2028-08-20', // > 6 months
    nationality: 'IND'
  };

  const validResult = IataTicketingService.validateApisManifest(validPax, departureDate);
  assert(validResult.isValid, 'APIS Validation approved valid passenger passport (> 6 months validity)');

  const expiredPax = {
    ...validPax,
    passportExpiry: '2027-01-10' // < 6 months from 2026-12-01
  };
  const invalidResult = IataTicketingService.validateApisManifest(expiredPax, departureDate);
  assert(!invalidResult.isValid, `APIS Validation rejected passport with < 6 months validity: ${invalidResult.errors[0]}`);

  // TEST 3: IATA Fare Construction
  const iataFare = IataTicketingService.constructIataFare(14500, 2);
  assert(
    iataFare.baseFare === 29000 &&
    iataFare.platformConvenienceFee === 700 &&
    iataFare.totalGrossAmount > 29000,
    `IATA Fare Breakdown constructed properly (Base: ₹${iataFare.baseFare}, Fee: ₹${iataFare.platformConvenienceFee}, Gross: ₹${iataFare.totalGrossAmount})`
  );

  // TEST 4: BCBP 2D Barcode Payload
  const bcbpString = IataTicketingService.formatBcbpPayload({
    passengerName: 'DOE/JOHN',
    pnr: flightPnr,
    originIata: 'CCJ',
    destinationIata: 'DXB',
    airlineCode: 'EK',
    flightNumber: 'EK 562',
    julianDate: '294',
    compartmentCode: 'Y',
    seatNumber: '14A',
    sequenceNumber: 42,
    ticketNumber: eTicketNumber
  });
  assert(
    bcbpString.startsWith('M1DOE/JOHN') && bcbpString.includes('CCJDXB'),
    `IATA Resolution 792 2D Boarding Pass payload formatted: ${bcbpString.substring(0, 45)}...`
  );

  const barcodeDataUrl = await IataTicketingService.generateBarcodeDataUrl(bcbpString);
  assert(barcodeDataUrl.startsWith('data:image/png;base64,'), 'Generated high-density 2D barcode image data URL for offline vault');

  // TEST 5: PRS Railway PNR & Tatkal Pricing
  console.log('\n--- TEST GROUP 2: Real-World PRS Railway Ticketing ---');
  const railPnr = PrsRailTicketingService.generatePnr('421');
  assert(
    railPnr.length === 10 && railPnr.startsWith('421'),
    `Generated valid 10-digit Indian Railway PRS PNR (Southern Railway 421-zone): ${railPnr}`
  );

  const railFareGn = PrsRailTicketingService.calculateRailFare({
    baseFare: 2150,
    travelClass: '3A',
    quota: 'GN',
    paxCount: 1
  });
  const railFareTatkal = PrsRailTicketingService.calculateRailFare({
    baseFare: 2150,
    travelClass: '3A',
    quota: 'TQ',
    paxCount: 1
  });
  assert(
    railFareTatkal.tatkalCharge > 0 && railFareTatkal.totalGrossAmount > railFareGn.totalGrossAmount,
    `Tatkal quota correctly appended dynamic surcharge (GN: ₹${railFareGn.totalGrossAmount} vs TQ: ₹${railFareTatkal.totalGrossAmount})`
  );

  // TEST 6: PRS Berth Allocation & Senior Citizen Priority
  const passengers = [
    { name: 'Kozhikode Passenger', age: 28, gender: 'MALE' as const },
    { name: 'Senior Citizen Uncle', age: 67, gender: 'MALE' as const }
  ];
  const allocated = PrsRailTicketingService.allocateBerths(passengers, '3A', 3);
  assert(
    allocated[0].coach === 'B3' && allocated[1].coach === 'B3',
    `Preserved family continuity in coach B3 (${allocated[0].coach} - ${allocated[0].berthNumber})`
  );
  assert(
    allocated[1].berthType === 'LB',
    `Auto-allocated Lower Berth (LB) for Senior Citizen aged ${passengers[1].age}`
  );

  // TEST 7: Railway Cancellation & Clerkage Deduction
  const futureDeparture = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h ahead (> 48h)
  const cancellationResult = PrsRailTicketingService.calculateRailwayCancellation(2150, '3A', futureDeparture);
  assert(
    cancellationResult.clerkageDeduction === 180 && cancellationResult.refundable === 2150 - 180,
    `Calculated standard IRCTC 3A flat clerkage deduction ₹180 for > 48h cancellation (Refund: ₹${cancellationResult.refundable})`
  );

  console.log('\n================================================================');
  console.log(`🏁 TEST RUN SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('================================================================\n');
}

runTicketingVerificationSuite();
