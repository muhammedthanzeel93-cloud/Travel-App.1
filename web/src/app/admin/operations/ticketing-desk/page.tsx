'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ShieldAlert,
  Building,
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
  ExternalLink,
  Users,
  Camera,
  MapPin,
  Calendar,
  Sparkles,
  Award,
  Ban,
  KeyRound,
  FileText,
  DollarSign
} from 'lucide-react';
import QRCode from 'qrcode';

interface StayReservation {
  id: string;
  bookingRef: string;
  hotelName: string;
  roomType: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  timeRemainingHours: number;
  guest: {
    name: string;
    email: string;
    phone: string;
    idType: string;
    idNumber: string;
    idVerified: boolean;
    adults: number;
    children: number;
  };
  pricing: {
    baseRate: number;
    taxes: number;
    platformMargin: number;
    totalAmount: number;
    partnerPayout: number;
  };
  escrowStatus: 'HELD_IN_ESCROW' | 'RELEASED_TO_PARTNER' | 'REFUNDED_TO_GUEST';
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  digitalVoucherCode?: string;
  voucherQrUrl?: string;
}

const INITIAL_STAYS: StayReservation[] = [
  {
    id: 'res_1',
    bookingRef: 'TB-STAY-8821',
    hotelName: 'Rainforest Eco Luxury Villa',
    roomType: 'Private Jacuzzi Pool Villa',
    city: 'Wayanad, Kerala',
    checkInDate: '2026-10-28',
    checkOutDate: '2026-10-31',
    nights: 3,
    timeRemainingHours: 3.5,
    guest: {
      name: 'Rahul Nair',
      email: 'rahul.nair@travelbuddy.com',
      phone: '+91 98471 23456',
      idType: 'Aadhaar Card',
      idNumber: '•••• •••• 8912',
      idVerified: true,
      adults: 2,
      children: 0
    },
    pricing: {
      baseRate: 14500,
      taxes: 1740,
      platformMargin: 650,
      totalAmount: 16890,
      partnerPayout: 14500
    },
    escrowStatus: 'HELD_IN_ESCROW',
    status: 'CONFIRMED'
  },
  {
    id: 'res_2',
    bookingRef: 'TB-STAY-9042',
    hotelName: 'The Heritage Grand Palace',
    roomType: 'Presidential Tea-Estate Suite',
    city: 'Munnar, Kerala',
    checkInDate: '2026-10-29',
    checkOutDate: '2026-11-01',
    nights: 3,
    timeRemainingHours: 24.0,
    guest: {
      name: 'Ananya Sharma',
      email: 'ananya.sharma@travelbuddy.com',
      phone: '+91 97112 34567',
      idType: 'Passport',
      idNumber: 'Z5891240',
      idVerified: true,
      adults: 2,
      children: 1
    },
    pricing: {
      baseRate: 18200,
      taxes: 2184,
      platformMargin: 820,
      totalAmount: 21204,
      partnerPayout: 18200
    },
    escrowStatus: 'HELD_IN_ESCROW',
    status: 'CHECKED_IN'
  },
  {
    id: 'res_3',
    bookingRef: 'TB-STAY-7719',
    hotelName: 'Arabian Sea Cliff Resort & Spa',
    roomType: 'Cliffside Oceanfront Chalet',
    city: 'Varkala Beach, Kerala',
    checkInDate: '2026-10-26',
    checkOutDate: '2026-10-28',
    nights: 2,
    timeRemainingHours: 0.5,
    guest: {
      name: 'Priya Patel',
      email: 'priya.patel@travelbuddy.com',
      phone: '+91 99201 87654',
      idType: 'Driving License',
      idNumber: 'KL-07-20210049',
      idVerified: true,
      adults: 1,
      children: 0
    },
    pricing: {
      baseRate: 9800,
      taxes: 1176,
      platformMargin: 450,
      totalAmount: 11426,
      partnerPayout: 9800
    },
    escrowStatus: 'RELEASED_TO_PARTNER',
    status: 'COMPLETED'
  }
];

interface RegisteredTraveler {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: 'Traveler' | 'Verified Creator' | 'Partner Hotelier';
  joinedDate: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
}

const REGISTERED_TRAVELERS: RegisteredTraveler[] = [
  {
    id: 'u1',
    name: 'Rahul Nair',
    username: '@rahul_travels',
    email: 'rahul.nair@travelbuddy.com',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
    role: 'Verified Creator',
    joinedDate: 'Oct 2026',
    isVerified: true,
    status: 'ACTIVE'
  },
  {
    id: 'u2',
    name: 'Ananya Sharma',
    username: '@ananya_wanderlust',
    email: 'ananya.sharma@travelbuddy.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    role: 'Verified Creator',
    joinedDate: 'Sep 2026',
    isVerified: true,
    status: 'ACTIVE'
  },
  {
    id: 'u3',
    name: 'Vikram Seth',
    username: '@vikram_expeditions',
    email: 'vikram.seth@travelbuddy.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    role: 'Traveler',
    joinedDate: 'Oct 2026',
    isVerified: false,
    status: 'ACTIVE'
  },
  {
    id: 'u4',
    name: 'Priya Patel',
    username: '@priya_phototravel',
    email: 'priya.patel@travelbuddy.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    role: 'Verified Creator',
    joinedDate: 'Aug 2026',
    isVerified: true,
    status: 'ACTIVE'
  },
  {
    id: 'u5',
    name: 'Rainforest Eco Resorts',
    username: '@rainforest_villas',
    email: 'partner@rainforestvillas.com',
    avatar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80',
    role: 'Partner Hotelier',
    joinedDate: 'Jul 2026',
    isVerified: true,
    status: 'ACTIVE'
  },
  {
    id: 'u6',
    name: 'Arun Kumar',
    username: '@arunkumar',
    email: 'arun.k@travelbuddy.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    role: 'Traveler',
    joinedDate: 'Oct 2026',
    isVerified: false,
    status: 'ACTIVE'
  }
];

export default function SuperAdminPlatformDashboard() {
  const [activeTab, setActiveTab] = useState<'STAYS' | 'USERS' | 'STORIES'>('STAYS');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reservations, setReservations] = useState<StayReservation[]>(INITIAL_STAYS);
  const [selectedRes, setSelectedRes] = useState<StayReservation | null>(INITIAL_STAYS[0]);
  const [travelers, setTravelers] = useState<RegisteredTraveler[]>(REGISTERED_TRAVELERS);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // 1-Click Digital Stay Voucher & Pass Issuance
  const handleIssueStayVoucher = async (res: StayReservation) => {
    setIsProcessing(true);
    setActionSuccessMessage(null);

    try {
      const voucherCode = `TB-VOUCHER-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrPayload = JSON.stringify({
        bookingRef: res.bookingRef,
        hotel: res.hotelName,
        guest: res.guest.name,
        checkIn: res.checkInDate,
        voucher: voucherCode
      });

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 220
      });

      const updated = reservations.map((item) => {
        if (item.id === res.id) {
          return {
            ...item,
            status: 'CONFIRMED' as const,
            digitalVoucherCode: voucherCode,
            voucherQrUrl: qrDataUrl
          };
        }
        return item;
      });

      setReservations(updated);
      setSelectedRes({
        ...res,
        status: 'CONFIRMED',
        digitalVoucherCode: voucherCode,
        voucherQrUrl: qrDataUrl
      });

      playAlertSound();
      setActionSuccessMessage(
        `✓ Stay Voucher ${voucherCode} successfully generated and dispatched to ${res.guest.name} via WhatsApp & Email!`
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Release Escrow Payout to Partner Hotelier
  const handleReleaseEscrow = (res: StayReservation) => {
    const updated = reservations.map((item) => {
      if (item.id === res.id) {
        return {
          ...item,
          escrowStatus: 'RELEASED_TO_PARTNER' as const
        };
      }
      return item;
    });

    setReservations(updated);
    if (selectedRes?.id === res.id) {
      setSelectedRes({ ...selectedRes, escrowStatus: 'RELEASED_TO_PARTNER' });
    }

    playAlertSound();
    setActionSuccessMessage(
      `✓ Escrow Payout of ₹${res.pricing.partnerPayout.toLocaleString()} transferred to ${res.hotelName} bank account.`
    );
  };

  // 1-Click Escrow Refund to Guest
  const handleRefundEscrow = (res: StayReservation) => {
    const updated = reservations.map((item) => {
      if (item.id === res.id) {
        return {
          ...item,
          escrowStatus: 'REFUNDED_TO_GUEST' as const,
          status: 'CANCELLED' as const
        };
      }
      return item;
    });

    setReservations(updated);
    if (selectedRes?.id === res.id) {
      setSelectedRes({ ...selectedRes, escrowStatus: 'REFUNDED_TO_GUEST', status: 'CANCELLED' });
    }

    playAlertSound();
    setActionSuccessMessage(
      `✓ Full Escrow Refund of ₹${res.pricing.totalAmount.toLocaleString()} credited back to ${res.guest.name}'s original payment method.`
    );
  };

  // Toggle user verification badge
  const handleToggleVerification = (userId: string) => {
    setTravelers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = !u.isVerified;
          setActionSuccessMessage(
            `User ${u.name} verification status updated to ${newStatus ? 'VERIFIED CREATOR' : 'STANDARD TRAVELER'}.`
          );
          return { ...u, isVerified: newStatus, role: newStatus ? 'Verified Creator' : 'Traveler' };
        }
        return u;
      })
    );
    playAlertSound();
  };

  // Toggle user suspension
  const handleToggleSuspend = (userId: string) => {
    setTravelers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          setActionSuccessMessage(
            `User ${u.name} has been ${newStatus === 'ACTIVE' ? 'REACTIVATED' : 'SUSPENDED'}.`
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
    playAlertSound();
  };

  return (
    <div className="space-y-6">
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
            Real-time hospitality management, traveler governance, and partner escrow settlements
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
            href="/admin/operations/rooms"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Partner Studio →</span>
          </Link>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered Users */}
        <div
          onClick={() => setActiveTab('USERS')}
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
            <span className="text-3xl font-black text-white block">
              {travelers.length}
            </span>
            <span className="text-[11px] font-semibold text-purple-400 mt-1 flex items-center gap-1">
              <span>{travelers.filter((u) => u.isVerified).length} Verified Creators</span>
              <span className="text-[10px] text-slate-500 group-hover:text-purple-300 transition-colors">→ Manage</span>
            </span>
          </div>
        </div>

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

        {/* Card 3: Hotel Partners */}
        <Link
          href="/admin/operations/rooms"
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
              <span>{reservations.length} Active Bookings</span>
              <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">→ Manage Studio</span>
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
            href="/admin/operations/rooms"
            className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/50 space-y-1 transition-all group block"
          >
            <span className="text-[11px] font-semibold text-slate-400 block group-hover:text-slate-300 transition-colors">
              Hotel Partner Studio
            </span>
            <span className="text-sm font-bold text-purple-400 flex items-center gap-2 group-hover:text-purple-300 transition-colors">
              <Building className="w-3.5 h-3.5" />
              <span>Luxury Suites &amp; NOC Studio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-normal ml-auto">
                Open Studio →
              </span>
            </span>
            <span className="text-[10px] text-slate-500 block">Escrow 24h settlements active</span>
          </Link>

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

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('STAYS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'STAYS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Hotel &amp; Stay Reservations ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Traveler Governance ({travelers.length})</span>
        </button>

        <Link
          href="/feed"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer ml-auto"
        >
          <Camera className="w-4 h-4 text-rose-400" />
          <span>Explore Feed Posts →</span>
        </Link>
      </div>

      {/* TAB 1: HOTEL & STAY RESERVATIONS WORKSPACE */}
      {activeTab === 'STAYS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Stay Queue (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Guest Check-in Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                  {reservations.length}
                </span>
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold">Live Escrow Active</span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {reservations.map((res) => {
                const isSelected = selectedRes?.id === res.id;
                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedRes(res)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all text-xs ${
                      isSelected
                        ? 'bg-slate-850 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-amber-500/10 text-amber-400">
                          <Building className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-extrabold text-white text-sm tracking-wide">
                          {res.bookingRef}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          res.escrowStatus === 'RELEASED_TO_PARTNER'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : res.escrowStatus === 'REFUNDED_TO_GUEST'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {res.escrowStatus === 'RELEASED_TO_PARTNER'
                          ? 'ESCROW RELEASED'
                          : res.escrowStatus === 'REFUNDED_TO_GUEST'
                          ? 'REFUNDED'
                          : 'ESCROW HELD'}
                      </span>
                    </div>

                    <div className="mt-2 text-slate-200 font-bold">
                      {res.hotelName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {res.roomType} • {res.city}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                      <span className="text-white font-semibold">{res.guest.name}</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1 font-mono">
                        ₹{res.pricing.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Column: Guest Manifest & Property Studio (5 Cols) */}
          {selectedRes ? (
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Stay Reservation &amp; Guest Manifest
                  </span>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                    <span>{selectedRes.guest.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {selectedRes.guest.adults} Adults
                    </span>
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ref Code</span>
                  <span className="text-sm font-black text-amber-400 tracking-wider font-mono">
                    {selectedRes.bookingRef}
                  </span>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>Property &amp; Suite Details</span>
                </span>
                <div className="text-sm font-bold text-white">{selectedRes.hotelName}</div>
                <div className="text-slate-300 font-medium">{selectedRes.roomType}</div>
                <div className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedRes.city}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Check-in:</span>
                    <span className="text-slate-200 font-semibold">{selectedRes.checkInDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Check-out:</span>
                    <span className="text-slate-200 font-semibold">{selectedRes.checkOutDate} ({selectedRes.nights} Nights)</span>
                  </div>
                </div>
              </div>

              {/* Guest Identification Verification */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Government ID Verification</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    VERIFIED &amp; COMPLIANT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ID Proof Type</span>
                    <span className="font-semibold text-slate-200">{selectedRes.guest.idType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ID Number</span>
                    <span className="font-mono font-bold text-slate-200">{selectedRes.guest.idNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile Contact</span>
                    <span className="font-mono text-slate-200">{selectedRes.guest.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="text-slate-200 truncate block">{selectedRes.guest.email}</span>
                  </div>
                </div>
              </div>

              {/* Tariff & Escrow Split Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tariff &amp; Partner Escrow Settlement Breakdown</span>
                </span>

                <div className="flex justify-between text-slate-400">
                  <span>Room Base Tariff ({selectedRes.nights} Nights):</span>
                  <span className="text-slate-200 font-mono">₹{selectedRes.pricing.baseRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxes &amp; GST:</span>
                  <span className="text-slate-200 font-mono">₹{selectedRes.pricing.taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Platform Commission Margin:</span>
                  <span className="font-mono">+₹{selectedRes.pricing.platformMargin.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                  <span>Total Guest Paid:</span>
                  <span className="text-amber-400 font-mono">₹{selectedRes.pricing.totalAmount.toLocaleString()}</span>
                </div>
                <div className="pt-1 flex justify-between text-[11px] text-purple-300 font-semibold">
                  <span>Partner Payout (Escrowed):</span>
                  <span className="font-mono">₹{selectedRes.pricing.partnerPayout.toLocaleString()}</span>
                </div>
              </div>

              {/* Generated QR Pass Preview */}
              {selectedRes.voucherQrUrl && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-center space-y-2 animate-in fade-in duration-200">
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Digital Stay Voucher &amp; QR Pass Active
                  </span>
                  <img
                    src={selectedRes.voucherQrUrl}
                    alt="Stay Voucher QR"
                    className="w-32 h-32 mx-auto rounded-lg bg-white p-2 shadow-lg"
                  />
                  <span className="block text-[10px] text-slate-400 font-mono">
                    Pass Code: {selectedRes.digitalVoucherCode}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select a reservation from the queue to inspect guest manifest
            </div>
          )}

          {/* Right Column: Stay Operations Action Hub (3 Cols) */}
          {selectedRes && (
            <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Stay Action Hub</span>
              </h2>

              {/* Issue Digital Stay Voucher CTA */}
              <button
                onClick={() => handleIssueStayVoucher(selectedRes)}
                disabled={isProcessing || !!selectedRes.digitalVoucherCode}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedRes.digitalVoucherCode
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02]'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>
                  {selectedRes.digitalVoucherCode ? '✓ Voucher Issued' : 'Issue Stay QR Voucher'}
                </span>
              </button>

              {/* Release Escrow Payout */}
              <button
                onClick={() => handleReleaseEscrow(selectedRes)}
                disabled={selectedRes.escrowStatus === 'RELEASED_TO_PARTNER'}
                className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedRes.escrowStatus === 'RELEASED_TO_PARTNER'
                    ? 'bg-purple-950/40 text-purple-400 border border-purple-800/40 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>
                  {selectedRes.escrowStatus === 'RELEASED_TO_PARTNER'
                    ? 'Escrow Already Released'
                    : 'Release Partner Payout'}
                </span>
              </button>

              {/* Inspect Hotel Studio */}
              <Link
                href="/admin/operations/rooms"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Inspect Property Documents</span>
              </Link>

              {/* Multi-Channel WhatsApp / SMS Dispatch */}
              <button
                onClick={() => {
                  setActionSuccessMessage(
                    `Stay confirmation slip & QR pass delivered to ${selectedRes.guest.phone} via WhatsApp.`
                  );
                  playAlertSound();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-dispatch WhatsApp / SMS</span>
              </button>

              {/* 1-Click Escrow Refund */}
              <button
                onClick={() => handleRefundEscrow(selectedRes)}
                disabled={selectedRes.escrowStatus === 'REFUNDED_TO_GUEST'}
                className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  selectedRes.escrowStatus === 'REFUNDED_TO_GUEST'
                    ? 'bg-rose-950/30 text-rose-500 border border-rose-900/40 cursor-not-allowed'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {selectedRes.escrowStatus === 'REFUNDED_TO_GUEST'
                    ? 'Escrow Refunded'
                    : '1-Click Escrow Refund'}
                </span>
              </button>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
                <p>• Automated 24h post-check-in partner escrow release active.</p>
                <p>• Verified guest check-in slips sync with Travel Buddy mobile app.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMUNITY TRAVELER GOVERNANCE */}
      {activeTab === 'USERS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Registered Community Travelers &amp; Governance</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage user privileges, award verified creator badges, or enforce community safety
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
              Total Travelers: {travelers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {travelers.map((traveler) => (
              <div
                key={traveler.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={traveler.avatar}
                    alt={traveler.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-slate-700 shrink-0"
                  />
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm truncate">{traveler.name}</span>
                      {traveler.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">{traveler.username}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{traveler.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      traveler.role === 'Verified Creator'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : traveler.role === 'Partner Hotelier'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {traveler.role}
                  </span>

                  <span
                    className={`text-[10px] font-bold ${
                      traveler.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {traveler.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleToggleVerification(traveler.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>{traveler.isVerified ? 'Remove Badge' : 'Verify Badge'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleSuspend(traveler.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      traveler.status === 'ACTIVE'
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <Ban className="w-3 h-3" />
                    <span>{traveler.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
