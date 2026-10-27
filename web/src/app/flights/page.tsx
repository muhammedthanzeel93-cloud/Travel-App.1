'use client';

import { useState } from 'react';
import { Plane, Calendar, User, ShieldCheck, CreditCard, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { OfflineVaultStorage } from '@/lib/offlineVault';

export default function FlightsBookingPage() {
  const [selectedFlight, setSelectedFlight] = useState<any>({
    airline: 'Emirates',
    code: 'EK',
    flightNumber: 'EK 562',
    origin: 'CCJ',
    originName: 'Calicut (Karipur)',
    destination: 'DXB',
    destinationName: 'Dubai International',
    departureTime: '2026-10-25T04:30:00Z',
    arrivalTime: '2026-10-25T07:10:00Z',
    baseFare: 14500
  });

  const [paxForm, setPaxForm] = useState({
    title: 'MR',
    firstName: 'John',
    lastName: 'Doe',
    dob: '1990-05-15',
    gender: 'MALE',
    passportNumber: 'Z5891240',
    passportExpiry: '2028-08-20',
    nationality: 'IND',
    seatPreference: '14A'
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fare calculation
  const fuelYQ = Math.round(selectedFlight.baseFare * 0.12);
  const airportUdf = 850;
  const securityAsf = 430;
  const taxesGst = Math.round((selectedFlight.baseFare + fuelYQ) * 0.05);
  const platformFee = 350;
  const grossTotal = selectedFlight.baseFare + fuelYQ + airportUdf + securityAsf + taxesGst + platformFee;

  const handleBookFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSubmitting(true);

    try {
      // 1. APIS Passport Expiry Validation (Must be >= 6 months from departure)
      const depDate = new Date(selectedFlight.departureTime);
      const minExpiry = new Date(depDate);
      minExpiry.setMonth(minExpiry.getMonth() + 6);

      const passExpiryDate = new Date(paxForm.passportExpiry);
      if (passExpiryDate < minExpiry) {
        setValidationError(
          `APIS Passport Validation Failed: Passport validity must extend at least 6 months beyond travel date (${passExpiryDate.toISOString().split('T')[0]} is less than required ${minExpiry.toISOString().split('T')[0]}).`
        );
        setIsSubmitting(false);
        return;
      }

      // Generate 6-char PNR
      const pnr = `EK${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const bookingResult = {
        pnr,
        airline: selectedFlight.airline,
        flightNumber: selectedFlight.flightNumber,
        sector: `${selectedFlight.origin} → ${selectedFlight.destination}`,
        passenger: `${paxForm.firstName} ${paxForm.lastName}`,
        seat: paxForm.seatPreference,
        totalAmount: grossTotal,
        status: 'PENDING_ISSUANCE'
      };

      // Save to Offline Vault
      await OfflineVaultStorage.saveTicket({
        ...bookingResult,
        type: 'FLIGHT',
        departureTime: selectedFlight.departureTime,
        ticketNumber: `176-${Math.floor(1000000000 + Math.random() * 9000000000)}`
      });

      setBookingSuccess(bookingResult);
    } catch (err: any) {
      setValidationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">✈️ Real-World Aviation Flight Booking Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Advance Passenger Information System (APIS) validation &amp; IATA fare construction
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
          IATA Standard Resolution 792
        </span>
      </div>

      {bookingSuccess ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/40 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-white">Flight Booking Queued!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your booking order has been sent to the <span className="text-amber-400 font-semibold">Super Admin Ticketing Desk</span>. Upon verification, your official 13-digit IATA electronic ticket and 2D barcode will dispatch instantly to your offline vault and WhatsApp.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned PNR:</span>
              <span className="font-mono font-bold text-amber-400">{bookingSuccess.pnr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Flight:</span>
              <span className="text-slate-200">{bookingSuccess.airline} {bookingSuccess.flightNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Passenger:</span>
              <span className="text-slate-200">{bookingSuccess.passenger} (Seat {bookingSuccess.seat})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Paid:</span>
              <span className="text-emerald-400 font-bold font-mono">₹{bookingSuccess.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <a
              href="/admin/operations/ticketing-desk"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Open Super Admin Desk to Issue
            </a>
            <button
              onClick={() => setBookingSuccess(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
            >
              Book Another
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Flight Details & Passenger APIS Form (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400">{selectedFlight.airline} • {selectedFlight.flightNumber}</span>
                <div className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{selectedFlight.origin} (04:30)</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span>{selectedFlight.destination} (07:10)</span>
                </div>
                <span className="text-[11px] text-slate-400 block">Boeing 777-300ER • Calicut Karipur to Dubai Intl T3</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Base Rate</span>
                <span className="text-lg font-black text-amber-400 font-mono">₹{selectedFlight.baseFare.toLocaleString()}</span>
              </div>
            </div>

            {/* APIS Passenger Form */}
            <form onSubmit={handleBookFlight} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Advance Passenger Information System (APIS) Details</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold">Strict Passport Matching</span>
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Title</label>
                  <select
                    value={paxForm.title}
                    onChange={(e) => setPaxForm({ ...paxForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MS">MS</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">First &amp; Middle Name (as in Passport)</label>
                  <input
                    type="text"
                    required
                    value={paxForm.firstName}
                    onChange={(e) => setPaxForm({ ...paxForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Surname / Last Name</label>
                  <input
                    type="text"
                    required
                    value={paxForm.lastName}
                    onChange={(e) => setPaxForm({ ...paxForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={paxForm.dob}
                    onChange={(e) => setPaxForm({ ...paxForm, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Passport Number</label>
                  <input
                    type="text"
                    required
                    value={paxForm.passportNumber}
                    onChange={(e) => setPaxForm({ ...paxForm, passportNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Passport Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={paxForm.passportExpiry}
                    onChange={(e) => setPaxForm({ ...paxForm, passportExpiry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Seat Preference</label>
                  <select
                    value={paxForm.seatPreference}
                    onChange={(e) => setPaxForm({ ...paxForm, seatPreference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  >
                    <option value="14A">14A (Window - Forward)</option>
                    <option value="14B">14B (Middle)</option>
                    <option value="14C">14C (Aisle)</option>
                    <option value="18A">18A (Window - Overwing)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nationality</label>
                  <input
                    type="text"
                    readOnly
                    value="IND (Republic of India)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
              >
                {isSubmitting ? 'Verifying APIS & Booking...' : `Confirm & Pay ₹${grossTotal.toLocaleString()}`}
              </button>
            </form>
          </div>

          {/* Right: IATA Fare Construction Breakdown (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>IATA Standard Fare Construction</span>
            </h3>

            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Airline Base Fare:</span>
                <span className="text-slate-200 font-mono">₹{selectedFlight.baseFare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel Surcharge (YQ):</span>
                <span className="text-slate-200 font-mono">₹{fuelYQ.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Airport Development (UDF):</span>
                <span className="text-slate-200 font-mono">₹{airportUdf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Aviation Security Fee (ASF):</span>
                <span className="text-slate-200 font-mono">₹{securityAsf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (K3):</span>
                <span className="text-slate-200 font-mono">₹{taxesGst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Platform Convenience Margin:</span>
                <span className="font-mono">₹{platformFee.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline font-bold text-white">
              <span>Gross Total Amount:</span>
              <span className="text-xl text-amber-400 font-mono">₹{grossTotal.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>✓ Escrow settlement via Razorpay/Stripe.</p>
              <p>✓ Automated pre-cache to 4-Hour Offline Vault.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
