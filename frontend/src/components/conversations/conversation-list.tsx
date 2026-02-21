import { ConversationItem } from './conversation-item';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  isLoading?: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, title: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function ConversationList({
  conversations,
  activeId,
  isLoading = false,
  onDelete,
  onRename,
  emptyMessage = 'No conversations yet',
  className,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-1', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground/60 px-2 py-4 text-center', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={activeId === conversation.id}
          onDelete={(e) => onDelete(conversation.id, e)}
          onRename={(title) => onRename(conversation.id, title)}
        />
      ))}
    </div>
  );
}
