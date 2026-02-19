import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

function RouteLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-3xl px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-40 rounded-lg bg-muted" />
          <div className="grid gap-4 md:grid-cols-[260px,1fr]">
            <Skeleton className="h-64 rounded-xl bg-muted" />
            <Skeleton className="h-64 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isHydrated, checkAuth } = useAuthStore();
  const checkAuthRef = useRef(checkAuth);

  useEffect(() => {
    checkAuthRef.current();
  }, []);

  if (!isHydrated || isLoading) {
    return <RouteLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, isHydrated, checkAuth } = useAuthStore();
  const checkAuthRef = useRef(checkAuth);

  useEffect(() => {
    checkAuthRef.current();
  }, []);

  if (!isHydrated || isLoading) {
    return <RouteLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}
