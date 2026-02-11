// types/chat.types.ts
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: Source[];
  attachments?: Document[];
  isStreaming?: boolean;
  createdAt: string;
}

export interface Source {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  content: string;
}

export interface PendingAttachment {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  documentId?: string;
  error?: string;
}

export interface StreamingState {
  isStreaming: boolean;
  content: string;
  status?: string;
  sources?: Source[];
}
