import { Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
          {content ? (
            <div className="prose prose-sm max-w-none text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="border-collapse w-full text-sm">{children}</table>
                    </div>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted/80 border border-border rounded-lg p-3 overflow-x-auto text-xs my-3">
                      {children}
                    </pre>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.startsWith('language-');
                    if (isBlock) return <code>{children}</code>;
                    return (
                      <code className="bg-muted border border-border rounded px-1.5 py-0.5 text-xs text-accent font-mono">
                        {children}
                      </code>
                    );
                  },
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
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent/50 pl-3 italic text-muted-foreground my-2">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-border my-3" />,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="inline-block w-2 h-4 bg-accent/50 animate-pulse" />
          )}

          {/* Cursor animation when content is streaming */}
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
