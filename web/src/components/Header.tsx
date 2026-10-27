'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Train, Map, Camera, ShieldAlert, Wifi, WifiOff, HardDrive, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAdminSession, performAdminLogout } from '@/features/admin/auth';

export default function Header() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    const syncAuth = () => {
      setAdminUser(getAdminSession());
    };
    syncAuth();
    window.addEventListener('ente_yathra_admin_auth_changed', syncAuth);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ente_yathra_admin_auth_changed', syncAuth);
    };
  }, []);

  // Close mobile dropdown when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Do not show public header on any admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Section: Brand Logo and Left-Aligned Navigation Links */}
        <div className="flex items-center gap-6">
          {/* Brand Logo - Travel Buddy */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Plane className="w-5 h-5 text-white transform -rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-blue-400 bg-clip-text text-transparent">
                Travel Buddy
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Aviation &amp; Rail Core Suite
              </span>
            </div>
          </Link>

          {/* Navigation Links - Full English (Left Aligned with Brand) */}
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
              <Camera className="w-3.5 h-3.5" /> Social &amp; Reels
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
        </div>

        {/* Right Status & Admin Controls */}
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

          {/* Admin Desk CTA or Active Session */}
          {mounted && adminUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/operations/ticketing-desk"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Desk</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to sign out from the Admin Panel?')) {
                    performAdminLogout();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Sign Out from Admin Panel"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}
          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-150">
          <Link
            href="/flights"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/flights' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plane className="w-4 h-4 text-blue-400" />
            <span>Flights (IATA)</span>
          </Link>
          <Link
            href="/trains"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/trains' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Train className="w-4 h-4 text-indigo-400" />
            <span>Trains (PRS)</span>
          </Link>
          <Link
            href="/customizer"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/customizer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Map className="w-4 h-4 text-amber-400" />
            <span>Dubai 10-Day Visa</span>
          </Link>
          <Link
            href="/feed"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/feed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4 text-rose-400" />
            <span>Social &amp; Reels</span>
          </Link>
          <Link
            href="/vault"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/vault' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>4H Offline Vault</span>
          </Link>
        </div>
      )}
    </header>
  );
}
