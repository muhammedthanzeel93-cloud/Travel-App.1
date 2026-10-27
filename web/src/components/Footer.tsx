'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Do not show footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© 2026 Travel Buddy. Enterprise Aviation (IATA Resolution 792) &amp; PRS Railway Engine.</span>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/admin/operations/flights" className="hover:text-blue-400">Flight Ops</Link>
          <Link href="/admin/operations/trains" className="hover:text-blue-400">Rail Ops</Link>
          <Link href="/admin/operations/rooms" className="hover:text-blue-400">Room Ops</Link>
          <Link href="/vault" className="hover:text-emerald-400">Offline Vault</Link>
        </div>
      </div>
    </footer>
  );
}
