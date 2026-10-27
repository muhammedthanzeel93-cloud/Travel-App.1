'use client';

import { usePathname } from 'next/navigation';

export default function ContentContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <main className={`flex-1 w-full ${isAdmin ? '' : 'max-w-7xl mx-auto p-4 lg:p-8'}`}>
      {children}
    </main>
  );
}
