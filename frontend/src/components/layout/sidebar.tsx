import { useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, X, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConversationList } from '@/components/conversations/conversation-list';
import { NewConversationButton } from '@/components/conversations/new-conversation-button';
import { Logo } from '@/components/ui/logo';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    conversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    isLoadingConversations,
  } = useChatStore();

  const handleNewChat = async () => {
    const conversation = await createConversation();
    if (conversation) {
      navigate(`/chat/${conversation.id}`);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isCurrentConversation = location.pathname === `/chat/${id}`;
    await deleteConversation(id);
    if (isCurrentConversation) {
      navigate('/chat');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeId = location.pathname.startsWith('/chat/')
    ? location.pathname.replace('/chat/', '')
    : undefined;

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <NewConversationButton onClick={handleNewChat} />
      </div>

      <Separator />

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-8 h-8 text-xs bg-muted/50 border-border/50 focus-visible:ring-1 focus-visible:ring-accent placeholder:text-muted-foreground/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3">
          <div className="text-xs font-medium text-muted-foreground/60 px-2 py-1.5 uppercase tracking-wider">
            {searchQuery ? `Results (${filteredConversations.length})` : 'Conversations'}
          </div>
          <ConversationList
            conversations={filteredConversations}
            activeId={activeId}
            isLoading={isLoadingConversations}
            onDelete={handleDeleteConversation}
            onRename={(id, title) => updateConversationTitle(id, title)}
            emptyMessage={searchQuery ? 'No conversations found' : 'No conversations yet'}
          />
        </div>
      </ScrollArea>

      <Separator />

      {/* Bottom Navigation */}
      <div className="p-3 space-y-0.5">
        <Link
          to="/documents"
          className={cn(
            'flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-colors',
            location.pathname === '/documents'
              ? 'bg-accent/10 text-accent border border-accent/20'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Documents</span>
        </Link>
      </div>
    </div>
  );
}
