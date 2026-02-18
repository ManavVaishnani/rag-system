import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ChatInterface } from '@/components/chat';
import { useChatStore } from '@/stores/chat-store';
import { socketService } from '@/lib/socket';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { 
    conversations, 
    isLoadingConversations,
    currentConversation, 
    loadConversations,
  } = useChatStore();

  // Load conversations on mount
  useEffect(() => {
    const load = async () => {
      try {
        await loadConversations();
      } catch {
        // Silently handle error — store already tracks error state
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadConversations]);

  // Connect socket when conversation is selected
  useEffect(() => {
    if (id) {
      socketService.connect();
    }
    
    return () => {
      if (!id) {
        socketService.disconnect();
      }
    };
  }, [id]);

  // If no ID is provided but we have conversations, redirect to the most recent one
  useEffect(() => {
    if (!isLoading && !id && conversations.length > 0 && !currentConversation) {
      const mostRecent = conversations[0];
      navigate(`/chat/${mostRecent.id}`, { replace: true });
    }
  }, [id, conversations, currentConversation, navigate, isLoading]);

  // Show loading state while checking for conversations
  if (isLoading || isLoadingConversations) {
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

  return (
    <AppLayout>
      <ChatInterface />
    </AppLayout>
  );
}
