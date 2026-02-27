import { apiClient, handleApiError } from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { ApiKeyResponse, CreditStatus, AddApiKeyRequest, UpdateApiKeyRequest } from '@/types/api-key.types';
import { AxiosError } from 'axios';

export const apiKeyService = {
  async addKey(data: AddApiKeyRequest): Promise<ApiKeyResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ApiKeyResponse>>('/user/api-keys', data);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async listKeys(): Promise<ApiKeyResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ApiKeyResponse[]>>('/user/api-keys');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async updateKey(id: string, data: UpdateApiKeyRequest): Promise<ApiKeyResponse> {
    try {
      const response = await apiClient.patch<ApiResponse<ApiKeyResponse>>(`/user/api-keys/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async deleteKey(id: string): Promise<void> {
    try {
      await apiClient.delete(`/user/api-keys/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getCredits(): Promise<CreditStatus> {
    try {
      const response = await apiClient.get<ApiResponse<CreditStatus>>('/user/credits');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },
};
