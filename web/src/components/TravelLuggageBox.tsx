'use client';

import React, { useState } from 'react';
import {
  Plane,
  Sparkles,
  MapPin,
  Globe2,
  Tag,
  Ticket,
  ShieldCheck,
  Luggage,
  Compass
} from 'lucide-react';

export default function TravelLuggageBox() {
  const [activeSticker, setActiveSticker] = useState<string | null>(null);

  const stickers = [
    {
      id: 'dubai',
      title: 'DUBAI',
      subtitle: 'BURJ KHALIFA 148F',
      color: 'from-amber-500/30 to-orange-600/30 border-amber-500/50 text-amber-300',
      tag: '🏜️ Desert Sunset',
      rotate: '-rotate-3'
    },
    {
      id: 'kerala',
      title: 'KERALA',
      subtitle: "GOD'S OWN COUNTRY",
      color: 'from-emerald-500/30 to-teal-600/30 border-emerald-500/50 text-emerald-300',
      tag: '🌴 Backwaters & Wayanad',
      rotate: 'rotate-2'
    },
    {
      id: 'swiss',
      title: 'SWISS ALPS',
      subtitle: 'ZERMATT • 4478M',
      color: 'from-sky-500/30 to-blue-600/30 border-sky-500/50 text-sky-300',
      tag: '🏔️ Snow Peaks',
      rotate: '-rotate-2'
    },
    {
      id: 'tokyo',
      title: 'TOKYO',
      subtitle: 'SHIBUYA SKY',
      color: 'from-rose-500/30 to-pink-600/30 border-rose-500/50 text-rose-300',
      tag: '⛩️ Cherry Blossom',
      rotate: 'rotate-3'
    }
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between">
      {/* Background Ambient Glow */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-indigo-500/10 rounded-3xl blur-2xl -z-10" />

      {/* The Travel Suitcase ("ട്രാവൽ പെട്ടി") Container */}
      <div className="relative bg-gradient-to-b from-[#1c1813] via-[#15120e] to-[#0d0b09] border-2 border-[#5c4028]/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[580px]">
        {/* Suitcase Texture Highlights & Metal Corner Guards */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500/60 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500/60 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500/60 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500/60 rounded-br-2xl pointer-events-none" />

        {/* Vintage Leather Straps Running Vertically */}
        <div className="absolute top-0 bottom-0 left-12 w-6 bg-gradient-to-r from-[#2c1d11] via-[#4a301b] to-[#2c1d11] border-x border-[#6e4c2b]/60 pointer-events-none opacity-80">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm border border-amber-300/80 shadow-md flex items-center justify-center">
            <div className="w-4 h-1 bg-[#2c1d11] rounded-full" />
          </div>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm border border-amber-300/80 shadow-md flex items-center justify-center">
            <div className="w-4 h-1 bg-[#2c1d11] rounded-full" />
          </div>
        </div>

        <div className="absolute top-0 bottom-0 right-12 w-6 bg-gradient-to-r from-[#2c1d11] via-[#4a301b] to-[#2c1d11] border-x border-[#6e4c2b]/60 pointer-events-none opacity-80">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm border border-amber-300/80 shadow-md flex items-center justify-center">
            <div className="w-4 h-1 bg-[#2c1d11] rounded-full" />
          </div>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm border border-amber-300/80 shadow-md flex items-center justify-center">
            <div className="w-4 h-1 bg-[#2c1d11] rounded-full" />
          </div>
        </div>

        {/* Suitcase Handle at Top */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-6 -mt-3 bg-gradient-to-r from-[#3e2918] via-[#654326] to-[#3e2918] rounded-t-xl border-t-2 border-x-2 border-amber-500/50 flex items-center justify-center shadow-lg">
            <div className="w-16 h-1 bg-amber-400/60 rounded-full" />
          </div>

          {/* Branding Header on Luggage */}
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Luggage className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
                  TRAVEL BUDDY • VOYAGER
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  EST. 2026
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Your Adventure Passport
              </h2>
            </div>
          </div>
        </div>

        {/* Boarding Pass & Luggage Tag in Center */}
        <div className="relative z-10 my-6 space-y-4">
          {/* Boarding Pass Envelope */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-white tracking-wider">BOARDING PASS • VIP EXPLORER</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                GATE 01 • READY
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 text-center">
              <div className="border-r border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">ORIGIN</span>
                <span className="text-sm font-black text-amber-400">YOUR HOME</span>
              </div>
              <div className="flex flex-col items-center justify-center border-r border-slate-800/80">
                <Plane className="w-4 h-4 text-slate-400 rotate-90" />
                <span className="text-[9px] text-slate-500 font-mono">NON-STOP</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">DESTINATION</span>
                <span className="text-sm font-black text-rose-400">THE WORLD</span>
              </div>
            </div>
          </div>

          {/* Travel Stickers on Suitcase ("പെട്ടിയിലെ സ്റ്റിക്കറുകൾ") */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>Luggage Travel Stamps</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to explore</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {stickers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSticker(activeSticker === s.id ? null : s.id)}
                  className={`cursor-pointer transition-all duration-200 rounded-xl p-2.5 border bg-gradient-to-br ${s.color} ${s.rotate} hover:scale-105 hover:rotate-0 shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider">{s.title}</span>
                    <span className="text-[9px] font-mono opacity-80">{s.tag.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] block opacity-90 font-medium truncate mt-0.5">{s.subtitle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Travel Suitcase Base Clasp */}
        <div className="relative z-10 pt-3 border-t border-[#4a301b]/80 flex items-center justify-between text-xs text-amber-400/80">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Travel Buddy Suitcase</span>
          </div>
          <span className="text-[11px] font-mono text-amber-400/70">Verified Traveler Identity</span>
        </div>
      </div>
    </div>
  );
}
