import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

/**
 * Hook for chat messaging and streaming operations.
 * Provides a clean API for sending messages and tracking streaming state.
 */
export function useChat() {
  const {
    messages,
    isLoadingMessages,
    isStreaming,
    streamingContent,
    streamingStatus,
    streamingSources,
    pendingAttachments,
    isUploadingAttachments,
    error,
    addMessage,
    setMessages,
    startStreaming,
    appendStreamingContent,
    setStreamingStatus,
    setStreamingSources,
    stopStreaming,
    addAttachments,
    uploadAttachments,
    updateAttachmentProgress,
    updateAttachmentStatus,
    removeAttachment,
    clearAttachments,
    setError,
  } = useChatStore();

  const handleAddAttachments = useCallback(
    (files: File[]) => {
      addAttachments(files);
    },
    [addAttachments]
  );

  const handleUploadAttachments = useCallback(
    async (conversationId?: string) => {
      await uploadAttachments(conversationId);
    },
    [uploadAttachments]
  );

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      removeAttachment(id);
    },
    [removeAttachment]
  );

  const handleClearAttachments = useCallback(() => {
    clearAttachments();
  }, [clearAttachments]);

  return {
    messages,
    isLoadingMessages,
    isStreaming,
    streamingContent,
    streamingStatus,
    streamingSources,
    pendingAttachments,
    isUploadingAttachments,
    error,
    addMessage,
    setMessages,
    startStreaming,
    appendStreamingContent,
    setStreamingStatus,
    setStreamingSources,
    stopStreaming,
    addAttachments: handleAddAttachments,
    uploadAttachments: handleUploadAttachments,
    updateAttachmentProgress,
    updateAttachmentStatus,
    removeAttachment: handleRemoveAttachment,
    clearAttachments: handleClearAttachments,
    setError,
  };
}
