// types/api-key.types.ts

export interface ApiKeyResponse {
  id: string;
  provider: string;
  name: string | null;
  isActive: boolean;
  maskedKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditStatus {
  dailyLimit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  hasByok: boolean;
  usingCredits: boolean;
}

export interface AddApiKeyRequest {
  apiKey: string;
  name?: string;
}

export interface UpdateApiKeyRequest {
  apiKey?: string;
  name?: string;
  isActive?: boolean;
}
