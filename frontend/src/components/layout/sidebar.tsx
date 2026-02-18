import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, MessageSquare, FileText, Trash2, Pencil, Check, X, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, createConversation, deleteConversation, updateConversationTitle, isLoadingConversations } = useChatStore();

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

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <MessageSquare className="w-4 h-4 text-accent" />
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
            RAG System
          </span>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 hover:border-accent/40 transition-all"
          variant="ghost"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
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
        <div className="px-3 pb-3 space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground/60 px-2 py-1.5 uppercase tracking-wider">
            {searchQuery ? `Results (${filteredConversations.length})` : 'Conversations'}
          </div>
          {isLoadingConversations ? (
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-sm text-muted-foreground/60 px-2 py-4 text-center">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={location.pathname === `/chat/${conversation.id}`}
                onDelete={(e) => handleDeleteConversation(conversation.id, e)}
                onRename={(title) => updateConversationTitle(conversation.id, title)}
              />
            ))
          )}
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

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onDelete: (e: React.MouseEvent) => void;
  onRename: (title: string) => void;
}

function ConversationItem({ conversation, isActive, onDelete, onRename }: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditTitle(conversation.title);
    setIsEditing(true);
  };

  const handleSaveEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-1 py-1">
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-xs bg-muted border-accent/50 focus-visible:ring-1 focus-visible:ring-accent"
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          onClick={handleSaveEdit}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleCancelEdit}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Link
      to={`/chat/${conversation.id}`}
      className={cn(
        'flex items-center justify-between px-2 py-2 rounded-lg text-sm group transition-all duration-150',
        isActive
          ? 'bg-accent/10 text-accent border border-accent/20'
          : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
      )}
    >
      <div className="flex items-center space-x-2 overflow-hidden min-w-0">
        <MessageSquare className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-accent" : "text-muted-foreground/60")} />
        <span className="truncate text-xs">{conversation.title}</span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-accent/10 hover:text-accent"
          onClick={handleStartEdit}
          title="Rename"
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-red-500/10 hover:text-red-400"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </Link>
  );
}
