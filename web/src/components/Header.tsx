'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Compass, Flame, Wifi, WifiOff, Menu, X, Sparkles, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        {/* Left Section: Brand Logo and Navigation Links */}
        <div className="flex items-center gap-6">
          {/* Brand Logo - Travel Buddy */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
                Travel Buddy
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Social Travel &amp; Explorer Community
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80 text-xs font-semibold">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Home
            </Link>
            <Link
              href="/feed"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/feed' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Social Feed &amp; Reels
            </Link>
          </nav>
        </div>

        {/* Right Section: Status & Highlights */}
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
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Desk</span>
          </Link>

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
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Home</span>
          </Link>
          <Link
            href="/feed"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pathname === '/feed' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4 text-rose-400" />
            <span>Social Feed &amp; Reels</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Admin Desk</span>
          </Link>
        </div>
      )}
    </header>
  );
}
