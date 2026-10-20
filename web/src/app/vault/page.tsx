'use client';

import { useState, useEffect } from 'react';
import { HardDrive, WifiOff, QrCode, Plane, Train, Clock, CheckCircle2, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { OfflineVaultStorage } from '@/lib/offlineVault';
import QRCode from 'qrcode';

export default function OfflineVaultPage() {
  const [cachedTickets, setCachedTickets] = useState<any[]>([]);
  const [activePass, setActivePass] = useState<any>(null);
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  useEffect(() => {
    async function loadVault() {
      const tickets = await OfflineVaultStorage.getAllTickets();
      if (tickets.length > 0) {
        setCachedTickets(tickets);
        setActivePass(tickets[0]);
      } else {
        // Fallback pre-cached sample pass for demonstration
        const samplePass = {
          pnr: 'EK89XQ',
          type: 'FLIGHT',
          carrier: 'Emirates (EK 562)',
          sector: 'CCJ (Calicut) → DXB (Dubai)',
          passenger: 'John Doe',
          seat: '14A (Window)',
          ticketNumber: '176-2894109382',
          departureTime: '2026-10-25T04:30:00Z',
          cachedAt: new Date().toISOString(),
          status: 'ISSUED'
        };
        setCachedTickets([samplePass]);
        setActivePass(samplePass);
      }
    }
    loadVault();
  }, []);

  useEffect(() => {
    async function renderBarcode() {
      if (!activePass) return;
      const payload = activePass.type === 'FLIGHT'
        ? `M1${activePass.passenger.toUpperCase().padEnd(20, ' ')}E${activePass.pnr.padEnd(7, ' ')}CCJDXBEK 0562 294Y014A0042 147>2180WW5294BEK ${activePass.ticketNumber.replace('-', '')} 0`
        : `https://railways.gov.in/pnr-verify?pnr=${activePass.pnr}&trn=12617`;

      try {
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 280
        });
        setBarcodeImage(url);
      } catch (e) {
        console.error('Barcode error', e);
      }
    }
    renderBarcode();
  }, [activePass]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>4-Hour Offline Vault</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                100% Zero-Network Usability
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely pre-cached 2D BCBP boarding passes &amp; IRCTC rail slips stored in device IndexedDB
            </p>
          </div>
        </div>

        {/* Airplane Mode Toggle */}
        <button
          onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            isSimulatedOffline
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <WifiOff className="w-4 h-4" />
          <span>{isSimulatedOffline ? 'Simulated Airplane Mode ON' : 'Test Offline Mode'}</span>
        </button>
      </div>

      {isSimulatedOffline && (
        <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>Airplane Mode Active: Zero network connection. All boarding passes and tickets are loading directly from device local storage.</span>
        </div>
      )}

      {/* Main Grid: Cached Pass Selector & Offline Boarding Pass Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Passes List) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block pb-2 border-b border-slate-800">
            Cached Passes in Vault ({cachedTickets.length})
          </span>

          <div className="space-y-2">
            {cachedTickets.map((t, idx) => (
              <div
                key={idx}
                onClick={() => setActivePass(t)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all text-xs ${
                  activePass?.pnr === t.pnr
                    ? 'bg-emerald-950/50 border-emerald-500 shadow-md ring-1 ring-emerald-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-400 font-mono text-sm">{t.pnr}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    4H CACHED
                  </span>
                </div>
                <span className="font-semibold text-slate-200 block mt-1">{t.carrier || t.trainName || 'Flight'}</span>
                <span className="text-[11px] text-slate-400 block">{t.sector}</span>
                <span className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> Valid offline for &gt; 4 hours
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (High Fidelity Boarding Pass / ERS Slip) */}
        {activePass && (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
              {/* Top Boarding Pass Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    {activePass.type === 'FLIGHT' ? <Plane className="w-5 h-5" /> : <Train className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-base block">
                      {activePass.type === 'FLIGHT' ? 'IATA ELECTRONIC BOARDING PASS' : 'INDIAN RAILWAYS ERS PASS'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activePass.ticketNumber ? `E-Ticket: ${activePass.ticketNumber}` : `PNR: ${activePass.pnr}`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold">
                    CONFIRMED
                  </span>
                </div>
              </div>

              {/* Pass Route & Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Passenger</span>
                  <span className="font-extrabold text-white text-sm">{activePass.passenger}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sector</span>
                  <span className="font-bold text-slate-200">{activePass.sector}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Seat / Berth</span>
                  <span className="font-extrabold text-amber-400 text-sm">
                    {activePass.seat || activePass.coachAndBerth || '14A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Flight / Train</span>
                  <span className="font-bold text-slate-200">{activePass.flightNumber || activePass.trainNo || 'EK 562'}</span>
                </div>
              </div>

              {/* High Density 2D Barcode Reader Area */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Official 2D Airport / PRS Gate Scanner Code</span>
                </span>

                {barcodeImage && (
                  <img
                    src={barcodeImage}
                    alt="Official 2D Barcode"
                    className="w-48 h-48 mx-auto rounded-xl bg-white p-3 shadow-2xl"
                  />
                )}

                <span className="block text-[11px] font-mono text-slate-400">
                  PNR: <strong className="text-amber-400">{activePass.pnr}</strong> • Gate/Platform Scannable Offline
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
