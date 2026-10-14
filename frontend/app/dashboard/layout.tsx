'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { useAuthStore } from '@/lib/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitialized, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  useEffect(() => {
    // Only redirect if checkAuth has completed and user is definitely not logged in
    if (isInitialized && !user && !isLoading) {
      router.replace('/login');
    }
  }, [isInitialized, user, isLoading, router]);

  // While checking cookie or if user not yet loaded, show smooth loading screen
  if (!isInitialized || (!user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  // If check completed and user is null, wait for router.replace to navigate
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 md:ml-64">
        {children}
      </main>
    </div>
  );
}
