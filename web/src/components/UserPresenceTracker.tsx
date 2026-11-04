'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getUserSession, subscribeToUserSession } from '@/features/auth/userAuth';

export default function UserPresenceTracker() {
  const pathname = usePathname();
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const sendHeartbeat = async () => {
      // Admins and unauthenticated visitors must NEVER be tracked as active travelers
      if (typeof window === 'undefined') return;
      if (pathname?.startsWith('/admin')) return;

      const session = getUserSession();
      if (!session || !session.username) return;
      if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN') return;

      // Rate limit heartbeat pings to avoid rapid duplicate triggers
      const now = Date.now();
      if (now - lastPingRef.current < 15_000) return;
      lastPingRef.current = now;

      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: new Date().toISOString() })
        });
      } catch {
        // Silently tolerate transient network interruptions
      }
    };

    // Execute immediately on route change or initial load
    void sendHeartbeat();

    // Regular interval: ping every 45 seconds while user is actively browsing
    intervalId = setInterval(() => {
      if (isMounted) void sendHeartbeat();
    }, 45_000);

    // Ping immediately when the user switches tabs back to this app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        void sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // React immediately to login / logout events in the browser
    const unsubscribeSession = subscribeToUserSession((newSession) => {
      if (!isMounted) return;
      if (newSession && newSession.role !== 'SUPER_ADMIN' && newSession.role !== 'ADMIN') {
        lastPingRef.current = 0;
        void sendHeartbeat();
      }
    });

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeSession();
    };
  }, [pathname]);

  return null;
}
