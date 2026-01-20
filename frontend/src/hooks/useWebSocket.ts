import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketClient from '../lib/socket';
import { WebSocketEvent, Document } from '../types';

export const useWebSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = socketClient.connect();

    // Listen for document status updates
    socket.on('document:statusUpdate', (event: WebSocketEvent) => {
      console.log('[useWebSocket] Status update:', event);
      
      // Invalidate documents list query
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      // Update specific document query if exists
      queryClient.setQueryData(['document', event.docId], (oldData: Document | undefined) => {
        if (oldData) {
          return { ...oldData, status: event.status };
        }
        return oldData;
      });
    });

    // Listen for document completed
    socket.on('document:completed', (event: WebSocketEvent) => {
      console.log('[useWebSocket] Document completed:', event);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', event.docId] });
      
      // Show notification (could use a toast library)
      console.log('✅ Document processing completed!');
    });

    // Listen for document failed
    socket.on('document:failed', (event: WebSocketEvent) => {
      console.log('[useWebSocket] Document failed:', event);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', event.docId] });
      
      // Show error notification
      console.error('❌ Document processing failed:', event.errorMessage);
    });

    return () => {
      socketClient.disconnect();
    };
  }, [queryClient]);

  return {
    isConnected: socketClient.isConnected(),
  };
};
