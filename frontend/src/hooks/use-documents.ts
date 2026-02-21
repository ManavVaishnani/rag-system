import { useCallback } from 'react';
import { useDocumentStore } from '@/stores/document-store';

/**
 * Hook for document management operations.
 * Provides a clean API for uploading, fetching, and deleting documents.
 */
export function useDocuments() {
  const {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadDocument,
    uploadDocuments,
    deleteDocument,
    getDocumentStatus,
    syncChatUploads,
    clearError,
  } = useDocumentStore();

  const handleFetchDocuments = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadDocument = useCallback(
    async (file: File, source?: 'chat' | 'documents') => {
      return uploadDocument(file, source);
    },
    [uploadDocument]
  );

  const handleUploadDocuments = useCallback(
    async (files: File[], source?: 'chat' | 'documents') => {
      return uploadDocuments(files, source);
    },
    [uploadDocuments]
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id);
    },
    [deleteDocument]
  );

  const handleGetDocumentStatus = useCallback(
    async (id: string) => {
      return getDocumentStatus(id);
    },
    [getDocumentStatus]
  );

  // Derived state
  const readyDocuments = documents.filter((d) => d.status === 'COMPLETED');
  const processingDocuments = documents.filter((d) => d.status === 'PROCESSING');
  const failedDocuments = documents.filter((d) => d.status === 'FAILED');

  return {
    documents,
    readyDocuments,
    processingDocuments,
    failedDocuments,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments: handleFetchDocuments,
    uploadDocument: handleUploadDocument,
    uploadDocuments: handleUploadDocuments,
    deleteDocument: handleDeleteDocument,
    getDocumentStatus: handleGetDocumentStatus,
    syncChatUploads,
    clearError,
  };
}
