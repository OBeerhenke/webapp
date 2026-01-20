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

export interface Document {
  id: string;
  status: DocumentStatus;
  documentType?: string;
  thumbnailUrl?: string;
  confidence?: number;
  createdAt: string;
  uploadedAt?: string;
  processingStartedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  imageBase64?: string;
  extractedData?: ExtractedData;
}

export type DocumentStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface DocumentUploadRequest {
  imageBase64: string;
}

export interface DocumentUploadResponse {
  docId: string;
  status: string;
}

export interface WebSocketEvent {
  docId: string;
  status?: string;
  extractedData?: ExtractedData;
  errorMessage?: string;
  timestamp: string;
}
