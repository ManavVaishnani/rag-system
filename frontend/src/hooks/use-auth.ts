import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook for authentication operations.
 * Wraps the auth store and provides a clean API for components.
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login({ email, password });
    },
    [login]
  );

  const handleRegister = useCallback(
    async (email: string, password: string) => {
      await register({ email, password });
    },
    [register]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleCheckAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth: handleCheckAuth,
    clearError,
  };
}
