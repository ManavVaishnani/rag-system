import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { ProtectedRoute, PublicRoute } from '@/components/protected-route';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/sonner';
import { registerAuthRedirectHandler } from '@/lib/auth-redirect';

// Lazily loaded pages — each page gets its own JS chunk for faster initial load
const LandingPage = lazy(() =>
  import('@/pages/landing-page').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/login-page').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/register-page').then((m) => ({ default: m.RegisterPage }))
);
const ChatPage = lazy(() =>
  import('@/pages/chat-page').then((m) => ({ default: m.ChatPage }))
);
const DocumentsPage = lazy(() =>
  import('@/pages/documents-page').then((m) => ({ default: m.DocumentsPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/settings-page').then((m) => ({ default: m.SettingsPage }))
);

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    registerAuthRedirectHandler(() => {
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster />
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
