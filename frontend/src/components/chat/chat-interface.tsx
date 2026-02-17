import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useChatStore } from '@/stores/chat-store';
import { socketService } from '@/lib/socket';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { EmptyChatState } from './empty-chat-state';

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
    loadConversation,
    addMessage,
    startStreaming,
    setError,
    addAttachments,
    uploadAttachments,
    removeAttachment,
  } = useChatStore();

  // Connect socket on mount
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  // Handle errors
  useEffect(() => {
    const error = useChatStore.getState().error;
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [setError]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId) {
      toast.error('No conversation selected');
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

    // Send via socket
    socketService.sendQuery(conversationId, content);
  }, [conversationId, pendingAttachments, uploadAttachments, addMessage, startStreaming]);

  const handleAttachFiles = useCallback(() => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.docx,.txt,.md';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        // Validate files
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validFiles = files.filter(file => {
          if (file.size > maxSize) {
            toast.error(`${file.name} exceeds 10MB limit`);
            return false;
          }
          return true;
        });

        if (validFiles.length > 10) {
          toast.error('Maximum 10 files allowed');
          return;
        }

        addAttachments(validFiles);
      }
    };
    
    input.click();
  }, [addAttachments]);

  // Always render the container
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Debug indicator - remove in production */}
      <div className="absolute top-0 right-0 p-2 text-xs text-muted-foreground z-50">
        ChatInterface: {conversationId ? `ID: ${conversationId}` : 'No ID'} | Msgs: {messages.length}
      </div>
      
      {!conversationId ? (
        // No conversation selected - show empty state
        <EmptyChatState />
      ) : isLoadingMessages && messages.length === 0 ? (
        // Loading conversation
        <MessageList
          messages={[]}
          isStreaming={false}
          streamingContent=""
          streamingStatus={null}
          streamingSources={null}
          isLoading={true}
        />
      ) : messages.length === 0 && !isStreaming ? (
        // New conversation with no messages
        <>
          <div className="flex-1 overflow-hidden">
            <EmptyChatState />
          </div>
          <MessageInput
            onSend={handleSendMessage}
            onAttachFiles={handleAttachFiles}
            attachments={pendingAttachments}
            onRemoveAttachment={removeAttachment}
            isUploading={isUploadingAttachments}
            isStreaming={isStreaming}
            disabled={!conversationId}
          />
        </>
      ) : (
        // Active conversation with messages
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
            isUploading={isUploadingAttachments}
            isStreaming={isStreaming}
            disabled={!conversationId}
          />
        </>
      )}
    </div>
  );
}
