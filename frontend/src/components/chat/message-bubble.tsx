import { User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { SourceCitations } from './source-citations';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'USER';

  return (
    <div
      className={cn(
        'flex gap-3 mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'h-8 w-8 shrink-0',
        isUser ? 'bg-accent' : 'bg-muted'
      )}>
        <AvatarFallback className={cn(
          'text-xs',
          isUser ? 'text-accent-foreground' : 'text-muted-foreground'
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        'flex flex-col max-w-[80%]',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-accent text-accent-foreground rounded-br-sm'
              : 'bg-card border border-border rounded-bl-sm'
          )}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className={cn(
                'mb-2 last:mb-0',
                line.trim() === '' && 'h-2'
              )}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          {isStreaming && ' • Streaming...'}
        </span>

        {/* Source Citations for Assistant Messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 w-full">
            <SourceCitations sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}
