import { Bot, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { SourceCitations } from './source-citations';
import type { Source } from '@/types';

interface StreamingMessageProps {
  content: string;
  status?: string | null;
  sources?: Source[] | null;
}

export function StreamingMessage({ content, status, sources }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 mb-6">
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 bg-muted">
        <AvatarFallback className="text-xs text-muted-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className="flex flex-col max-w-[80%] items-start">
        {/* Status Indicator */}
        {status && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{status}</span>
          </div>
        )}

        {/* Streaming Bubble */}
        <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="prose prose-invert prose-sm max-w-none">
            {content ? (
              content.split('\n').map((line, i) => (
                <p key={i} className={cn(
                  'mb-2 last:mb-0',
                  line.trim() === '' && 'h-2'
                )}>
                  {line || '\u00A0'}
                </p>
              ))
            ) : (
              <span className="inline-block w-2 h-4 bg-accent/50 animate-pulse" />
            )}
          </div>
          
          {/* Cursor animation when content exists */}
          {content && (
            <span className="inline-block w-2 h-4 bg-accent/50 ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Source Citations */}
        {sources && sources.length > 0 && (
          <div className="mt-3 w-full">
            <SourceCitations sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}
