import { create } from 'zustand';
import type { Document } from '@/types';
import { documentService } from '@/services/document.service';

interface DocumentState {
  // State
  documents: Document[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  // Actions
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, source?: 'chat' | 'documents') => Promise<boolean>;
  uploadDocuments: (files: File[], source?: 'chat' | 'documents') => Promise<boolean>;
  deleteDocument: (id: string) => Promise<void>;
  getDocumentStatus: (id: string) => Promise<void>;
  syncChatUploads: (document: Document) => void;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentState>()((set) => ({
  // Initial state
  documents: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,

  // Fetch all documents
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = await documentService.getDocuments();
      set({ documents, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
        isLoading: false,
      });
    }
  },

  // Upload a single document
  uploadDocument: async (file, source = 'documents') => {
    set({ isUploading: true, uploadProgress: 0, error: null });
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        set((state) => ({
          uploadProgress: Math.min(state.uploadProgress + 10, 90),
        }));
      }, 200);

      await documentService.uploadDocument(file, source);

      clearInterval(progressInterval);
      set({ uploadProgress: 100 });

      // Refetch documents to get the new one with full data
      const documents = await documentService.getDocuments();
      set({ documents, isUploading: false });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload document',
        isUploading: false,
        uploadProgress: 0,
      });
      return false;
    }
  },

  // Upload multiple documents (uploads one by one)
  uploadDocuments: async (files, source = 'documents') => {
    set({ isUploading: true, uploadProgress: 0, error: null });
    try {
      const progressPerFile = 90 / files.length;
      let completedFiles = 0;

      // Upload files one by one since backend only accepts single file
      for (const file of files) {
        await documentService.uploadDocument(file, source);
        completedFiles++;
        set({
          uploadProgress: Math.min(completedFiles * progressPerFile, 90),
        });
      }

      set({ uploadProgress: 100 });

      // Refetch documents to get all new ones with full data
      const documents = await documentService.getDocuments();
      set({ documents, isUploading: false });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload documents',
        isUploading: false,
        uploadProgress: 0,
      });
      return false;
    }
  },

  // Delete a document
  deleteDocument: async (id) => {
    try {
      await documentService.deleteDocument(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete document',
      });
    }
  },

  // Get document status
  getDocumentStatus: async (id) => {
    try {
      const status = await documentService.getDocumentStatus(id);
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id
            ? {
                ...d,
                status: status.status,
                chunkCount: status.chunkCount,
                errorMessage: status.errorMessage,
              }
            : d
        ),
      }));
    } catch (error) {
      console.error('Failed to get document status:', error);
    }
  },

  // Sync documents uploaded from chat
  syncChatUploads: (document) => {
    set((state) => {
      // Check if document already exists
      const exists = state.documents.find((d) => d.id === document.id);
      if (exists) {
        return {
          documents: state.documents.map((d) =>
            d.id === document.id ? document : d
          ),
        };
      }
      return {
        documents: [document, ...state.documents],
      };
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
