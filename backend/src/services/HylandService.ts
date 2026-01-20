import axios from 'axios';
import FormData from 'form-data';
import { AuthToken, ExtractedData } from '../types';

class HylandService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private useMock: boolean;

  constructor() {
    this.useMock = process.env.USE_MOCK_HYLAND === 'true';
  }

  /**
   * Get valid authentication token (refreshes if expired)
   */
  async getToken(): Promise<string> {
    if (!this.token || this.isTokenExpired()) {
      await this.authenticate();
    }
    return this.token!;
  }

  /**
   * Check if current token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    // Add 30 second buffer
    return new Date(Date.now() + 30000) >= this.tokenExpiry;
  }

  /**
   * Authenticate with Hyland IDP using client credentials
   */
  private async authenticate(): Promise<void> {
    if (this.useMock) {
      // Mock authentication
      this.token = 'mock-token-' + Date.now();
      this.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour
      console.log('[HylandService] Mock authentication successful');
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', process.env.HYLAND_CLIENT_ID!);
      params.append('client_secret', process.env.HYLAND_CLIENT_SECRET!);

      const response = await axios.post<AuthToken>(
        process.env.HYLAND_IDP_URL!,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      console.log('[HylandService] Authentication successful, token expires at:', this.tokenExpiry);
    } catch (error: any) {
      console.error('[HylandService] Authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Hyland IDP');
    }
  }

  /**
   * Upload document to Hyland Content API
   * @param imageBase64 Base64 encoded image data (with data URL prefix)
   * @param fileName Original file name
   */
  async uploadDocument(imageBase64: string, fileName: string = 'document.jpg'): Promise<string> {
    if (this.useMock) {
      // Mock upload - return fake document ID
      const mockDocId = 'HYLAND-' + Date.now();
      console.log('[HylandService] Mock upload successful:', mockDocId);
      return mockDocId;
    }

    try {
      const token = await this.getToken();
      
      // Convert base64 to buffer
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate upload ID
      const uploadId = Date.now().toString();
      
      // Create form data
      const form = new FormData();
      
      // Add JSON metadata
      const metadata = {
        sys_primaryType: 'SysFile',
        sys_title: fileName,
        sysfile_blob: {
          uploadId: uploadId
        }
      };
      
      form.append('main', JSON.stringify(metadata), {
        contentType: 'application/json'
      });
      
      // Add file data
      form.append(uploadId, buffer, {
        filename: fileName,
        contentType: 'image/jpeg'
      });

      const response = await axios.post(
        `${process.env.HYLAND_CONTENT_API_URL}/documents/${process.env.HYLAND_FOLDER_ID}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const documentId = response.data.id || response.data.sys_id;
      console.log('[HylandService] Document uploaded successfully:', documentId);
      return documentId;
    } catch (error: any) {
      console.error('[HylandService] Upload failed:', error.response?.data || error.message);
      throw new Error('Failed to upload document to Hyland');
    }
  }

  /**
   * Trigger IDP extraction process for a document
   */
  async triggerExtraction(hylandDocId: string): Promise<void> {
    if (this.useMock) {
      console.log('[HylandService] Mock extraction triggered for:', hylandDocId);
      return;
    }

    try {
      const token = await this.getToken();
      
      // Note: Adjust this endpoint based on actual Hyland IDP API
      // This is a placeholder - update with real extraction trigger endpoint
      await axios.post(
        `${process.env.HYLAND_CONTENT_API_URL}/documents/${hylandDocId}/extract`,
        {
          webhookUrl: `${process.env.BACKEND_URL}/api/webhook/hyland/extraction`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[HylandService] Extraction triggered for:', hylandDocId);
    } catch (error: any) {
      console.error('[HylandService] Trigger extraction failed:', error.response?.data || error.message);
      // Don't throw error if extraction trigger fails - document is uploaded
      console.warn('[HylandService] Document uploaded but extraction trigger failed');
    }
  }

  /**
   * Generate mock extraction results (for development)
   */
  generateMockExtractionData(): ExtractedData {
    const mockTypes = ['invoice', 'resume', 'receipt'];
    const documentType = mockTypes[Math.floor(Math.random() * mockTypes.length)];

    if (documentType === 'invoice') {
      return {
        documentType: 'invoice',
        overallConfidence: 92.5,
        fields: [
          { name: 'Invoice Number', value: 'INV-2026-001', confidence: 98, category: 'identification' },
          { name: 'Invoice Date', value: '2026-01-15', confidence: 95, category: 'identification' },
          { name: 'Vendor Name', value: 'Acme Corporation', confidence: 97, category: 'vendor' },
          { name: 'Vendor Address', value: '123 Business St, City, State 12345', confidence: 89, category: 'vendor' },
          { name: 'Total Amount', value: 1250.00, confidence: 99, category: 'financial' },
          { name: 'Tax Amount', value: 125.00, confidence: 96, category: 'financial' },
          { name: 'Subtotal', value: 1125.00, confidence: 98, category: 'financial' },
          { name: 'Payment Terms', value: 'Net 30', confidence: 85, category: 'terms' },
          { name: 'Due Date', value: '2026-02-14', confidence: 92, category: 'terms' },
        ],
        tables: [
          {
            name: 'Line Items',
            rows: [
              { description: 'Professional Services', quantity: 40, rate: 25.00, amount: 1000.00 },
              { description: 'Software License', quantity: 1, rate: 125.00, amount: 125.00 },
            ],
          },
        ],
      };
    } else if (documentType === 'resume') {
      return {
        documentType: 'resume',
        overallConfidence: 88.0,
        fields: [
          { name: 'Full Name', value: 'John Doe', confidence: 99, category: 'personal' },
          { name: 'Email', value: 'john.doe@email.com', confidence: 97, category: 'contact' },
          { name: 'Phone', value: '+1 555-0123', confidence: 94, category: 'contact' },
          { name: 'Location', value: 'San Francisco, CA', confidence: 91, category: 'contact' },
          { name: 'Job Title', value: 'Senior Software Engineer', confidence: 95, category: 'professional' },
          { name: 'Years of Experience', value: 8, confidence: 87, category: 'professional' },
          { name: 'Education', value: 'B.S. Computer Science', confidence: 92, category: 'education' },
          { name: 'Skills', value: 'React, TypeScript, Node.js, AWS', confidence: 89, category: 'skills' },
        ],
      };
    } else {
      return {
        documentType: 'receipt',
        overallConfidence: 85.5,
        fields: [
          { name: 'Merchant', value: 'Coffee Shop', confidence: 96, category: 'merchant' },
          { name: 'Date', value: '2026-01-15', confidence: 92, category: 'transaction' },
          { name: 'Time', value: '14:35', confidence: 88, category: 'transaction' },
          { name: 'Total', value: 15.75, confidence: 99, category: 'financial' },
          { name: 'Payment Method', value: 'Credit Card', confidence: 94, category: 'payment' },
          { name: 'Card Last 4', value: '1234', confidence: 97, category: 'payment' },
        ],
      };
    }
  }
}

export default new HylandService();
