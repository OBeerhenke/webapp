export interface AuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface DocumentUploadRequest {
  imageBase64: string;
}

export interface DocumentUploadResponse {
  docId: string;
  status: string;
}

export interface ExtractedField {
  name: string;
  value: string | number | boolean;
  confidence: number;
  category?: string;
}

export interface ExtractedData {
  fields: ExtractedField[];
  documentType?: string;
  overallConfidence?: number;
  tables?: Array<{
    name: string;
    rows: Record<string, any>[];
  }>;
}

export interface HylandWebhookPayload {
  docId: string;
  hylandDocId: string;
  extractedData: ExtractedData;
  status: 'completed' | 'failed';
  errorMessage?: string;
}

export interface WebSocketEvent {
  type: 'document:statusUpdate' | 'document:completed' | 'document:failed';
  data: any;
}

export type DocumentStatus = 'uploading' | 'processing' | 'completed' | 'failed';
