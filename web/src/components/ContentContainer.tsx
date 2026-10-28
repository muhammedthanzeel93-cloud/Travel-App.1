'use client';

import { usePathname } from 'next/navigation';

export default function ContentContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Admin operations pages should take full screen width and height
  if (pathname?.startsWith('/admin/operations')) {
    return <main className="flex-1 w-full min-h-screen">{children}</main>;
  }

  // Admin login page is centered with padding
  const isCenterAuthPage = pathname === '/admin';

  return (
    <main
      className={`flex-1 w-full ${
        isCenterAuthPage
          ? 'flex items-center justify-center min-h-[80vh] p-4 sm:p-6'
          : 'max-w-7xl mx-auto p-4 lg:p-8'
      }`}
    >
      {children}
    </main>
  );
}
