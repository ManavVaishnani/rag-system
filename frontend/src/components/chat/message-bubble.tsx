import { User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          {isUser ? (
            // User messages: plain text with line breaks
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            // Assistant messages: full markdown rendering
            <div className="prose prose-sm max-w-none text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Tables: add horizontal scroll for wide tables
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="border-collapse w-full text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  // Code blocks: styled for dark theme
                  pre: ({ children }) => (
                    <pre className="bg-muted/80 border border-border rounded-lg p-3 overflow-x-auto text-xs my-3">
                      {children}
                    </pre>
                  ),
                  // Inline code
                  code: ({ children, className }) => {
                    const isBlock = className?.startsWith('language-');
                    if (isBlock) return <code>{children}</code>;
                    return (
                      <code className="bg-muted border border-border rounded px-1.5 py-0.5 text-xs text-accent font-mono">
                        {children}
                      </code>
                    );
                  },
                  // Links: open in new tab
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-2 hover:text-accent/80"
                    >
                      {children}
                    </a>
                  ),
                  // Paragraphs: no extra margin on last child
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 text-sm leading-relaxed">
                      {children}
                    </p>
                  ),
                  // Headings
                  h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                  // Lists
                  ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent/50 pl-3 italic text-muted-foreground my-2">
                      {children}
                    </blockquote>
                  ),
                  // Horizontal rule
                  hr: () => <hr className="border-border my-3" />,
                  // Strong / emphasis
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
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
