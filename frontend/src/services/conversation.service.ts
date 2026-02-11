import { apiClient, handleApiError } from '@/lib/axios';
import type { Conversation, Message } from '@/types';
import { AxiosError } from 'axios';

export const conversationService = {
  async createConversation(): Promise<Conversation> {
    try {
      const response = await apiClient.post<{ conversation: Conversation }>('/conversations', {
        title: 'New Conversation',
      });
      return response.data.conversation;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<{ conversations: Conversation[] }>('/conversations');
      return response.data.conversations;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    try {
      const response = await apiClient.get(`/conversations/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async updateConversation(id: string, title: string): Promise<Conversation> {
    try {
      const response = await apiClient.patch<{ conversation: Conversation }>(`/conversations/${id}`, {
        title,
      });
      return response.data.conversation;
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
