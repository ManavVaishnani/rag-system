import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

/**
 * Hook for conversation management operations.
 * Provides a clean API for creating, loading, editing, and deleting conversations.
 */
export function useConversations() {
  const {
    conversations,
    currentConversation,
    isLoadingConversations,
    error,
    loadConversations,
    loadConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation,
  } = useChatStore();

  const handleLoadConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  const handleLoadConversation = useCallback(
    async (id: string) => {
      await loadConversation(id);
    },
    [loadConversation]
  );

  const handleCreateConversation = useCallback(async () => {
    return createConversation();
  }, [createConversation]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
    },
    [deleteConversation]
  );

  const handleRenameConversation = useCallback(
    async (id: string, title: string) => {
      await updateConversationTitle(id, title);
    },
    [updateConversationTitle]
  );

  return {
    conversations,
    currentConversation,
    isLoadingConversations,
    error,
    loadConversations: handleLoadConversations,
    loadConversation: handleLoadConversation,
    createConversation: handleCreateConversation,
    deleteConversation: handleDeleteConversation,
    renameConversation: handleRenameConversation,
    setCurrentConversation,
  };
}
