import { useChatStore } from '@/stores/chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, MessageSquare, FileText, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversations, createConversation, deleteConversation, isLoadingConversations } = useChatStore();

  const handleNewChat = async () => {
    const conversation = await createConversation();
    if (conversation) {
      navigate(`/chat/${conversation.id}`);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteConversation(id);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">RAG System</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <div className="text-xs font-medium text-muted-foreground px-2 py-2">
            Conversations
          </div>
          {isLoadingConversations ? (
            <div className="text-sm text-muted-foreground px-2">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2">No conversations yet</div>
          ) : (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/chat/${conversation.id}`}
                className={cn(
                  'flex items-center justify-between px-2 py-2 rounded-lg text-sm group transition-colors',
                  location.pathname === `/chat/${conversation.id}`
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{conversation.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Bottom Navigation */}
      <div className="p-3 space-y-1">
        <Link
          to="/documents"
          className={cn(
            'flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-colors',
            location.pathname === '/documents'
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-muted'
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Documents</span>
        </Link>
      </div>
    </div>
  );
}
