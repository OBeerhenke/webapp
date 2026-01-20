import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import WebSocketService from '../services/WebSocketService';
import { HylandWebhookPayload } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * Receive webhook callback from Hyland IDP when extraction is complete
 */
router.post('/extraction', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log('[Webhook] Received IDP callback');
    console.log('[Webhook] Payload type:', typeof payload);
    console.log('[Webhook] Has documents:', payload?.documents);
    console.log('[Webhook] Is array:', Array.isArray(payload?.documents));

    // The real IDP response contains documents array
    if (!payload || !payload.documents || !Array.isArray(payload.documents)) {
      console.error('[Webhook] Invalid payload structure. Payload:', JSON.stringify(payload, null, 2));
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const document = payload.documents[0]; // Process first document
    const contentRef = payload.contentFileReferences?.[0];
    
    if (!contentRef?.sys_id) {
      console.error('[Webhook] Missing sys_id in content reference');
      return res.status(400).json({ error: 'Missing document ID' });
    }

    const hylandDocId = contentRef.sys_id;

    // Find document by Hyland doc ID
    const dbDocument = await prisma.document.findFirst({
      where: { hylandDocId },
    });

    if (!dbDocument) {
      console.error('[Webhook] Document not found in DB:', hylandDocId);
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check extraction status (accept both Extracted and ReviewRequired)
    if (payload.extractionStatus === 'Extracted' || payload.extractionStatus === 'ReviewRequired') {
      // Parse fields into array format for frontend
      const extractedFields: any[] = [];
      document.fields?.forEach((field: any) => {
        extractedFields.push({
          name: field.name,
          value: field.value || '',
          confidence: (field.extractionConfidence || 0) * 100,
        });
      });

      // Parse tables
      const tables: any[] = [];
      document.tables?.forEach((table: any) => {
        const rows = table.records?.map((record: any) => {
          const row: Record<string, string> = {};
          record.records?.forEach((cell: any) => {
            row[cell.recordName] = cell.value;
          });
          return row;
        }) || [];
        
        tables.push({
          name: table.name,
          rows,
        });
      });

      // Build extracted data object
      const extractedData = {
        documentType: document.className || 'Unknown',
        overallConfidence: document.classificationConfidence * 100,
        fields: extractedFields,
        tables,
      };

      // Update document with extraction results
      await prisma.document.update({
        where: { id: dbDocument.id },
        data: {
          status: 'completed',
          extractedData: JSON.stringify(extractedData),
          documentType: document.className,
          confidence: Math.round(document.classificationConfidence * 100),
          completedAt: new Date(),
        },
      });

      console.log('[Webhook] Document completed:', dbDocument.id, 'Type:', document.className);

      // Emit WebSocket event to frontend
      WebSocketService.emitDocumentCompleted(dbDocument.id, extractedData);
    } else {
      // Extraction failed or not complete
      await prisma.document.update({
        where: { id: dbDocument.id },
        data: {
          status: 'failed',
          errorMessage: `Extraction status: ${payload.extractionStatus}`,
        },
      });

      console.log('[Webhook] Document extraction incomplete:', dbDocument.id);

      WebSocketService.emitDocumentFailed(
        dbDocument.id,
        `Extraction status: ${payload.extractionStatus}`
      );
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
