import axios from 'axios';
import { Document, DocumentUploadRequest, DocumentUploadResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const documentService = {
  /**
   * Upload document image
   */
  async uploadDocument(imageBase64: string): Promise<DocumentUploadResponse> {
    const response = await api.post<DocumentUploadResponse>('/documents/upload', {
      imageBase64,
    });
    return response.data;
  },

  /**
   * Get all documents
   */
  async getDocuments(): Promise<Document[]> {
    const response = await api.get<Document[]>('/documents');
    return response.data;
  },

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${id}`);
    return response.data;
  },

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; mode: string }> {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
