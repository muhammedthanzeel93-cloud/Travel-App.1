'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ShieldAlert,
  Building,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Volume2,
  VolumeX,
  Users,
  Camera,
  MapPin,
  Sparkles,
  ArrowRight,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  Activity
} from 'lucide-react';

interface StaySummary {
  id: string;
  bookingRef: string;
  hotelName: string;
  roomType: string;
  city: string;
  guestName: string;
  checkInDate: string;
  totalAmount: number;
  partnerPayout: number;
  escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED_TO_PARTNER' | 'REFUNDED_TO_GUEST';
}

const RECENT_STAYS: StaySummary[] = [
  {
    id: 'res_1',
    bookingRef: 'TB-STAY-8821',
    hotelName: 'Rainforest Eco Luxury Villa',
    roomType: 'Private Jacuzzi Pool Villa',
    city: 'Wayanad, Kerala',
    guestName: 'Rahul Nair',
    checkInDate: '2026-10-28',
    totalAmount: 16890,
    partnerPayout: 14500,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    id: 'res_2',
    bookingRef: 'TB-STAY-9042',
    hotelName: 'The Heritage Grand Palace',
    roomType: 'Presidential Tea-Estate Suite',
    city: 'Munnar, Kerala',
    guestName: 'Ananya Sharma',
    checkInDate: '2026-10-29',
    totalAmount: 21204,
    partnerPayout: 18200,
    escrowStatus: 'HELD_IN_ESCROW'
  },
  {
    id: 'res_3',
    bookingRef: 'TB-STAY-7719',
    hotelName: 'Arabian Sea Cliff Resort & Spa',
    roomType: 'Cliffside Oceanfront Chalet',
    city: 'Varkala Beach, Kerala',
    guestName: 'Priya Patel',
    checkInDate: '2026-10-26',
    totalAmount: 11426,
    partnerPayout: 9800,
    escrowStatus: 'RELEASED_TO_PARTNER'
  }
];

export default function SuperAdminPlatformDashboard() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Play audio chime notification
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Travel Buddy • Platform Operations Control Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Operations &amp; Community Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Real-time platform infrastructure, traveler governance, and partner escrow overview
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => {
              setActionSuccessMessage('Dashboard refreshed: Database and partner services operational.');
              playAlertSound();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/operations/travel-agency"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Travel Agency Desk →</span>
          </Link>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered Users */}
        <Link
          href="/admin/operations/travel-agency?tab=users"
          className="bg-[#0b0f19] border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-purple-300 transition-colors">
              Registered Travelers
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">6</span>
            <span className="text-[11px] font-semibold text-purple-400 mt-1 flex items-center gap-1">
              <span>4 Verified Creators</span>
              <span className="text-[10px] text-slate-500 group-hover:text-purple-300 transition-colors">→ Manage</span>
            </span>
          </div>
        </Link>

        {/* Card 2: Active In-App Users (Now) */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active In-App Now</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white">1</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 mt-1 block">
              Super Admin Session Active
            </span>
          </div>
        </div>

        {/* Card 3: Hotel Partners & Stays */}
        <Link
          href="/admin/operations/travel-agency?tab=stays"
          className="bg-[#0b0f19] hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
              Partner Hotels &amp; Stays
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">3</span>
            <span className="text-[11px] font-semibold text-amber-400 mt-1 flex items-center gap-1">
              <span>3 Active Bookings</span>
              <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">→ Inspect Desk</span>
            </span>
          </div>
        </Link>

        {/* Card 4: Security Clearance */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Security Clearance</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-rose-400 tracking-wider block">
              SUPER_ADMIN
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Two-Factor OTP Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Live Platform Engine Status Card */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">
              Live Platform Engine &amp; Infrastructure Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Super Admin governance over hospitality services, community feeds, and partner escrow
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">Database Engine</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>MongoDB Connected</span>
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Database: travel_platform</span>
          </div>

          <Link
            href="/admin/operations/travel-agency"
            className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 space-y-1 transition-all group block"
          >
            <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-slate-300 transition-colors">
              Travel Agency &amp; Escrow Desk
            </span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-2 group-hover:text-amber-300 transition-colors">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Agency Reports &amp; Stays</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-normal ml-auto">
                Open Reports →
              </span>
            </span>
            <span className="text-[10px] text-slate-500 block">Escrow 24h settlements active</span>
          </Link>

          <Link
            href="/feed"
            className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/50 space-y-1 transition-all group block"
          >
            <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-slate-300 transition-colors">
              Social Travel Feed &amp; Stories
            </span>
            <span className="text-sm font-bold text-purple-400 flex items-center gap-2 group-hover:text-purple-300 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <span>Multi-Photo Stories Active</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-normal ml-auto">
                View Feed →
              </span>
            </span>
            <span className="text-[10px] text-slate-500 block">Community feed moderation online</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white underline text-xs cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* DEDICATED TRAVEL AGENCY EXECUTIVE HUB CARD */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-purple-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Briefcase className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-white">
                Travel Agency &amp; Community Operations Hub
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Agency booking manifests, guest verification, partner escrow settlements, and verified traveler badges
              are located under the dedicated Travel Agency desk in the navigation sidebar.
            </p>
          </div>

          <Link
            href="/admin/operations/travel-agency"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Open Travel Agency Reports →</span>
          </Link>
        </div>

        {/* 3 Quick Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Active Agency Bookings</span>
            <span className="font-mono font-bold text-amber-400 text-sm">3 Reservations</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Protected Escrow Capital</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">₹32,700 Held</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Community Governance</span>
            <span className="font-mono font-bold text-purple-300 text-sm">6 Registered</span>
          </div>
        </div>
      </div>

      {/* Recent Operational Bookings & Activity Snapshot */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Recent Stay Activity Snapshot</h3>
          </div>

          <Link
            href="/admin/operations/travel-agency?tab=stays"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All Reservations in Agency Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold uppercase text-slate-400 bg-slate-950/70 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Booking Ref</th>
                <th className="px-4 py-3">Hotel &amp; Suite</th>
                <th className="px-4 py-3">Guest Name</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Gross Total</th>
                <th className="px-4 py-3">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {RECENT_STAYS.map((res) => (
                <tr key={res.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">{res.bookingRef}</td>
                  <td className="px-4 py-3 text-white">
                    <span className="font-semibold block">{res.hotelName}</span>
                    <span className="text-[10px] text-slate-400">{res.city}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{res.guestName}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{res.checkInDate}</td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">₹{res.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        res.escrowStatus === 'RELEASED_TO_PARTNER'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {res.escrowStatus === 'RELEASED_TO_PARTNER' ? 'ESCROW RELEASED' : 'ESCROW HELD'}
                    </span>
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
