import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ChatInterface, EmptyChatState } from '@/components/chat';
import { useChatStore } from '@/stores/chat-store';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    conversations, 
    isLoadingConversations,
    currentConversation, 
    loadConversations,
  } = useChatStore();

  // Load conversations only on true initial load (nothing cached yet)
  useEffect(() => {
    if (conversations.length === 0 && !isLoadingConversations) {
      loadConversations();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If no ID is provided but we have conversations, redirect to the most recent one
  useEffect(() => {
    if (!isLoadingConversations && !id && conversations.length > 0 && !currentConversation) {
      const mostRecent = conversations[0];
      navigate(`/chat/${mostRecent.id}`, { replace: true });
    }
  }, [id, conversations, currentConversation, navigate, isLoadingConversations]);

  // Show loading state only on initial load (no conversations cached yet)
  if (isLoadingConversations && conversations.length === 0) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // When no specific conversation is selected, show an empty chat state
  if (!id) {
    return (
      <AppLayout>
        <EmptyChatState />
      </AppLayout>
    );
  }

  // Conversation selected – render full chat interface
  return (
    <AppLayout>
      <ChatInterface />
    </AppLayout>
  );
}
