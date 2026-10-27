import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-white">404 - Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you requested could not be located in the platform route tree.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
