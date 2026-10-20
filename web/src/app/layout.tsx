'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Train, Map, Camera, ShieldAlert, Wifi, WifiOff, HardDrive } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isAdminSection = pathname?.startsWith('/admin');

  return (
    <html lang="en">
      <head>
        <title>Travel Platform | Aviation & Rail Enterprise Suite</title>
        <meta name="description" content="Enterprise Full-Stack Travel Platform with IATA & PRS Real-World Ticketing and Super Admin Desk" />
        <meta name="theme-color" content="#0b0f19" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        {/* Top Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Plane className="w-5 h-5 text-white transform -rotate-45" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                  TRAVEL PLATFORM
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  IATA & PRS Core Ticketing
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80 text-xs font-semibold">
              <Link
                href="/flights"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/flights' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Plane className="w-3.5 h-3.5" /> Flights (IATA)
              </Link>
              <Link
                href="/trains"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/trains' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Train className="w-3.5 h-3.5" /> Trains (PRS)
              </Link>
              <Link
                href="/customizer"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/customizer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Map className="w-3.5 h-3.5" /> Dubai 10-Day Visa
              </Link>
              <Link
                href="/feed"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/feed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Social & Reels
              </Link>
              <Link
                href="/vault"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/vault' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" /> 4H Offline Vault
              </Link>
            </nav>

            {/* Right Status & Admin CTA */}
            <div className="flex items-center gap-3">
              {/* Online/Offline Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isOnline
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                    : 'bg-amber-950/80 text-amber-400 border border-amber-800/80 animate-pulse'
                }`}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isOnline ? 'Online Sync' : '4h Offline Vault Active'}</span>
              </div>

              {/* Super Admin Desk CTA */}
              <Link
                href="/admin/operations/ticketing-desk"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isAdminSection
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Super Admin Desk</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© 2026 Travel Platform. Enterprise Aviation (IATA Resolution 792) & PRS Railway Engine.</span>
            <div className="flex items-center gap-4 text-slate-400">
              <Link href="/admin/operations/flights" className="hover:text-blue-400">Flight Ops</Link>
              <Link href="/admin/operations/trains" className="hover:text-blue-400">Rail Ops</Link>
              <Link href="/admin/operations/rooms" className="hover:text-blue-400">Room Ops</Link>
              <Link href="/vault" className="hover:text-emerald-400">Offline Vault</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
