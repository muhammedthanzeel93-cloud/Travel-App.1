'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Sparkles,
  ZoomIn,
  Search,
  Filter,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info,
  Clock,
  RotateCcw
} from 'lucide-react';

interface RoomItem {
  id: string;
  name: string;
  photo: string;
  basePrice: number;
  highlightTag: string;
  isApproved: boolean;
}

interface HotelProperty {
  id: string;
  name: string;
  city: string;
  address: string;
  status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  starRating: number;
  documents: {
    tradeLicense: string;
    fireNoc: string;
    propertyDeed: string;
  };
  rooms: RoomItem[];
}

const INITIAL_PROPERTIES: HotelProperty[] = [
  {
    id: 'h_1',
    name: 'Address Downtown Dubai',
    city: 'Dubai',
    address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai, UAE',
    status: 'VERIFIED',
    starRating: 5,
    documents: {
      tradeLicense: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80',
      fireNoc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
      propertyDeed: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80'
    },
    rooms: [
      {
        id: 'r_101',
        name: 'Deluxe Fountain View Suite',
        photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        basePrice: 18500,
        highlightTag: 'Direct Burj Fountain View 🌊',
        isApproved: true
      },
      {
        id: 'r_102',
        name: 'Presidential Spa Suite',
        photo: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        basePrice: 32000,
        highlightTag: 'Deep Soaking Jacuzzi Tub 🛁',
        isApproved: false
      }
    ]
  },
  {
    id: 'h_2',
    name: 'The Raviz Kadavu Luxury Resort',
    city: 'Calicut (Kozhikode)',
    address: 'NH 17, Calicut Bypass Road, Azhinjillam, Kerala',
    status: 'PENDING_VERIFICATION',
    starRating: 5,
    documents: {
      tradeLicense: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      fireNoc: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1000&q=80',
      propertyDeed: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80'
    },
    rooms: [
      {
        id: 'r_201',
        name: 'Heritage Riverview Cottage',
        photo: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
        basePrice: 7200,
        highlightTag: 'Serene Chaliyar River View 🛶',
        isApproved: false
      },
      {
        id: 'r_202',
        name: 'Ayurvedic Wellness Villa',
        photo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        basePrice: 9500,
        highlightTag: 'Private Herbal Plunge Pool 🌿',
        isApproved: true
      }
    ]
  },
  {
    id: 'h_3',
    name: 'Vythiri Rainforest Hideaway Resort',
    city: 'Wayanad',
    address: 'Lakkidi P.O., Vythiri, Wayanad, Kerala',
    status: 'VERIFIED',
    starRating: 4,
    documents: {
      tradeLicense: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80',
      fireNoc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
      propertyDeed: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1000&q=80'
    },
    rooms: [
      {
        id: 'r_301',
        name: 'Canopy Treehouse Villa',
        photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        basePrice: 12000,
        highlightTag: 'Mist Rainforest Canopy View 🌲',
        isApproved: true
      }
    ]
  }
];

export default function RoomOperationsPage() {
  const [hotels, setHotels] = useState<HotelProperty[]>(INITIAL_PROPERTIES);
  const [selectedDocZoom, setSelectedDocZoom] = useState<{ url: string; title: string; hotelName: string } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING_VERIFICATION'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDocZoom(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter properties based on search and status
  const filteredHotels = hotels.filter((hotel) => {
    const matchesSearch =
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ? true : hotel.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const verifiedCount = hotels.filter((h) => h.status === 'VERIFIED').length;
  const pendingCount = hotels.filter((h) => h.status === 'PENDING_VERIFICATION').length;
  const totalApprovedTags = hotels.reduce(
    (acc, h) => acc + h.rooms.filter((r) => r.isApproved).length,
    0
  );
  const totalRooms = hotels.reduce((acc, h) => acc + h.rooms.length, 0);

  const handleApproveHotel = (hotelId: string) => {
    setHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, status: 'VERIFIED' as const } : h))
    );
    setMessage({
      text: 'Partner Property documents successfully verified and marked VERIFIED! Live on traveler app.',
      type: 'success'
    });
  };

  const handleSuspendHotel = (hotelId: string) => {
    setHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, status: 'PENDING_VERIFICATION' as const } : h))
    );
    setMessage({
      text: 'Property verification status suspended and returned to PENDING for re-audit.',
      type: 'warning'
    });
  };

  const handleToggleTag = (hotelId: string, roomId: string) => {
    setHotels((prev) =>
      prev.map((h) => {
        if (h.id === hotelId) {
          return {
            ...h,
            rooms: h.rooms.map((r) =>
              r.id === roomId ? { ...r, isApproved: !r.isApproved } : r
            )
          };
        }
        return h;
      })
    );
    setMessage({
      text: 'Room photographic highlight badge status updated successfully.',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/operations/ticketing-desk"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Hotel &amp; Property Studio
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Property-Wise Operations Studio
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Host document inspection studio, photographic highlight approvals, and escrow settlement
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Escrow Rule: 24h Post Check-In</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-700/80 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Audit SLA: &lt; 4 Hours</span>
          </span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800/80 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Verified Partner Hotels
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">{verifiedCount}</span>
            <span className="text-xs text-emerald-400 font-bold">/ {hotels.length} Listed</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800/80 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Pending Document Audit
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-400">{pendingCount}</span>
            <span className="text-xs text-amber-400/80 font-semibold">Action required</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800/80 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Room Photo Highlights
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-indigo-400">{totalApprovedTags}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {totalRooms} Badges verified</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800/80 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
            Gross Escrow Volume
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-400">₹28.5 L</span>
            <span className="text-xs text-slate-400 font-semibold">100% Protected</span>
          </div>
        </div>
      </div>

      {/* Action Notification Toast Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : message.type === 'warning'
              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
              : 'bg-blue-950/80 border-blue-800 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="hover:underline font-bold text-xs ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b0f19] border border-slate-800">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Properties ({hotels.length})
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING_VERIFICATION')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'PENDING_VERIFICATION'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Audit ({pendingCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by hotel name, city (e.g. Dubai, Calicut)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHotels.length === 0 ? (
          <div className="lg:col-span-2 p-12 text-center bg-[#0b0f19] border border-slate-800 rounded-3xl space-y-3">
            <Building className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Properties Found</h3>
            <p className="text-xs text-slate-400">
              No hotels matched your search or status filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredHotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-[#0b0f19] border border-slate-800/90 rounded-3xl p-6 space-y-5 shadow-xl hover:border-slate-700 transition-all"
            >
              {/* Hotel Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-lg tracking-tight truncate">
                      {hotel.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {hotel.address}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-amber-400 text-xs">
                      {'★'.repeat(hotel.starRating)}
                    </span>
                    <span className="text-[11px] text-slate-500">•</span>
                    <span className="text-[11px] text-slate-400 font-semibold">{hotel.city}</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      hotel.status === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {hotel.status === 'VERIFIED' ? '✓ Verified Partner' : '⏳ Pending Audit'}
                  </span>
                </div>
              </div>

              {/* Document Inspection Studio Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Government Compliance Documents (Click to Zoom)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">3 Documents Listed</span>
                </div>

                {/* 3 Document Thumbnails */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Doc 1: Trade License */}
                  <div
                    onClick={() =>
                      setSelectedDocZoom({
                        url: hotel.documents.tradeLicense,
                        title: 'Commercial Trade License',
                        hotelName: hotel.name
                      })
                    }
                    className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 h-24 bg-slate-900 transition-all shadow-inner"
                  >
                    <img
                      src={hotel.documents.tradeLicense}
                      alt="Trade License"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white" />
                      <span className="text-[9px] text-amber-300 font-bold mt-1">Inspect</span>
                    </div>
                    <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white truncate text-center">
                      Trade License
                    </span>
                  </div>

                  {/* Doc 2: Fire Safety NOC */}
                  <div
                    onClick={() =>
                      setSelectedDocZoom({
                        url: hotel.documents.fireNoc,
                        title: 'Fire Safety NOC Certificate',
                        hotelName: hotel.name
                      })
                    }
                    className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 h-24 bg-slate-900 transition-all shadow-inner"
                  >
                    <img
                      src={hotel.documents.fireNoc}
                      alt="Fire NOC"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white" />
                      <span className="text-[9px] text-amber-300 font-bold mt-1">Inspect</span>
                    </div>
                    <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white truncate text-center">
                      Fire NOC
                    </span>
                  </div>

                  {/* Doc 3: Property Deed */}
                  <div
                    onClick={() =>
                      setSelectedDocZoom({
                        url: hotel.documents.propertyDeed,
                        title: 'Property Deed & Ownership Proof',
                        hotelName: hotel.name
                      })
                    }
                    className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 h-24 bg-slate-900 transition-all shadow-inner"
                  >
                    <img
                      src={hotel.documents.propertyDeed}
                      alt="Property Deed"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white" />
                      <span className="text-[9px] text-amber-300 font-bold mt-1">Inspect</span>
                    </div>
                    <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white truncate text-center">
                      Property Deed
                    </span>
                  </div>
                </div>

                {/* Property Verification Toggle Button */}
                <div className="pt-1">
                  {hotel.status === 'PENDING_VERIFICATION' ? (
                    <button
                      onClick={() => handleApproveHotel(hotel.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Partner Property &amp; Verify Documents</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspendHotel(hotel.id)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-400 border border-slate-800 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Suspend / Request Document Re-submission</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Room Photographic Highlight Studio */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Room Photographic Highlight Tags Review</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {hotel.rooms.filter((r) => r.isApproved).length}/{hotel.rooms.length} Approved
                  </span>
                </div>

                <div className="space-y-2.5">
                  {hotel.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={room.photo}
                          alt={room.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80';
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {room.name}
                          </span>
                          <span className="text-[11px] text-amber-400 font-semibold block mt-0.5">
                            {room.highlightTag}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ₹{room.basePrice.toLocaleString()} / night
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {room.isApproved ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black tracking-wide">
                              ✓ Verified Badge
                            </span>
                            <button
                              onClick={() => handleToggleTag(hotel.id, room.id)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-[10px] font-semibold border border-slate-800 transition-colors cursor-pointer"
                              title="Revoke verified badge"
                            >
                              Revoke
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleTag(hotel.id, room.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            Approve Tag
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* High-Resolution Document Inspection Zoom Modal */}
      {selectedDocZoom && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedDocZoom(null)}
        >
          <div
            className="max-w-3xl w-full bg-[#0b0f19] border border-slate-800 rounded-3xl overflow-hidden p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Official Verification Document Audit
                </span>
                <h3 className="text-base font-black text-white">
                  {selectedDocZoom.title}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Property: {selectedDocZoom.hotelName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(75, prev - 25))}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 px-1">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(200, prev + 25))}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDocZoom(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Image Preview Container */}
            <div className="max-h-[65vh] overflow-auto rounded-2xl bg-black border border-slate-800/80 p-2 flex items-center justify-center">
              <img
                src={selectedDocZoom.url}
                alt={selectedDocZoom.title}
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                className="max-w-full max-h-[60vh] object-contain rounded-xl transition-transform duration-200"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Press Esc or click outside to dismiss inspection
              </span>
              <button
                onClick={() => setSelectedDocZoom(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
