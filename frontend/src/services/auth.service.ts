import { apiClient, handleApiError } from '@/lib/axios';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User, ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Even if logout fails on server, we should still clear local state
      console.error('Logout error:', error);
    }
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>('/auth/refresh', { refreshToken });
      return response.data.data.tokens;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },
};
