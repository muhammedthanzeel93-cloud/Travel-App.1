'use client';

import { useState } from 'react';
import { Plane, Search, Download, AlertTriangle, ShieldCheck, Clock, Users, ArrowUpRight } from 'lucide-react';

export default function FlightOperationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const flightBookings = [
    {
      pnr: 'EK89XQ',
      carrier: 'Emirates (EK 562)',
      route: 'CCJ (Calicut) → DXB (Dubai)',
      departure: '25 Oct 2026, 04:30 AM',
      passenger: 'John Doe (14A)',
      ticketNo: '176-2894109382',
      grossFare: '₹18,270',
      status: 'CONFIRMED'
    },
    {
      pnr: 'IX3412',
      carrier: 'Air India Express (IX 345)',
      route: 'CCJ (Calicut) → DXB (Dubai)',
      departure: '25 Oct 2026, 10:15 AM',
      passenger: 'Anjali Menon (07F)',
      ticketNo: '176-9012481029',
      grossFare: '₹14,440',
      status: 'CONFIRMED'
    },
    {
      pnr: 'FZ9910',
      carrier: 'Flydubai (FZ 442)',
      route: 'CCJ (Calicut) → DXB (Dubai)',
      departure: '25 Oct 2026, 10:45 PM',
      passenger: 'Farhan Siddiqui (21C)',
      ticketNo: '141-5581902847',
      grossFare: '₹15,600',
      status: 'PENDING_ISSUANCE'
    }
  ];

  const filtered = flightBookings.filter((b) => {
    const matchesSearch = b.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passenger.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">✈️ Aeroplane &amp; Flight Operations Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-world IATA electronic ticket registry, sector inventory, and passenger manifests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            Sector: CCJ ⇄ DXB (High Demand)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Flight Bookings</span>
          <span className="block text-2xl font-black text-white mt-1">248</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Gross Ticket Volume</span>
          <span className="block text-2xl font-black text-blue-400 mt-1">₹42.5 Lakhs</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Platform Margins Earned</span>
          <span className="block text-2xl font-black text-emerald-400 mt-1">₹1,48,750</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active Airlines</span>
          <span className="block text-2xl font-black text-amber-400 mt-1">6 Carriers</span>
        </div>
      </div>

      {/* Manifest Table & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PNR, Passenger, or Flight..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedStatus === 'CONFIRMED' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING_ISSUANCE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedStatus === 'PENDING_ISSUANCE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">PNR / Ticket No</th>
                <th className="p-3">Flight &amp; Sector</th>
                <th className="p-3">Departure</th>
                <th className="p-3">Passenger &amp; Seat</th>
                <th className="p-3">Gross Fare</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((item) => (
                <tr key={item.pnr} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <span className="font-extrabold text-white block">{item.pnr}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.ticketNo}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-200 block">{item.carrier}</span>
                    <span className="text-[10px] text-slate-400">{item.route}</span>
                  </td>
                  <td className="p-3 text-slate-300">{item.departure}</td>
                  <td className="p-3 text-amber-400 font-semibold">{item.passenger}</td>
                  <td className="p-3 font-mono text-slate-200">{item.grossFare}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition-colors">
                      View Manifest
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
