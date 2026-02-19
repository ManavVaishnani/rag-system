import { apiClient, handleApiError } from '@/lib/axios';
import type { Conversation, Message, ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export const conversationService = {
  async createConversation(): Promise<Conversation> {
    try {
      const response = await apiClient.post<ApiResponse<{ conversation: Conversation }>>('/conversations', {
        title: 'New Conversation',
      });
      return response.data.data.conversation;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<ApiResponse<Conversation[]>>('/conversations');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    try {
      const response = await apiClient.get<ApiResponse<{ conversation: Conversation; messages: Message[] }>>(`/conversations/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async updateConversation(id: string, title: string): Promise<Conversation> {
    try {
      const response = await apiClient.patch<ApiResponse<{ conversation: Conversation }>>(`/conversations/${id}`, {
        title,
      });
      return response.data.data.conversation;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async deleteConversation(id: string): Promise<void> {
    try {
      await apiClient.delete(`/conversations/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },
};
