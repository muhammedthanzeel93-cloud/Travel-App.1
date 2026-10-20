'use client';

import Link from 'next/link';
import {
  ShieldAlert,
  Plane,
  Train,
  Map,
  Camera,
  HardDrive,
  CheckCircle2,
  TrendingUp,
  FileText,
  Building,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/60 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>IATA Resolution 792 & IRCTC PRS Verified Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Enterprise Travel Platform &amp;{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
              Super Admin Command Suite
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Full-stack enterprise operations hub delivering real-world aviation (6-character PNRs, 13-digit IATA e-tickets, 2D BCBP barcodes), PRS rail quota ticketing, dynamic 10-day Dubai visa customizer, and 4-hour offline-first resilience.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/admin/operations/ticketing-desk"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <ShieldAlert className="w-4 h-4" />
              Launch Super Admin Ticketing Desk
            </Link>

            <Link
              href="/customizer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <Map className="w-4 h-4 text-blue-400" />
              Dubai 10-Day Visa Planner
            </Link>
          </div>
        </div>

        {/* Live Metrics Ticker */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div>
            <span className="block text-2xl font-black text-amber-400">3 Orders</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Awaiting Admin Issuance
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-white">187 Today</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Issued Tickets
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-blue-400">890 Active</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-400" /> PNRs Tracked
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-emerald-400">4+ Hours</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-emerald-400" /> Offline Vault Caching
            </span>
          </div>
        </div>
      </div>

      {/* Primary Feature Matrix */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>Core Operational Verticals &amp; Modules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Super Admin Ticketing Desk */}
          <Link
            href="/admin/operations/ticketing-desk"
            className="group p-6 rounded-2xl bg-slate-900/60 border border-amber-500/30 hover:border-amber-400/80 transition-all hover:bg-slate-900/90 hover:shadow-xl hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors flex items-center justify-between">
              <span>Super Admin Ticketing Desk</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real-time order reception with audio alert, APIS passport verification, 1-click issuance of 13-digit IATA e-tickets &amp; BCBP 2D barcodes.
            </p>
          </Link>

          {/* Card 2: Flights Booking */}
          <Link
            href="/flights"
            className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/60 transition-all hover:bg-slate-900/90 hover:shadow-xl hover:shadow-blue-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plane className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors flex items-center justify-between">
              <span>IATA Flight Booking Studio</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Calicut (CCJ) to Dubai (DXB) flight inventory, APIS passport validation (&gt;6 months check), interactive seat picker, and IATA fare construction.
            </p>
          </Link>

          {/* Card 3: Trains Booking */}
          <Link
            href="/trains"
            className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/60 transition-all hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Train className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors flex items-center justify-between">
              <span>PRS Railway Ticketing Studio</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              10-digit rail PNR assignment, Tatkal &amp; Ladies quotas, smart berth engine allocating lower berths for senior citizens, and Charting tracking.
            </p>
          </Link>

          {/* Card 4: Dubai 10-Day Visa Customizer */}
          <Link
            href="/customizer"
            className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/60 transition-all hover:bg-slate-900/90 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors flex items-center justify-between">
              <span>Dubai 10-Day Visa Customizer</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Interactive Google Maps route builder, day-by-day attraction clusters (Burj Khalifa, Desert Safari, Palm Jumeirah), and drag-and-drop customization.
            </p>
          </Link>

          {/* Card 5: Social Feed & Reels */}
          <Link
            href="/feed"
            className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/60 transition-all hover:bg-slate-900/90 hover:shadow-xl hover:shadow-pink-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-pink-400 transition-colors flex items-center justify-between">
              <span>Travel-Social Feed &amp; Reels</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Multi-image swipeable carousels, double-tap heart animations, vertical Travel Reels, 24-hour stories with interactive stickers, and audio voice DMs.
            </p>
          </Link>

          {/* Card 6: 4-Hour Offline Vault */}
          <Link
            href="/vault"
            className="group p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/60 transition-all hover:bg-slate-900/90 hover:shadow-xl hover:shadow-teal-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors flex items-center justify-between">
              <span>4-Hour Offline Mobile Vault</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Pre-cached BCBP 2D boarding passes and IRCTC rail ERS slips with IndexedDB persistence that scans seamlessly in airplane mode.
            </p>
          </Link>
        </div>
      </div>

      {/* Multi-Vertical Operations Dashboards Banner */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm">Dedicated Multi-Vertical Super Admin Command Suite</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor flight sectors, rail charts, and hotel document verification desks independently.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/operations/flights"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Plane className="w-3.5 h-3.5 text-blue-400" /> Flight Operations
          </Link>
          <Link
            href="/admin/operations/trains"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Train className="w-3.5 h-3.5 text-indigo-400" /> Rail Operations
          </Link>
          <Link
            href="/admin/operations/rooms"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-emerald-400" /> Room Operations
          </Link>
        </div>
      </div>
    </div>
  );
}
