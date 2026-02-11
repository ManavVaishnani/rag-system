import { create } from 'zustand';
import type { Conversation, Message, PendingAttachment, Source } from '@/types';
import { conversationService } from '@/services/conversation.service';
import { documentService } from '@/services/document.service';

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
    set({ isLoadingConversations: true });
    try {
      const conversations = await conversationService.getConversations();
      set({ conversations, isLoadingConversations: false });
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

  // Create a new conversation
  createConversation: async () => {
    try {
      const conversation = await conversationService.createConversation();
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation,
        messages: [],
      }));
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
    try {
      const updated = await conversationService.updateConversation(id, title);
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
        currentConversation: state.currentConversation?.id === id ? updated : state.currentConversation,
      }));
    } catch (error) {
      set({
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
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        pendingAttachments
          .filter((a) => a.status === 'uploading')
          .forEach((attachment) => {
            if (attachment.progress < 90) {
              get().updateAttachmentProgress(attachment.id, attachment.progress + 10);
            }
          });
      }, 200);

      const documents = await documentService.uploadDocuments(filesToUpload, 'chat');

      clearInterval(progressInterval);

      // Update attachments as completed
      documents.forEach((doc, index) => {
        const file = filesToUpload[index];
        const attachment = pendingAttachments.find((a) => a.file === file);
        if (attachment) {
          get().updateAttachmentStatus(attachment.id, 'completed', doc.id);
          get().updateAttachmentProgress(attachment.id, 100);
        }
      });
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
