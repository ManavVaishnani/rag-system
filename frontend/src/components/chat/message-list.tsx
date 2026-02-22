import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { StreamingMessage } from './streaming-message';
import type { Message, Source } from '@/types';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingStatus: string | null;
  streamingSources: Source[] | null;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
  streamingStatus,
  streamingSources,
  isLoading = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming content
  useEffect(() => {
    // Use requestAnimationFrame for more responsive scrolling during streaming
    const scrollFrame = requestAnimationFrame(() => {
      if (bottomRef.current) {
        // For streaming, scroll immediately; for new messages, scroll smoothly
        const behavior = isStreaming ? 'auto' : 'smooth';
        bottomRef.current.scrollIntoView({ behavior });
      }
    });
    
    return () => cancelAnimationFrame(scrollFrame);
  }, [messages, streamingContent, isStreaming]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="px-4 py-6 max-w-3xl mx-auto space-y-2">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* Streaming Message */}
          {isStreaming && (
            <StreamingMessage
              content={streamingContent}
              status={streamingStatus}
              sources={streamingSources}
            />
          )}
          
          {/* Bottom anchor for auto-scroll */}
          <div ref={bottomRef} className="h-0" />
        </div>
      </ScrollArea>
    </div>
  );
}
