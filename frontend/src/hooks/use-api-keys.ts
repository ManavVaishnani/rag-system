import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyService } from '@/services/api-key.service';
import type { AddApiKeyRequest, UpdateApiKeyRequest } from '@/types/api-key.types';
import { toast } from 'sonner';

const API_KEYS_QUERY_KEY = ['api-keys'];
const CREDITS_QUERY_KEY = ['credits'];

export function useApiKeys() {
  const queryClient = useQueryClient();

  const keysQuery = useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () => apiKeyService.listKeys(),
  });

  const creditsQuery = useQuery({
    queryKey: CREDITS_QUERY_KEY,
    queryFn: () => apiKeyService.getCredits(),
  });

  const addKeyMutation = useMutation({
    mutationFn: (data: AddApiKeyRequest) => apiKeyService.addKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
      toast.success('API key added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add API key');
    },
  });

  const updateKeyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiKeyRequest }) =>
      apiKeyService.updateKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
      toast.success('API key updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update API key');
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => apiKeyService.deleteKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
      toast.success('API key deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete API key');
    },
  });

  return {
    // Queries
    keys: keysQuery.data ?? [],
    credits: creditsQuery.data ?? null,
    isLoadingKeys: keysQuery.isLoading,
    isLoadingCredits: creditsQuery.isLoading,

    // Mutations
    addKey: addKeyMutation.mutate,
    updateKey: updateKeyMutation.mutate,
    deleteKey: deleteKeyMutation.mutate,
    isAddingKey: addKeyMutation.isPending,
    isUpdatingKey: updateKeyMutation.isPending,
    isDeletingKey: deleteKeyMutation.isPending,
  };
}
