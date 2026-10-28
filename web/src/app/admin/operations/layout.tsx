'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Camera,
      Building,
  LogOut,
  Lock,
  ArrowRight,
  LayoutDashboard,
  Users,
  Settings,
  Compass,
  Moon,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { getAdminSession, performAdminLogout } from '@/features/admin/auth';

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [adminUser, setAdminUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const session = getAdminSession();
      setAdminUser(session);
      setIsCheckingAuth(false);
    };

    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('ente_yathra_admin_auth_changed', handleAuthChange);
    return () => window.removeEventListener('ente_yathra_admin_auth_changed', handleAuthChange);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await performAdminLogout();
  };

  // Checking authentication for protected admin operations
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Verifying admin permissions...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Admin Authentication Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Valid administrative sign-in is required to access this operations console.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Go to Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/operations/ticketing-desk',
      icon: LayoutDashboard,
      active: pathname === '/admin/operations/ticketing-desk'
    },
    {
      name: 'Post Photos',
      href: '/feed',
      icon: Camera,
      active: false
    },
    {
      name: 'Hotel Partners',
      href: '/admin/operations/rooms',
      icon: Building,
      active: pathname === '/admin/operations/rooms'
    },
    {
      name: 'User Governance',
      href: '/admin/operations/ticketing-desk#users',
      icon: Users,
      active: false
    },
    {
      name: 'Admin Settings',
      href: '/admin/operations/ticketing-desk#settings',
      icon: Settings,
      active: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col lg:flex-row text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#090d16] border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">Travel Buddy</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar (Desktop Fixed / Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 xl:w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-200 lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Top Brand Header */}
          <div className="flex items-center gap-3.5 px-2 pt-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-tight leading-none">
                Travel Buddy
              </h1>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-black tracking-wider text-amber-400 uppercase">
                <span>👑 SUPER ADMIN</span>
              </div>
            </div>
          </div>

          {/* Section: Operations Desks */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
              Operations Desks
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      item.active
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.active ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.active && (
                      <span className="w-2 h-2 rounded-full bg-slate-950 shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {/* Background Badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Background</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-400 text-[11px] font-bold">
              <Moon className="w-3 h-3 text-amber-400" />
              <span>Black</span>
            </span>
          </div>

          {/* User Profile Card */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              {adminUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs text-white truncate">{adminUser.username}</span>
                <span className="text-[10px]">👑</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">@{adminUser.username}</span>
            </div>
          </div>

          {/* Traveler View (User Page) Button */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Traveler View (User Page)</span>
          </Link>

          {/* Log out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Modal for Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Sign Out from Admin Panel?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your administrative session will be terminated and all security credentials cleared from this browser.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Yes, Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
