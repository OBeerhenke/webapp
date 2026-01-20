import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/api';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentService.getDocuments,
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentService.getDocument(id),
    enabled: !!id,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageBase64: string) => documentService.uploadDocument(imageBase64),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
