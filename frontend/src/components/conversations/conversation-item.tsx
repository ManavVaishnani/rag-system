import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onDelete: (e: React.MouseEvent) => void;
  onRename: (title: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onDelete,
  onRename,
}: ConversationItemProps) {
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
        <MessageSquare
          className={cn(
            'h-3.5 w-3.5 flex-shrink-0',
            isActive ? 'text-accent' : 'text-muted-foreground/60'
          )}
        />
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
