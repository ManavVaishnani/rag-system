import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import type { Source } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      console.error('No access token available for socket connection');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Query status updates
    this.socket.on('query:status', (data: { status: string }) => {
      useChatStore.getState().setStreamingStatus(data.status);
    });

    // Source citations
    this.socket.on('query:sources', (data: { sources: Source[] }) => {
      useChatStore.getState().setStreamingSources(data.sources);
    });

    // Streaming chunks
    this.socket.on('query:chunk', (data: { chunk: string }) => {
      useChatStore.getState().appendStreamingContent(data.chunk);
    });

    // Query complete
    this.socket.on('query:complete', (data: { messageId: string; content: string; sources?: Source[] }) => {
      const { stopStreaming, addMessage, currentConversation } = useChatStore.getState();
      stopStreaming();

      if (currentConversation) {
        addMessage({
          id: data.messageId,
          conversationId: currentConversation.id,
          role: 'ASSISTANT',
          content: data.content,
          sources: data.sources,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Cached response
    this.socket.on('query:cached', () => {
      // Could show a "cached" indicator in the UI
      console.log('Received cached response');
    });

    // Error handling
    this.socket.on('query:error', (data: { error: string }) => {
      const { stopStreaming, setError } = useChatStore.getState();
      stopStreaming();
      setError(data.error);
    });
  }

  sendQuery(conversationId: string, content: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('query:stream', {
      conversationId,
      content,
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
