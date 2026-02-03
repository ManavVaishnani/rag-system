// Type definitions for the RAG system

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface VectorData {
  id: string;
  vector: number[];
  payload: VectorPayload;
}

export interface VectorPayload {
  documentId: string;
  chunkId: string;
  content: string;
  chunkIndex: number;
  userId: string;
  filename: string;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: VectorPayload;
}

export interface TextChunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

export interface CachedQueryResult {
  query: string;
  response: string;
  sources: SourceCitation[];
  embedding: number[];
  createdAt: number;
}

export interface SourceCitation {
  documentId: string;
  chunkId: string;
  filename: string;
  content: string;
  score: number;
}

export interface DocumentUploadResult {
  id: string;
  filename: string;
  status: string;
}

export interface QueryRequest {
  query: string;
  conversationId?: string;
}

export interface StreamingChunk {
  type: 'chunk' | 'complete' | 'error' | 'sources';
  data: string | SourceCitation[] | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
