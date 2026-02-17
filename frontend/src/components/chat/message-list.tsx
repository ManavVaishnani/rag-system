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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming content
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

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
    <ScrollArea className="flex-1 px-4 py-6 bg-background" ref={scrollRef}>
      <div className="max-w-3xl mx-auto space-y-2">
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
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
