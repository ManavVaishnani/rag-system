import { apiClient, handleApiError } from '@/lib/axios';
import type { Message, ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export interface QueryRequest {
  content: string;
  conversationId?: string;
}

export interface QueryResponse {
  message: Message;
  sources?: Array<{
    documentId: string;
    documentName: string;
    chunkIndex: number;
    score: number;
    content: string;
  }>;
}

export interface DailyUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export const chatService = {
  async sendQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await apiClient.post<ApiResponse<QueryResponse>>('/query', request);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getDailyUsage(): Promise<DailyUsage> {
    try {
      const response = await apiClient.get<ApiResponse<DailyUsage>>('/query/usage');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },
};
