import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useChatStore } from '@/stores/chat-store';
import { useDocumentStore } from '@/stores/document-store';
import { socketService } from '@/lib/socket';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { EmptyChatState } from './empty-chat-state';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ALLOWED_EXTENSIONS = '.pdf,.docx,.txt,.md';

export function ChatInterface() {
  const { id: conversationId } = useParams<{ id: string }>();
  
  const {
    messages,
    isLoadingMessages,
    isStreaming,
    streamingContent,
    streamingStatus,
    streamingSources,
    pendingAttachments,
    isUploadingAttachments,
    dailyUsage,
    error,
    loadConversation,
    addMessage,
    startStreaming,
    stopStreaming,
    setError,
    addAttachments,
    uploadAttachments,
    removeAttachment,
    clearAttachments,
    loadDailyUsage,
  } = useChatStore();

  const { documents } = useDocumentStore();

  // Connect socket on mount and load daily usage
  useEffect(() => {
    socketService.connect();
    loadDailyUsage();
    return () => {
      socketService.disconnect();
    };
  }, [loadDailyUsage]);

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      clearAttachments();
    }
  }, [conversationId, loadConversation, clearAttachments]);

  // Show toast whenever the store surfaces an error (e.g. query:error from socket)
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId) {
      toast.error('No conversation selected');
      return;
    }

    // Check daily message limit
    if (dailyUsage && dailyUsage.remaining <= 0) {
      toast.error(`Daily message limit reached (${dailyUsage.limit}/day). Resets at midnight UTC.`);
      return;
    }

    // Upload attachments first if any
    if (pendingAttachments.length > 0) {
      await uploadAttachments(conversationId);
    }

    // Add user message immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'USER' as const,
      content,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Start streaming
    startStreaming();

    // Send via socket — false means the socket isn't connected yet
    const sent = socketService.sendQuery(conversationId, content);
    if (!sent) {
      stopStreaming();
      toast.error('Not connected to server. Please wait a moment and try again.');
      return;
    }

    // Clear attachments after sending
    clearAttachments();
  }, [conversationId, pendingAttachments, uploadAttachments, addMessage, startStreaming, stopStreaming, clearAttachments]);

  const handleAttachFiles = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = ALLOWED_EXTENSIONS;
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      // Check total count
      if (pendingAttachments.length + files.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const validFiles: File[] = [];
      const duplicateFiles: File[] = [];

      for (const file of files) {
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" exceeds 10 MB limit`);
          continue;
        }

        // Check for duplicates in pending attachments
        const isDuplicatePending = pendingAttachments.some(
          (a) => a.file.name === file.name && a.file.size === file.size
        );
        if (isDuplicatePending) {
          toast.warning(`"${file.name}" is already queued`);
          continue;
        }

        // Check for duplicates in existing documents
        const isDuplicateDoc = documents.some(
          (d) => (d.originalName === file.name || d.filename === file.name) && (d.size === file.size || d.fileSize === file.size)
        );
        if (isDuplicateDoc) {
          duplicateFiles.push(file);
          continue;
        }

        validFiles.push(file);
      }

      // Handle duplicates with confirmation
      if (duplicateFiles.length > 0) {
        const names = duplicateFiles.map((f) => `"${f.name}"`).join(', ');
        toast.warning(`${names} already exist${duplicateFiles.length > 1 ? '' : 's'} in your documents`, {
          action: {
            label: 'Upload anyway',
            onClick: () => addAttachments(duplicateFiles),
          },
          duration: 6000,
        });
      }

      if (validFiles.length > 0) {
        addAttachments(validFiles);
      }
    };
    
    input.click();
  }, [addAttachments, pendingAttachments, documents]);

  const handleRetryAttachment = useCallback((id: string) => {
    useChatStore.getState().updateAttachmentStatus(id, 'pending');
  }, []);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {!conversationId ? (
        <EmptyChatState />
      ) : isLoadingMessages && messages.length === 0 ? (
        <MessageList
          messages={[]}
          isStreaming={false}
          streamingContent=""
          streamingStatus={null}
          streamingSources={null}
          isLoading={true}
        />
      ) : messages.length === 0 && !isStreaming ? (
        <>
          <div className="flex-1 overflow-hidden">
            <EmptyChatState onSuggestionClick={handleSendMessage} />
          </div>
          <MessageInput
            onSend={handleSendMessage}
            onAttachFiles={handleAttachFiles}
            attachments={pendingAttachments}
            onRemoveAttachment={removeAttachment}
            onRetryAttachment={handleRetryAttachment}
            isUploading={isUploadingAttachments}
            isStreaming={isStreaming}
            disabled={!conversationId}
            dailyUsage={dailyUsage}
          />
        </>
      ) : (
        <>
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            streamingStatus={streamingStatus}
            streamingSources={streamingSources}
            isLoading={isLoadingMessages}
          />
          <MessageInput
            onSend={handleSendMessage}
            onAttachFiles={handleAttachFiles}
            attachments={pendingAttachments}
            onRemoveAttachment={removeAttachment}
            onRetryAttachment={handleRetryAttachment}
            isUploading={isUploadingAttachments}
            isStreaming={isStreaming}
            disabled={!conversationId}
            dailyUsage={dailyUsage}
          />
        </>
      )}
    </div>
  );
}
