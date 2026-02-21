import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import type { Source } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Backend SourceCitation shape (different field names from frontend Source)
interface BackendSource {
  documentId: string;
  chunkId?: string;
  filename?: string;
  documentName?: string; // forward-compat if backend is updated
  chunkIndex?: number;
  score: number;
  content: string;
}

/** Normalize backend source shape to the frontend Source type */
function mapSource(s: BackendSource, index: number): Source {
  return {
    documentId: s.documentId,
    documentName: s.documentName ?? s.filename ?? 'Unknown document',
    chunkIndex: s.chunkIndex ?? index,
    score: s.score,
    content: s.content,
  };
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  // Holds a query that arrived before the socket finished connecting
  private pendingQuery: { conversationId: string; content: string } | null = null;

  connect() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
    }

    // Defer the actual connection so a rapid disconnect() (React StrictMode
    // double-invoke in dev) can cancel it before the socket is ever created.
    this.connectTimer = setTimeout(() => {
      this.connectTimer = null;

      if (this.socket?.connected || this.socket?.active) {
        return;
      }

      const { accessToken } = useAuthStore.getState();

      if (!accessToken) {
        console.error('No access token available for socket connection');
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();
    }, 50);
  }

  disconnect() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    this.pendingQuery = null;

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

      // Flush any query that arrived before the connection was ready
      if (this.pendingQuery) {
        const { conversationId, content } = this.pendingQuery;
        this.pendingQuery = null;
        // Backend expects "query" field, not "content"
        this.socket!.emit('query:stream', { conversationId, query: content });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.pendingQuery && this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.pendingQuery = null;
        const { stopStreaming, setError } = useChatStore.getState();
        stopStreaming();
        setError('Unable to connect to server. Please refresh and try again.');
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Query status updates
    this.socket.on('query:status', (data: { status: string }) => {
      useChatStore.getState().setStreamingStatus(data.status);
    });

    // Source citations — map backend field names to frontend Source type
    this.socket.on('query:sources', (data: { sources: BackendSource[] }) => {
      const mapped = (data.sources ?? []).map(mapSource);
      useChatStore.getState().setStreamingSources(mapped);
    });

    // Streaming chunks
    this.socket.on('query:chunk', (data: { chunk: string }) => {
      useChatStore.getState().appendStreamingContent(data.chunk);
    });

    // Query complete
    // Backend sends either:
    //   { done: true }                           — streaming case (chunks already received)
    //   { response: string, sources: Source[] }  — no-documents / zero-results case
    this.socket.on('query:complete', (data: {
      done?: boolean;
      response?: string;
      messageId?: string;
      content?: string;
      sources?: BackendSource[];
    }) => {
      const { stopStreaming, addMessage, currentConversation, streamingContent } =
        useChatStore.getState();

      // Use accumulated streaming content when backend only sends { done: true }
      const finalContent =
        streamingContent ||
        data.response ||
        data.content ||
        "I couldn't find any relevant information in your documents.";

      stopStreaming();

      if (currentConversation) {
        addMessage({
          id: data.messageId ?? `msg-${Date.now()}`,
          conversationId: currentConversation.id,
          role: 'ASSISTANT',
          content: finalContent,
          sources: data.sources?.map(mapSource),
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Cached response — backend sends { response, sources } without streaming chunks
    this.socket.on('query:cached', (data: { response: string; sources?: BackendSource[] }) => {
      const { stopStreaming, addMessage, currentConversation } = useChatStore.getState();

      stopStreaming();

      if (currentConversation && data.response) {
        addMessage({
          id: `cached-${Date.now()}`,
          conversationId: currentConversation.id,
          role: 'ASSISTANT',
          content: data.response,
          sources: data.sources?.map(mapSource),
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Error handling
    this.socket.on('query:error', (data: { error: string }) => {
      const { stopStreaming, setError } = useChatStore.getState();
      stopStreaming();
      setError(data.error);
    });
  }

  /**
   * Send a query over the socket.
   * - Connected           → emits immediately, returns true.
   * - Still connecting    → queues for the 'connect' event, returns true.
   * - Not initialised     → returns false (caller should show an error).
   */
  sendQuery(conversationId: string, content: string): boolean {
    if (this.socket?.connected) {
      // Backend expects field named "query", NOT "content"
      this.socket.emit('query:stream', { conversationId, query: content });
      return true;
    }

    // Socket created but TCP handshake still in progress
    if (this.socket || this.connectTimer) {
      this.pendingQuery = { conversationId, content };
      return true;
    }

    console.error('Socket not initialised — call connect() first');
    return false;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
