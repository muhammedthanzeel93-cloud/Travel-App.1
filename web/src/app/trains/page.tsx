'use client';

import { useState } from 'react';
import { Train, Calendar, User, CreditCard, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { OfflineVaultStorage } from '@/lib/offlineVault';

export default function TrainsBookingPage() {
  const [selectedTrain] = useState({
    trainNo: '12617',
    trainName: 'Mangala Lakshadweep Superfast Express',
    origin: 'CLT (Kozhikode Main)',
    destination: 'NZM (Hazrat Nizamuddin Delhi)',
    departure: '25 Oct 2026, 01:15 PM',
    duration: '28h 15m'
  });

  const [travelClass, setTravelClass] = useState('3A');
  const [quota, setQuota] = useState('GN');

  const [passenger, setPassenger] = useState({
    name: 'Mohammed Ashraf',
    age: 64,
    gender: 'MALE',
    berthPref: 'LB'
  });

  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Fare calculations
  const baseRate = travelClass === '3A' ? 2150 : travelClass === '2A' ? 3120 : 820;
  const tatkalFee = quota === 'TQ' ? (travelClass === '3A' ? 400 : 500) : 0;
  const resFee = 40;
  const superfastCharge = 45;
  const platformFee = 40;
  const totalAmount = baseRate + tatkalFee + resFee + superfastCharge + platformFee;

  const handleBookTrain = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate 10-digit PNR
    const pnr = `421${Math.floor(1000000 + Math.random() * 9000000)}`;

    // Auto-allocate lower berth if age >= 60
    const allocatedBerthType = passenger.age >= 60 ? 'LB (Lower Berth)' : 'MB (Middle Berth)';
    const coach = travelClass === '3A' ? 'B3' : travelClass === '2A' ? 'A1' : 'S4';
    const berthNo = 42;

    const result = {
      pnr,
      trainNo: selectedTrain.trainNo,
      trainName: selectedTrain.trainName,
      sector: `${selectedTrain.origin} → ${selectedTrain.destination}`,
      passenger: passenger.name,
      coachAndBerth: `${coach} - ${berthNo} (${allocatedBerthType})`,
      travelClass,
      quota,
      totalAmount,
      status: 'CONFIRMED'
    };

    // Save in 4-hour offline vault
    await OfflineVaultStorage.saveTicket({
      ...result,
      type: 'TRAIN',
      departureTime: '2026-10-25T13:15:00Z',
      qrCodeDataUrl: `https://railways.gov.in/pnr-verify?pnr=${pnr}&trn=12617`
    });

    setBookingSuccess(result);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">🚆 Real-World PRS Railway Booking Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              10-digit rail PNR assignment, Tatkal engine &amp; automated Senior Citizen lower berth allocator
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
          Indian Railways PRS Zone 421
        </span>
      </div>

      {bookingSuccess ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/40 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-white">Train Ticket Confirmed (CNF)!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your 10-digit PNR has been generated and pre-cached in your <span className="text-emerald-400 font-semibold">4-Hour Offline Vault</span>.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">10-Digit PNR:</span>
              <span className="font-mono font-bold text-amber-400">{bookingSuccess.pnr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Train:</span>
              <span className="text-slate-200">{bookingSuccess.trainNo} - {bookingSuccess.trainName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seat/Berth Allotted:</span>
              <span className="text-emerald-400 font-bold">{bookingSuccess.coachAndBerth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Paid:</span>
              <span className="text-slate-200 font-mono">₹{bookingSuccess.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <a
              href="/vault"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Open Offline Vault
            </a>
            <button
              onClick={() => setBookingSuccess(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
            >
              Book Another Train
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-indigo-400">{selectedTrain.trainNo} - {selectedTrain.trainName}</span>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{selectedTrain.origin}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span>{selectedTrain.destination}</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Departs: {selectedTrain.departure} • Duration: {selectedTrain.duration}</span>
            </div>

            <form onSubmit={handleBookTrain} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Travel Class</label>
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="3A">3A - AC 3 Tier (₹2,150)</option>
                    <option value="2A">2A - AC 2 Tier (₹3,120)</option>
                    <option value="SL">SL - Sleeper Class (₹820)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Reservation Quota</label>
                  <select
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="GN">GN - General Quota</option>
                    <option value="TQ">TQ - Tatkal Quota (+₹400)</option>
                    <option value="LD">LD - Ladies Quota</option>
                    <option value="SS">SS - Senior Citizen Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div>
                  <label className="text-slate-400 block mb-1">Passenger Name</label>
                  <input
                    type="text"
                    required
                    value={passenger.name}
                    onChange={(e) => setPassenger({ ...passenger, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={passenger.age}
                    onChange={(e) => setPassenger({ ...passenger, age: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                  {passenger.age >= 60 && (
                    <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                      ✓ Auto-priority Lower Berth (LB) eligible
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Gender</label>
                  <select
                    value={passenger.gender}
                    onChange={(e) => setPassenger({ ...passenger, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01]"
              >
                Confirm Booking &amp; Pay ₹{totalAmount.toLocaleString()}
              </button>
            </form>
          </div>

          {/* Right Fare Breakdown */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>Railway Fare Breakdown</span>
            </h3>

            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Rail Base Fare:</span>
                <span className="text-slate-200 font-mono">₹{baseRate}</span>
              </div>
              {tatkalFee > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Tatkal Surcharge (TQ):</span>
                  <span className="font-mono">₹{tatkalFee}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Reservation Fee:</span>
                <span className="text-slate-200 font-mono">₹{resFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Superfast Surcharge:</span>
                <span className="text-slate-200 font-mono">₹{superfastCharge}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Platform Service Fee:</span>
                <span className="font-mono">₹{platformFee}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white">
              <span>Total Amount:</span>
              <span className="text-lg text-amber-400 font-mono">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
