import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { WebSocketEvent } from '../types';

class WebSocketService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('[WebSocket] Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('[WebSocket] Client disconnected:', socket.id);
      });

      // Send initial connection success
      socket.emit('connection:success', {
        message: 'Connected to IDP backend',
        timestamp: new Date().toISOString(),
      });
    });

    console.log('[WebSocket] Server initialized');
  }

  /**
   * Emit event to all connected clients
   */
  emit(event: string, data: any): void {
    if (!this.io) {
      console.error('[WebSocket] Server not initialized');
      return;
    }

    this.io.emit(event, data);
    console.log(`[WebSocket] Emitted event: ${event}`, data);
  }

  /**
   * Emit document status update
   */
  emitDocumentStatusUpdate(docId: string, status: string): void {
    this.emit('document:statusUpdate', {
      docId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit document completed
   */
  emitDocumentCompleted(docId: string, extractedData: any): void {
    this.emit('document:completed', {
      docId,
      extractedData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit document failed
   */
  emitDocumentFailed(docId: string, errorMessage: string): void {
    this.emit('document:failed', {
      docId,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export default new WebSocketService();
