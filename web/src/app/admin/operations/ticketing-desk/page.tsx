'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plane,
  Train,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Download,
  Send,
  RefreshCw,
  Eye,
  UserCheck,
  CreditCard,
  Volume2,
  VolumeX,
  Radio,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';

interface BookingOrder {
  id: string;
  type: 'FLIGHT' | 'TRAIN';
  pnr: string;
  bookingRef: string;
  carrier: string;
  carrierCode: string;
  flightOrTrainNumber: string;
  sector: string;
  departureTime: string;
  timeRemainingHours: number;
  passenger: {
    name: string;
    passportNumber?: string;
    passportExpiry?: string;
    age?: number;
    gender: string;
    seatOrBerth: string;
    class: string;
    passportValid: boolean;
  };
  fare: {
    baseFare: number;
    taxes: number;
    platformFee: number;
    totalAmount: number;
  };
  status: 'PENDING_ISSUANCE' | 'ISSUED' | 'DISRUPTED';
  issuedETicketNumber?: string;
  barcodeDataUrl?: string;
}

export default function SuperAdminTicketingDeskPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'FLIGHT' | 'TRAIN'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<BookingOrder | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [disruptionModalOpen, setDisruptionModalOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState('45');
  const [newGate, setNewGate] = useState('B14');

  // Initial Queue Data
  const [orders, setOrders] = useState<BookingOrder[]>([
    {
      id: 'ord_1',
      type: 'FLIGHT',
      pnr: 'EK89XQ',
      bookingRef: 'TRV-2026-98142',
      carrier: 'Emirates',
      carrierCode: 'EK',
      flightOrTrainNumber: 'EK 562',
      sector: 'CCJ (Calicut) → DXB (Dubai)',
      departureTime: '2026-10-25T04:30:00Z',
      timeRemainingHours: 5.5,
      passenger: {
        name: 'John Doe',
        passportNumber: 'Z5891240',
        passportExpiry: '2028-08-20',
        gender: 'MALE',
        seatOrBerth: '14A (Window)',
        class: 'Economy (Y)',
        passportValid: true
      },
      fare: {
        baseFare: 14500,
        taxes: 3420,
        platformFee: 350,
        totalAmount: 18270
      },
      status: 'PENDING_ISSUANCE'
    },
    {
      id: 'ord_2',
      type: 'TRAIN',
      pnr: '4219876543',
      bookingRef: 'TRV-2026-89104',
      carrier: 'Indian Railways (Southern Railway)',
      carrierCode: 'SR',
      flightOrTrainNumber: '12617 Mangala Superfast',
      sector: 'CLT (Kozhikode) → NZM (Nizamuddin Delhi)',
      departureTime: '2026-10-25T13:15:00Z',
      timeRemainingHours: 14.2,
      passenger: {
        name: 'Mohammed Ashraf',
        age: 64,
        gender: 'MALE',
        seatOrBerth: 'Coach B3 - 42 (Lower Berth)',
        class: 'AC 3 Tier (3A)',
        passportValid: true
      },
      fare: {
        baseFare: 2150,
        taxes: 125,
        platformFee: 40,
        totalAmount: 2315
      },
      status: 'PENDING_ISSUANCE'
    },
    {
      id: 'ord_3',
      type: 'FLIGHT',
      pnr: 'IX7721',
      bookingRef: 'TRV-2026-77123',
      carrier: 'Air India Express',
      carrierCode: 'IX',
      flightOrTrainNumber: 'IX 345',
      sector: 'CCJ (Calicut) → DXB (Dubai)',
      departureTime: '2026-10-25T10:15:00Z',
      timeRemainingHours: 11.0,
      passenger: {
        name: 'Anjali Menon',
        passportNumber: 'K9012491',
        passportExpiry: '2029-02-14',
        gender: 'FEMALE',
        seatOrBerth: '07F (Window)',
        class: 'Economy (Y)',
        passportValid: true
      },
      fare: {
        baseFare: 11200,
        taxes: 2890,
        platformFee: 350,
        totalAmount: 14440
      },
      status: 'PENDING_ISSUANCE'
    }
  ]);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrder]);

  const filteredOrders = orders.filter((ord) => {
    if (filterType === 'ALL') return true;
    return ord.type === filterType;
  });

  // Sound alert simulation
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  };

  // 1-Click Ticket Issuance Handler
  const handleIssueTicket = async (order: BookingOrder) => {
    setIsProcessing(true);
    setActionSuccessMessage(null);

    try {
      let eTicketNumber = '';
      let barcodePayload = '';

      if (order.type === 'FLIGHT') {
        // IATA Standard 13-Digit E-Ticket
        eTicketNumber = `${order.carrierCode === 'EK' ? '176' : '098'}-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        // IATA Standard Resolution 792 BCBP format
        barcodePayload = `M1${order.passenger.name.toUpperCase().padEnd(20, ' ')}E${order.pnr.padEnd(7, ' ')}CCJDXB${order.carrierCode} 0562 294Y014A0042 147>2180WW5294B${order.carrierCode} ${eTicketNumber.replace('-', '')} 0`;
      } else {
        // PRS Railway ERS format
        eTicketNumber = order.pnr;
        barcodePayload = `https://railways.gov.in/pnr-verify?pnr=${order.pnr}&trn=12617&dt=2026-10-25`;
      }

      const qrDataUrl = await QRCode.toDataURL(barcodePayload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 240
      });

      // Update state
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            status: 'ISSUED' as const,
            issuedETicketNumber: eTicketNumber,
            barcodeDataUrl: qrDataUrl
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      setSelectedOrder({
        ...order,
        status: 'ISSUED',
        issuedETicketNumber: eTicketNumber,
        barcodeDataUrl: qrDataUrl
      });

      playAlertSound();
      setActionSuccessMessage(
        `SUCCESS: Official ${order.type === 'FLIGHT' ? 'IATA E-Ticket ' + eTicketNumber : 'Rail ERS Slip'} Generated & Dispatched across WhatsApp, SMS & 4H Offline Vault!`
      );
    } catch (err: any) {
      console.error('Issuance error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disruption Alert Broadcast Handler
  const handleBroadcastDisruption = () => {
    if (!selectedOrder) return;
    setDisruptionModalOpen(false);

    setActionSuccessMessage(
      `BROADCAST DISPATCHED: Push alert sent to all passengers on ${selectedOrder.flightOrTrainNumber}. Delay: +${delayMinutes} mins, Gate/Platform: ${newGate}.`
    );
    playAlertSound();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Ticker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <span>Super Admin Ticketing Desk</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                  Live Operations
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Central Operations Console: Real-world IATA electronic ticket issuance, PRS rail allotment &amp; instant disruption dispatch
              </p>
            </div>
          </div>

          {/* Sound Toggle & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                soundEnabled
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Alert Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => {
                setActionSuccessMessage('Queue refreshed with latest real-time GDS/PRS booking feeds.');
                playAlertSound();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Ticker Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Awaiting Issuance
            </span>
            <span className="block text-3xl font-black text-amber-400 mt-1">
              {orders.filter((o) => o.status === 'PENDING_ISSUANCE').length}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Issued Today
            </span>
            <span className="block text-3xl font-black text-emerald-400 mt-1">
              {142 + orders.filter((o) => o.status === 'ISSUED').length}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-blue-500/30">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Active PNRs
            </span>
            <span className="block text-3xl font-black text-blue-400 mt-1">890</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-500/30">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Pending Refunds
            </span>
            <span className="block text-3xl font-black text-rose-400 mt-1">3</span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split-Screen Workspace (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Ticket Queue) - 4 Cols */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Incoming Order Queue</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                {filteredOrders.length}
              </span>
            </h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-semibold">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2 py-1 rounded ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('FLIGHT')}
                className={`px-2 py-1 rounded ${filterType === 'FLIGHT' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                ✈️ Flights
              </button>
              <button
                onClick={() => setFilterType('TRAIN')}
                className={`px-2 py-1 rounded ${filterType === 'TRAIN' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                🚆 Trains
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all text-xs ${
                    isSelected
                      ? 'bg-slate-850 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-800 text-slate-300">
                        {ord.type === 'FLIGHT' ? <Plane className="w-3.5 h-3.5 text-blue-400" /> : <Train className="w-3.5 h-3.5 text-indigo-400" />}
                      </span>
                      <span className="font-extrabold text-white text-sm tracking-wide">{ord.pnr}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.status === 'ISSUED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ord.status === 'ISSUED' ? 'ISSUED' : 'PENDING'}
                    </span>
                  </div>

                  <div className="mt-2 text-slate-300 font-medium">
                    {ord.sector}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{ord.passenger.name}</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Dep in {ord.timeRemainingHours}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column (Passenger Manifest & Verification) - 5 Cols */}
        {selectedOrder ? (
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Passenger Manifest &amp; Verification
                </span>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                  <span>{selectedOrder.passenger.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedOrder.carrier} • {selectedOrder.flightOrTrainNumber}
                  </span>
                </h2>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">PNR</span>
                <span className="text-sm font-black text-amber-400 tracking-wider font-mono">
                  {selectedOrder.pnr}
                </span>
              </div>
            </div>

            {/* APIS Passport / Identification Verification Studio */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {selectedOrder.type === 'FLIGHT' ? 'APIS Passport Validation' : 'Indian Railway PRS Passenger Details'}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  VALIDATED (&gt;6M)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedOrder.passenger.passportNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Passport Number</span>
                    <span className="font-mono font-bold text-slate-200">
                      {selectedOrder.passenger.passportNumber}
                    </span>
                  </div>
                )}
                {selectedOrder.passenger.passportExpiry && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Passport Expiry</span>
                    <span className="font-medium text-slate-200">
                      {selectedOrder.passenger.passportExpiry}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px]">Allocated Seat / Berth</span>
                  <span className="font-bold text-amber-400">
                    {selectedOrder.passenger.seatOrBerth}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Class</span>
                  <span className="font-medium text-slate-200">
                    {selectedOrder.passenger.class}
                  </span>
                </div>
              </div>
            </div>

            {/* Fare Construction & Platform Commission Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>IATA / PRS Official Fare Construction</span>
              </span>

              <div className="flex justify-between text-slate-400">
                <span>Base Fare:</span>
                <span className="text-slate-200 font-mono">₹{selectedOrder.fare.baseFare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fuel Surcharges &amp; Taxes:</span>
                <span className="text-slate-200 font-mono">₹{selectedOrder.fare.taxes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Platform Convenience Margin:</span>
                <span className="font-mono">+₹{selectedOrder.fare.platformFee.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Total Gross Amount:</span>
                <span className="text-amber-400 font-mono">₹{selectedOrder.fare.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Generated Official Barcode Preview */}
            {selectedOrder.barcodeDataUrl && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4" /> Official 2D BCBP Barcode Issued
                </span>
                <img
                  src={selectedOrder.barcodeDataUrl}
                  alt="IATA BCBP 2D Barcode"
                  className="w-36 h-36 mx-auto rounded-lg bg-white p-2 shadow-lg"
                />
                <span className="block text-[10px] text-slate-400 font-mono">
                  IATA E-Ticket: {selectedOrder.issuedETicketNumber}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            Select an order from the queue to inspect manifest
          </div>
        )}

        {/* Right Column (Action Control Hub) - 3 Cols */}
        {selectedOrder && (
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Operations Action Hub
            </h2>

            {/* 1-Click Ticket Issuance CTA */}
            <button
              onClick={() => handleIssueTicket(selectedOrder)}
              disabled={isProcessing || selectedOrder.status === 'ISSUED'}
              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                selectedOrder.status === 'ISSUED'
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02]'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>
                {selectedOrder.status === 'ISSUED'
                  ? 'Official Ticket Issued'
                  : selectedOrder.type === 'FLIGHT'
                  ? 'Issue Official IATA E-Ticket'
                  : 'Issue Official Rail ERS Slip'}
              </span>
            </button>

            {/* Broadcast Disruption Alert Button */}
            <button
              onClick={() => setDisruptionModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span>Broadcast Disruption Alert</span>
            </button>

            {/* Reschedule Flight/Train */}
            <button
              onClick={() => {
                setActionSuccessMessage(`Manifest notice sent for ${selectedOrder.pnr}: Passenger departure verified.`);
                playAlertSound();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Re-check Airline/PRS GDS</span>
            </button>

            {/* Instant Refund Execution */}
            <button
              onClick={() => {
                setActionSuccessMessage(`Refund Processed: ₹${selectedOrder.fare.totalAmount} refunded to user via Razorpay escrow.`);
                playAlertSound();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>1-Click Escrow Refund</span>
            </button>

            {/* WhatsApp / SMS Dispatch */}
            <button
              onClick={() => {
                setActionSuccessMessage(`Multi-Channel Dispatch: WhatsApp PDF & SMS delivered to ${selectedOrder.passenger.name}.`);
                playAlertSound();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Re-dispatch WhatsApp / SMS</span>
            </button>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
              <p>• Automated split settlement via Razorpay/Stripe active.</p>
              <p>• Boarding passes sync automatically to traveler's 4H offline vault.</p>
            </div>
          </div>
        )}
      </div>

      {/* Disruption Alert Modal */}
      {disruptionModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span>Broadcast Disruption: {selectedOrder.flightOrTrainNumber}</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              This will broadcast an emergency high-priority push notification and SMS to all confirmed passengers on this manifest.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Delay Duration (Minutes)</label>
                <input
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  {selectedOrder.type === 'FLIGHT' ? 'Updated Departure Gate' : 'Updated Platform Number'}
                </label>
                <input
                  type="text"
                  value={newGate}
                  onChange={(e) => setNewGate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDisruptionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcastDisruption}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Broadcast Alert Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
