import { apiClient, handleApiError } from '@/lib/axios';
import type { Conversation, Message, Source, ApiResponse } from '@/types';
import { AxiosError } from 'axios';

// Backend stores sources with different field names; normalize on the way in
type RawSource = Source & { filename?: string; chunkId?: string };

function normalizeMessageSources(messages: Message[]): Message[] {
  return messages.map((msg) => ({
    ...msg,
    sources: (msg.sources as RawSource[] | undefined)?.map((s, i) => ({
      documentId: s.documentId,
      documentName: s.documentName ?? s.filename ?? 'Unknown document',
      chunkIndex: s.chunkIndex ?? i,
      score: s.score,
      content: s.content,
    })),
  }));
}

export const conversationService = {
  async createConversation(): Promise<Conversation> {
    try {
      const response = await apiClient.post<ApiResponse<Conversation>>('/conversations', {
        title: 'New Conversation',
      });
      return response.data.data;
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
      const data = response.data.data;
      return { conversation: data.conversation, messages: normalizeMessageSources(data.messages) };
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async updateConversation(id: string, title: string): Promise<Conversation> {
    try {
      const response = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${id}`, {
        title,
      });
      return response.data.data;
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
