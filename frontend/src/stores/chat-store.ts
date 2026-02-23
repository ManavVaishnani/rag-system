import { create } from 'zustand';
import type { Conversation, Message, PendingAttachment, Source } from '@/types';
import { conversationService } from '@/services/conversation.service';
import { documentService } from '@/services/document.service';
import { useDocumentStore } from '@/stores/document-store';

interface ChatState {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;

  // Messages
  messages: Message[];
  isLoadingMessages: boolean;

  // Streaming
  isStreaming: boolean;
  streamingContent: string;
  streamingStatus: string | null;
  streamingSources: Source[] | null;

  // Attachments
  pendingAttachments: PendingAttachment[];
  isUploadingAttachments: boolean;

  // Error
  error: string | null;

  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  refreshConversationMessages: () => Promise<void>;
  createConversation: () => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;

  // Message actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;

  // Streaming actions
  startStreaming: () => void;
  appendStreamingContent: (content: string) => void;
  setStreamingStatus: (status: string) => void;
  setStreamingSources: (sources: Source[]) => void;
  stopStreaming: () => void;

  // Attachment actions
  addAttachments: (files: File[]) => void;
  uploadAttachments: (conversationId?: string) => Promise<void>;
  updateAttachmentProgress: (id: string, progress: number) => void;
  updateAttachmentStatus: (id: string, status: PendingAttachment['status'], documentId?: string, error?: string) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;

  // Error
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  isLoadingConversations: false,
  messages: [],
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  streamingStatus: null,
  streamingSources: null,
  pendingAttachments: [],
  isUploadingAttachments: false,
  error: null,

  // Load all conversations
  loadConversations: async () => {
    // Only show loading state on initial load (no conversations yet)
    const isInitialLoad = get().conversations.length === 0;
    if (isInitialLoad) {
      set({ isLoadingConversations: true });
    }
    try {
      const conversations = await conversationService.getConversations();
      // Filter out any null/undefined conversations
      const validConversations = (conversations || []).filter((c) => c && c.id);
      set({ conversations: validConversations, isLoadingConversations: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load conversations',
        isLoadingConversations: false,
      });
    }
  },

  // Load a specific conversation with messages
  loadConversation: async (id) => {
    set({ isLoadingMessages: true });
    try {
      const data = await conversationService.getConversation(id);
      set({
        currentConversation: data.conversation,
        messages: data.messages,
        isLoadingMessages: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoadingMessages: false,
      });
    }
  },

  // Refresh messages for current conversation
  refreshConversationMessages: async () => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    try {
      const data = await conversationService.getConversation(currentConversation.id);
      set({
        messages: data.messages,
      });
    } catch (error) {
      console.error('Failed to refresh conversation messages:', error);
    }
  },

  // Create a new conversation
  createConversation: async () => {
    try {
      const conversation = await conversationService.createConversation();
      // Only add valid conversations to the store
      if (conversation && conversation.id) {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversation: conversation,
          messages: [],
        }));
      }
      return conversation;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      });
      return null;
    }
  },

  // Delete a conversation
  deleteConversation: async (id) => {
    try {
      await conversationService.deleteConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
        messages: state.currentConversation?.id === id ? [] : state.messages,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      });
    }
  },

  // Update conversation title
  updateConversationTitle: async (id, title) => {
    // Optimistic update — apply immediately so the sidebar reflects the change
    const previousConversations = get().conversations;
    const previousCurrent = get().currentConversation;
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, title }
          : state.currentConversation,
    }));

    try {
      await conversationService.updateConversation(id, title);
    } catch (error) {
      // Revert optimistic update on failure
      set({
        conversations: previousConversations,
        currentConversation: previousCurrent,
        error: error instanceof Error ? error.message : 'Failed to update conversation',
      });
    }
  },

  // Set current conversation
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  // Add a message
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  // Set all messages
  setMessages: (messages) => {
    set({ messages });
  },

  // Streaming actions
  startStreaming: () => {
    set({
      isStreaming: true,
      streamingContent: '',
      streamingStatus: null,
      streamingSources: null,
    });
  },

  appendStreamingContent: (content) => {
    set((state) => ({
      streamingContent: state.streamingContent + content,
    }));
  },

  setStreamingStatus: (status) => {
    set({ streamingStatus: status });
  },

  setStreamingSources: (sources) => {
    set({ streamingSources: sources });
  },

  stopStreaming: () => {
    set({ isStreaming: false });
  },

  // Attachment actions
  addAttachments: (files) => {
    const newAttachments: PendingAttachment[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      progress: 0,
      status: 'pending',
    }));
    set((state) => ({
      pendingAttachments: [...state.pendingAttachments, ...newAttachments],
    }));
  },

  uploadAttachments: async (_conversationId) => {
    const { pendingAttachments } = get();
    if (pendingAttachments.length === 0) return;

    const filesToUpload = pendingAttachments
      .filter((a) => a.status === 'pending')
      .map((a) => a.file);

    if (filesToUpload.length === 0) return;

    set({ isUploadingAttachments: true });

    // Update status to uploading
    filesToUpload.forEach((file) => {
      const attachment = pendingAttachments.find((a) => a.file === file);
      if (attachment) {
        get().updateAttachmentStatus(attachment.id, 'uploading');
      }
    });

    try {
      // Upload files one by one since backend only accepts single file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const attachment = pendingAttachments.find((a) => a.file === file);
        
        if (!attachment) continue;

        // Simulate progress during upload
        const progressInterval = setInterval(() => {
          const current = get().pendingAttachments.find((a) => a.id === attachment.id);
          if (current && current.progress < 85) {
            get().updateAttachmentProgress(attachment.id, current.progress + 15);
          }
        }, 300);

        try {
          const response = await documentService.uploadDocument(file, 'chat');
          clearInterval(progressInterval);
          
          // Update as completed
          get().updateAttachmentStatus(attachment.id, 'completed', response.id);
          get().updateAttachmentProgress(attachment.id, 100);

          // Sync to document store so it appears on Documents page
          const docStore = useDocumentStore.getState();
          docStore.syncChatUploads({
            id: response.id,
            userId: '',
            filename: response.filename || file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            status: 'PROCESSING',
            source: 'chat',
            createdAt: new Date().toISOString(),
          });

          // Poll for status updates
          const pollStatus = async () => {
            let attempts = 0;
            const maxAttempts = 20;
            const poll = setInterval(async () => {
              attempts++;
              try {
                const status = await documentService.getDocumentStatus(response.id);
                docStore.syncChatUploads({
                  id: response.id,
                  userId: '',
                  filename: response.filename || file.name,
                  originalName: file.name,
                  mimeType: file.type,
                  size: file.size,
                  status: status.status,
                  source: 'chat',
                  chunkCount: status.chunkCount,
                  errorMessage: status.errorMessage,
                  createdAt: new Date().toISOString(),
                });
                if (status.status !== 'PROCESSING' || attempts >= maxAttempts) {
                  clearInterval(poll);
                }
              } catch {
                clearInterval(poll);
              }
            }, 3000);
          };
          pollStatus();
        } catch (fileError) {
          clearInterval(progressInterval);
          // Mark this specific attachment as error
          get().updateAttachmentStatus(
            attachment.id,
            'error',
            undefined,
            fileError instanceof Error ? fileError.message : 'Upload failed'
          );
        }
      }
    } catch (error) {
      // Mark all uploading attachments as error
      pendingAttachments
        .filter((a) => a.status === 'uploading')
        .forEach((attachment) => {
          get().updateAttachmentStatus(
            attachment.id,
            'error',
            undefined,
            error instanceof Error ? error.message : 'Upload failed'
          );
        });
    } finally {
      set({ isUploadingAttachments: false });
    }
  },

  updateAttachmentProgress: (id, progress) => {
    set((state) => ({
      pendingAttachments: state.pendingAttachments.map((a) =>
        a.id === id ? { ...a, progress } : a
      ),
    }));
  },

  updateAttachmentStatus: (id, status, documentId, error) => {
    set((state) => ({
      pendingAttachments: state.pendingAttachments.map((a) =>
        a.id === id ? { ...a, status, documentId, error } : a
      ),
    }));
  },

  removeAttachment: (id) => {
    set((state) => ({
      pendingAttachments: state.pendingAttachments.filter((a) => a.id !== id),
    }));
  },

  clearAttachments: () => {
    set({ pendingAttachments: [] });
  },

  // Error
  setError: (error) => {
    set({ error });
  },
}));
