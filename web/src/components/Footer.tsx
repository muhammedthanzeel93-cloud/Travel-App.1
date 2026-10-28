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
        <span>© 2026 Travel Buddy. Explore &amp; Share Real-World Travel Stories Worldwide.</span>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/feed" className="hover:text-amber-400">Feed</Link>
          <Link href="/feed" className="hover:text-rose-400">Reels &amp; Stories</Link>
        </div>
      </div>
    </footer>
  );
}
