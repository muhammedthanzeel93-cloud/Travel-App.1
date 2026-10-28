'use client';

import { usePathname } from 'next/navigation';

export default function ContentContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Admin Operations Console requires full edge-to-edge layout with no wrapper padding
  if (pathname?.startsWith('/admin/operations')) {
    return <div className="w-full h-full min-h-screen">{children}</div>;
  }

  // Auth & Admin Login pages get centered presentation
  if (pathname === '/' || pathname === '/admin') {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-screen p-4 sm:p-6">
        {children}
      </div>
    );
  }

  // Public social / feed pages get max-w container
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-8">
      {children}
    </div>
  );
}
