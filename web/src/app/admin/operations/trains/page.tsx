'use client';

import { useState } from 'react';
import { Train, Search, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export default function TrainOperationsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const trainBookings = [
    {
      pnr: '4219876543',
      trainNo: '12617',
      trainName: 'Mangala Lakshadweep Superfast Express',
      route: 'CLT (Kozhikode) → NZM (Nizamuddin Delhi)',
      departure: '25 Oct 2026, 01:15 PM',
      class: '3A (AC 3 Tier)',
      quota: 'GN (General)',
      passengers: 'Mohammed Ashraf (Coach B3 - 42 LB)',
      status: 'CONFIRMED',
      fare: '₹2,315',
      chartStatus: 'CHART_1_PREPARED'
    },
    {
      pnr: '4218821940',
      trainNo: '12217',
      trainName: 'Kerala Sampark Kranti Express',
      route: 'CLT (Kozhikode) → NZM (Nizamuddin Delhi)',
      departure: '25 Oct 2026, 06:30 PM',
      class: '3A (AC 3 Tier)',
      quota: 'TQ (Tatkal)',
      passengers: 'Deepak Varma (Coach B2 - 18 MB)',
      status: 'CONFIRMED',
      fare: '₹2,803',
      chartStatus: 'CHART_1_PREPARED'
    },
    {
      pnr: '4217109283',
      trainNo: '12617',
      trainName: 'Mangala Lakshadweep Superfast Express',
      route: 'CLT (Kozhikode) → NZM (Nizamuddin Delhi)',
      departure: '26 Oct 2026, 01:15 PM',
      class: 'SL (Sleeper Class)',
      quota: 'GN (General)',
      passengers: 'Suresh Kumar (WL 14 / WL 4)',
      status: 'WAITLISTED',
      fare: '₹860',
      chartStatus: 'CHART_NOT_PREPARED'
    }
  ];

  const filtered = trainBookings.filter(
    (b) =>
      b.pnr.includes(searchTerm) ||
      b.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passengers.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">🚆 Railway &amp; Transit Operations Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              PRS Passenger Reservation System engine, 10-digit PNR lookup, Chart preparation and TDR refund desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
            Zone: 421 Southern Railway (Calicut)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Train Bookings</span>
          <span className="block text-2xl font-black text-white mt-1">420</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Active PNRs Monitored</span>
          <span className="block text-2xl font-black text-indigo-400 mt-1">890</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Tatkal Conversion Rate</span>
          <span className="block text-2xl font-black text-emerald-400 mt-1">94.2%</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Service Fees Retained</span>
          <span className="block text-2xl font-black text-amber-400 mt-1">₹35,600</span>
        </div>
      </div>

      {/* Bookings & PNR Tracking Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search 10-Digit PNR or Passenger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Charting: <span className="text-emerald-400 font-bold">Chart 1 Prepared (T-4h)</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">10-Digit PNR</th>
                <th className="p-3">Train Details</th>
                <th className="p-3">Class &amp; Quota</th>
                <th className="p-3">Passenger &amp; Berth</th>
                <th className="p-3">Charting</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((item) => (
                <tr key={item.pnr} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-extrabold text-amber-400">{item.pnr}</td>
                  <td className="p-3">
                    <span className="text-white block font-semibold">{item.trainNo} - {item.trainName}</span>
                    <span className="text-[10px] text-slate-400">{item.route}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-200 block">{item.class}</span>
                    <span className="text-[10px] text-slate-400">{item.quota}</span>
                  </td>
                  <td className="p-3 text-emerald-400 font-semibold">{item.passengers}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                      {item.chartStatus}
                    </span>
                  </td>
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
                      Track Live GPS
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
