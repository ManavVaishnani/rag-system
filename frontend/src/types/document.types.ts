// types/document.types.ts
export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  source: 'chat' | 'documents';
  errorMessage?: string;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface DocumentUploadResponse {
  documents: Document[];
}

export interface DocumentStatusResponse {
  id: string;
  status: Document['status'];
  chunkCount?: number;
  errorMessage?: string;
}
