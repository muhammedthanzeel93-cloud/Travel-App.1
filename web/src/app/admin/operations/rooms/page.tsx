'use client';

import { useState } from 'react';
import { Building, ShieldCheck, CheckCircle2, XCircle, FileText, Eye, AlertTriangle, Sparkles, ZoomIn } from 'lucide-react';

export default function RoomOperationsPage() {
  const [selectedDocZoom, setSelectedDocZoom] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [hotels, setHotels] = useState([
    {
      id: 'h_1',
      name: 'Address Downtown Dubai',
      city: 'Dubai',
      status: 'VERIFIED',
      starRating: 5,
      documents: {
        tradeLicense: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
        fireNoc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      rooms: [
        {
          id: 'r_101',
          name: 'Deluxe Fountain View Suite',
          photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          highlightTag: 'Direct Burj Fountain View 🌊',
          isApproved: true
        },
        {
          id: 'r_102',
          name: 'Presidential Spa Suite',
          photo: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
          highlightTag: 'Deep Soaking Jacuzzi Tub 🛁',
          isApproved: false
        }
      ]
    },
    {
      id: 'h_2',
      name: 'The Raviz Kadavu Luxury Resort',
      city: 'Calicut (Kozhikode)',
      status: 'PENDING_VERIFICATION',
      starRating: 5,
      documents: {
        tradeLicense: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
        fireNoc: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80'
      },
      rooms: [
        {
          id: 'r_201',
          name: 'Heritage Riverview Cottage',
          photo: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
          highlightTag: 'Serene Chaliyar River View 🛶',
          isApproved: false
        }
      ]
    }
  ]);

  const handleApproveTag = (hotelId: string, roomId: string) => {
    setHotels((prev) =>
      prev.map((h) => {
        if (h.id === hotelId) {
          return {
            ...h,
            rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, isApproved: true } : r))
          };
        }
        return h;
      })
    );
    setMessage('Room Photo Highlight approved! Badge is now verified and visible to travelers.');
  };

  const handleApproveHotel = (hotelId: string) => {
    setHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, status: 'VERIFIED' } : h))
    );
    setMessage('Partner Hotel trade license & safety documents verified and approved!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">🏨 Room &amp; Hotel Stay Operations Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Host document inspection studio, photographic highlight approvals, and escrow settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Escrow Rule: 24h Post Check-In
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Verified Partner Hotels</span>
          <span className="block text-2xl font-black text-white mt-1">28</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Average Occupancy</span>
          <span className="block text-2xl font-black text-emerald-400 mt-1">78.5%</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Gross Room Revenue</span>
          <span className="block text-2xl font-black text-blue-400 mt-1">₹28.5 Lakhs</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Pending Verification</span>
          <span className="block text-2xl font-black text-amber-400 mt-1">
            {hotels.filter((h) => h.status === 'PENDING_VERIFICATION').length}
          </span>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Hotel Verification & Photo Highlight Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">{hotel.name}</h3>
                <span className="text-xs text-slate-400">{hotel.city} • {'★'.repeat(hotel.starRating)}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  hotel.status === 'VERIFIED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {hotel.status}
              </span>
            </div>

            {/* Document Inspection Studio */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Document Inspection Studio (Click to Zoom)</span>
              </span>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setSelectedDocZoom(hotel.documents.tradeLicense)}
                  className="group relative cursor-pointer rounded-lg overflow-hidden border border-slate-700 h-24"
                >
                  <img src={hotel.documents.tradeLicense} alt="Trade License" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white">
                    Trade License
                  </span>
                </div>

                <div
                  onClick={() => setSelectedDocZoom(hotel.documents.fireNoc)}
                  className="group relative cursor-pointer rounded-lg overflow-hidden border border-slate-700 h-24"
                >
                  <img src={hotel.documents.fireNoc} alt="Fire Safety NOC" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white">
                    Fire Safety NOC
                  </span>
                </div>
              </div>

              {hotel.status === 'PENDING_VERIFICATION' && (
                <button
                  onClick={() => handleApproveHotel(hotel.id)}
                  className="w-full mt-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
                >
                  Approve Hotel Verification
                </button>
              )}
            </div>

            {/* Room Photo Highlight Studio Inspector */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Room Photographic Highlight Tags Review</span>
              </span>

              <div className="space-y-2">
                {hotel.rooms.map((room) => (
                  <div key={room.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={room.photo} alt={room.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <span className="text-xs font-bold text-white block">{room.name}</span>
                        <span className="text-[11px] text-amber-400 font-medium">{room.highlightTag}</span>
                      </div>
                    </div>

                    <div>
                      {room.isApproved ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          ✓ Verified Badge
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveTag(hotel.id, room.id)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
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
        ))}
      </div>

      {/* Document Zoom Modal */}
      {selectedDocZoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Government Trade License &amp; Safety Certificate Inspection</span>
              <button onClick={() => setSelectedDocZoom(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕ Close</button>
            </div>
            <img src={selectedDocZoom} alt="High Res Inspection" className="w-full max-h-[70vh] object-contain rounded-xl bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
