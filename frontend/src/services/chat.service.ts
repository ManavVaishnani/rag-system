import { apiClient, handleApiError } from '@/lib/axios';
import type { Message } from '@/types';
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

export const chatService = {
  async sendQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await apiClient.post<QueryResponse>('/query', request);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },
};
