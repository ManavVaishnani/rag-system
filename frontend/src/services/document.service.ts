import { apiClient, handleApiError } from '@/lib/axios';
import type { Document, DocumentStatusResponse, DocumentContentResponse, ApiResponse } from '@/types';
import { AxiosError } from 'axios';

interface UploadResponse {
  id: string;
  filename: string;
  status: string;
  message: string;
}

export const documentService = {
  async uploadDocument(file: File, source: 'chat' | 'documents' = 'documents'): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      const response = await apiClient.post<ApiResponse<UploadResponse>>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getDocuments(): Promise<Document[]> {
    try {
      const response = await apiClient.get<ApiResponse<Document[]>>('/documents');
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getDocumentStatus(id: string): Promise<DocumentStatusResponse> {
    try {
      const response = await apiClient.get<ApiResponse<DocumentStatusResponse>>(`/documents/${id}/status`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getDocumentContent(id: string): Promise<DocumentContentResponse> {
    try {
      const response = await apiClient.get<ApiResponse<DocumentContentResponse>>(`/documents/${id}/content`);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },
};
