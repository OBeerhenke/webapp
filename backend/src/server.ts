import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import documentsRouter from './routes/documents';
import webhookRouter from './routes/webhook';
import WebSocketService from './services/WebSocketService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); // Allow large base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize WebSocket
WebSocketService.initialize(httpServer);

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: process.env.USE_MOCK_HYLAND === 'true' ? 'mock' : 'production',
  });
});

app.use('/api/documents', documentsRouter);
app.use('/api/webhook/hyland', webhookRouter);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);

// Add startup error handling
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  IDP Mobile Backend Server                             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 WebSocket enabled`);
  console.log(`🔧 Mode: ${process.env.USE_MOCK_HYLAND === 'true' ? 'MOCK' : 'PRODUCTION'}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - POST   http://0.0.0.0:${PORT}/api/documents/upload`);
  console.log(`   - GET    http://0.0.0.0:${PORT}/api/documents`);
  console.log(`   - GET    http://0.0.0.0:${PORT}/api/documents/:id`);
  console.log(`   - DELETE http://0.0.0.0:${PORT}/api/documents/:id`);
  console.log(`   - POST   http://0.0.0.0:${PORT}/api/webhook/hyland/extraction`);
  console.log(`   - GET    http://0.0.0.0:${PORT}/api/health`);
  console.log('');
}).on('error', (error) => {
  console.error('SERVER START ERROR:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
