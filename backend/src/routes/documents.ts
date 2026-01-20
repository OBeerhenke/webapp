import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import HylandService from '../services/HylandService';
import WebSocketService from '../services/WebSocketService';
import { DocumentUploadRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * Convert base64 image to JPEG format if needed
 */
async function convertToJpeg(imageBase64: string): Promise<string> {
  try {
    // Extract mime type and base64 data
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return imageBase64; // Not a data URI, return as-is
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // If already JPEG or PNG, return as-is
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png') {
      return imageBase64;
    }

    console.log(`[ImageConversion] Converting ${mimeType} to JPEG`);

    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Convert to JPEG using sharp
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convert back to base64
    const jpegBase64 = jpegBuffer.toString('base64');
    return `data:image/jpeg;base64,${jpegBase64}`;
  } catch (error) {
    console.error('[ImageConversion] Error converting image:', error);
    return imageBase64; // Return original on error
  }
}

/**
 * Upload document image and initiate processing
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { imageBase64 }: DocumentUploadRequest = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Convert to JPEG if needed
    const convertedImage = await convertToJpeg(imageBase64);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        status: 'uploading',
        imageBase64: convertedImage,
        uploadedAt: new Date(),
      },
    });

    console.log('[Upload] Created document:', document.id);

    // Emit status update via WebSocket
    WebSocketService.emitDocumentStatusUpdate(document.id, 'uploading');

    // Start async upload and processing (don't await)
    processDocument(document.id, convertedImage).catch((error) => {
      console.error('[Upload] Processing failed:', error);
    });

    // Return immediately with document ID
    return res.status(201).json({
      docId: document.id,
      status: document.status,
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Async function to upload to Hyland and trigger extraction
 */
async function processDocument(docId: string, imageBase64: string): Promise<void> {
  try {
    // Extract filename from base64 if available, or generate one
    const fileName = `document_${Date.now()}.jpg`;
    
    // Upload to Hyland Content API
    const hylandDocId = await HylandService.uploadDocument(imageBase64, fileName);

    // Update document with Hyland ID and status
    await prisma.document.update({
      where: { id: docId },
      data: {
        hylandDocId,
        status: 'processing',
        processingStartedAt: new Date(),
      },
    });

    console.log('[ProcessDocument] Uploaded to Hyland:', hylandDocId);

    // Emit processing status
    WebSocketService.emitDocumentStatusUpdate(docId, 'processing');

    // Trigger IDP extraction
    await HylandService.triggerExtraction(hylandDocId);

    console.log('[ProcessDocument] IDP extraction triggered for:', docId);

    // If using mock mode, simulate webhook callback after delay
    if (process.env.USE_MOCK_HYLAND === 'true') {
      simulateMockWebhook(docId, hylandDocId);
    }
  } catch (error: any) {
    console.error('[ProcessDocument] Error:', error);

    // Update document status to failed
    await prisma.document.update({
      where: { id: docId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    });

    // Emit failure event
    WebSocketService.emitDocumentFailed(docId, error.message);
  }
}

/**
 * Simulate webhook callback in mock mode (for development)
 */
function simulateMockWebhook(docId: string, hylandDocId: string): void {
  const delay = parseInt(process.env.MOCK_PROCESSING_TIME_MS || '120000');
  
  console.log(`[MockWebhook] Will simulate callback in ${delay}ms for:`, docId);

  setTimeout(async () => {
    try {
      const mockData = HylandService.generateMockExtractionData();

      // Update document with extracted data
      await prisma.document.update({
        where: { id: docId },
        data: {
          status: 'completed',
          extractedData: JSON.stringify(mockData),
          documentType: mockData.documentType,
          confidence: mockData.overallConfidence,
          completedAt: new Date(),
        },
      });

      console.log('[MockWebhook] Document completed:', docId);

      // Emit completion event
      WebSocketService.emitDocumentCompleted(docId, mockData);
    } catch (error) {
      console.error('[MockWebhook] Error:', error);
    }
  }, delay);
}

/**
 * Get all documents
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        documentType: true,
        thumbnailUrl: true,
        confidence: true,
        createdAt: true,
        uploadedAt: true,
        processingStartedAt: true,
        completedAt: true,
        errorMessage: true,
      },
    });

    return res.json(documents);
  } catch (error: any) {
    console.error('[GetDocuments] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get document by ID with full details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Parse extractedData from JSON string
    const response = {
      ...document,
      extractedData: document.extractedData
        ? JSON.parse(document.extractedData)
        : null,
    };

    return res.json(response);
  } catch (error: any) {
    console.error('[GetDocument] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete document by ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.document.delete({
      where: { id },
    });

    console.log('[DeleteDocument] Deleted:', id);

    return res.status(204).send();
  } catch (error: any) {
    console.error('[DeleteDocument] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
