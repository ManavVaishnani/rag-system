import { apiClient, handleApiError } from '@/lib/axios';
import type { Document, DocumentStatusResponse, DocumentUploadResponse } from '@/types';
import { AxiosError } from 'axios';

export const documentService = {
  async uploadDocuments(files: File[], source: 'chat' | 'documents' = 'documents'): Promise<Document[]> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('source', source);

      const response = await apiClient.post<DocumentUploadResponse>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.documents;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getDocuments(): Promise<Document[]> {
    try {
      const response = await apiClient.get<{ documents: Document[] }>('/documents');
      return response.data.documents;
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  },

  async getDocumentStatus(id: string): Promise<DocumentStatusResponse> {
    try {
      const response = await apiClient.get<{ document: DocumentStatusResponse }>(`/documents/${id}/status`);
      return response.data.document;
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
