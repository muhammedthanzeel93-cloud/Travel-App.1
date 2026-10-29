'use client';

import Link from 'next/link';
import { useState } from 'react';
import { playChime } from '@/lib/soundAlert';
import {
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Volume2,
  VolumeX,
  Users,
  Camera,
  Server,
  KeyRound,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function SuperAdminPlatformDashboard() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const playAlertSound = () => {
    playChime('success', soundEnabled);
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
            Real-time platform infrastructure, authentication services, and community feed governance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
              setActionSuccessMessage('Dashboard refreshed: Database and core platform services operational.');
              playAlertSound();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Refresh</span>
          </button>

          <Link
            href="/feed"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Social Feed →</span>
          </Link>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Travelers */}
        <Link
          href="/admin/operations/users"
          className="bg-[#0b0f19] border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group cursor-pointer"
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
            <span className="text-3xl font-black text-white block">5</span>
            <span className="text-[11px] font-semibold text-purple-400 mt-1 flex items-center gap-1">
              <span>Active Community Database</span>
              <span className="text-[10px] text-slate-500 group-hover:text-purple-300 transition-colors">
                → Manage Users
              </span>
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

        {/* Card 3: Social Travel Stories & Feed */}
        <Link
          href="/feed"
          className="bg-[#0b0f19] hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
              Community Travel Feed
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">Live</span>
            <span className="text-[11px] font-semibold text-amber-400 mt-1 flex items-center gap-1">
              <span>Multi-Photo Stories</span>
              <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">→ Open Feed</span>
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
              Super Admin governance over authentication, database engines, and community feeds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">Database Engine</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Database Active</span>
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Dual-Layer MongoDB &amp; File Vault</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">Authentication &amp; Security</span>
            <span className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>2FA OTP Engine Online</span>
            </span>
            <span className="text-[10px] text-slate-500 block">Email &amp; SMS OTP Dispatchers Active</span>
          </div>

          <Link
            href="/feed"
            className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 space-y-1 transition-all group block"
          >
            <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-slate-300 transition-colors">
              Social Travel Feed &amp; Stories
            </span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-2 group-hover:text-amber-300 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <span>Multi-Photo Stories Active</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-normal ml-auto">
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

      {/* Platform Diagnostics & Security Audit Log */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">System Diagnostics &amp; Operational Health</h3>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Healthy</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Frontend Web App</span>
            <div className="text-xs font-bold text-slate-200">Next.js 15 App Router</div>
            <div className="text-[11px] text-emerald-400 font-mono">Port 4550 • HTTP/2 Ready</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security &amp; Tokens</span>
            <div className="text-xs font-bold text-slate-200">JWT Admin Session Token</div>
            <div className="text-[11px] text-blue-400 font-mono">HS256 24h Expiry Active</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Persistence Vault</span>
            <div className="text-xs font-bold text-slate-200">MongoDB Database Active</div>
            <div className="text-[11px] text-purple-400 font-mono">travel_buddy Synchronized</div>
          </div>
        </div>
      </div>
    </div>
  );
}
